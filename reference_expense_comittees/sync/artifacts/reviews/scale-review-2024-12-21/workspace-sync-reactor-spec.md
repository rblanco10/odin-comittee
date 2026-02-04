# WorkspaceSyncReactor Complete Specification

> **Status**: APPROVED - Ready for Implementation
> **Date**: 2024-12-21
> **Committee Session**: Scale Review - Complete Design Specification

## Executive Summary

This document specifies the **complete** workspace-centric sync architecture. The goal is to replace the per-entity-type scheduling model with a per-connection scheduling model where a single reactor run syncs ALL entity types for one ERP connection.

## What Already Exists (Built in Previous Session)

| Component | Status | Purpose |
|-----------|--------|---------|
| `fetch_page/3` in all 11 capabilities | ✅ Complete | Paginated fetch from ERP |
| `EntitySyncService` | ✅ Complete | Orchestrates fetch→upsert loop for ONE entity |
| 11 `BulkUpsertServices` | ✅ Complete | Memory-efficient bulk database writes |
| Modified `SyncReactor` (uses EntitySyncService) | ✅ Complete | Interim integration |

## What Must Be Built

| Component | Status | Purpose |
|-----------|--------|---------|
| `WorkspaceSyncReactor` | 🆕 To Build | Single reactor for all entities per connection |
| Scheduler wiring | 🆕 To Build | Trigger per connection, not per entity |
| `SyncExecution` schema extension | 🆕 To Build | Track multi-entity progress |

---

## 1. Architecture Overview

### Before (Current - Per-Entity Scheduling)

```
Scheduler triggers 11 separate reactor runs per connection:

  Scheduler → SyncReactor(:currencies, conn_1)
  Scheduler → SyncReactor(:departments, conn_1)
  Scheduler → SyncReactor(:gl_accounts, conn_1)
  Scheduler → SyncReactor(:locations, conn_1)
  Scheduler → SyncReactor(:classes, conn_1)
  Scheduler → SyncReactor(:projects, conn_1)
  Scheduler → SyncReactor(:customers, conn_1)
  Scheduler → SyncReactor(:vendors, conn_1)
  Scheduler → SyncReactor(:employees, conn_1)
  Scheduler → SyncReactor(:expense_categories, conn_1)
  Scheduler → SyncReactor(:accounting_periods, conn_1)

Problems:
- 11 scheduling events per connection
- No shared progress tracking
- Memory spikes from 11 concurrent syncs
- Hard to reason about "workspace sync complete"
```

### After (Target - Per-Connection Scheduling)

```
Scheduler triggers ONE reactor run per connection:

  Scheduler → WorkspaceSyncReactor(conn_1)
       │
       ├── step :init_execution
       │
       ├── step :sync_currencies ─────────┐
       ├── step :sync_subsidiaries        │
       ├── step :sync_accounting_periods  │
       ├── step :sync_departments         │
       ├── step :sync_locations           │  SEQUENTIAL
       ├── step :sync_classes             │  One at a time
       ├── step :sync_gl_accounts         │  Shared connection
       ├── step :sync_expense_categories  │  Single progress tracker
       ├── step :sync_projects            │
       ├── step :sync_customers           │
       ├── step :sync_vendors             │
       ├── step :sync_employees ──────────┘
       │
       ├── step :bridge_dimensions (conditional)
       │
       └── step :finalize

Benefits:
- 1 scheduling event per connection
- Single SyncExecution tracks entire run
- Bounded memory (only 1 entity type at a time)
- Clear "workspace sync complete" semantics
- Resumable from any entity type
```

---

## 2. WorkspaceSyncReactor Implementation

### File Location

```
lib/flame_teampay_payables/ember_erp/resources/reactors/sync/workspace_sync_reactor.ex
```

### Complete Implementation

```elixir
defmodule FlameTeampayPayables.EmberErp.Resources.Reactors.Sync.WorkspaceSyncReactor do
  @moduledoc """
  Workspace-centric sync reactor that processes ALL entity types for a single
  ERP connection in one atomic run.

  ## Key Differences from SyncReactor

  1. **Single Scheduling Unit**: One reactor run = one complete workspace sync
  2. **Sequential Entity Processing**: All entity types processed in dependency order
  3. **Shared Progress Tracking**: One SyncExecution tracks the entire run
  4. **Resumability**: Can resume from any entity type if interrupted

  ## Entity Processing Order (Dependency-Aware)

  1. currencies (no deps, needed for monetary values)
  2. subsidiaries (no deps, organizational structure)
  3. accounting_periods (no deps, time boundaries)
  4. departments (no deps, organizational)
  5. locations (no deps, organizational)
  6. classes (no deps, classification)
  7. gl_accounts (no deps, chart of accounts)
  8. expense_categories (may reference gl_accounts)
  9. projects (no deps)
  10. customers (no deps, may reference subsidiaries)
  11. vendors (no deps, may reference subsidiaries)
  12. employees (no deps, may reference departments)
  13. [conditional] dimension_bridge (depends on dimension entities)

  ## Usage

      # Full sync of all entities for a connection
      WorkspaceSyncReactor.run(%{
        erp_connection_id: "abc-123",
        workspace_id: "workspace-456",
        sync_mode: :incremental
      })

      # Resume from a specific entity (after failure)
      WorkspaceSyncReactor.run(%{
        erp_connection_id: "abc-123",
        workspace_id: "workspace-456",
        sync_mode: :incremental,
        resume_from: :vendors
      })
  """

  use Ash.Reactor

  require Logger

  alias FlameTeampayPayables.EmberErp.Resources.Connection.ErpConnection
  alias FlameTeampayPayables.EmberErp.Resources.Sync.SyncExecution
  alias FlameTeampayPayables.EmberErp.Services.EntitySyncService
  alias FlameTeampayPayables.EmberErp.Services.UnifiedDimensionBridgeService
  alias FlameTeampayPayables.EmberErp.Observability.ReactorInstrumentation, as: RI

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

  @dimension_entities [
    :departments,
    :locations,
    :classes,
    :gl_accounts,
    :expense_categories,
    :projects
  ]

  # ===========================================================================
  # REACTOR INPUTS
  # ===========================================================================

  input :erp_connection_id
  input :workspace_id
  input :entity_id  # Optional: for entity-scoped syncs
  input :sync_mode  # :full | :incremental, defaults to :incremental
  input :resume_from  # Optional: entity type to resume from
  input :otel_ctx  # OpenTelemetry parent context

  # ===========================================================================
  # STEP: INITIALIZE EXECUTION
  # ===========================================================================

  step :init_execution do
    argument :erp_connection_id, input(:erp_connection_id)
    argument :workspace_id, input(:workspace_id)
    argument :entity_id, input(:entity_id)
    argument :sync_mode, input(:sync_mode)
    argument :resume_from, input(:resume_from)
    argument :otel_ctx, input(:otel_ctx)

    run fn args, _context ->
      RI.restore_parent_context(args[:otel_ctx])

      RI.with_step("init_execution", [
        {"erp_connection_id", args.erp_connection_id},
        {"sync_mode", to_string(args[:sync_mode] || :incremental)}
      ], fn ->
        workspace_id = args.workspace_id
        sync_mode = args[:sync_mode] || :incremental

        # Load connection with credentials
        with {:ok, connection} <- load_connection(args.erp_connection_id, workspace_id),
             {:ok, execution} <- create_or_resume_execution(connection, args) do

          # Determine which entities to sync (supports resume)
          start_index = determine_start_index(args[:resume_from])
          entities_to_sync = Enum.drop(@entity_order, start_index)

          Logger.info("[WorkspaceSyncReactor] Initialized",
            connection_id: connection.id,
            provider: connection.provider,
            sync_mode: sync_mode,
            entities_to_sync: length(entities_to_sync),
            resume_from: args[:resume_from]
          )

          {:ok, %{
            connection: connection,
            execution: execution,
            workspace_id: workspace_id,
            entity_id: args[:entity_id],
            entities_to_sync: entities_to_sync,
            sync_mode: sync_mode,
            start_time: System.monotonic_time(:millisecond)
          }}
        end
      end)
    end
  end

  # ===========================================================================
  # STEP: SYNC ALL ENTITIES
  # ===========================================================================

  step :sync_all_entities do
    argument :context, result(:init_execution)

    run fn %{context: ctx}, _reactor_context ->
      RI.with_step("sync_all_entities", [
        {"entity_count", to_string(length(ctx.entities_to_sync))}
      ], fn ->
        sync_entities_sequentially(ctx)
      end)
    end
  end

  # ===========================================================================
  # STEP: DIMENSION BRIDGE (CONDITIONAL)
  # ===========================================================================

  step :bridge_dimensions do
    argument :sync_result, result(:sync_all_entities)
    argument :workspace_id, input(:workspace_id)
    argument :entity_id, input(:entity_id)
    argument :erp_connection_id, input(:erp_connection_id)

    run fn args, _context ->
      sync_result = args.sync_result

      # Only bridge if dimension entities were synced
      synced_dimensions = Enum.filter(
        sync_result.completed_entities,
        &(&1 in @dimension_entities)
      )

      if length(synced_dimensions) > 0 do
        RI.with_step("bridge_dimensions", [
          {"synced_dimensions", inspect(synced_dimensions)}
        ], fn ->
          Logger.info("[WorkspaceSyncReactor] Bridging dimensions",
            synced_dimensions: synced_dimensions
          )

          case load_connection(args.erp_connection_id, args.workspace_id) do
            {:ok, connection} ->
              UnifiedDimensionBridgeService.bridge_all(
                args.workspace_id,
                args[:entity_id],
                connection.id,
                connection.provider
              )

            {:error, reason} ->
              Logger.error("[WorkspaceSyncReactor] Failed to load connection for bridge",
                error: inspect(reason)
              )
              {:error, reason}
          end
        end)
      else
        Logger.info("[WorkspaceSyncReactor] Skipping dimension bridge (no dimension entities synced)")
        {:ok, :skipped}
      end
    end
  end

  # ===========================================================================
  # STEP: FINALIZE EXECUTION
  # ===========================================================================

  step :finalize do
    argument :init_context, result(:init_execution)
    argument :sync_result, result(:sync_all_entities)
    argument :bridge_result, result(:bridge_dimensions)

    run fn args, _context ->
      RI.with_step("finalize", [], fn ->
        ctx = args.init_context
        sync_result = args.sync_result
        duration = System.monotonic_time(:millisecond) - ctx.start_time

        # Calculate totals
        total_synced = sync_result.entity_stats
          |> Map.values()
          |> Enum.map(&Map.get(&1, :records_synced, 0))
          |> Enum.sum()

        total_failed = sync_result.entity_stats
          |> Map.values()
          |> Enum.map(&Map.get(&1, :failed, 0))
          |> Enum.sum()

        # Update SyncExecution to completed
        finalize_execution(ctx.execution, %{
          status: :completed,
          completed_entities: sync_result.completed_entities,
          entity_stats: sync_result.entity_stats,
          total_synced: total_synced,
          total_failed: total_failed,
          duration_ms: duration,
          bridge_result: args.bridge_result
        })

        Logger.info("[WorkspaceSyncReactor] Completed",
          connection_id: ctx.connection.id,
          entities_synced: length(sync_result.completed_entities),
          total_records: total_synced,
          total_failed: total_failed,
          duration_ms: duration
        )

        {:ok, %{
          status: :completed,
          connection_id: ctx.connection.id,
          completed_entities: sync_result.completed_entities,
          entity_stats: sync_result.entity_stats,
          total_synced: total_synced,
          total_failed: total_failed,
          duration_ms: duration,
          bridge_result: args.bridge_result
        }}
      end)
    end
  end

  # ===========================================================================
  # RETURN VALUE
  # ===========================================================================

  return :finalize

  # ===========================================================================
  # PRIVATE FUNCTIONS
  # ===========================================================================

  defp sync_entities_sequentially(ctx) do
    initial_acc = %{
      completed_entities: [],
      entity_stats: %{},
      failed_entities: []
    }

    result = Enum.reduce(ctx.entities_to_sync, initial_acc, fn entity_type, acc ->
      Logger.info("[WorkspaceSyncReactor] Syncing #{entity_type}",
        entity_type: entity_type,
        completed_so_far: length(acc.completed_entities)
      )

      # Update execution: now syncing this entity
      update_execution_progress(ctx.execution, %{
        current_entity_type: entity_type,
        status: :in_progress
      })

      # Get time cursor for incremental sync
      time_cursor = if ctx.sync_mode == :incremental do
        get_last_sync_cursor(ctx.connection, entity_type)
      end

      # Call EntitySyncService
      case EntitySyncService.sync_entity(ctx.connection, entity_type,
             time_cursor: time_cursor,
             entity_id: ctx.entity_id
           ) do
        {:ok, stats} ->
          Logger.info("[WorkspaceSyncReactor] Completed #{entity_type}",
            records_synced: stats.records_synced,
            failed: stats.failed,
            duration_ms: stats.duration_ms
          )

          # Update execution progress
          update_execution_progress(ctx.execution, %{
            completed_entities: [entity_type | acc.completed_entities],
            entity_stats: Map.put(acc.entity_stats, entity_type, stats)
          })

          %{acc |
            completed_entities: [entity_type | acc.completed_entities],
            entity_stats: Map.put(acc.entity_stats, entity_type, stats)
          }

        {:error, error_info} ->
          Logger.warning("[WorkspaceSyncReactor] Failed #{entity_type}, continuing",
            entity_type: entity_type,
            error: inspect(error_info.reason),
            partial_synced: error_info.stats.records_synced
          )

          # Record failure but continue with other entities
          %{acc |
            failed_entities: [entity_type | acc.failed_entities],
            entity_stats: Map.put(acc.entity_stats, entity_type, %{
              status: :failed,
              error: error_info.reason,
              partial_synced: error_info.stats.records_synced,
              cursor: error_info[:cursor]
            })
          }
      end
    end)

    {:ok, result}
  end

  defp determine_start_index(nil), do: 0
  defp determine_start_index(resume_from) when is_atom(resume_from) do
    case Enum.find_index(@entity_order, &(&1 == resume_from)) do
      nil ->
        Logger.warning("[WorkspaceSyncReactor] Unknown resume_from entity: #{resume_from}, starting from beginning")
        0
      index ->
        index
    end
  end

  defp load_connection(erp_connection_id, workspace_id) do
    ErpConnection
    |> Ash.Query.filter(id == ^erp_connection_id)
    |> Ash.Query.load([:credentials])
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
  end

  defp create_or_resume_execution(connection, args) do
    # Check for existing in-progress execution to resume
    case find_resumable_execution(connection, args.workspace_id) do
      {:ok, existing} when not is_nil(existing) ->
        Logger.info("[WorkspaceSyncReactor] Resuming existing execution",
          execution_id: existing.id
        )
        {:ok, existing}

      _ ->
        # Create new execution
        SyncExecution
        |> Ash.Changeset.for_create(:create, %{
          erp_connection_id: connection.id,
          workspace_id: args.workspace_id,
          entity_id: args[:entity_id],
          entity_type: :workspace,  # Special marker for workspace-level sync
          status: :running,
          sync_mode: args[:sync_mode] || :incremental,
          metadata: %{
            reactor: "WorkspaceSyncReactor",
            started_at: DateTime.utc_now()
          }
        })
        |> Ash.create(tenant: args.workspace_id, authorize?: false)
    end
  end

  defp find_resumable_execution(connection, workspace_id) do
    SyncExecution
    |> Ash.Query.filter(
      erp_connection_id == ^connection.id and
      status == :running and
      entity_type == :workspace
    )
    |> Ash.Query.sort(inserted_at: :desc)
    |> Ash.Query.limit(1)
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
  end

  defp update_execution_progress(execution, updates) do
    execution
    |> Ash.Changeset.for_update(:update, %{
      current_entity_type: updates[:current_entity_type],
      completed_entities: updates[:completed_entities],
      entity_stats: updates[:entity_stats],
      status: updates[:status]
    })
    |> Ash.update(authorize?: false)
  end

  defp finalize_execution(execution, final_stats) do
    execution
    |> Ash.Changeset.for_update(:update, %{
      status: final_stats.status,
      completed_entities: final_stats.completed_entities,
      entity_stats: final_stats.entity_stats,
      records_synced: final_stats.total_synced,
      records_failed: final_stats.total_failed,
      duration_ms: final_stats.duration_ms,
      finished_at: DateTime.utc_now()
    })
    |> Ash.update(authorize?: false)
  end

  defp get_last_sync_cursor(connection, entity_type) do
    # Get the last successful sync time for incremental sync
    case SyncExecution
         |> Ash.Query.filter(
           erp_connection_id == ^connection.id and
           status == :completed
         )
         |> Ash.Query.sort(finished_at: :desc)
         |> Ash.Query.limit(1)
         |> Ash.read_one(tenant: connection.workspace_id, authorize?: false) do
      {:ok, nil} -> nil
      {:ok, execution} -> execution.finished_at
      _ -> nil
    end
  end
end
```

---

## 3. SyncExecution Schema Extension

The `SyncExecution` resource needs additional fields to support workspace-level tracking:

### File: `lib/flame_teampay_payables/ember_erp/resources/sync/sync_execution.ex`

Add these attributes:

```elixir
attributes do
  # ... existing attributes ...

  # NEW: Workspace sync tracking
  attribute :current_entity_type, :atom do
    description "Currently syncing entity type (for progress display)"
  end

  attribute :completed_entities, {:array, :atom} do
    default []
    description "List of successfully synced entity types"
  end

  attribute :entity_stats, :map do
    default %{}
    description "Per-entity sync statistics: %{entity_type => %{records_synced, failed, duration_ms}}"
  end

  attribute :sync_mode, :atom do
    constraints one_of: [:full, :incremental]
    default :incremental
    description "Whether this was a full or incremental sync"
  end

  attribute :resumed_from, :atom do
    description "If this execution was resumed, which entity it started from"
  end
end
```

---

## 4. Scheduler Wiring

### Option A: Modify SyncConfiguration Triggers

```elixir
# In SyncConfiguration resource

triggers do
  trigger :workspace_sync do
    action :execute_workspace_sync
    scheduler :every, "*/5 * * * *"  # Every 5 minutes
  end
end

actions do
  action :execute_workspace_sync do
    run fn _input, context ->
      # Get connection for this configuration
      connection_id = context.actor.erp_connection_id
      workspace_id = context.actor.workspace_id
      
      WorkspaceSyncReactor.run(%{
        erp_connection_id: connection_id,
        workspace_id: workspace_id,
        sync_mode: :incremental
      })
    end
  end
end
```

### Option B: Oban Worker (Recommended for More Control)

Create a new worker:

```elixir
defmodule FlameTeampayPayables.EmberErp.Workers.WorkspaceSyncWorker do
  use Oban.Pro.Worker,
    queue: :erp_sync,
    max_attempts: 3,
    priority: 1

  alias FlameTeampayPayables.EmberErp.Resources.Reactors.Sync.WorkspaceSyncReactor

  @impl true
  def process(%Oban.Job{args: args}) do
    case WorkspaceSyncReactor.run(%{
      erp_connection_id: args["erp_connection_id"],
      workspace_id: args["workspace_id"],
      entity_id: args["entity_id"],
      sync_mode: String.to_existing_atom(args["sync_mode"] || "incremental"),
      resume_from: args["resume_from"] && String.to_existing_atom(args["resume_from"])
    }) do
      {:ok, result} ->
        {:ok, result}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # Schedule all active connections
  def schedule_all_connections do
    # Get all active ERP connections
    connections = list_active_connections()

    Enum.each(connections, fn conn ->
      %{
        "erp_connection_id" => conn.id,
        "workspace_id" => conn.workspace_id,
        "sync_mode" => "incremental"
      }
      |> __MODULE__.new(schedule_in: jitter_delay(conn))
      |> Oban.insert()
    end)
  end

  # Add jitter to spread out sync starts
  defp jitter_delay(conn) do
    # Hash connection ID to get consistent but distributed delay
    hash = :erlang.phash2(conn.id, 300)  # 0-299 seconds
    hash
  end
end
```

---

## 5. Migration Path

### Phase 1: Deploy WorkspaceSyncReactor (Parallel)

1. Deploy `WorkspaceSyncReactor` alongside existing `SyncReactor`
2. Both can run - no breaking changes
3. Test workspace sync via manual trigger or new worker

### Phase 2: Switch Scheduling

1. Disable per-entity-type triggers
2. Enable per-connection triggers
3. Monitor for issues

### Phase 3: Deprecate SyncReactor

1. After 2 weeks of successful workspace syncs
2. Mark `SyncReactor` as deprecated
3. Eventually remove

---

## 6. Testing Strategy

### Tier 1: IEx Manual Test

```elixir
# Get a connection
alias FlameTeampayPayables.EmberErp.Resources.Connection.ErpConnection
alias FlameTeampayPayables.EmberWorkspaces.Resources.Workspace
alias FlameTeampayPayables.EmberErp.Resources.Reactors.Sync.WorkspaceSyncReactor

{:ok, workspace} = Ash.read_one(Ash.Query.limit(Workspace, 1), authorize?: false)
{:ok, conns} = Ash.read(ErpConnection, tenant: workspace.id, authorize?: false)
conn = Enum.find(conns, &(&1.provider == :netsuite))

# Run full workspace sync
WorkspaceSyncReactor.run(%{
  erp_connection_id: conn.id,
  workspace_id: workspace.id,
  sync_mode: :incremental
})

# Check result - should show all entity types synced
```

### Tier 2: Worker Test

```elixir
# Insert job
%{
  "erp_connection_id" => conn.id,
  "workspace_id" => workspace.id,
  "sync_mode" => "incremental"
}
|> FlameTeampayPayables.EmberErp.Workers.WorkspaceSyncWorker.new()
|> Oban.insert()

# Check Oban dashboard or logs
```

---

## 7. Metrics & Observability

The reactor includes full OpenTelemetry instrumentation via `RI.with_step`. Key spans:

- `WorkspaceSyncReactor.init_execution`
- `WorkspaceSyncReactor.sync_all_entities`
- `WorkspaceSyncReactor.sync_entity.{entity_type}` (12 spans)
- `WorkspaceSyncReactor.bridge_dimensions`
- `WorkspaceSyncReactor.finalize`

Each span includes:
- Entity type being synced
- Records synced/failed
- Duration
- Error information (if failed)

---

## 8. Summary: What the Coder Must Build

| # | Component | File | Status |
|---|-----------|------|--------|
| 1 | WorkspaceSyncReactor | `resources/reactors/sync/workspace_sync_reactor.ex` | 🆕 Create |
| 2 | SyncExecution schema extension | `resources/sync/sync_execution.ex` | 📝 Modify |
| 3 | WorkspaceSyncWorker (optional) | `workers/workspace_sync_worker.ex` | 🆕 Create |
| 4 | Scheduler wiring | TBD based on approach | 🆕 Create |
| 5 | Tests | `priv/scripts/tier1_workspace_sync_test.exs` | 🆕 Create |

**Estimated Complexity**: Medium-High
**Estimated Time (AI Coder)**: 1-2 hours including testing

