# Wiring Diagram: Streaming Sync Integration

**Document ID:** WIRE-SCALE-001  
**Created:** 2024-12-21  
**Status:** Approved by Committee  
**Related:** PROP-SCALE-001, IMPL-SCALE-001

---

## Purpose

This document clarifies exactly how the new streaming sync components integrate with existing code. It resolves all ambiguity about entry points, call chains, and migration paths.

---

## Key Decisions

| Question | Decision |
|----------|----------|
| Does SyncReactor still exist? | **Yes** — Keep it, refactor internals |
| What calls EntitySyncService? | **SyncReactor steps** call it |
| How are entity types iterated? | **SyncReactor steps** (already sequential) |
| Where is progress saved? | **SyncExecution** resource (extend schema) |
| How does scheduler trigger new flow? | **Unchanged** — still triggers SyncReactor |
| What about Dimension Bridge? | **Conditional** — skip for entity-only syncs |

---

## Current Flow (Before)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT FLOW (PROBLEMATIC)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AshOban Scheduler                                                          │
│       │                                                                      │
│       ▼                                                                      │
│  SyncConfiguration.execute_scheduled_sync                                   │
│       │                                                                      │
│       ▼                                                                      │
│  SyncReactor.run(inputs)                                                    │
│       │                                                                      │
│       ├── step :sync_currencies ─────┐                                      │
│       ├── step :sync_subsidiaries    │                                      │
│       ├── step :sync_gl_accounts     │                                      │
│       ├── step :sync_departments     │   Each step calls:                   │
│       ├── step :sync_locations       ├── CapabilityRouter.sync()            │
│       ├── step :sync_classes         │       │                              │
│       ├── step :sync_projects        │       ▼                              │
│       ├── step :sync_customers       │   Adapter.sync_<entity>()            │
│       ├── step :sync_vendors         │       │                              │
│       ├── step :sync_employees ──────┘       ▼                              │
│       │                              ┌───────────────────────────┐          │
│       │                              │ fetch_all_<entity>()      │          │
│       │                              │ ⚠️ LOADS ALL INTO MEMORY  │          │
│       │                              └───────────────────────────┘          │
│       │                                      │                              │
│       │                                      ▼                              │
│       │                              ┌───────────────────────────┐          │
│       │                              │ <Entity>SyncHandler       │          │
│       │                              │ ⚠️ N+1 INDIVIDUAL SAVES   │          │
│       │                              └───────────────────────────┘          │
│       │                                                                      │
│       └── step :bridge_dimensions ─── UnifiedDimensionBridgeService         │
│               ⚠️ RUNS UNCONDITIONALLY (even for vendor-only sync)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## New Flow (After)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEW FLOW (STREAMING + BULK)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AshOban Scheduler  (UNCHANGED)                                             │
│       │                                                                      │
│       ▼                                                                      │
│  SyncConfiguration.execute_scheduled_sync  (UNCHANGED)                      │
│       │                                                                      │
│       ▼                                                                      │
│  SyncReactor.run(inputs)  (MODIFIED INTERNALS)                              │
│       │                                                                      │
│       ├── step :init_execution ──────── Create/resume SyncExecution         │
│       │                                                                      │
│       ├── step :sync_currencies ─────┐                                      │
│       ├── step :sync_subsidiaries    │                                      │
│       ├── step :sync_gl_accounts     │                                      │
│       ├── step :sync_departments     │   Each step calls:                   │
│       ├── step :sync_locations       ├── EntitySyncService.sync_entity()    │
│       ├── step :sync_classes         │       │                              │
│       ├── step :sync_projects        │       ▼                              │
│       ├── step :sync_customers       │   ┌─────────────────────────────┐    │
│       ├── step :sync_vendors         │   │ EntitySyncService           │    │
│       ├── step :sync_employees ──────┘   │ (orchestrates pagination)   │    │
│       │                                  └─────────────────────────────┘    │
│       │                                          │                          │
│       │                          ┌───────────────┴───────────────┐          │
│       │                          │                               │          │
│       │                          ▼                               ▼          │
│       │              ┌─────────────────────┐      ┌─────────────────────┐  │
│       │              │ CapabilityRouter    │      │ BulkUpsertService   │  │
│       │              │ .fetch_page()       │      │ .upsert_batch()     │  │
│       │              │ ✅ ONE PAGE ONLY    │      │ ✅ BULK INSERT      │  │
│       │              └─────────────────────┘      └─────────────────────┘  │
│       │                          │                               │          │
│       │                          └───────────┬───────────────────┘          │
│       │                                      │                              │
│       │                                      ▼                              │
│       │                              ┌───────────────────────────┐          │
│       │                              │ Loop until has_more=false │          │
│       │                              │ Save cursor after each    │          │
│       │                              │ page (resumable)          │          │
│       │                              └───────────────────────────┘          │
│       │                                                                      │
│       └── step :bridge_dimensions ─── if should_bridge?(config) do          │
│               ✅ CONDITIONAL (only runs when needed)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Unchanged Components

| Component | Current Role | Change |
|-----------|--------------|--------|
| AshOban Scheduler | Triggers syncs on schedule | None |
| SyncConfiguration | Stores sync settings, triggers executor | None |
| execute_scheduled_sync | Calls SyncReactor.run() | None |

### Modified Components

| Component | Current Role | New Role |
|-----------|--------------|----------|
| **SyncReactor** | Orchestrates entity syncs, calls CapabilityRouter | Orchestrates entity syncs, calls **EntitySyncService** |
| **CapabilityRouter** | Has `sync/4` that fetches all | Add `fetch_page/4` that fetches one page |
| **Vendors capability** | Has `fetch_all_vendors/9` | Add `fetch_page/3` that fetches one page |

### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **EntitySyncService** | Orchestrates paginated fetch + bulk upsert loop | `ember_erp/services/entity_sync_service.ex` |
| **VendorBulkUpsertService** | Bulk inserts vendor records | `ember_erp/services/bulk/vendor_bulk_upsert_service.ex` |
| **(9 more BulkUpsertServices)** | One per entity type | `ember_erp/services/bulk/` |

---

## Call Chain Comparison

### Before (Single Vendor Sync)

```elixir
SyncReactor.run(%{erp_connection_id: conn_id, ...})
  → step :sync_vendors
    → CapabilityRouter.sync(:netsuite, :vendors, config, opts)
      → NetSuiteAdapter.sync_vendors(config, opts)
        → Vendors.fetch_all_vendors(config, ..., [], 0)  # Recursive, accumulates ALL
          → returns {:ok, %{records: [1108 vendors], ...}}
      → VendorSyncHandler.handle_sync_result(result, conn, ws_id)
        → Enum.each(records, fn r -> Vendor.create_from_erp(r) end)  # N+1
```

### After (Single Vendor Sync)

```elixir
SyncReactor.run(%{erp_connection_id: conn_id, ...})
  → step :sync_vendors
    → EntitySyncService.sync_entity(connection, :vendors, opts)
      → Loop:
        → CapabilityRouter.fetch_page(:netsuite, :vendors, config, cursor, page_size: 1000)
          → Vendors.fetch_page(config, cursor, opts)
            → returns {:ok, %{records: [1000], next_cursor: %{offset: 1000}, has_more: true}}
        → VendorBulkUpsertService.upsert_batch(records, connection)
          → Ash.bulk_create(mapped, Vendor, :create_from_erp, upsert?: true, ...)
        → Update SyncExecution.current_cursor
        → If has_more, continue loop
      → returns {:ok, %{records_synced: 1108, pages: 2, failed: 0}}
```

---

## File Changes Summary

### Phase 1: Capability Layer

| File | Action | Change |
|------|--------|--------|
| `adapters/capability_router.ex` | Modify | Add `fetch_page/4` function |
| `adapters/providers/netsuite/capabilities/sync/parties/vendors.ex` | Modify | Add `fetch_page/3` function |

### Phase 2: Bulk Upsert Layer

| File | Action | Change |
|------|--------|--------|
| `services/bulk/` | Create | New directory |
| `services/bulk/vendor_bulk_upsert_service.ex` | Create | Bulk upsert for vendors |

### Phase 3: Orchestrator Layer

| File | Action | Change |
|------|--------|--------|
| `services/entity_sync_service.ex` | Create | Pagination + bulk upsert orchestration |

### Phase 4: Reactor Integration

| File | Action | Change |
|------|--------|--------|
| `resources/reactors/sync/sync_reactor.ex` | Modify | Steps call EntitySyncService instead of CapabilityRouter.sync |

### Phase 5: Progress Tracking

| File | Action | Change |
|------|--------|--------|
| `resources/sync_log/sync_execution.ex` | Modify | Add progress tracking attributes |
| Migration file | Create | Add columns for cursor, entities_completed |

### Phase 6: Expand to All Entity Types

| File | Action | Change |
|------|--------|--------|
| 9 more capabilities | Modify | Add `fetch_page/3` to each |
| 9 more bulk services | Create | One per entity type |
| `entity_sync_service.ex` | Modify | Add dispatch clauses for all types |

---

## SyncReactor Step Changes

### Before

```elixir
step :sync_vendors do
  run fn input, _ ->
    config = build_adapter_config(input.connection)
    
    case CapabilityRouter.sync(:netsuite, :vendors, config, []) do
      {:ok, result} ->
        VendorSyncHandler.handle_sync_result(result, input.connection, input.workspace_id)
      error -> error
    end
  end
end
```

### After

```elixir
step :sync_vendors do
  run fn input, _ ->
    # Check if already completed (for resumability)
    if :vendors in (input.sync_execution.entities_completed || []) do
      {:ok, :already_completed}
    else
      case EntitySyncService.sync_entity(input.connection, :vendors, 
             time_cursor: input.last_sync_at,
             sync_execution_id: input.sync_execution.id) do
        {:ok, stats} ->
          # Mark entity as completed
          update_sync_execution(input.sync_execution, :vendors, stats)
          {:ok, stats}
        error -> error
      end
    end
  end
end
```

---

## Progress Tracking Schema

### SyncExecution Extensions

```elixir
# In sync_execution.ex, add:

attribute :current_entity_type, :atom do
  description "Entity type currently being synced (for resumability)"
end

attribute :current_cursor, :map do
  description "Cursor for current page (for resumability)"
  default %{}
end

attribute :entities_completed, {:array, :atom} do
  description "List of entity types that have completed syncing"
  default []
end

attribute :entity_stats, :map do
  description "Stats per entity type: %{vendors: %{records: 1108, pages: 2}, ...}"
  default %{}
end
```

### Migration

```elixir
def change do
  alter table(:sync_executions) do
    add :current_entity_type, :string
    add :current_cursor, :map, default: %{}
    add :entities_completed, {:array, :string}, default: []
    add :entity_stats, :map, default: %{}
  end
end
```

---

## Dimension Bridge Handling

### Current (Unconditional)

```elixir
step :bridge_dimensions do
  run fn input, _ ->
    UnifiedDimensionBridgeService.bridge_dimensions(input.connection.id, input.workspace_id)
  end
end
```

### New (Conditional)

```elixir
step :bridge_dimensions do
  run fn input, _ ->
    # Only bridge if sync config says to, or if dimension entities were synced
    dimension_entities = [:gl_accounts, :departments, :locations, :classes, :projects]
    synced_dimensions = Enum.filter(dimension_entities, & &1 in input.sync_execution.entities_completed)
    
    if length(synced_dimensions) > 0 do
      UnifiedDimensionBridgeService.bridge_dimensions(input.connection.id, input.workspace_id)
    else
      {:ok, :skipped_no_dimension_entities}
    end
  end
end
```

---

## Resumability Flow

### Normal Completion

```
1. SyncReactor starts
2. Creates SyncExecution (status: :running)
3. For each entity:
   a. Set current_entity_type
   b. EntitySyncService pages through data
   c. After each page: update current_cursor
   d. On completion: add to entities_completed, clear cursor
4. After all entities: set status: :completed
```

### Crash Recovery

```
1. SyncReactor starts (or Oban retries)
2. Loads existing SyncExecution (status: :running)
3. Reads entities_completed → skip those
4. Reads current_entity_type, current_cursor → resume from there
5. Continue normal flow
```

---

## Verification Checklist

After implementation, verify:

```
□ SyncReactor still starts via AshOban schedule
□ Each entity type syncs via EntitySyncService
□ fetch_page returns ~1000 records per call
□ Bulk upsert saves records without N+1
□ SyncExecution.current_cursor updates after each page
□ entities_completed populates as entities finish
□ Crash recovery resumes from saved cursor
□ Dimension Bridge only runs when dimension entities synced
□ Total sync time reduced (measure before/after)
□ Memory usage stays flat during sync (doesn't grow with record count)
```

---

## Notes

- This wiring diagram was approved by the Sync Committee on 2024-12-21
- All decisions minimize changes to entry points (scheduler, triggers)
- SyncReactor shell remains, only internals change
- Resumability built into design from the start

