# Engineering Handoff: Idempotency Gap - Stuck PushRequest Retry Logic

**Session:** SC-2026-01-05-004  
**Date:** 2026-01-05  
**Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Priority:** HIGH  
**Confidence:** HIGH (Root cause verified from logs)

---

## Executive Summary

When clicking "Sync to ERP" for a reimbursement that has a **stale/stuck PushRequest**, the idempotency check returns the existing request without re-triggering processing. The user sees a success message but nothing is pushed to NetSuite.

**Root Cause:** The idempotency check finds an existing PushRequest (from a previous failed attempt) and returns it as-is, without checking if it needs to be re-processed.

**Solution:** Modify the idempotency logic to check the existing PushRequest's status and take appropriate action:
- If `:pushed` → Return `{:ok, :already_synced}`
- If `:pending` or `:failed` or `:blocked` → Re-trigger the Oban job

---

## Log Evidence

```
[info] ManualSyncService: Starting manual sync for reimbursement report request_id=eff64f82-1d4f-4050-99cc-5c196b8691d0
[info] ManualSyncService: Push request already exists for reimbursement request_id=eff64f82-1d4f-4050-99cc-5c196b8691d0
[info] ManualSyncService: Starting manual sync for reimbursement payment
[warning] ManualSyncService: Cannot sync payment - linked report not synced
```

**What happened:**
1. `find_existing_reimbursement_push_request` found an existing PushRequest
2. The function returned `{:ok, existing_request}` without verifying status
3. The payment sync failed because the report's `erp_expense_report_id` is still `nil`
4. No Oban job was triggered, no API call was made

---

## PushRequest Status Lifecycle

| Status | Description | Action on Manual Sync |
|--------|-------------|----------------------|
| `:pending` | Waiting to be processed | Re-trigger Oban job |
| `:processing` | Currently being processed | Return existing (in-flight) |
| `:pushed` | Successfully synced | Return `{:ok, :already_synced}` |
| `:partial` | Some entities pushed | Re-trigger for remaining |
| `:failed` | Push failed | Re-trigger Oban job |
| `:blocked` | Policy blocked (recoverable) | Re-trigger Oban job |
| `:skipped` | Duplicate prevention | Return `{:ok, :already_synced}` |

---

## Implementation Plan

### File: `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

#### Change 1: Create Helper Function for Status-Aware Retry

Add a new helper function to handle existing PushRequest re-triggering:

```elixir
# SC-2026-01-05-004: Handle existing PushRequest based on status
# If completed, return :already_synced; otherwise re-trigger the Oban job
defp handle_existing_push_request(%PushRequest{status: status} = existing_request, workspace_id)
     when status in [:pushed, :skipped] do
  Logger.info("ManualSyncService: PushRequest already completed",
    push_request_id: existing_request.id,
    status: status
  )

  {:ok, :already_synced}
end

defp handle_existing_push_request(%PushRequest{status: :processing} = existing_request, _workspace_id) do
  Logger.info("ManualSyncService: PushRequest currently processing",
    push_request_id: existing_request.id
  )

  # Return the in-flight request - don't create duplicate
  {:ok, existing_request}
end

defp handle_existing_push_request(%PushRequest{status: status} = existing_request, workspace_id)
     when status in [:pending, :failed, :blocked, :partial] do
  Logger.info("ManualSyncService: Re-triggering stuck PushRequest",
    push_request_id: existing_request.id,
    status: status
  )

  # Re-trigger the Oban job for this PushRequest
  trigger = AshOban.Info.oban_trigger(PushRequest, :process_push)

  if trigger do
    AshOban.run_trigger(existing_request, trigger, tenant: workspace_id)

    Logger.info("ManualSyncService: Oban job re-triggered for PushRequest",
      push_request_id: existing_request.id
    )
  end

  {:ok, existing_request}
end
```

#### Change 2: Update `sync_reimbursement_report/2`

Replace the existing handler for `{:ok, %PushRequest{}}`:

```elixir
# BEFORE (lines 262-270):
# SC-2026-01-05-003: Existing push request found - return it for idempotency
{:ok, %PushRequest{} = existing_request} ->
  Logger.info("ManualSyncService: Push request already exists for reimbursement",
    request_id: request_id,
    push_request_id: existing_request.id,
    status: existing_request.status
  )

  {:ok, existing_request}

# AFTER:
# SC-2026-01-05-004: Handle existing push request based on status
{:ok, %PushRequest{} = existing_request} ->
  handle_existing_push_request(existing_request, workspace_id)
```

#### Change 3: Update `sync_reimbursement_payment/2`

Apply the same change (lines 385-395 approximately):

```elixir
# BEFORE:
# SC-2026-01-05-003: Existing push request found - return it for idempotency
{:ok, %PushRequest{} = existing_request} ->
  Logger.info("ManualSyncService: Push request already exists for reimbursement payment",
    payment_id: payment_id,
    push_request_id: existing_request.id,
    status: existing_request.status
  )

  {:ok, existing_request}

# AFTER:
# SC-2026-01-05-004: Handle existing push request based on status
{:ok, %PushRequest{} = existing_request} ->
  handle_existing_push_request(existing_request, workspace_id)
```

#### Change 4: Update `sync_card_transaction/2`

Apply the same change (lines 144-152):

```elixir
# BEFORE:
# SC-2026-01-02-006: Existing push request found - return it for idempotency
{:ok, %PushRequest{} = existing_request} ->
  Logger.info("ManualSyncService: Push request already exists for card transaction",
    transaction_id: transaction_id,
    push_request_id: existing_request.id,
    status: existing_request.status
  )

  {:ok, existing_request}

# AFTER:
# SC-2026-01-05-004: Handle existing push request based on status
{:ok, %PushRequest{} = existing_request} ->
  handle_existing_push_request(existing_request, workspace_id)
```

---

## Testing Checklist

### Manual Testing

1. **Clean slate test:**
   - [ ] Create a new reimbursement, mark as paid
   - [ ] Click "Sync to ERP" → Should create PushRequest and push to NetSuite
   - [ ] Check NetSuite for expense report

2. **Retry stuck request test:**
   - [ ] Find a reimbursement with existing `:pending` PushRequest
   - [ ] Click "Sync to ERP" → Should log "Re-triggering stuck PushRequest"
   - [ ] Verify Oban job is created and processes

3. **Already synced test:**
   - [ ] Find a reimbursement that was successfully synced (has `erp_expense_report_id`)
   - [ ] Click "Sync to ERP" → Should return `:already_synced`
   - [ ] No duplicate entries in NetSuite

### Log Verification

After clicking "Sync to ERP", you should see one of:

**Scenario A - Fresh sync:**
```
[info] ManualSyncService: Starting manual sync for reimbursement report
[info] ManualSyncService: Push request created for reimbursement
[info] PushRequest: Triggering immediate processing for [id]
```

**Scenario B - Re-triggering stuck:**
```
[info] ManualSyncService: Starting manual sync for reimbursement report
[info] ManualSyncService: Re-triggering stuck PushRequest
[info] ManualSyncService: Oban job re-triggered for PushRequest
```

**Scenario C - Already synced:**
```
[info] ManualSyncService: Starting manual sync for reimbursement report
[info] ManualSyncService: PushRequest already completed
```

---

## Committee Approval

| Member | Role | Vote |
|--------|------|------|
| Chair | Session Coordinator | ✅ Approved |
| Sync Architect | Technical Design | ✅ Approved |
| Observability Analyst | Logging/Monitoring | ✅ Approved |
| Edge Case Analyst | Status Lifecycle | ✅ Approved |

**Decision:** Unanimously approved for implementation.

---

## Implementation Notes

### Why Re-trigger Instead of Create New?

Creating a new PushRequest when one exists could cause:
1. Duplicate entries in NetSuite
2. Race conditions if both are processed
3. Audit trail confusion

Re-triggering the existing request maintains a clean audit trail and prevents duplicates.

### Why Not Reset Status to `:pending`?

We could update the status back to `:pending` before re-triggering. However:
1. The Oban trigger filter is `status == :pending`, so this would work
2. But it would lose the history of previous attempts
3. The AshOban trigger mechanism handles non-pending statuses by checking the record

The simpler approach is to just re-trigger the Oban job. The worker will process it regardless of current status.

---

## Files to Modify

| File | Changes |
|------|---------|
| `manual_sync_service.ex` | Add `handle_existing_push_request/2`, update 3 sync functions |

**Estimated LOC:** ~40 lines added

---

*Prepared by Sync Committee — Session SC-2026-01-05-004*

