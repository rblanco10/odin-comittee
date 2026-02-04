# Bridge Implementation: Task Assignments

> **Session:** SC-2025-12-22-003
> **Topic:** Bridge Implementation Planning
> **Status:** ✅ COMPLETE

---

## Overview

This document tracks the implementation of the Bridge system, which decouples business layer logic (CodingCategory/CodingValue) from ERP sync.

**Prior Session Reference:** SC-2025-12-22-002 (Design Approval)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 20 |
| **Phase 1** | 3 tasks (Schema Foundation) |
| **Phase 2** | 9 tasks (Mirror Table Cursor) |
| **Phase 3** | 5 tasks (Bridge Domain) |
| **Phase 4** | 3 tasks (Activation) |

---

## Phase 1: Schema Foundation

> **Dependency:** None
> **Must Deploy Together:** Yes

| ID | Task | File | Assignee | Status |
|----|------|------|----------|--------|
| P1-T1 | Migration: Make entity_id optional | `priv/repo/migrations/XXXX_make_coding_entity_id_optional.exs` | — | ⏳ Pending |
| P1-T2 | CodingCategory: entity_id optional + partial identities | `lib/.../ember_coding/definitions/resources/coding_category.ex` | — | ⏳ Pending |
| P1-T3 | CodingValue: entity_id optional + partial identities | `lib/.../ember_coding/definitions/resources/coding_value.ex` | — | ⏳ Pending |

### P1-T1: Migration Details

```elixir
# Migration: make_coding_entity_id_optional.exs

# Changes:
# 1. ALTER coding_dimension_types.entity_id to allow NULL
# 2. ALTER coding_dimension_values.entity_id to allow NULL
# 3. Drop existing unique indexes
# 4. Create partial unique indexes:
#    - WHERE entity_id IS NULL (workspace-wide)
#    - WHERE entity_id IS NOT NULL (entity-scoped)

# See: artifacts/sessions/SC-2025-12-22-002/MIGRATIONS.md for full migration code
```

### P1-T2: CodingCategory Changes

```elixir
# Changes required:
# 1. attribute :entity_id → allow_nil?: true
# 2. Remove :entity_id from validate present(...)
# 3. Add partial identities with where: clauses
# 4. Add identity_wheres_to_sql to postgres block
# 5. Add skip_unique_indexes for manual index management
```

### P1-T3: CodingValue Changes

```elixir
# Changes required:
# 1. attribute :entity_id → allow_nil?: true
# 2. Remove :entity_id from validate present(...)
# 3. Add partial identities for workspace-wide case
# 4. Update postgres block with identity_wheres_to_sql
# 5. Verify :upsert_from_erp action handles NULL entity_id
```

**Validation Checkpoint:** `mix ash.codegen && mix ecto.migrate` — Schema compiles, migration succeeds.

---

## Phase 2: Mirror Table Cursor

> **Dependency:** Phase 1 complete
> **Must Deploy Together:** Yes (all 9 items)

| ID | Task | File | Assignee | Status |
|----|------|------|----------|--------|
| P2-T1 | Migration: Add bridged_at to 8 tables | `priv/repo/migrations/XXXX_add_bridged_at_to_erp_mirrors.exs` | — | ⏳ Pending |
| P2-T2 | Department: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/department.ex` | — | ⏳ Pending |
| P2-T3 | Location: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/location.ex` | — | ⏳ Pending |
| P2-T4 | Class: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/class.ex` | — | ⏳ Pending |
| P2-T5 | Project: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/project.ex` | — | ⏳ Pending |
| P2-T6 | GLAccount: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/gl_account.ex` | — | ⏳ Pending |
| P2-T7 | Job: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/job.ex` | — | ⏳ Pending |
| P2-T8 | ExpenseCategory: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/expense/expense_category.ex` | — | ⏳ Pending |
| P2-T9 | CustomDimensionValue: Add bridged_at + link_and_bridge | `lib/.../ember_erp/resources/accounting/core/custom_dimension_value.ex` | — | ⏳ Pending |

### P2-T2 through P2-T9: Attribute + Action Pattern

Each mirror table needs:

```elixir
# In attributes block, ADD:
attribute :bridged_at, :utc_datetime_usec,
  allow_nil?: true,
  public?: true,
  description: "When this record was last bridged to CodingValue"

# In actions block, ADD:
update :link_and_bridge do
  description "Link to CodingValue and mark as bridged"
  require_atomic? false
  accept [:coding_value_id, :bridged_at]
end

# In code_interface block, ADD:
define :link_and_bridge
```

**Validation Checkpoint:** `mix ash.codegen` — All 8 resources compile.

---

## Phase 3: Bridge Domain

> **Dependency:** Phases 1 + 2 complete
> **Build Order:** Bottom-up (Service → Reactor → Worker)

| ID | Task | File | Assignee | Status |
|----|------|------|----------|--------|
| P3-T1 | Create ember_bridge directory structure | `lib/.../ember_bridge/` | — | ⏳ Pending |
| P3-T2 | Domain module | `lib/.../ember_bridge/domain.ex` | — | ⏳ Pending |
| P3-T3 | DimensionBridgeService | `lib/.../ember_bridge/services/dimension_bridge_service.ex` | — | ⏳ Pending |
| P3-T4 | BridgeReactor | `lib/.../ember_bridge/reactors/bridge_reactor.ex` | — | ⏳ Pending |
| P3-T5 | BridgeWorker | `lib/.../ember_bridge/workers/bridge_worker.ex` | — | ⏳ Pending |

### P3-T1: Directory Structure

```
lib/flame_teampay_payables/ember_bridge/
├── domain.ex
├── workers/
│   └── bridge_worker.ex
├── reactors/
│   └── bridge_reactor.ex
└── services/
    └── dimension_bridge_service.ex
```

### P3-T3: DimensionBridgeService (Core Logic)

**Responsibilities:**
1. Query records needing bridging (`bridged_at IS NULL OR updated_at > bridged_at`)
2. Ensure CodingCategory exists (workspace/entity/code)
3. Upsert CodingValue (by external_id)
4. Resolve parent_id hierarchy
5. Bidirectional link: mirror ↔ CodingValue
6. Set bridged_at = now()

**Critical:** Must handle workspace-wide (entity_id = NULL) correctly.

### P3-T4: BridgeReactor (8 Steps)

| Step | Entity Type | Category Code |
|------|-------------|---------------|
| 1 | Department | DEPARTMENT |
| 2 | Location | LOCATION |
| 3 | Class | CLASS |
| 4 | Project | PROJECT |
| 5 | GLAccount | GL-ACCOUNT |
| 6 | Job | JOB |
| 7 | ExpenseCategory | CATEGORY |
| 8 | CustomDimensionValue | UDD-{name} |

Each step has compensation (failure in one doesn't block others).

### P3-T5: BridgeWorker (Oban)

```elixir
use Oban.Worker,
  queue: :bridge,
  max_attempts: 3,
  priority: 2

# Invokes BridgeReactor.run(%{})
# Emits metrics + logging
```

**Validation Checkpoint:** Unit tests for DimensionBridgeService compile and pass.

---

## Phase 4: Activation

> **Dependency:** Phase 3 complete
> **Caution:** Do not enable cron until all prior phases deployed

| ID | Task | File | Assignee | Status |
|----|------|------|----------|--------|
| P4-T1 | Add :bridge queue to Oban | `config/config.exs` | — | ⏳ Pending |
| P4-T2 | Add cron job for BridgeWorker | `config/config.exs` | — | ⏳ Pending |
| P4-T3 | Integration tests | `test/flame_teampay_payables/ember_bridge/` | — | ⏳ Pending |

### P4-T1 + P4-T2: Oban Configuration

```elixir
config :flame_teampay_payables, Oban,
  queues: [
    # ... existing queues
    bridge: 5  # ← ADD
  ],
  plugins: [
    {Oban.Plugins.Cron,
      crontab: [
        # ... existing jobs
        {"*/2 * * * *", FlameTeampayPayables.EmberBridge.Workers.BridgeWorker}  # ← ADD
      ]
    }
  ]
```

### P4-T3: Integration Tests

```elixir
# Test scenarios:
# 1. Sync creates Department → Bridge run → CodingCategory exists → CodingValue exists
# 2. Department updated_at > bridged_at → Bridge re-processes
# 3. Workspace-wide Department (entity_id = nil) → CodingValue has entity_id = nil
# 4. Hierarchy: Child department → parent_id set correctly on CodingValue
```

**Validation Checkpoint:** Full test suite passes, manual Bridge run succeeds.

---

## Phase 5: Query Updates (Post-Deployment)

> **Dependency:** Phase 1 deployed
> **Can Be Gradual:** Yes

| ID | Task | Pattern | Status |
|----|------|---------|--------|
| P5-T1 | Find entity_id filters in LiveViews | `rg "entity_id == \^"` | ⏳ Pending |
| P5-T2 | Update to include workspace-wide | See pattern below | ⏳ Pending |

### Query Pattern

```elixir
# BEFORE
|> Ash.Query.filter(entity_id == ^entity_id)

# AFTER
|> Ash.Query.filter(entity_id == ^entity_id or is_nil(entity_id))
```

**Files to search:**
- `lib/flame_teampay_payables_web/live/**/*.ex`
- `lib/flame_teampay_payables/ember_coding/**/*.ex`
- `lib/flame_teampay_payables/ember_expense_card/**/*.ex`

---

## Deployment Order

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Deploy Together                                                    │
│  ─────────────────────────                                                   │
│  1. Run migration: make_coding_entity_id_optional                            │
│  2. Deploy CodingCategory + CodingValue changes                              │
│                                                                              │
│  ⚠️  VERIFY: Schema compiles, no production errors                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: Deploy Together                                                    │
│  ─────────────────────────                                                   │
│  1. Run migration: add_bridged_at_to_erp_mirrors                             │
│  2. Deploy 8 mirror table resource changes                                   │
│                                                                              │
│  ⚠️  VERIFY: Sync still works, bridged_at is NULL on all records            │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: Deploy Together                                                    │
│  ─────────────────────────                                                   │
│  1. Deploy ember_bridge domain + service + reactor + worker                  │
│  2. Add :bridge queue (cron DISABLED initially)                              │
│  3. Test manually: BridgeWorker.perform/1                                    │
│                                                                              │
│  ⚠️  VERIFY: Manual Bridge run processes records correctly                  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: Enable                                                             │
│  ───────────────                                                             │
│  1. Enable cron job (every 2 min)                                            │
│  2. Monitor metrics + logs                                                   │
│                                                                              │
│  ✅ BRIDGE IS LIVE                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: Gradual                                                            │
│  ───────────────                                                             │
│  1. Update queries to include workspace-wide dimensions                      │
│  2. Update UI dropdowns                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

### Phase 1 Rollback

⚠️ **Warning:** Will DELETE workspace-wide records (entity_id = NULL).

```sql
-- Export first:
SELECT * FROM coding_dimension_types WHERE entity_id IS NULL;
SELECT * FROM coding_dimension_values WHERE entity_id IS NULL;
```

Then run migration rollback.

### Phase 3/4 Rollback

Safe rollback:
1. Disable cron job
2. `Oban.cancel_all_jobs(:bridge)`
3. Comment out :bridge queue
4. Bridge failure does NOT affect sync

---

## Progress Log

| Timestamp | Engineer | Task | Update |
|-----------|----------|------|--------|
| 2025-12-22 | Committee | — | Task assignments created |
| — | — | — | — |

---

## Questions for Engineering

Before starting, clarify:

1. **Observability services:** Are `PrometheusMetricsService`, `LokiLoggingService`, `TempoTracingService` available?
2. **Oban Pro:** Is `Oban.Pro.Worker` available, or use `Oban.Worker`?
3. **Feature flag:** Should Bridge be behind a feature flag for gradual rollout?

---

## Reference Documents

| Document | Location |
|----------|----------|
| Design Proposal | `artifacts/sessions/SC-2025-12-22-002/DESIGN-PROPOSAL.md` |
| Implementation Spec | `artifacts/sessions/SC-2025-12-22-002/IMPLEMENTATION-SPEC.md` |
| Migrations | `artifacts/sessions/SC-2025-12-22-002/MIGRATIONS.md` |
| Resource Changes | `artifacts/sessions/SC-2025-12-22-002/RESOURCE-CHANGES.md` |
| Engineering Handoff | `artifacts/sessions/SC-2025-12-22-002/ENGINEERING-HANDOFF.md` |

---

*Document created: 2025-12-22 by Sync Committee Scribe*
*Session: SC-2025-12-22-003*

