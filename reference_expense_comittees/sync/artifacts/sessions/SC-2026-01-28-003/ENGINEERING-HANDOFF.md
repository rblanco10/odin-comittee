# Engineering Handoff: SC-2026-01-28-003

## Session Summary

**Session ID**: SC-2026-01-28-003  
**Date**: 2026-01-28  
**Status**: ✅ RESOLVED  
**Category**: Ready to Pay Reimbursement Sync Flow Fix

---

## Problem Statement

Ready to Pay reimbursements were syncing to NetSuite with incorrect data compared to Paid reimbursements:

| Issue | Ready to Pay (Before) | Paid (Correct) |
|-------|----------------------|----------------|
| Employee | Fallback "1640" (Amy Teams) | Correct employee via email match |
| Document Number | UUID format | Sequential (REIM-2026-XXXX) |
| Memo | Missing | Present (RT prefix) |
| Subsidiary | Not set | From EntityMapping |
| Currency | Not set | From Subsidiary |
| Dimensions | Missing | From CodingAssignment |
| Approval Status | Not set | 2 (Approved) |

---

## Root Cause Analysis

### Definitive Finding

The Ready to Pay and Paid sync flows used **different reactors**:

| Flow | Entity Type | Reactor | Status |
|------|-------------|---------|--------|
| Ready to Pay | `:expense_report` | `PushExpenseReportReactor` | ❌ Incomplete scaffold with test/fallback paths |
| Paid | `:reimbursement_complete` | `PushReimbursementCompleteReactor` | ✅ Fully functional with proper data resolution |

### Technical Details

1. **`ManualSyncService.sync_reimbursement_report/2`** (Ready to Pay) was calling:
   ```elixir
   PushOrchestrator.push_entity(..., :expense_report, ...)
   ```
   This routed to `PushExpenseReportReactor` which:
   - Had incomplete data resolution logic
   - Contained test/fallback code paths
   - Did not properly resolve employee, subsidiary, dimensions

2. **`ManualSyncService.sync_reimbursement_complete/2`** (Paid) was calling:
   ```elixir
   PushOrchestrator.push_entity(..., :reimbursement_complete, ...)
   ```
   This routed to `PushReimbursementCompleteReactor` which:
   - Properly resolves employee via email/employee_number match
   - Resolves subsidiary from EntityMapping
   - Resolves currency from subsidiary
   - Resolves dimensions from CodingAssignment
   - Handles payment push (when payment exists)
   - **Already handles nil payment gracefully** (skips payment push step)

---

## Solution Implemented

### Approach: Route Ready to Pay through PushReimbursementCompleteReactor

Since `PushReimbursementCompleteReactor` already handles the case when no completed payment exists (it simply skips the payment push step), the fix was minimal:

**Changed `ManualSyncService.sync_reimbursement_report/2` to use `:reimbursement_complete` entity type.**

### Code Change

**File**: `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

```elixir
# Before (lines 306-316)
case PushOrchestrator.push_entity(
       erp_connection.id,
       "expense",
       :expense_report,  # <-- Old: routed to broken reactor
       "Reimbursement.ReimbursementRequest",
       request.id,
       :manual,
       get_actor_id(actor),
       %{triggered_by: "manual_sync"},
       actor
     )

# After (lines 302-322)
# SC-2026-01-28-003: Use :reimbursement_complete entity type for Ready to Pay syncs
# This routes through PushReimbursementCompleteReactor which properly resolves:
# - Employee (via email/employee_number match to Accounting Employee)
# - Subsidiary (from EntityMapping)
# - Currency (from subsidiary)
# - Dimensions (from CodingAssignment)
# - Memo, document number, approval status
# The reactor automatically skips payment push when no completed payment exists,
# which is the case for Ready to Pay (unpaid) reimbursements.
case PushOrchestrator.push_entity(
       erp_connection.id,
       "expense",
       :reimbursement_complete,  # <-- New: routes to working reactor
       "Reimbursement.ReimbursementRequest",
       request.id,
       :manual,
       get_actor_id(actor),
       %{triggered_by: "manual_sync_ready_to_pay"},
       actor
     )
```

---

## Verification

### Log Evidence (Post-Fix)

The following logs confirm the fix is working:

```
[info] Queueing push request for expense/reimbursement_complete to ERP
[info] PushReimbursementCompleteReactor: Validating push request 4e93397c-8d75-4cbd-93ee-15116f8edd3d
[info] PushReimbursementCompleteReactor: Loading reimbursement data c1f0c167-13d8-44a7-8a65-80e5498c65f0
[warning] PushReimbursementCompleteReactor: No payments found for request c1f0c167-13d8-44a7-8a65-80e5498c65f0
[info] PushReimbursementCompleteReactor: No completed payment found (payment_status != :completed)
[info] PushReimbursementCompleteReactor: Resolved subsidiary from EntityMapping: 8 (Teampay California), currency_id: "1"
[debug] PushReimbursementCompleteReactor: Found Accounting Employee by email: 77049
[info] [PAID SYNC] Resolved NetSuite Employee External ID: 77049
[info] [PAID SYNC] Subsidiary External ID: "8"
[info] [PAID SYNC] Subsidiary Currency ID: "1"
[info] [PAID SYNC] Payment: false  <-- Correctly skipped, no completed payment
[info] [PAID SYNC] Final report_data: %{
  complete: false,
  description: "RT0021",
  total_amount: Decimal.new("629.93"),
  currency_id: "1",
  report_number: "REIM-2026-0021",
  employee_external_id: "77049",
  approvalstatus: 2,
  subsidiary_external_id: "8",
  ...
}
```

### Confirmed Behavior

| Aspect | Before Fix | After Fix |
|--------|------------|-----------|
| Reactor Used | `PushExpenseReportReactor` | `PushReimbursementCompleteReactor` ✅ |
| Employee | 1640 (fallback) | 77049 (correct) ✅ |
| Subsidiary | Missing | 8 (Teampay California) ✅ |
| Currency | Missing | 1 (USD) ✅ |
| Document Number | UUID | REIM-2026-0021 ✅ |
| Memo | Missing | RT0021 ✅ |
| Approval Status | Missing | 2 (Approved) ✅ |
| Dimensions | Missing | All resolved ✅ |
| Payment Push | N/A | Skipped (no completed payment) ✅ |

---

## Impact Assessment

### What Changed

- Ready to Pay syncs now use the same reactor as Paid syncs
- Both flows share identical data resolution logic

### What Did NOT Change

- Paid tab "Post to ERP" button behavior unchanged
- `PushReimbursementCompleteReactor` logic unchanged
- All other sync flows unchanged
- No database schema changes
- No API contract changes

### Flows Affected

| Flow | Entity Type | Effect |
|------|-------------|--------|
| Ready to Pay single sync | `:reimbursement_complete` | ✅ Now uses correct reactor |
| Ready to Pay bulk sync | `:reimbursement_complete` | ✅ Now uses correct reactor (calls `sync_reimbursement_report`) |
| Paid single sync | `:reimbursement_complete` | No change (already correct) |
| Paid bulk sync | `:reimbursement_complete` | No change (already correct) |

---

## Committee Members Involved

| Member | Contribution |
|--------|--------------|
| Chair | Session governance, decision authority |
| Scribe | Documentation, session recording |
| Path Defender | Traced entity type usage, verified no other flows affected |
| Code Fidelity Engineer | Verified reactor invocation paths |
| Edge Case Specialist | Analyzed payment handling for nil cases |
| Sync Architect | Designed solution approach, confirmed reactor handles nil payments |
| NetSuite Specialist | Validated NetSuite payload structure |

---

## Files Modified

| File | Change |
|------|--------|
| `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex` | Changed entity type from `:expense_report` to `:reimbursement_complete` in `sync_reimbursement_report/2` |

---

## Related Sessions

- **SC-2026-01-27-002**: Idempotency handling and human-readable error messages
- **SC-2026-01-06-002**: Original unified reimbursement sync implementation

---

## Recommendations

1. **Consider deprecating `PushExpenseReportReactor`** - It appears to be incomplete and is no longer used for reimbursement syncs. Review if any other flows depend on it.

2. **Add integration test** - Verify Ready to Pay sync creates correct NetSuite expense report with proper employee, subsidiary, and dimensions.

3. **Monitor logs** - Watch for any `[PAID SYNC]` logs that show incorrect data resolution.

---

## Session Closed

**Closed by**: Sync Committee Chair  
**Closing timestamp**: 2026-01-28T02:45:00Z  
**Resolution**: ✅ Successfully resolved by routing Ready to Pay syncs through `PushReimbursementCompleteReactor`
