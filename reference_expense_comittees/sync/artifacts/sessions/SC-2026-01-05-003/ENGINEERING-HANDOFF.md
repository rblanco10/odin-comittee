# Engineering Handoff: Reimbursement Push to NetSuite - "Filter False" Fix

**Session:** SC-2026-01-05-003  
**Date:** 2026-01-05  
**Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Priority:** HIGH  
**Confidence:** HIGH (Patterns verified in card transaction flow)

---

## Executive Summary

After clicking "Sync to ERP" for a reimbursement, the `PushRequest` is created but the AshOban worker fails to find the record, logging:

```
skipped query run due to filter being false
```

**Root Cause:** The `AshOban.Changes.BuiltinChanges.run_oban_trigger/1` may not be properly passing tenant context to the Oban job, causing the worker to fail when querying for the push request.

**Solution:** Apply the same fixes that resolved identical issues in the card transaction flow (commit `4dfa82956`).

---

## Committee Participants

| Role | Member | Contribution |
|------|--------|--------------|
| **Committee Chair** | Session Coordinator | Convened session, final approval |
| **Sync Architect** | Technical Lead | Root cause analysis, pattern verification |
| **AshOban Expert** | Background Jobs Specialist | Tenant context investigation |
| **NetSuite Specialist** | ERP Domain Expert | Verified ERP payload expectations |
| **Observability Analyst** | Log Analysis | Identified "filter false" pattern |
| **Code Archaeologist** | Codebase Historian | Found working patterns in card flow |

---

## Problem Analysis

### Symptom

1. User clicks "Sync to ERP" in Paid tab
2. Log shows: `Created push request 60f8d493-...`
3. Log shows: `skipped query run due to filter being false`
4. Expense report never appears in NetSuite

### Root Cause

The `pending_push_requests` read action has `multitenancy :allow_global`, but the AshOban job may not be receiving the correct tenant context when triggered via `BuiltinChanges.run_oban_trigger/1`.

The card transaction flow uses a **manual trigger** that explicitly passes the tenant:

```elixir
AshOban.run_trigger(result, trigger, tenant: result.workspace_id)
```

---

## Implementation Tasks

### Task 1: Switch to Manual AshOban Trigger (CRITICAL)

**File:** `lib/flame_teampay_payables/ember_erp/resources/push_request/push_request.ex`

**Location:** Lines 233-236 in the `create` action

**Current Code:**

```elixir
# SC-2026-01-02-008: Trigger Oban job immediately on create
# This follows the ChannelDelivery pattern for immediate processing
# Uses the built-in AshOban change which properly handles tenant context
change AshOban.Changes.BuiltinChanges.run_oban_trigger(:process_push)
```

**Replace With:**

```elixir
# SC-2026-01-05-003: Trigger Oban job immediately on create with explicit tenant
# The built-in run_oban_trigger may not pass tenant correctly for multi-tenant resources
# This manual approach matches the working card transaction pattern (SC-2026-01-02-007)
change fn changeset, _context ->
  Ash.Changeset.after_action(changeset, fn _changeset, result ->
    # Only trigger for pending status
    if result.status == :pending do
      trigger = AshOban.Info.oban_trigger(result.__struct__, :process_push)
      if trigger do
        require Logger
        Logger.info("PushRequest: Triggering immediate processing for #{result.id}",
          workspace_id: result.workspace_id,
          entity_type: result.entity_type
        )
        AshOban.run_trigger(result, trigger, tenant: result.workspace_id)
      end
    end

    {:ok, result}
  end)
end
```

**Effort:** 15 minutes

---

### Task 2: Add Idempotency Check to Reimbursement Report Sync

**File:** `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

**Location:** `sync_reimbursement_report/2` function (around line 223)

**Current Code:**

```elixir
with {:ok, request} <- load_reimbursement_request(request_id, workspace_id),
     {:ok, :not_synced} <- check_reimbursement_not_already_synced(request),
     {:ok, :ready} <- check_reimbursement_ready(request),
     {:ok, erp_connection} <- get_erp_connection(workspace_id, request.entity_id) do
```

**Replace With:**

```elixir
with {:ok, request} <- load_reimbursement_request(request_id, workspace_id),
     {:ok, :not_synced} <- check_reimbursement_not_already_synced(request),
     {:ok, :ready} <- check_reimbursement_ready(request),
     {:ok, erp_connection} <- get_erp_connection(workspace_id, request.entity_id),
     # SC-2026-01-05-003: Check for existing push request (idempotency)
     {:ok, :not_found} <- find_existing_reimbursement_push_request(request.id, erp_connection.id, workspace_id) do
```

**Add Handler for Existing Push Request (in the `else` block, after `{:ok, :already_synced}`):**

```elixir
# SC-2026-01-05-003: Existing push request found - return it for idempotency
{:ok, %PushRequest{} = existing_request} ->
  Logger.info("ManualSyncService: Push request already exists for reimbursement",
    request_id: request_id,
    push_request_id: existing_request.id,
    status: existing_request.status
  )

  {:ok, existing_request}
```

**Add New Helper Function (after `find_existing_push_request/3`):**

```elixir
# SC-2026-01-05-003: Check if a PushRequest already exists for this reimbursement
# Returns the existing request if found (for idempotency), or :not_found
defp find_existing_reimbursement_push_request(request_id, erp_connection_id, workspace_id) do
  require Ash.Query
  import Ash.Expr

  query =
    PushRequest
    |> Ash.Query.filter(
      expr(
        source_resource_id == ^request_id and
          erp_connection_id == ^erp_connection_id and
          source_domain == "expense" and
          entity_type == :expense_report
      )
    )
    |> Ash.Query.limit(1)

  case Ash.read(query, tenant: workspace_id, authorize?: false) do
    {:ok, [existing | _]} -> {:ok, existing}
    {:ok, []} -> {:ok, :not_found}
    {:error, reason} -> {:error, reason}
  end
end
```

**Effort:** 30 minutes

---

### Task 3: Add Idempotency Check to Reimbursement Payment Sync

**File:** `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

**Location:** `sync_reimbursement_payment/2` function

Apply the same pattern as Task 2 for the payment sync:

```elixir
# Add to the `with` chain:
{:ok, :not_found} <- find_existing_payment_push_request(payment.id, erp_connection.id, workspace_id)

# Add helper function:
defp find_existing_payment_push_request(payment_id, erp_connection_id, workspace_id) do
  require Ash.Query
  import Ash.Expr

  query =
    PushRequest
    |> Ash.Query.filter(
      expr(
        source_resource_id == ^payment_id and
          erp_connection_id == ^erp_connection_id and
          source_domain == "expense" and
          entity_type == :expense_report_payment
      )
    )
    |> Ash.Query.limit(1)

  case Ash.read(query, tenant: workspace_id, authorize?: false) do
    {:ok, [existing | _]} -> {:ok, existing}
    {:ok, []} -> {:ok, :not_found}
    {:error, reason} -> {:error, reason}
  end
end
```

**Effort:** 20 minutes

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `push_request.ex` | Replace `BuiltinChanges.run_oban_trigger` with manual trigger |
| `manual_sync_service.ex` | Add idempotency checks for report and payment sync |

---

## Testing Checklist

### Manual Testing

- [ ] Navigate to Reimbursements page → Paid tab
- [ ] Click "Sync to ERP" for a paid reimbursement
- [ ] Verify console shows: `PushRequest: Triggering immediate processing for {id}`
- [ ] Verify NO "filter being false" error appears
- [ ] Verify flash shows success message
- [ ] Open NetSuite → Verify Expense Report created
- [ ] Verify Bill Payment/Check created with apply list

### Edge Cases

- [ ] Click sync twice quickly → Should return existing push request (idempotent)
- [ ] Click sync on already-synced reimbursement → Should show "already synced"
- [ ] Click sync when no ERP connection → Should show appropriate error

### Regression Testing

- [ ] Card transaction sync still works (uses same `push_request.ex`)
- [ ] Auto-push for card transactions still works
- [ ] Scheduled sync jobs still process correctly

---

## Dependency Chain

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Sync to ERP" in Paid tab                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  ManualSyncService.sync_reimbursement_complete/2                │
│                                                                  │
│  1. Check for existing push request (NEW - idempotency)         │
│  2. Call PushOrchestrator.push_entity()                         │
│  3. PushRequest.create() action runs                            │
│  4. after_action triggers AshOban.run_trigger with tenant       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Oban Job Created with workspace_id in args                     │
│                                                                  │
│  1. Worker reads record via pending_push_requests               │
│  2. multitenancy :allow_global allows global read               │
│  3. Worker finds record and processes                           │
│  4. execute_push action runs PushExpenseReportReactor           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  NetSuite Result                                                 │
│                                                                  │
│  • Expense Report created                                        │
│  • Bill Payment/Check created (via payment sync)                │
│  • Both records linked via apply list                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Sessions

| Session | Topic | Relevance |
|---------|-------|-----------|
| SC-2026-01-02-007 | AshOban trigger for card transactions | **Source of working pattern** |
| SC-2026-01-02-008 | AshOban worker read action fix | Already applied |
| SC-2026-01-02-011 | Multitenancy :allow_global fix | Already applied |
| SC-2026-01-05-002 | Unified ERP sync implementation | Previous session |

---

## Committee Sign-off

| Member | Role | Approval |
|--------|------|----------|
| Committee Chair | Process | ✅ |
| Sync Architect | Technical | ✅ |
| AshOban Expert | Background Jobs | ✅ |
| NetSuite Specialist | ERP Domain | ✅ |
| Observability Analyst | Diagnostics | ✅ |
| Code Archaeologist | Pattern Verification | ✅ |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Manual trigger doesn't fix issue | Low | Medium | Pattern verified in card flow |
| Breaks existing card sync | Low | High | Same create action used - regression test |
| Performance impact | Very Low | Low | after_action is synchronous but fast |

---

*Document generated by Sync Committee Session SC-2026-01-05-003*
*Approved for implementation: 2026-01-05*

