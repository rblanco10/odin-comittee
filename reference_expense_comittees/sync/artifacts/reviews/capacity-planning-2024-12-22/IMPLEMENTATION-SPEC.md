# Workspace Sync Capacity Planning: Implementation Specification

> **Proposal ID:** PROP-CAPACITY-001
> **Session:** SC-2025-12-22-001
> **Status:** ✅ APPROVED
> **Created:** 2025-12-22
> **Target SLA:** 2-minute incremental sync

---

## Executive Summary

This specification defines the **counter/modulo tiered sync** approach for achieving a 2-minute sync SLA across 1,000+ workspaces. The design reduces average sync duration from 30-60 seconds to ~1.75 seconds by intelligently skipping slow-changing entity types on most runs.

### Key Metrics

| Metric | Before | After |
|--------|--------|-------|
| Avg sync duration | 30-60s | **1.75s** |
| Workers for 1K workspaces | 250-500 | **15-25** |
| Nodes needed | 20-40 | **3-5** |
| 2-min SLA achievable? | ❌ No | ✅ Yes |

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution: Counter/Modulo Tiered Sync](#solution-countermodulo-tiered-sync)
3. [Implementation Tasks](#implementation-tasks)
4. [Code Changes](#code-changes)
5. [Configuration Changes](#configuration-changes)
6. [Testing Strategy](#testing-strategy)
7. [Capacity Planning Reference](#capacity-planning-reference)
8. [Rollout Plan](#rollout-plan)

---

## Problem Statement

### Current State Issues

1. **Queue Mismatch (CRITICAL)**
   - `WorkspaceSyncWorker` uses queue `:erp_sync`
   - Config defines `:erp_sync_default`, not `:erp_sync`
   - Result: Jobs run with NO global limit, NO partitioning

2. **All Entities Every Sync**
   - Current reactor syncs all 12 entity types every run
   - Duration: 30-60 seconds per workspace
   - At 1,000 workspaces: Would need 250-500 concurrent workers

3. **No Periodic Trigger**
   - `WorkspaceSyncWorker` has no AshOban/cron trigger
   - Must be manually scheduled or triggered

### Business Requirement

> "I want to be able to tell our customers to expect a sync within 2 min."

---

## Solution: Counter/Modulo Tiered Sync

### Concept

Every 2 minutes, the reactor runs but only syncs entities whose "tier" matches the current run number modulo.

```
Run 1:  HOT only                    (~1.5s)
Run 2:  HOT only                    (~1.5s)
Run 7:  HOT only                    (~1.5s)
Run 8:  HOT + WARM                  (~3s)
Run 30: HOT + WARM + COLD           (~5.5s)
Run 720: HOT + WARM + COLD + STATIC (~7.5s)
```

### Entity Tier Classification

| Tier | Modulo | Interval | Entities | Rationale |
|------|--------|----------|----------|-----------|
| **HOT** | 1 (every run) | 2 min | expense_reports, bills, ap_payments | Active user workflows |
| **WARM** | 8 | ~16 min | vendors, employees, projects | Setup data, changes occasionally |
| **COLD** | 30 | ~1 hour | customers, gl_accounts, departments, classes, expense_categories | Reference data, rarely changes |
| **STATIC** | 720 | ~24 hours | currencies, subsidiaries, locations, accounting_periods | Configuration, almost never changes |

### Why This Works

- 87.5% of runs sync only 3 entities (HOT tier) = ~1.5 seconds
- Weighted average sync duration: ~1.75 seconds
- 15 workers can process 1,000 workspaces in under 2 minutes

---

## Implementation Tasks

### Priority Order

| # | Task | File(s) | Complexity | Time |
|---|------|---------|------------|------|
| 1 | Add `:erp_sync` queue to config | `config.exs` | 🟢 Easy | 5 min |
| 2 | Add `sync_run_number` to ErpConnection | `erp_connection.ex` | 🟢 Easy | 15 min |
| 3 | Create migration for new attribute | `priv/repo/migrations/` | 🟢 Easy | 10 min |
| 4 | Add tier configuration to reactor | `workspace_sync_reactor.ex` | 🟢 Easy | 15 min |
| 5 | Implement `entities_for_run/1` | `workspace_sync_reactor.ex` | 🟢 Easy | 15 min |
| 6 | Modify `init_execution` to use dynamic entities | `workspace_sync_reactor.ex` | 🟡 Medium | 20 min |
| 7 | Increment `run_number` in finalize step | `workspace_sync_reactor.ex` | 🟢 Easy | 10 min |
| 8 | Update worker to pass `run_number` | `workspace_sync_worker.ex` | 🟢 Easy | 10 min |
| 9 | Add periodic scheduling trigger | TBD | 🟡 Medium | 30 min |
| **Total** | | | | **~2.5 hours** |

---

## Code Changes

### Task 1: Add `:erp_sync` Queue to Config

**File:** `config/config.exs`

**Location:** Inside `Oban.Pro.Plugins.DynamicQueues` block (~line 220)

```elixir
# Add after erp_sync_default line:
erp_sync: [limit: 10, global_limit: 25, partition: [:args, "workspace_id"]],
```

**Full context:**
```elixir
# ============================================================================
# EXTERNAL API QUEUES - ERP (global_limit for rate limit protection)
# ============================================================================

erp_push: [limit: 5, global_limit: 15, partition: [:args, "workspace_id"]],
erp_push_execution: [limit: 5, global_limit: 15, partition: [:args, "workspace_id"]],
erp_push_resume: [limit: 3, global_limit: 10, partition: [:args, "workspace_id"]],
erp_push_retry: [limit: 2, global_limit: 6, partition: [:args, "workspace_id"]],
erp_sync_to_accounting: [limit: 1, global_limit: 3, partition: [:args, "workspace_id"]],
erp_sync_default: [limit: 5, global_limit: 15, partition: [:args, "workspace_id"]],
# ADD THIS LINE:
erp_sync: [limit: 10, global_limit: 25, partition: [:args, "workspace_id"]],
```

---

### Task 2: Add `sync_run_number` to ErpConnection

**File:** `lib/flame_teampay_payables/ember_erp/resources/connection/erp_connection.ex`

**Add attribute:**
```elixir
attributes do
  # ... existing attributes ...
  
  # Sync run counter for tiered sync scheduling
  # Incremented after each successful WorkspaceSyncReactor run
  # Used with modulo to determine which entity tiers to sync
  attribute :sync_run_number, :integer do
    default 0
    allow_nil? false
    description "Counter for tiered sync scheduling (modulo determines which entities sync)"
  end
end
```

**Add action for incrementing:**
```elixir
actions do
  # ... existing actions ...
  
  update :increment_sync_run_number do
    description "Increment the sync run counter after a successful workspace sync"
    change fn changeset, _context ->
      current = Ash.Changeset.get_attribute(changeset, :sync_run_number) || 0
      Ash.Changeset.force_change_attribute(changeset, :sync_run_number, current + 1)
    end
  end
end
```

---

### Task 3: Create Migration

**File:** `priv/repo/migrations/YYYYMMDDHHMMSS_add_sync_run_number_to_erp_connection.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddSyncRunNumberToErpConnection do
  use Ecto.Migration

  def change do
    alter table(:erp_connections) do
      add :sync_run_number, :integer, null: false, default: 0
    end
  end
end
```

---

### Task 4-7: Modify WorkspaceSyncReactor

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/sync/workspace_sync_reactor.ex`

**Add tier configuration (after `@entity_order`):**

```elixir
# Existing entity order (keep for reference/full syncs)
@entity_order [
  :currencies,
  :subsidiaries,
  :accounting_periods,
  :departments,
  :locations,
  :classes,
  :gl_accounts,
  :expense_categories,
  :projects,
  :customers,
  :vendors,
  :employees
]

# NEW: Tiered sync configuration
# Entities are grouped by how frequently they change
@entity_tiers %{
  hot:    [:expense_reports, :bills, :ap_payments],
  warm:   [:vendors, :employees, :projects],
  cold:   [:customers, :gl_accounts, :departments, :classes, :expense_categories],
  static: [:currencies, :subsidiaries, :locations, :accounting_periods]
}

# NEW: How often each tier syncs (as modulo of run_number)
# hot: every run, warm: every 8th, cold: every 30th, static: every 720th (daily)
@tier_modulos %{
  hot:    1,      # Every run (2 min interval)
  warm:   8,      # Every 8th run (~16 min)
  cold:   30,     # Every 30th run (~1 hour)
  static: 720     # Every 720th run (~24 hours)
}
```

**Add `entities_for_run/1` function:**

```elixir
@doc """
Determines which entities to sync based on the run number.

Uses modulo arithmetic to include tiers based on frequency:
- HOT (modulo 1): Every run - expense_reports, bills, ap_payments
- WARM (modulo 8): Every 8th run - vendors, employees, projects
- COLD (modulo 30): Every 30th run - customers, gl_accounts, etc.
- STATIC (modulo 720): Every 720th run - currencies, subsidiaries, etc.

Run 0 is special: syncs ALL entities (initial/recovery sync).

## Examples

    iex> entities_for_run(1)
    [:expense_reports, :bills, :ap_payments]
    
    iex> entities_for_run(8)
    [:expense_reports, :bills, :ap_payments, :vendors, :employees, :projects]
    
    iex> entities_for_run(0)
    # All entities (full sync)
"""
def entities_for_run(0) do
  # Run 0 = full sync (initial or recovery)
  @entity_order
end

def entities_for_run(run_number) when is_integer(run_number) and run_number > 0 do
  @entity_tiers
  |> Enum.filter(fn {tier, _entities} ->
    modulo = Map.get(@tier_modulos, tier, 1)
    rem(run_number, modulo) == 0
  end)
  |> Enum.flat_map(fn {_tier, entities} -> entities end)
  |> Enum.filter(&(&1 in @entity_order))  # Only include supported entities
end

@doc """
Returns a breakdown of which tiers are active for a given run number.
Useful for logging and debugging.
"""
def tier_breakdown(run_number) do
  @tier_modulos
  |> Enum.filter(fn {_tier, modulo} -> rem(run_number, modulo) == 0 end)
  |> Enum.map(fn {tier, _} -> tier end)
end
```

**Modify `init_execution` step:**

```elixir
step :init_execution do
  argument :erp_connection_id, input(:erp_connection_id)
  argument :workspace_id, input(:workspace_id)
  argument :entity_id, input(:entity_id)
  argument :sync_mode, input(:sync_mode)
  argument :resume_from, input(:resume_from)
  argument :otel_ctx, input(:otel_ctx)
  argument :force_full_sync, input(:force_full_sync)  # NEW: Optional override

  run fn args, _context ->
    RI.restore_parent_context(args[:otel_ctx])

    RI.with_step("init_execution", [
      reactor: :workspace_sync_reactor,
      workspace_id: args.workspace_id,
      attributes: %{erp_connection_id: args.erp_connection_id}
    ], fn ->
      workspace_id = args.workspace_id
      sync_mode = args[:sync_mode] || :incremental

      with {:ok, connection} <- load_connection(args.erp_connection_id, workspace_id),
           {:ok, execution} <- create_or_resume_execution(connection, workspace_id, args) do

        # NEW: Determine entities based on run number (or force full sync)
        run_number = connection.sync_run_number || 0
        
        entities_to_sync = cond do
          # Force full sync requested (e.g., "Sync Now" button)
          args[:force_full_sync] == true ->
            @entity_order
            
          # Resume from specific entity (failure recovery)
          args[:resume_from] != nil ->
            start_index = determine_start_index(args[:resume_from])
            Enum.drop(@entity_order, start_index)
            
          # Normal tiered sync based on run number
          true ->
            entities_for_run(run_number)
        end

        active_tiers = tier_breakdown(run_number)

        Logger.info("[WorkspaceSyncReactor] Initialized run ##{run_number}",
          connection_id: connection.id,
          provider: connection.provider,
          sync_mode: sync_mode,
          run_number: run_number,
          active_tiers: active_tiers,
          entities_to_sync: entities_to_sync,
          entity_count: length(entities_to_sync)
        )

        {:ok, %{
          connection: connection,
          execution: execution,
          workspace_id: workspace_id,
          entity_id: args[:entity_id],
          entities_to_sync: entities_to_sync,
          sync_mode: sync_mode,
          run_number: run_number,
          active_tiers: active_tiers,
          start_time: System.monotonic_time(:millisecond)
        }}
      end
    end)
  end
end
```

**Add new input for force_full_sync:**

```elixir
input :force_full_sync  # Optional: true to sync all entities regardless of tier
```

**Modify finalize step to increment run_number:**

```elixir
step :finalize do
  argument :init_context, result(:init_execution)
  argument :sync_result, result(:sync_all_entities)

  run fn args, _context ->
    RI.with_step("finalize", [
      reactor: :workspace_sync_reactor,
      workspace_id: args.init_context.workspace_id
    ], fn ->
      ctx = args.init_context
      sync_result = args.sync_result
      duration = System.monotonic_time(:millisecond) - ctx.start_time

      # ... existing stats calculation ...

      # Update SyncExecution to completed
      finalize_execution(ctx.execution, ctx.workspace_id, %{
        status: :completed,
        completed_entities: sync_result.completed_entities,
        entity_stats: sync_result.entity_stats,
        total_synced: total_synced,
        total_failed: total_failed,
        duration_ms: duration
      })

      # NEW: Increment run number on connection
      increment_connection_run_number(ctx.connection, ctx.workspace_id)

      Logger.info("[WorkspaceSyncReactor] Completed run ##{ctx.run_number}",
        connection_id: ctx.connection.id,
        next_run_number: ctx.run_number + 1,
        active_tiers: ctx.active_tiers,
        entities_synced: length(sync_result.completed_entities),
        total_records: total_synced,
        duration_ms: duration
      )

      {:ok, %{
        status: :completed,
        connection_id: ctx.connection.id,
        run_number: ctx.run_number,
        next_run_number: ctx.run_number + 1,
        completed_entities: sync_result.completed_entities,
        entity_stats: sync_result.entity_stats,
        total_synced: total_synced,
        total_failed: total_failed,
        duration_ms: duration
      }}
    end)
  end
end
```

**Add helper function:**

```elixir
defp increment_connection_run_number(connection, workspace_id) do
  connection
  |> Ash.Changeset.for_update(:increment_sync_run_number, %{})
  |> Ash.update(tenant: workspace_id, authorize?: false)
  |> case do
    {:ok, updated} ->
      Logger.debug("[WorkspaceSyncReactor] Incremented run_number to #{updated.sync_run_number}")
      {:ok, updated}
    {:error, error} ->
      Logger.warning("[WorkspaceSyncReactor] Failed to increment run_number: #{inspect(error)}")
      {:error, error}
  end
end
```

---

### Task 8: Update Worker

**File:** `lib/flame_teampay_payables/ember_erp/workers/workspace_sync_worker.ex`

**Add `force_full_sync` support:**

```elixir
@impl Oban.Worker
def perform(%Oban.Job{args: args}) do
  erp_connection_id = args["erp_connection_id"]
  workspace_id = args["workspace_id"]
  sync_mode = parse_sync_mode(args["sync_mode"])
  resume_from = parse_resume_from(args["resume_from"])
  entity_id = args["entity_id"]
  force_full_sync = args["force_full_sync"] == true  # NEW

  # ... existing setup ...

  result = WorkspaceSyncReactor.run(%{
    erp_connection_id: erp_connection_id,
    workspace_id: workspace_id,
    entity_id: entity_id,
    sync_mode: sync_mode,
    resume_from: resume_from,
    force_full_sync: force_full_sync,  # NEW
    otel_ctx: otel_ctx
  })

  # ... rest unchanged ...
end
```

**Add force sync function:**

```elixir
@doc """
Schedule a full sync (all entity tiers) for a connection.

Use this for "Sync Now" buttons or initial setup.
"""
def schedule_full_sync(erp_connection_id, workspace_id, opts \\ []) do
  schedule_in = Keyword.get(opts, :schedule_in, 0)

  %{
    "erp_connection_id" => erp_connection_id,
    "workspace_id" => workspace_id,
    "sync_mode" => "incremental",
    "force_full_sync" => true
  }
  |> __MODULE__.new(schedule_in: schedule_in)
  |> Oban.insert()
end
```

---

## Configuration Changes

### Production Config (`config/config.exs`)

```elixir
erp_sync: [limit: 10, global_limit: 25, partition: [:args, "workspace_id"]],
```

### Scaling Guide

| Workspaces | global_limit | Nodes (5 workers/node) |
|------------|--------------|------------------------|
| 100 | 5 | 1 |
| 500 | 15 | 3 |
| 1,000 | 25 | 5 |
| 2,000 | 40 | 8 |
| 5,000 | 100 | 20 |

---

## Testing Strategy

### Unit Tests

**Test `entities_for_run/1`:**

```elixir
defmodule WorkspaceSyncReactorTierTest do
  use ExUnit.Case
  alias FlameTeampayPayables.EmberErp.Resources.Reactors.Sync.WorkspaceSyncReactor

  describe "entities_for_run/1" do
    test "run 0 returns all entities (full sync)" do
      entities = WorkspaceSyncReactor.entities_for_run(0)
      assert length(entities) == 12
    end

    test "run 1 returns only hot tier" do
      entities = WorkspaceSyncReactor.entities_for_run(1)
      assert entities == [:expense_reports, :bills, :ap_payments]
    end

    test "run 8 returns hot + warm tiers" do
      entities = WorkspaceSyncReactor.entities_for_run(8)
      assert :expense_reports in entities
      assert :vendors in entities
      assert :employees in entities
      refute :gl_accounts in entities
    end

    test "run 30 returns hot + warm + cold tiers" do
      entities = WorkspaceSyncReactor.entities_for_run(30)
      assert :expense_reports in entities
      assert :vendors in entities
      assert :gl_accounts in entities
      refute :currencies in entities
    end

    test "run 720 returns all tiers" do
      entities = WorkspaceSyncReactor.entities_for_run(720)
      assert length(entities) >= 12
    end
  end

  describe "tier_breakdown/1" do
    test "returns active tiers for run number" do
      assert WorkspaceSyncReactor.tier_breakdown(1) == [:hot]
      assert WorkspaceSyncReactor.tier_breakdown(8) == [:hot, :warm]
      assert :cold in WorkspaceSyncReactor.tier_breakdown(30)
    end
  end
end
```

### Integration Tests

```elixir
# Test with real NetSuite connection
# priv/scripts/tiered_sync_test.exs

workspace_id = "550e8400-e29b-41d4-a716-446655440000"
connection_id = "your-connection-id"

# Test hot tier only (run 1)
IO.puts("Testing HOT tier (run 1)...")
{:ok, result} = WorkspaceSyncReactor.run(%{
  erp_connection_id: connection_id,
  workspace_id: workspace_id,
  sync_mode: :incremental
})

IO.inspect(result.completed_entities, label: "Entities synced")
IO.puts("Duration: #{result.duration_ms}ms")

# Expected: Only expense_reports, bills, ap_payments
# Expected duration: ~1-2 seconds
```

### Load Testing

```elixir
# Simulate 100 concurrent workspace syncs
connections = get_test_connections(100)

tasks = Enum.map(connections, fn conn ->
  Task.async(fn ->
    start = System.monotonic_time(:millisecond)
    WorkspaceSyncWorker.schedule_sync(conn.id, conn.workspace_id)
    duration = System.monotonic_time(:millisecond) - start
    {conn.id, duration}
  end)
end)

results = Task.await_many(tasks, :timer.minutes(5))
avg_duration = Enum.map(results, &elem(&1, 1)) |> Enum.sum() |> div(100)
IO.puts("Average scheduling time: #{avg_duration}ms")
```

---

## Capacity Planning Reference

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│           WORKSPACE SYNC CAPACITY QUICK REFERENCE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TARGET SLA: 2 minutes                                          │
│   SYNC INTERVAL: Every 2 minutes                                 │
│   AVG SYNC DURATION: ~1.75 seconds (with tiered approach)        │
│                                                                  │
│   TIER SCHEDULE:                                                 │
│   ├── HOT (every 2 min):  expense_reports, bills, ap_payments    │
│   ├── WARM (every 16 min): vendors, employees, projects          │
│   ├── COLD (every 1 hr):   gl_accounts, departments, etc.        │
│   └── STATIC (daily):      currencies, subsidiaries, etc.        │
│                                                                  │
│   SCALING FORMULA:                                               │
│   workers_needed = workspaces / 68                               │
│   nodes_needed = workers_needed / 5                              │
│                                                                  │
│   EXAMPLE: 1,000 workspaces                                      │
│   ├── Workers: 1000 / 68 = 15                                    │
│   ├── Nodes: 15 / 5 = 3                                          │
│   └── Recommended global_limit: 25 (with headroom)               │
│                                                                  │
│   ERP RATE LIMITS:                                               │
│   ├── Per workspace: ~1.5 API calls/minute                       │
│   ├── NetSuite limit: 500 calls/min per account                  │
│   └── Status: ✅ Well within limits                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rollout Plan

### Phase 1: Configuration Fix (Day 1)
- [ ] Add `:erp_sync` queue to config.exs
- [ ] Deploy config change
- [ ] Verify jobs are properly throttled

### Phase 2: Schema Migration (Day 2)
- [ ] Add `sync_run_number` to ErpConnection
- [ ] Run migration
- [ ] Verify attribute accessible

### Phase 3: Reactor Changes (Day 3-4)
- [ ] Add tier configuration
- [ ] Implement `entities_for_run/1`
- [ ] Modify init_execution
- [ ] Add run_number increment
- [ ] Unit tests passing

### Phase 4: Worker Updates (Day 4)
- [ ] Add force_full_sync support
- [ ] Integration tests passing

### Phase 5: Validation (Day 5)
- [ ] Load test with 100 workspaces
- [ ] Verify 2-min SLA met
- [ ] Monitor Prometheus metrics
- [ ] Check ERP rate limit usage

### Phase 6: Production Rollout (Day 6+)
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor for issues
- [ ] Document any adjustments

---

## Appendix: Committee Session Summary

**Session ID:** SC-2025-12-22-001
**Members Activated:** Intake Coordinator, Sync Architect, Standards Enforcer, AP Domain Expert, Evaluation Subcommittee

### Key Decisions Made

1. **Tiered sync approach** — Approved counter/modulo design
2. **run_number storage** — Store on ErpConnection (persistent)
3. **Queue configuration** — Add `:erp_sync` with global_limit: 25
4. **Tier intervals** — HOT=2min, WARM=16min, COLD=1hr, STATIC=24hr

### Artifacts Produced

- This implementation specification
- Capacity planning calculations
- Code examples for all changes

---

*Document created by Sync Committee Scribe on 2025-12-22*

