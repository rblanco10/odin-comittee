# SC-2025-12-23-006: Unified Bridge Architecture

## Session Summary

**Date**: 2025-12-23  
**Topic**: Unify Dimension Bridging and Push Reconciliation into Single Bridge  
**Status**: ENGINEERING_HANDOFF  
**Outcome**: Architecture documented, ready for implementation

---

## Problem Statement

Currently, two separate mechanisms handle post-sync linking operations:

1. **DimensionBridgeService** (via BridgeWorker)
   - Transforms ERP dimension mirrors → CodingCategory/CodingValue
   - Runs independently on its own schedule
   - Decoupled from sync

2. **PushReconciliationService** (via WorkspaceSyncWorker)
   - Links PushRequest → Mirror → Source Domain Resource
   - Runs INSIDE WorkspaceSyncWorker after sync
   - Coupled to sync

### Issues with Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT: FRAGMENTED ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WorkspaceSyncWorker (queue: :erp_sync)                                      │
│       │                                                                      │
│       ├─► WorkspaceSyncReactor.run()                                         │
│       │                                                                      │
│       └─► PushReconciliationService.reconcile_workspace() ← COUPLED!        │
│                                                                              │
│  BridgeWorker (queue: :bridge) ← Separate!                                   │
│       │                                                                      │
│       └─► BridgeReactor ─► DimensionBridgeService                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Problems:**
1. Inconsistent architecture - dimension bridging is decoupled, reconciliation is coupled
2. If sync fails mid-way, reconciliation doesn't run
3. Can't reconcile independently from sync
4. Conceptual overlap - both are "post-sync linking" operations

---

## Solution: Unified Bridge Architecture

All post-sync linking operations should flow through a single, decoupled BridgeReactor.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PROPOSED: UNIFIED BRIDGE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WorkspaceSyncWorker (queue: :erp_sync)                                      │
│       │                                                                      │
│       └─► WorkspaceSyncReactor.run() ──► Sync only, NO reconciliation       │
│                                                                              │
│  BridgeWorker (queue: :bridge)                                               │
│       │                                                                      │
│       └─► BridgeReactor (unified)                                            │
│               │                                                              │
│               ├─► Step 1-8: bridge_dimensions (existing)                     │
│               │    └─► DimensionBridgeService.bridge_entity_type()          │
│               │                                                              │
│               ├─► Step 9: reconcile_push_lifecycle (new)                    │
│               │    └─► PushReconciliationService.reconcile_all_workspaces() │
│               │         • PushRequest → Mirror (by external_id)             │
│               │         • Mirror.origin_push_request_id = PushRequest.id    │
│               │                                                              │
│               └─► Step 10: bridge_transactions (new)                         │
│                    └─► TransactionBridgeService.bridge_all_workspaces()     │
│                         • ReimbursementRequest → ExpenseReport              │
│                         • Invoice → Bill                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Conceptual Model

### Three Types of Bridging

| Type | Description | Direction | Creates Records? |
|------|-------------|-----------|------------------|
| **Dimension Bridge** | Mirror → CodingCategory/CodingValue | ERP → Product | YES |
| **Push Lifecycle** | PushRequest → Mirror | Internal ERP | NO (links only) |
| **Transaction Bridge** | Source → Mirror | Product → ERP Mirror | NO (links only) |

All three are conceptually "post-sync linking" operations and should be handled by a single BridgeReactor.

---

## Implementation Plan

### Phase 1: Add Reconciliation to BridgeReactor

#### Step 9: reconcile_push_lifecycle

Adds a step to BridgeReactor that:
1. Queries ALL workspaces with ERP connections
2. For each workspace, calls `PushReconciliationService.reconcile_workspace/1`
3. Aggregates results

```elixir
# BridgeReactor - New Step
step :reconcile_push_lifecycle do
  run fn _args, _context ->
    Logger.info("[BridgeReactor] Reconciling push lifecycle across workspaces")
    
    results = 
      list_active_workspaces()
      |> Enum.map(fn workspace_id ->
        case PushReconciliationService.reconcile_workspace(workspace_id) do
          {:ok, result} -> result
          {:error, _} -> %{success: 0, not_found: 0, error: 0}
        end
      end)
      |> Enum.reduce(%{success: 0, not_found: 0, error: 0}, fn r, acc ->
        %{
          success: acc.success + r.success,
          not_found: acc.not_found + r.not_found,
          error: acc.error + r.error
        }
      end)
    
    {:ok, results}
  end
  
  compensate fn _, _, _ -> :ok end
end
```

#### Step 10: bridge_transactions

Adds a step to link source domain resources to their mirrors:
1. Queries PushRequests with `sync_verified_at` but without source link
2. Links source resources to mirrors

```elixir
step :bridge_transactions do
  run fn _args, _context ->
    Logger.info("[BridgeReactor] Bridging transaction links across workspaces")
    
    # This is already done inside reconcile_push_lifecycle via update_source_resource/3
    # But could be split out if we want finer granularity
    
    {:ok, 0}
  end
end
```

### Phase 2: Remove Reconciliation from WorkspaceSyncWorker

Remove the `reconcile_pushes/1` call from `WorkspaceSyncWorker`:

```elixir
# BEFORE (lines 311-337)
defp reconcile_pushes(workspace_id) do
  case PushReconciliationService.reconcile_workspace(workspace_id) do
    # ...
  end
end

# AFTER
# Delete this function entirely
# Remove the call to reconcile_pushes/1 from perform/1
```

### Phase 3: Update Statistics

Update BridgeReactor's `aggregate_results` step and BridgeWorker logging to include reconciliation stats.

---

## Files to Modify

| File | Action |
|------|--------|
| `ember_bridge/reactors/bridge_reactor.ex` | Add steps 9-10, update aggregation |
| `ember_bridge/workers/bridge_worker.ex` | Update logging for new stats |
| `ember_erp/workers/workspace_sync_worker.ex` | Remove `reconcile_pushes/1` |
| `ember_erp/services/push_reconciliation_service.ex` | Add `reconcile_all_workspaces/0` |

---

## Benefits

1. **Consistent Architecture**: All post-sync operations flow through BridgeWorker
2. **Decoupled**: Reconciliation runs independently of sync
3. **Resilient**: If sync fails, reconciliation still runs on next bridge cycle
4. **Simpler**: One place for all post-sync linking logic
5. **Observable**: Single entry point for metrics/logging

---

## Testing Strategy

1. Unit test new BridgeReactor steps
2. Verify sync no longer calls reconciliation
3. Verify bridge runs reconciliation for all workspaces
4. Integration test: push → sync → bridge → verify links

---

## Rollback Plan

If issues arise:
1. Re-add `reconcile_pushes/1` to WorkspaceSyncWorker
2. Remove new steps from BridgeReactor
3. Both can coexist temporarily (idempotent operations)

