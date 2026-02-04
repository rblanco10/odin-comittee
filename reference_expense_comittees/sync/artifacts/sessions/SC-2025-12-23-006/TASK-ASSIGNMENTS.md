# SC-2025-12-23-006: Task Assignments

## Engineering Subcommittee Tasks

### Task 1: Add reconcile_push_lifecycle Step to BridgeReactor

**File**: `lib/flame_teampay_payables/ember_bridge/reactors/bridge_reactor.ex`

**Description**: Add a new step that reconciles push requests across all workspaces.

**Changes**:
1. Add alias for `PushReconciliationService` and `ErpConnection`
2. Add helper function `list_active_workspace_ids/0`
3. Add step `:reconcile_push_lifecycle` after dimension steps
4. Update `:aggregate_results` to include reconciliation stats

---

### Task 2: Add reconcile_all_workspaces to PushReconciliationService

**File**: `lib/flame_teampay_payables/ember_erp/services/push_reconciliation_service.ex`

**Description**: Add a function to reconcile all workspaces (for BridgeReactor use).

**Changes**:
1. Add `reconcile_all_workspaces/0` function
2. Query active ERP connections
3. Call `reconcile_workspace/1` for each

---

### Task 3: Update BridgeWorker Logging

**File**: `lib/flame_teampay_payables/ember_bridge/workers/bridge_worker.ex`

**Description**: Update logging to include reconciliation statistics.

**Changes**:
1. Add reconciliation fields to success log
2. Add TODO comments for future observability

---

### Task 4: Remove reconcile_pushes from WorkspaceSyncWorker

**File**: `lib/flame_teampay_payables/ember_erp/workers/workspace_sync_worker.ex`

**Description**: Remove the reconciliation call from sync worker to decouple.

**Changes**:
1. Remove `reconcile_pushes/1` function
2. Remove call to `reconcile_pushes/1` in `perform/1`
3. Remove alias for `PushReconciliationService`

---

## Execution Order

1. ✅ Task 1 + Task 2 (can run in parallel - additive)
2. ✅ Task 3 (depends on Task 1)
3. ✅ Task 4 (final - removes coupling)
4. ✅ Verify compilation
5. ✅ Update session state

---

## Verification Checklist

- [ ] BridgeReactor has `:reconcile_push_lifecycle` step
- [ ] PushReconciliationService has `reconcile_all_workspaces/0`
- [ ] BridgeWorker logs reconciliation stats
- [ ] WorkspaceSyncWorker no longer calls reconcile
- [ ] Compilation succeeds
- [ ] Session state updated

