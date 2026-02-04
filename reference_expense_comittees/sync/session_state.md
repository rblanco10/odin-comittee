# Sync Committee Session State

## Current Session

- **Session ID:** SC-2026-01-30-001
- **Status:** ✅ IMPLEMENTED
- **Turn:** 5
- **Started:** 2026-01-30
- **Focus:** NetSuite Vendor Memo Field Enhancement — Teampay Label
- **Gap ID:** GAP-NS-VENDOR-MEMO-001
- **Convened By:** Human
- **Human Request:** For Teampay created vendors, indicate in the memo field in NetSuite that they were created by Teampay and the payment method is credit card

### Problem Statement

Product team requested that when Teampay auto-creates vendors in NetSuite (during card transaction processing), the vendor record should include a memo field indicating:
- The vendor was created by Teampay
- The payment method is credit card

### Solution

Add `comments` field to vendor data during auto-creation with format:
```
Created by Teampay | Payment Method: Credit Card | [date]
```

### Fix Applied

```elixir
# SC-2026-01-30-001: Add memo field for Teampay-created vendors (GAP-NS-VENDOR-MEMO-001)
vendor_data = %{
  "company_name" => merchant_name,
  "is_person" => false,
  "email" => nil,
  "phone" => nil,
  "subsidiary_id" => subsidiary_id,
  "comments" => "Created by Teampay | Payment Method: Credit Card | #{Date.to_string(Date.utc_today())}"
}
```

### Files Changed

| File | Change |
|------|--------|
| `push_card_spend_reactor.ex` | Added `comments` field to auto-created vendor data |

### Committee Notes

- NetSuite `comments` field maps directly to the Vendor memo/notes field
- The adapter (`capabilities/push/vendors.ex`) already handles the `comments` field transformation
- Format approved by human: "Created by Teampay | Payment Method: Credit Card | [date]"

---

## Previous Session (SC-2026-01-29-005)

- **Session ID:** SC-2026-01-29-005
- **Status:** ✅ IMPLEMENTED
- **Turn:** 2
- **Started:** 2026-01-29
- **Focus:** Root Cause Analysis - Reimbursement Sync Status Determination
- **Gap ID:** GAP-REIMB-SYNC-STATUS-001
- **Parent Sessions:** SC-2026-01-29-001, SC-2026-01-29-002, SC-2026-01-29-003, SC-2026-01-29-004
- **Convened By:** Chair (Emergency Escalation)
- **Human Request:** Stop making workarounds, find the real root cause

### Problem Statement

After four sequential fixes (SC-2026-01-29-001 through 004), the reimbursement sync status was STILL showing incorrect values. When using `:reimbursement_complete` entity type (full mode), the UI would show "Post Payment" even after both expense report AND payment were successfully pushed to NetSuite.

### Root Cause

**Location:** `reimbursements_live.ex` → `build_push_status_lookup_by_entity_type/1`

**Issue:** The enrichment logic used legacy `:reimbursement_complete` as fallback for `expense_report_push_status` but NOT for `expense_report_payment_push_status`. Since `:reimbursement_complete` pushes BOTH, both statuses should be derived from it when status is `:pushed`.

### Fix Applied

```elixir
# SC-2026-01-29-005: Derive payment status from legacy :reimbursement_complete
# :pushed = BOTH succeeded, :partial = only expense report succeeded
legacy_payment_status = case get_push_status(legacy_request) do
  :pushed -> :pushed  # Full mode pushed both
  _ -> nil
end

expense_report_payment_push_status: get_push_status(payment_request) || legacy_payment_status
```

### Files Changed

| File | Change |
|------|--------|
| `reimbursements_live.ex` | Fixed `build_push_status_lookup_by_entity_type/1` |

### Artifact

Session summary: `artifacts/sessions/SC-2026-01-29-005/SESSION-SUMMARY.md`

---

## Previous Session (SC-2026-01-29-002)

- **Session ID:** SC-2026-01-29-002
- **Status:** ✅ IMPLEMENTED (refined by SC-2026-01-29-005)
- **Turn:** 7
- **Started:** 2026-01-29
- **Focus:** Sync Status Source of Truth - Use PushRequest Instead of erp_expense_report_id
- **Gap ID:** GAP-REIMB-TWO-PHASE-002
- **Parent Session:** SC-2026-01-29-001

### Committee Decision

Use `PushRequest.status` and `PushEntityRecord.external_id` as source of truth for "was it pushed", while keeping `erp_expense_report_id` for "was it synced and verified".

### Artifact

Committee decision: `artifacts/sessions/SC-2026-01-29-002/COMMITTEE-DECISION.md`

---

## Previous Session (Two-Phase Reimbursement Push)

- **Session ID:** SC-2026-01-29-001
- **Status:** ✅ APPROVED - Implemented with SC-2026-01-29-002 refinement
- **Turn:** 6
- **Started:** 2026-01-29
- **Focus:** Two-Phase Reimbursement Push (Expense Report + Payment as Separate PushRequests)
- **Gap ID:** GAP-REIMB-TWO-PHASE-001

### Implementation Tasks (Completed)

| # | Task | Status |
|---|------|--------|
| 1 | Database migration - add entity_type to unique constraint | ✅ Done |
| 2 | Update PushRequest identity | ✅ Done |
| 3 | Update ReactorRegistry mappings | ✅ Done |
| 4 | Modify reactor with mode flags | ✅ Done |
| 5 | Update sync_reimbursement_report | ✅ Done |
| 6 | Add sync_reimbursement_payment | ✅ Done |
| 7 | Update UI components | ✅ Done (refined by SC-2026-01-29-002) |

### Artifact

Full implementation plan: `artifacts/sessions/SC-2026-01-29-001/ENGINEERING-HANDOFF.md`

---

## Previous Session (Vendor Policy Enforcement)

- **Session ID:** SC-2026-01-28-005
- **Status:** ✅ CLOSED
- **Turn:** 18
- **Started:** 2026-01-28
- **Closed:** 2026-01-28
- **Focus:** Vendor Policy Enforcement and Duplicate Vendor Recovery for NetSuite
- **Human Request:** Investigate vendor policy gap and implement fixes for auto-creation flow
- **Branch:** `vendor-policy/jan-28-2026`
- **Commit:** `cd26691e0`

### Summary

Comprehensive investigation and fix of vendor policy enforcement during card transaction sync to NetSuite. Four distinct bugs were identified and resolved:

| Bug ID | Component | Issue | Status |
|--------|-----------|-------|--------|
| SC-2026-01-28-001 | `load_vendor_policy/2` | Hardcoded nil for entity_id | ✅ Fixed |
| SC-2026-01-28-002 | `push_vendor_to_erp/5` | Wrong payload keys, missing subsidiary | ✅ Fixed |
| SC-2026-01-28-003 | UI Messaging | No user feedback for vendor outcomes | ✅ Fixed |
| SC-2026-01-28-004 | Duplicate Vendor | No recovery when vendor exists in NetSuite | ✅ Fixed |

### Files Modified

| File | Changes |
|------|---------|
| `push_card_spend_reactor.ex` | +176/-46 (entity-aware lookup, duplicate recovery) |
| `vendor_policy_service.ex` | +63/-10 (entity-aware get_policy/3) |
| `erp_live.ex` | +3/-1 (pass entity_id) |
| `transactions_live.ex` | +58/-10 (UI messaging, tooltips) |

### Session Artifacts

- Full summary: `artifacts/reviews/SC-2026-01-28-001/SESSION-SUMMARY.md`

---

## Previous Session (Employee Duplication)

- **Session ID:** SC-2026-01-28-004
- **Status:** ✅ RESOLVED
- **Turn:** 13
- **Started:** 2026-01-28
- **Closed:** 2026-01-28
- **Focus:** Employee Duplication During Reimbursement Push to NetSuite
- **Human Request:** Investigate and fix employee duplication issues when pushing reimbursements to NetSuite

### Problem Statement

When pushing reimbursements to NetSuite, the system was creating duplicate employees. The logs showed:
```
Error: "There is already an employee with external access to this account using that entity name"
```

Investigation revealed multiple `ErpEmployee` records with the same email but different `employee_number` values (e.g., "Allison Steitz (TP-0c5cf5)", "Allison Steitz (TP-7304e3)", etc.) — all for the same person.

### Root Cause

**GAP-EMPLOYEE-DUPLICATION-001:** Two issues combined:

1. **read_one error swallowing:** When multiple ErpEmployee records existed with the same email, `Ash.read_one` returned `{:error, ...}`, but the catch-all `_` pattern treated this as "not found", triggering auto-create.

2. **EmployeeLinkingService matching failures:** After ERP disconnect/reconnect:
   - `ErpFastDisconnectService` clears all `erp_employee_id` links
   - New `ErpEmployee` records created with new UUIDs
   - `EmployeeLinkingService` failed to re-link because:
     - Email in NetSuite differed from WorkforceEmployee email
     - Matching priority was email-first, missing employee_number matches

### Solution Implemented

**Fix 1: read_one error handling**
- Changed from `Ash.read_one` to `Ash.read` with `limit(1)` and `sort(inserted_at: :asc)`
- Properly handles multiple records by using the oldest one
- Explicitly logs errors instead of silently treating them as "not found"

**Fix 2: EmployeeLinkingService matching priority**
- Updated priority: **employee_number → email → name (fallback)**
- Employee number is the most stable identifier (doesn't change with email/name updates)
- Added name-based matching as fallback for cases where neither matches

**Subsidiary handling decision:**
- Don't filter by subsidiary during linking
- Validate at push time with actionable error message
- This avoids creating duplicates while giving users clear guidance

### Files Modified

| File | Change |
|------|--------|
| `push_reimbursement_complete_reactor.ex` | Fixed `read_one` error swallowing in `resolve_employee_external_id_legacy/3` |
| `push_expense_report_reactor.ex` | Same fix + extracted `try_email_lookup/5` helper |
| `employee_linking_service.ex` | Updated matching priority: employee_number → email → name; added name-based fallback matching |

### Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Matching priority | Employee number first | Most stable identifier |
| Employee number format | No validation needed | Compare field-to-field directly |
| Subsidiary filtering | Don't filter during linking | Validate at push time with clear message |
| Multiple records | Use oldest (by inserted_at) | Consistent, predictable behavior |

### Gap Registry Update

| Gap ID | Description | Status |
|--------|-------------|--------|
| **GAP-EMPLOYEE-DUPLICATION-001** | read_one error swallowing + linking mismatch causing duplicate auto-creates | ✅ Fixed |
| **GAP-EXPENSE-CATEGORY-001** | GL Accounts without ExpenseCategories selectable for reimbursements | ✅ Fixed (SC-2026-01-28-002) |

---

## Related Fix: ExpenseCategory Filtering (SC-2026-01-28-002)

- **Status:** ✅ RESOLVED
- **Date:** 2026-01-28
- **Focus:** Prevent selection of GL Accounts without ExpenseCategories in reimbursement flows

### Problem Statement

Users could select GL Accounts that don't have corresponding ExpenseCategories in NetSuite. When pushing expense reports to NetSuite, this caused:
- "ExpenseCategory not found for GL Account" errors
- Fallback to incompatible default categories
- Subsidiary restriction failures

### Root Cause

NetSuite requires ExpenseCategory for expense reports, but not all GL Accounts have corresponding ExpenseCategories. The UI allowed selection of any GL Account regardless of ExpenseCategory availability.

### Solution Implemented

Preventative fix at the UI level:

1. **Reimbursement Forms (User Selection):** Filter GL Account dropdowns to only show accounts that have corresponding ExpenseCategories in NetSuite.

2. **Coding Rules (Admin Configuration - NetSuite only):** Show all GL accounts but with subtle indicator (small amber dot) for accounts without ExpenseCategories.

### Files Modified

| File | Change |
|------|--------|
| `DimensionFilterService` | Added `filter_by_expense_category: true` option |
| `reimbursement_detail_live.ex` | Uses filtered GL accounts for reimbursement editing |
| `requests_live.ex` | Uses filtered GL accounts for reimbursement creation |
| `erp_live.ex` | Loads extended format for coding rules (NetSuite only) |
| `coding_rule_builder.ex` | Shows warning indicators for NetSuite |
| `custom_select.ex` | Supports extended format with warning indicators |

### Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Reimbursement forms | Filter to valid accounts only | Prevent user error at source |
| Coding rules (admin) | Show all with warnings | Admins need full visibility |
| Other ERPs | No warnings | Only NetSuite has this restriction |

---

## Previous Session (Ready to Pay vs Paid)

- **Session ID:** SC-2026-01-28-003
- **Status:** ✅ RESOLVED
- **Turn:** 25
- **Started:** 2026-01-28
- **Closed:** 2026-01-28
- **Focus:** Ready to Pay vs Paid Reimbursement Sync Discrepancy
- **Human Request:** Investigate why Ready to Pay syncs used fallback data while Paid syncs worked correctly

### Problem Statement

Ready to Pay reimbursements were syncing to NetSuite with incorrect data (fallback employee, missing subsidiary/currency/dimensions) while Paid reimbursements synced correctly.

### Root Cause

The two flows used **different reactors**:
- Ready to Pay: `:expense_report` → `PushExpenseReportReactor` (incomplete, had test/fallback paths)
- Paid: `:reimbursement_complete` → `PushReimbursementCompleteReactor` (fully functional)

### Solution Implemented

Changed `ManualSyncService.sync_reimbursement_report/2` to use `:reimbursement_complete` entity type, routing Ready to Pay syncs through the working `PushReimbursementCompleteReactor`. The reactor already handles nil payments by skipping the payment push step.

### Files Modified

| File | Change |
|------|--------|
| `ember_erp/services/manual_sync_service.ex` | Changed entity type from `:expense_report` to `:reimbursement_complete` |

### Verification

Logs confirm Ready to Pay syncs now use `PushReimbursementCompleteReactor` with correct employee (77049), subsidiary (8), currency (1), dimensions, and skipped payment push.

### Artifact

Full handoff document: `artifacts/sessions/SC-2026-01-28-003/ENGINEERING-HANDOFF.md`

---

## Previous Session (Error Messages)

- **Session ID:** SC-2026-01-27-002b
- **Status:** ✅ IMPLEMENTED
- **Turn:** 3
- **Started:** 2026-01-27
- **Closed:** 2026-01-27
- **Focus:** Human-Readable Error Messages for Duplicate Push Requests
- **Human Request:** Make the "has already been taken" unique constraint error human-readable and informational rather than alarming

### Problem Statement

When attempting to sync a reimbursement that already has a pending/processing/pushed push request, users see a raw Ash error struct:
```
Failed to sync to ERP: %Ash.Error.Invalid{...message: "has already been taken"...}
```

This is confusing because:
1. It looks like an error when it's actually informational
2. Users don't understand what "has already been taken" means
3. The technical details are not actionable for end users

### Solution Implemented

**Two-Phase Approach (Both Approved by Human):**

1. **Phase 1 - Idempotency Pre-check in PushOrchestrator:**
   - Added `check_existing_push_request/5` function that queries for existing PushRequest BEFORE creating
   - Returns `{:existing_request, push_request}` instead of triggering unique constraint violation
   - Caller (ManualSyncService) receives `{:ok, {:already_queued, existing_request}}`

2. **Phase 2 - Human-Readable Error Formatter:**
   - Created `ErpErrorFormatter` module with `format_sync_result/1` function
   - Maps all ERP sync results to `{flash_type, message}` tuples
   - Flash types: `:info` (informational), `:warning` (needs attention), `:error` (failure)
   - User-friendly messages that explain what happened and what to do

3. **Phase 3 - UI Integration:**
   - Updated `reimbursements_live.ex` to use `ErpErrorFormatter`
   - Now shows informational messages for duplicate requests instead of errors

### Files Modified

| File | Change |
|------|--------|
| `ember_erp/services/push_orchestrator.ex` | Added idempotency pre-check |
| `ember_erp/services/erp_error_formatter.ex` | NEW: Human-readable error formatter |
| `ember_erp/services/manual_sync_service.ex` | Handle `{:already_queued, ...}` response |
| `flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex` | Use ErpErrorFormatter |

### User Experience After Change

**Before:** "Failed to sync to ERP: %Ash.Error.Invalid{...}"
**After (pushed):** "This item has already been synced to the ERP." (info flash)
**After (pending):** "Sync is already queued and will be processed shortly." (info flash)
**After (processing):** "Sync is currently in progress. Please wait for it to complete." (info flash)

---

## Previous Session (UI Parity)

- **Session ID:** SC-2026-01-27-002a
- **Status:** ✅ IMPLEMENTED
- **Turn:** 12
- **Started:** 2026-01-27
- **Closed:** 2026-01-27
- **Focus:** Reimbursement ERP Sync Status UI Parity with Transactions
- **Human Request:** Replicate transaction sync status button behavior for reimbursements, including stale detection when record changes after posting

### Problem Statement

The reimbursement sync status UI lacked feature parity with transactions:
1. No stale detection (record changed after posting → needs re-post)
2. No pending/failed state tracking from PushRequest
3. No error display for failed syncs
4. Different terminology ("Sync" vs "Post")

### Resolution: GAP-REIMB-SYNC-001 IMPLEMENTED

| File | Change |
|------|--------|
| `reimbursement_request.ex` | Added `erp_synced_at` and `erp_sync_error` attributes |
| `reimbursement_request.ex` | Updated `link_erp_report` action to set `erp_synced_at` and clear error |
| `reimbursement_request.ex` | Added `record_erp_sync_error` action for failure recording |
| `reimbursements_live.ex` | Replaced `erp_sync_status_cell` with `sync_action_button` pattern |
| `reimbursements_live.ex` | Added `compute_reimbursement_sync_status/3` with 6 states |
| `reimbursements_live.ex` | Added `enrich_with_push_status/2` for PushRequest enrichment |
| `reimbursements_live.ex` | Updated `transform_reimbursement_for_ui/1` with ERP sync fields |

### Sync Status States (6 total)

| Status | Label | Condition |
|--------|-------|-----------|
| synced | "Posted" | Has ERP ID and `updated_at <= erp_synced_at` |
| stale | "Re-Post" | Has ERP ID but `updated_at > erp_synced_at` |
| pending | "Posting..." | PushRequest status is :pending or :processing |
| failed | "Retry" | PushRequest status is :failed or :blocked |
| not_synced | "Post" | No ERP ID, ready to post |
| no_erp | "Post" (disabled) | ERP connection not configured |

### Key Design Decisions

1. **Stale detection via timestamp comparison**: `updated_at > erp_synced_at` triggers "Re-Post"
2. **PushRequest enrichment**: Query latest PushRequest status for pending/failed states
3. **Terminology alignment**: Use "Post/Posted/Re-Post" to match transactions page
4. **Error tooltip**: Show user-friendly error message on hover for failed syncs

---

## Previous Session (DimensionTypeConfig)

- **Session ID:** SC-2026-01-27-001
- **Status:** ✅ IMPLEMENTED
- **Turn:** 5
- **Started:** 2026-01-27
- **Closed:** 2026-01-27
- **Focus:** DimensionTypeConfig Missing coding_category_id — Coding Status Always "needs_review"
- **Human Request:** Fix issue where passing through dimension_mapping_tab without edits causes coding_status to always be "needs_review"

### Problem Statement

When a user sets up an ERP connection and navigates through the dimension_mapping_tab without making any changes, no configuration is saved. This causes coding status calculations to always return "needs_review" because the DimensionTypeConfig records lack the coding_category_id FK needed to match CodingAssignments.

### Root Cause Identified

**GAP-CODING-STATUS-001:** DimensionTypeConfig records are created during connection setup, but the coding_category_id FK is only populated when `save_tab_data` runs. If the user doesn't make changes, the tab isn't marked dirty, so save never runs.

### Resolution: GAP-CODING-STATUS-001 FIXED

| File | Change |
|------|--------|
| `dimension_mapping_service.ex` | Added `backfill_coding_category_ids/2` function to populate FK after sync |
| `erp_live.ex` | Mark dimension_mapping tab as dirty when configs are created |
| `erp_live.ex` | Call `backfill_coding_category_ids` after sync completes |
| `update_coding_status.ex` (transactions) | Handle nil coding_key as satisfied (per human amendment) |
| `update_coding_status.ex` (reimbursements) | Handle nil coding_key as satisfied (per human amendment) |

**Two-Pronged Solution:**
1. **Prevention:** Mark tab dirty when configs created → forces save_tab_data to run
2. **Backfill:** Run backfill after sync completes → populates FK for any missed configs
3. **Safety Net:** If coding_key unresolvable → treat as not required (per human amendment)

### Key Knowledge Acquired

1. DimensionTypeConfig is created before CodingCategory exists (timing gap)
2. CodingCategory is created by CodingBridge during sync
3. The FK relationship is only established when save_tab_data runs
4. Per committee decision: missing config = not required (don't block transactions)

---

## Previous Session (Logging Verbosity)

- **Session ID:** SC-2026-01-27-000
- **Status:** ✅ IMPLEMENTED
- **Focus:** Logging Verbosity for ERP Push/Sync Errors (DevOps Request)
- **Human Request:** Add verbose logging following DevOps requirements for ERP sync/push errors, specifically focusing on NetSuite and Dwolla

### Problem Statement

DevOps team requested enhanced logging verbosity across ERP push/sync operations to improve debugging in Grafana/Loki. Current logs lack:
1. Adequate verbosity (info, error, debug levels)
2. Descriptive strings indicating what's happening
3. Received vs expected values
4. Actionable guidance for troubleshooting

### Reported Errors

1. **Reimbursement Unique Constraint Violation:**
   - `Ash.Error.Changes.InvalidAttribute` with message "has already been taken"
   - Constraint: `ember_erp_push_requests_unique_source_push_index`
   - Root cause: Race condition in `PushOrchestrator` lacking idempotency check

2. **Transaction Timeout Error:**
   - `Reactor.Error.Invalid.RunStepError` with `Req.TransportError{reason: :timeout}`
   - Root cause: NetSuite API timeouts (30s default) insufficient for complex operations

3. **Dwolla Webhook Signature Validation:**
   - DevOps specifically flagged insufficient logging context
   - Current: `Logger.error("Dwolla webhook signature validation failed")`
   - Missing: Expected/received values, customer context

### Approved Plan Summary

**Scope:** 26 logging gaps across 17 files (NetSuite + Dwolla only, excluding Sage/QuickBooks)

| Category | Files | Gaps | Priority |
|----------|-------|------|----------|
| Dwolla | 4 | 5 | HIGH (DevOps flagged) |
| ERP Push Orchestration | 5 | 7 | HIGH |
| NetSuite Client Layer | 4 | 4 | HIGH |
| NetSuite Push Capabilities | 10 | 10 | HIGH-MEDIUM |

### Implementation Phases

**Phase 1 (Critical Path):** 9 gaps in 6 files
- Dwolla adapter/client (GAP-DWOLLA-LOG-001, 003, 005)
- ExecutePush (GAP-EXEC-LOG-001)
- NetSuite client timeouts (GAP-NS-LOG-001, 002)

**Phase 2 (Push Capabilities):** 8 gaps in 5 files
- expense_reports, expense_report_payments, bills, vendors, ap_payments

**Phase 3 (Remaining):** 9 gaps in 6 files
- Other capabilities + orchestrator + reactors

### Logging Standard (DevOps Requirements)

```elixir
Logger.error("[Component] Operation failed - detailed description",
  trace_id: trace_id,
  workspace_id: workspace_id,
  push_request_id: push_request_id,
  entity_type: :expense_report,
  received: inspect(actual_value),
  expected: "description of expected value",
  error_code: error_code,
  error_message: error_message,
  suggested_action: "Check X or contact Y"
)
```

### Implementation Complete

- [x] Human approved `approve all` approach
- [x] Implemented all 26 logging gaps across 17 files
- [ ] Test in dev environment
- [ ] Verify logs appear in Grafana/Loki with expected context

### Files Modified

| Category | File | Gaps Fixed |
|----------|------|------------|
| Dwolla | `dwolla/adapter.ex` | GAP-DWOLLA-LOG-001, GAP-DWOLLA-LOG-005 |
| Dwolla | `dwolla/client.ex` | GAP-DWOLLA-LOG-003 |
| Dwolla | `dwolla/capabilities/identity_verification.ex` | GAP-DWOLLA-LOG-002 |
| Dwolla | `dwolla/capabilities/funding_source_management.ex` | GAP-DWOLLA-LOG-004 |
| ExecutePush | `resources/push_request/manual_actions/execute_push.ex` | GAP-EXEC-LOG-001 |
| NetSuite Client | `netsuite/client.ex` | GAP-NS-LOG-001 |
| NetSuite SOAP | `netsuite/soap_client.ex` | GAP-NS-LOG-002 |
| NetSuite Adapter | `netsuite/adapter.ex` | GAP-NS-LOG-003 |
| NetSuite Token | `netsuite/token_cache.ex` | GAP-NS-LOG-004 |
| Push Capabilities | `capabilities/push/expense_reports.ex` | GAP-NS-PUSH-001 |
| Push Capabilities | `capabilities/push/expense_report_payments.ex` | GAP-NS-PUSH-002 |
| Push Capabilities | `capabilities/push/bills.ex` | GAP-NS-PUSH-003 |
| Push Capabilities | `capabilities/push/vendors.ex` | GAP-NS-PUSH-004 |
| Push Capabilities | `capabilities/push/ap_payments.ex` | GAP-NS-PUSH-005 |
| Push Capabilities | `capabilities/push/files.ex` | GAP-NS-PUSH-006 |
| Push Capabilities | `capabilities/push/journal_entry.ex` | GAP-NS-PUSH-007 |
| Push Capabilities | `capabilities/push/vendor_credits.ex` | GAP-NS-PUSH-008 |
| Push Capabilities | `capabilities/push/employees.ex` | GAP-NS-PUSH-009 |
| Orchestrator | `services/push_orchestrator.ex` | GAP-PUSH-LOG-001, GAP-PUSH-LOG-004 |
| Status Change | `integrations/erp/push_on_status_change.ex` | GAP-PUSH-LOG-005 |
| Payment Worker | `workers/apply_bill_payment_worker.ex` | GAP-PUSH-LOG-006 |
| Reactor | `reactors/expense/push_reimbursement_complete_reactor.ex` | GAP-PUSH-LOG-002 |
| Reactor | `reactors/ap/push_card_spend_reactor.ex` | GAP-PUSH-LOG-003 |

---

## Previous Session

- **Session ID:** SC-2026-01-23-002
- **Status:** ✅ IMPLEMENTED
- **Turn:** 1
- **Started:** 2026-01-23
- **Closed:** 2026-01-23
- **Focus:** Vendor Policy Threshold Input Field Missing
- **Human Request:** Add threshold input field for "auto-create vendor up to a transaction threshold" option on Vendors & Sync step

### Resolution: GAP-VENDOR-THRESHOLD-UI-001 FIXED

| File | Change |
|------|--------|
| `vendors_sync_tab.ex` | Added `auto_create_threshold` assign to mount (default: 5000) |
| `vendors_sync_tab.ex` | Updated `update/2` to load threshold from parent's `vendor_config` |
| `vendors_sync_tab.ex` | Updated `load_data_from_db/1` to load threshold from VendorPolicy |
| `vendors_sync_tab.ex` | Added threshold input field UI when `:auto_create_threshold` is selected |
| `vendors_sync_tab.ex` | Added `update-threshold` event handler to update threshold value |
| `vendors_sync_tab.ex` | Updated `select-policy` to include threshold in `vendor_config` |

---

## Earlier Session

- **Session ID:** SC-2026-01-23-001
- **Status:** ✅ IMPLEMENTED
- **Turn:** 1
- **Started:** 2026-01-23
- **Closed:** 2026-01-23
- **Focus:** Mock Transaction Webhook Architecture — Direct Handler vs HTTP Request Pattern
- **Human Request:** Fix 403 Forbidden error when mocking WEX Fleet transactions on dev.teampay.io

### Problem Statement

**Error:** Mock transactions fail with `403 Forbidden` on hosted environments (dev.teampay.io) because the server makes HTTP requests to itself through the public URL, which CloudFlare/WAF blocks.

### Root Cause Identified

**Anti-pattern:** The `send_mock_transaction_webhook/3` function was using `FlameTeampayPayablesWeb.Endpoint.url()` to get the external URL and making HTTP requests to itself. This works locally but fails on hosted environments where CDN/WAF blocks self-referential requests.

**Flow Before Fix:**
1. OpsBar builds mock webhook payload
2. Gets external URL (`https://dev.teampay.io`)
3. Makes HTTP POST to `/webhooks/wex_fleet/{connection_id}/transactions`
4. Request exits server → Internet → CloudFlare → WAF
5. CloudFlare blocks request → **403 Forbidden**

### Resolution: SC-2026-01-23-001 IMPLEMENTED

**Committee Vote:** UNANIMOUS (5-0) — Direct handler call approved

| Member | Verdict | Key Point |
|--------|---------|-----------|
| Sync Architect | ✅ APPROVE | HTTP to self is anti-pattern; direct call is correct |
| Edge Case Hunter | ✅ APPROVE | Fewer failure modes with direct call |
| Standards Enforcer | ✅ APPROVE | Follows established patterns |
| Observability Auditor | ✅ APPROVE | All meaningful observability preserved |
| End User Advocate | ✅ STRONGLY APPROVE | Unblocks developers on hosted environments |

| File | Change |
|------|--------|
| `operations_bar.ex` | Replaced HTTP request with direct handler calls |
| `operations_bar.ex` | WEX Fleet: Calls `WexTransactionWebhookHandler.handle_event/2` directly |
| `operations_bar.ex` | Marqeta: Calls `WebhookReceiver.receive/1` directly |
| `operations_bar.ex` | Removed `build_webhook_auth_header/2` (no longer needed) |

**Flow After Fix:**
1. OpsBar builds mock webhook payload
2. Calls handler directly (in-process)
3. Handler processes event
4. Transaction created → **Success**

### Key Knowledge Acquired

1. **HTTP endpoints are adapters** — They exist for external callers (real WEX/Marqeta servers)
2. **Internal code should call handlers directly** — Bypasses network, CDN, WAF
3. **Pattern consistency** — Reactors, tests, and services all call handlers directly
4. **Observability preserved** — Handler logging, OpenTelemetry spans, audit trail all work the same

---

## Previous Session

- **Session ID:** SC-2026-01-20-001
- **Status:** ✅ IMPLEMENTED
- **Turn:** 3
- **Started:** 2026-01-20
- **Closed:** 2026-01-20
- **Focus:** Currency Always British Pounds on NetSuite Push — Subsidiary Currency Fix
- **Human Request:** Fix expense reports always using British Pounds (GBP) regardless of subsidiary

### Problem Statement

**Error:** Expense reports pushed to NetSuite always use British Pounds (GBP), regardless of the subsidiary's configured base currency.

### Root Cause Identified

**GAP-CURRENCY-SUBSIDIARY-001:** The reactor hardcoded `currency_code: "USD"` instead of looking up the subsidiary's `currency_id` from the `ErpSubsidiary` mirror table.

**Flow Before Fix:**
1. Reactor sends `currency_code: "USD"` (hardcoded)
2. Push layer tries to resolve "USD" to NetSuite internal ID
3. Resolution fails or falls back to `fetch_real_currency()`
4. `fetch_real_currency()` fetches first currency from NetSuite with `limit: 1`
5. First currency in NetSuite's default sort = GBP
6. Expense report created with wrong currency

### Resolution: GAP-CURRENCY-SUBSIDIARY-001 FIXED

| File | Change |
|------|--------|
| `push_reimbursement_complete_reactor.ex` | Added `ErpSubsidiary` alias |
| `push_reimbursement_complete_reactor.ex` | Added `get_subsidiary_currency_id/3` function to look up currency from ErpSubsidiary |
| `push_reimbursement_complete_reactor.ex` | Updated `resolve_subsidiary_from_entity_mapping/2` to return `{external_id, name, currency_id}` tuple |
| `push_reimbursement_complete_reactor.ex` | Updated `build_expense_report_data/8` → `/9` to accept and use `currency_id` |
| `push_reimbursement_complete_reactor.ex` | Replaced `currency_code: "USD"` with `currency_id: subsidiary_currency_id` |
| `expense_reports.ex` (NetSuite push) | Updated `ensure_currency_ref/2` to trust valid numeric IDs instead of re-fetching |

**Flow After Fix:**
1. Reactor looks up subsidiary from EntityMapping
2. Reactor queries ErpSubsidiary to get `currency_id` (NetSuite internal ID)
3. Reactor passes `currency_id` (e.g., "3" for EUR) to push layer
4. Push layer uses the provided currency_id directly
5. Expense report created with correct subsidiary currency

### Key Knowledge Acquired

1. **ErpSubsidiary.currency_id** stores the NetSuite currency internal ID (e.g., "1" for USD, "3" for EUR)
2. **Cross-ERP compatibility:** Only NetSuite requires currency on expense reports; Sage Intacct and QuickBooks inherit from entity
3. **The `fetch_real_currency` fallback** was dangerous — it returned the first currency in NetSuite's sort order (GBP)
4. **Numeric IDs should be trusted** — previously "1" was treated as invalid and re-fetched

---

## Previous Session

- **Session ID:** SC-2026-01-19-007
- **Status:** 🟢 MEETING_ACTIVE  
- **Turn:** 2
- **Started:** 2026-01-19
- **Focus:** Expense Category Missing on ERP Push — Diagnostic Logging Added
- **Human Request:** Fix RECURRING "Some expense lines missing 'category' field" error for Teams-originated reimbursements. Previous fix in SC-2026-01-19-006 was incomplete — issue persists

### Turn 2 Investigation

**Key Finding:** User confirms category IS visible in UI, meaning CodingAssignment WAS created correctly.

**Problem Hypothesis:** The push reactor's `get_item_dimensions_from_coding_assignments` function is not finding or properly loading the CodingAssignment records.

**Action Taken:** Added enhanced diagnostic logging.

### Turn 3 — ROOT CAUSE IDENTIFIED ✓

**Logs showed:**
```
Found 5 CodingAssignment records for item ...
CodingAssignment - category_code="GL-ACCOUNT", value_id="9cc0121c-...", value_name="6251 Sales Travel & Meals"
Final dimensions: %{gl_account: "9cc0121c-..."}
Searching ExpenseCategory with gl_account_code: 6251
⚠️ No ExpenseCategory found with gl_account_code: 6251
```

**Root Cause:** Data mismatch between `CodingValue.code` and `ExpenseCategory.gl_account_code`

| Field | Value | Source |
|-------|-------|--------|
| `CodingValue.code` | `"6251"` | GL Account code from NetSuite |
| `CodingValue.external_id` | `"123"` (example) | GL Account NetSuite internal ID |
| `ExpenseCategory.gl_account_code` | `"123"` | Stores NetSuite internal ID, NOT code |

The ExpenseCategoryMapper extracts `account` field from NetSuite which returns `{"id": "123"}`, not the code `"6251"`.

**Fix Applied:**
1. Updated `resolve_expense_category_from_coding_value` to try multiple matching strategies:
   - Strategy 1: Match by `CodingValue.external_id` → `ExpenseCategory.gl_account_code` (internal IDs)
   - Strategy 2: Match by `CodingValue.code` → `ExpenseCategory.gl_account_code` (account codes)
   - Strategy 3: Fall back to name matching

2. Added new function `find_expense_category_by_gl_account_id` for Strategy 1

**Next Step:** Test push again to verify fix

### Problem Statement

**Error Message:**
```
[warning] [NetSuite Push] ExpenseReports - Some expense lines missing 'category' field, fetching default expense category
[error] [NetSuite Client] Response body: %{"o:errorDetails" => [%{"detail" => "Error while accessing a resource. The Accounts Payable USD Sub8 account cannot be used with the Euro Sub subsidiary..."}]}
```

**Flow Analysis:**
1. User selects category in reimbursement UI → Saved to `CodingAssignment` table
2. `PushReimbursementCompleteReactor.build_expense_report_data/8` reads `item.metadata["gl_account"]`
3. `metadata["gl_account"]` is `nil` because dimension is in CodingAssignment, NOT metadata
4. `category_external_id` returns `nil`
5. NetSuite push layer detects missing category → fetches "default" expense category
6. Default fetch `/expenseCategory?limit=1` returns first category (from wrong subsidiary)
7. Push fails with subsidiary mismatch error

**Root Cause (Multi-Part):**

1. **Reactor not querying CodingAssignment**: `PushReimbursementCompleteReactor` was reading from `item.metadata["gl_account"]` but the UI saves dimension selections to `CodingAssignment` records, NOT to item metadata.

2. **Field name mismatch in reimbursement_detail_live.ex**: The edit form uses `name="item[category]"` but the `update_coding_assignments_for_item` function looked for `"gl_account"` key, so category selections were NEVER saved to CodingAssignment when editing existing items.

**GAP ID:** GAP-REIMB-CATEGORY-PUSH-001

### Resolution: GAP-REIMB-CATEGORY-PUSH-001 (Turn 3)

| File | Change |
|------|--------|
| `push_reimbursement_complete_reactor.ex` | Added `CodingAssignment` and `CodingCategory` aliases |
| `push_reimbursement_complete_reactor.ex` | Added `get_item_dimensions_from_coding_assignments/2` to query CodingAssignment for each item |
| `push_reimbursement_complete_reactor.ex` | Added `category_code_to_dimension_key/1` to map CodingCategory.code to dimension keys |
| `push_reimbursement_complete_reactor.ex` | Updated `build_expense_report_data/8` to hydrate dimensions from CodingAssignment first, fallback to metadata |
| `push_reimbursement_complete_reactor.ex` | Changed query pattern from `:by_record` action to plain `Ash.Query.filter` (same as UI uses) |
| `push_reimbursement_complete_reactor.ex` | Added info-level logging to trace dimension resolution |
| `reimbursement_detail_live.ex` | **Fixed** `dimension_mappings` to include `{"category", "GL"}` so form field matches CodingAssignment creation |
| `expense_reports.ex` | **Fixed** `ensure_expense_lines_category/2` to extract subsidiary_id from expense report header |
| `expense_reports.ex` | **Fixed** `fetch_default_expense_category/2` to filter by subsidiary |
| `expense_reports.ex` | Added `find_category_for_subsidiary/3` to find compatible category by checking account subsidiary |
| `expense_reports.ex` | Added `check_account_subsidiary/3` to validate account-subsidiary compatibility |

**Form Field Mismatch Fix:**
```elixir
# Before (broken) - only looked for "gl_account" field
dimension_mappings = [
  {"department", "DEPT"},
  {"gl_account", "GL"},  # Form uses "category", not "gl_account"!
  ...
]

# After (fixed) - includes "category" field mapping
dimension_mappings = [
  {"department", "DEPT"},
  {"department_id", "DEPT"},
  {"gl_account", "GL"},
  {"category", "GL"},  # Now handles form's "category" field
  ...
]
```

### Key Knowledge Acquired

1. **UI saves to CodingAssignment, not metadata**: The reimbursement UI uses `CodingAssignment` records (with `record_type: "reimbursement_item"`) to store dimension selections
2. **CodingAssignment query pattern**: Use plain `Ash.Query.filter(record_type == x and record_id == y)` with load (same as UI)
3. **CodingCategory.code mapping**: Codes like "GL", "GL-ACCOUNT", "DEPT", "CLASS" need to be mapped to dimension keys like `:gl_account`, `:department`, `:class`
4. **Fallback pattern**: Always fall back to metadata for legacy data that may not have CodingAssignment records
5. **Form field naming matters**: The form's input `name=` attribute must match the key used in `dimension_mappings` for CodingAssignment upsert to work

---

## Previous Session (Provider Not Enabled)

- **Session ID:** SC-2026-01-19-005
- **Status:** 🔴 DEFERRED
- **Focus:** Provider Not Enabled error for reimbursement payments
- **GAP ID:** GAP-REIMB-PROVIDER-001
- **Notes:** Separate issue - workspace needs Dwolla enabled or provider selection logic needs to respect enabled_providers

---

## Previous Session

- **Session ID:** SC-2026-01-19-005
- **Status:** ✅ FIXED
- **Turn:** 1
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** BadBooleanError in AccountMappingService — Strict `and` with nil values
- **Human Request:** Fix push reactor failure with `BadBooleanError{term: nil, operator: :and}`

### Problem Statement

Push reimbursement reactor fails with `BadBooleanError` when `subsidiary_id` is `nil`:

```
%BadBooleanError{term: nil, operator: :and}
```

Error occurs in `AccountMappingService.resolve_from_account_mapping/4` at lines 815 and 831.

### Root Cause Identified

**GAP-NS-BOOLEAN-ERROR-001:** `AccountMappingService` uses Elixir's strict `and` operator with potentially `nil` values.

**Problematic Code (Line 815):**
```elixir
subsidiary_check_will_run: is_funding_item and subsidiary_id && subsidiary_id != "",
```

**Problematic Code (Line 831):**
```elixir
is_funding_item and subsidiary_id && subsidiary_id != "" and not String.contains?(...)
```

When `is_funding_item` is `true` and `subsidiary_id` is `nil`:
- `true and (nil && ...)` → `true and nil` → **BadBooleanError**

### Resolution: GAP-NS-BOOLEAN-ERROR-001 FIXED

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Pre-compute `has_subsidiary = subsidiary_id != nil && subsidiary_id != ""` |
| `account_mapping_service.ex` | Replace `and` with `&&` in cond checks (lines 821, 831) |
| `account_mapping_service.ex` | Use `has_subsidiary` boolean in logging and condition checks |

**Before (Broken):**
```elixir
is_funding_item and subsidiary_id && subsidiary_id != "" and not String.contains?(...)
```

**After (Fixed):**
```elixir
has_subsidiary = subsidiary_id != nil && subsidiary_id != ""
...
is_funding_item && has_subsidiary && not String.contains?(...)
```

### Key Knowledge Acquired

1. **Elixir `and` vs `&&`:**
   - `and` — Strict boolean operator; both operands MUST be `true` or `false`
   - `&&` — Short-circuit operator; works with truthy/falsy values (nil is falsy)
   - Mixing `and` with potentially nil values causes `BadBooleanError`

2. **Fix Pattern:**
   - Pre-compute nil checks into boolean variables
   - Use `&&` throughout for short-circuit evaluation
   - Or use explicit guards: `is_boolean(x) and x`

---

## Previous Session

- **Session ID:** SC-2026-01-19-004
- **Status:** ✅ COMMITTED & IMPLEMENTED
- **Turn:** 8
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** Vendor Subsidiary Filtering + Receipt Matching + Primary Subsidiary Fix
- **Human Request:** Fix vendor filtering by subsidiary + receipt tie-breaker + exclude synced/attached + fix primary subsidiary determination using isprimarysub field

### Problem Statement

**Issue 1 (Turn 2):** After implementing the `primary_erp_location_id` vendor filter (SC-2026-01-19-003), the vendor dropdown pagination in multiple pages was broken. The in-memory filtering after DB pagination caused:
1. `has_more` to return `false` prematurely
2. Offset calculations to be wrong (based on filtered count, not scanned count)

**Issue 2 (Turn 3):** The `MerchantVendorMappingService.check_fuzzy_match/3` was fuzzy matching against ALL 1,155 vendors instead of filtering by the entity's ERP subsidiary first. This caused:
1. Potential matches to vendors in wrong subsidiaries
2. Multiple "Adobe" matches from different subsidiaries (same name, different subsidiary)

### Root Causes Identified

**GAP-NS-PAGINATION-001:** In-memory filtering after DB-level pagination breaks pagination logic.

**GAP-NS-FUZZY-MATCH-001:** `MerchantVendorMappingService` fuzzy matching was not filtering by `primary_erp_location_id`, allowing matches to vendors from other subsidiaries.

### Resolution: ALL IN-MEMORY VENDOR FILTERS MOVED TO DB LEVEL

| File | Change |
|------|--------|
| `transactions_live.ex` | `load_lazy_filter_options("vendor", ...)` - Added DB-level filter using `erp_vendor.primary_erp_location_id` |
| `transactions_live.ex` | `search_vendors/3` - Added DB-level subsidiary filter |
| `transactions_live.ex` | Removed dead code `load_vendors_page/3` |
| `transaction_query_service.ex` | `get_vendor_options/3` - Moved in-memory filter to DB level |
| `transaction_query_service.ex` | Removed unused helper functions `get_vendor_erp_entity_ids/1` and `get_vendor_primary_erp_location/1` |
| `expense_card_service.ex` | `get_vendor_filter_options/3` - Moved in-memory filter to DB level, removed helper function |
| `expense_card_query_service.ex` | `get_vendor_options/3` - Moved in-memory filter to DB level, removed helper function |
| `merchant_vendor_mapping_service.ex` | `check_fuzzy_match/3` - Added DB-level subsidiary filter, added `get_entity_erp_location/2` helper |
| `merchant_vendor_mapping_service.ex` | `load_vendor_batch/4` - Changed from `entity_id` to `erp_location_id` filtering |
| `receipt_handler.ex` | `try_tie_breaker/1` - Changed to ALWAYS pick a winner; added `find_newest_transaction/1` |
| `match_computation_service.ex` | `get_card_candidates` - Added `is_nil(erp_synced_at)` filter to exclude synced transactions |
| `match_computation_service.ex` | `get_reimbursement_candidates` - Added `is_nil(erp_expense_line_item_id)` and `receipt_count == 0` filters |
| `vendor_entity_sync_service.ex` | `update_vendor_subsidiary_data` - Only update `entity_ids`, preserve `primary_erp_location_id` |
| `vendor_entity_relationships.ex` | `enrich_vendors` - Use `subsidiary_ids` field instead of overwriting `subsidiary` |
| `vendor_mapper.ex` | `extract_subsidiary_ids` - Check `subsidiary_ids` first, then `subsidiary` |
| `vendor_mapper.ex` | `extract_primary_subsidiary_id_with_fallback` - Only use vendor record's `subsidiary`, no fallback to entity_ids |

### Fix: Primary Subsidiary Determination (Turn 6-7)

**Problem:** Vendors were getting wrong `primary_erp_location_id` values. For example, a vendor with primary `6` was getting `1` instead.

**Root Cause Analysis:**

The `vendorSubsidiaryRelationship` table lists ALL subsidiaries a vendor is available for, but does NOT indicate which is PRIMARY. The code was:
1. Fetching relationships and **sorting** them alphabetically (`["1", "3", "6"]`)
2. Using the **first sorted entry** (`"1"`) as primary
3. **Overwriting** the original `subsidiary` field with the sorted list

This was WRONG. The primary subsidiary ONLY comes from the vendor record's `subsidiary` field.

**Fix Applied:**

1. **`vendor_entity_relationships.ex`**: Use a SEPARATE `subsidiary_ids` field instead of overwriting `subsidiary`
```elixir
# BEFORE (overwrote primary):
Map.put(vendor, "subsidiary", Enum.join(entity_ids, ", "))

# AFTER (preserves primary):
Map.put(vendor, "subsidiary_ids", entity_ids)
```

2. **`vendor_mapper.ex`**: Check `subsidiary_ids` for entity_ids list, use `subsidiary` ONLY for primary
```elixir
# entity_ids: from subsidiary_ids (enriched) or subsidiary field
# primary_erp_location_id: ONLY from subsidiary field (no fallback)
```

3. **`vendor_entity_sync_service.ex`**: Only update `entity_ids`, preserve existing `primary_erp_location_id`

**Data Flow After Fix (Turn 8):**

| Field | Source | Purpose |
|-------|--------|---------|
| `subsidiary` (vendor record) | `SELECT * FROM vendor` | Often NULL for shared vendors |
| `isprimarysub` | `vendorSubsidiaryRelationship` table | Identifies PRIMARY subsidiary |
| `subsidiary_ids` (enriched) | `vendorSubsidiaryRelationship` table | ALL available subsidiaries |
| `primary_subsidiary_id` (enriched) | `isprimarysub='T'` in relationship table | PRIMARY for payment routing |
| `primary_erp_location_id` | enriched `primary_subsidiary_id` | Stored for payment routing |
| `entity_ids` | relationship table (via `subsidiary_ids`) | Filtering vendors by entity |

### Turn 8: Proper Primary Subsidiary Detection

**Problem:** NetSuite's `SELECT * FROM vendor` returns `subsidiary=null` for vendors shared across subsidiaries. The primary subsidiary must come from the `vendorSubsidiaryRelationship` table using `isprimarysub='T'`.

**Fix Applied:**

1. **`vendor_entity_relationships.ex`**: Updated query to include `isprimarysub` field
```sql
SELECT entity, subsidiary, isprimarysub
FROM vendorSubsidiaryRelationship
ORDER BY entity, isprimarysub DESC
```

2. **`vendor_entity_relationships.ex`**: Return structure now includes `primary`:
```elixir
%{vendor_id => %{entity_ids: [...], primary: "6"}}
```

3. **`vendor_bulk_upsert_service.ex`**: Added `maybe_enrich_with_subsidiary_data/3` to fetch relationships and enrich vendors BEFORE mapping

4. **`vendor_mapper.ex`**: Updated `extract_primary_subsidiary_id_with_fallback/2` to check enriched `primary_subsidiary_id` first

| File | Change |
|------|--------|
| `vendor_entity_relationships.ex` | Added `isprimarysub` to query, track primary per vendor |
| `vendor_entity_relationships.ex` | `enrich_vendors` now adds `primary_subsidiary_id` |
| `vendor_bulk_upsert_service.ex` | Added `maybe_enrich_with_subsidiary_data/3` |
| `vendor_mapper.ex` | Check `primary_subsidiary_id` first in fallback chain |
| `vendor_entity_sync_service.ex` | Now updates `primary_erp_location_id` from relationship data |

### Match Candidate Exclusion Filters (Turn 5)

**Problem:** Receipt matching was considering transactions that:
1. Already had a receipt attached
2. Were already synced to ERP

**Fix:** Added DB-level filters in `MatchComputationService`:

**Card Transactions (`get_card_candidates`):**
```elixir
|> Ash.Query.filter(expr(
    is_nil(receipt_document_id) and  # No receipt attached (already existed)
    is_nil(erp_synced_at) and        # SC-2026-01-19-004: Not synced to ERP
    ...
  ))
```

**Reimbursement Items (`get_reimbursement_candidates`):**
```elixir
|> Ash.Query.filter(expr(
    is_nil(erp_expense_line_item_id) and  # SC-2026-01-19-004: Not synced to ERP
    receipt_count == 0 and                 # SC-2026-01-19-004: No receipts attached
    ...
  ))
```

### Receipt Tie-Breaker Change (Turn 4)

**Problem:** When multiple transactions matched a receipt with equal scores, the system left it for "manual review" instead of auto-matching.

**Fix:** Changed `try_tie_breaker/1` to always return a winner:
- If no other tie-breaker distinguishes candidates, pick the **newest transaction** (most recent date)
- Removed the `{:ok, :no_clear_winner, candidates}` path (except for empty list edge case)
- Added `find_newest_transaction/1` helper that sorts by date descending

**New Tie-Breaker Order:**
1. Score difference (≥10 points higher)
2. Exact amount match
3. Closest date to receipt
4. Exact merchant match  
5. **FALLBACK: Newest transaction** ← Always picks a winner

### DB-Level Filter Pattern

```elixir
# SC-2026-01-19-004: Filter at DB level
# Include vendors where:
#   - No ERP vendor link (erp_vendor_id is nil) - user might link later
#   - ERP vendor has no primary location (nil = global/shared)
#   - ERP vendor's primary location matches current entity's ERP location
vendor_query = if erp_location_id do
  Ash.Query.filter(vendor_query, expr(
    is_nil(erp_vendor_id) or
    is_nil(erp_vendor.primary_erp_location_id) or
    erp_vendor.primary_erp_location_id == ^erp_location_str
  ))
else
  vendor_query
end
```

### Key Knowledge Acquired

1. **In-Memory Filtering + Pagination = Broken:**
   - Never apply in-memory filters after DB offset/limit
   - Pagination controls (offset, has_more) must be based on DB-level filtering

2. **Ash Relationship Filtering:**
   - Ash supports filtering by relationship attributes: `erp_vendor.primary_erp_location_id`
   - This generates efficient JOINs at the DB level

3. **Pattern for Subsidiary Filtering:**
   - Always filter at DB level for correct pagination
   - Include nil checks for vendors without ERP links or global vendors

---

## Previous Session

- **Session ID:** SC-2026-01-19-003-B
- **Status:** ✅ COMMITTED & IMPLEMENTED
- **Turn:** 7
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** Vendor Primary Subsidiary Not Populated After Sync
- **Human Request:** Investigate why vendor primary_erp_location_id column stayed blank after sync

### Problem Statement

After re-syncing vendors from NetSuite, the `primary_erp_location_id` column remained NULL for all 1,125 vendors, even though `entity_ids` was properly populated.

### Root Causes Identified

**GAP-NS-PRIMARY-SUBSIDIARY-001:** `VendorBulkUpsertService.upsert_batch/3` did NOT include `primary_erp_location_id` or `entity_ids` in the `upsert_fields` list. This meant:
- On **create**: Fields were set (all attributes written)
- On **upsert**: Fields were **NOT updated** (not in upsert_fields)

**GAP-NS-PRIMARY-SUBSIDIARY-002:** `VendorEntitySyncService.update_vendor_entity_ids/3` only updated `entity_ids`, NOT `primary_erp_location_id`.

**GAP-NS-PRIMARY-SUBSIDIARY-003:** NetSuite SuiteQL `SELECT * FROM vendor` often returns `null` for the `subsidiary` field when vendors are shared via the `vendorSubsidiaryRelationship` table. The mapper had no fallback logic.

### Resolution: ALL THREE GAPS FIXED

| File | Change |
|------|--------|
| `vendor_mapper.ex` | Added `extract_primary_subsidiary_id_with_fallback/2` with fallback to first entity_id |
| `vendor_mapper.ex` | Added comprehensive logging for subsidiary extraction |
| `vendor_bulk_upsert_service.ex` | Added `entity_ids` and `primary_erp_location_id` to `upsert_fields` |
| `vendor_bulk_upsert_service.ex` | Added logging for subsidiary data counts |
| `vendor_entity_sync_service.ex` | Updated `update_vendors/2` to also set `primary_erp_location_id` |
| `vendor_entity_sync_service.ex` | Added `update_vendor_subsidiary_data/3` to update both fields |
| `vendor_entity_sync_service.ex` | Fixed `sync_all/0` to use direct Ecto query for cross-workspace operations |

### Key Knowledge Acquired

1. **NetSuite Vendor Subsidiary Data Flow:**
   - Main vendor sync: `SELECT * FROM vendor` → may return `subsidiary = null`
   - Entity relationship sync: `vendorSubsidiaryRelationship` table → `entity_ids`
   - The FIRST entry in `entity_ids` is the primary (NetSuite convention)

2. **Ash Bulk Upsert Behavior:**
   - `Ash.bulk_create` with `upsert?: true` only updates fields in `upsert_fields`
   - Missing fields from `upsert_fields` = never updated on re-sync
   - Always add ALL fields that should be updated to `upsert_fields`

3. **Cross-Workspace Queries:**
   - Use direct Ecto query (`from c in "erp_connections"`) to bypass Ash multitenancy
   - Then load full records with tenant context for subsequent operations
   - Binary UUIDs from PostgreSQL must be converted to string format

### Verification Results

Before fix:
- Total vendors: 1,125
- With primary_erp_location_id: 0 (all NULL)
- With entity_ids: 1,125

After fix (running VendorEntitySyncService.sync_all):
- Total vendors: 1,125
- With primary_erp_location_id: 1,125 ✅
- With entity_ids: 1,125 ✅

---

## Previous Session

- **Session ID:** SC-2026-01-19-003-A
- **Status:** ✅ COMMITTED & IMPLEMENTED
- **Turn:** 4
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** NetSuite Employee Push — Entity Name Collision Error
- **Human Request:** Fix "entity name already exists" error when pushing employees to NetSuite

### Agenda

1. ~~Explain the current Workforce ↔ ERP Employee architecture~~ ✅ Turn 1
2. ~~Investigate inactive employee handling~~ ✅ Turn 2 (not the actual issue)
3. ~~Entity name collision when creating NetSuite employee~~ ✅ Turn 3-4 (FIXED)

### Problem Statement (Turn 3)

**Error Message:**
```
"There is already an employee with external access to this account using that entity name. 
All employees with external access must have a unique entity name for login purposes."
```

**Root Cause:** 
- We don't set `entityid` field when pushing employees
- NetSuite auto-generates it as `"{firstname} {lastname}"`
- If an employee (active OR inactive) with external access has the same name, creation fails

**GAP ID:** GAP-EMP-ENTITYID-001

### Resolution: GAP-EMP-ENTITYID-001 FIXED

**Committee Vote:** UNANIMOUS (11-0) — Option B approved

**Solution:** Add explicit `entityid` field with unique suffix

**Format:** `{FirstName} {LastName} (TP-{6_char_id})`
**Example:** `John Smith (TP-a1b2c3)`

| File | Change |
|------|--------|
| `push/employees.ex` | Added `build_unique_entityid/3` function |
| `push/employees.ex` | Added `entityid` field to `transform_to_netsuite_format/2` |

**Implementation Details:**
- Uses first 6 characters of workforce_employee.id (UUID) for uniqueness
- Truncates name if total length exceeds 32 characters (NetSuite limit)
- Falls back to timestamp-based ID if no user ID provided

---

## Previous Session

- **Session ID:** SC-2026-01-19-002
- **Status:** ✅ COMMITTED & IMPLEMENTED
- **Turn:** 7
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** Multiple Card Payment Push Fixes — Full Resolution Chain + Subsidiary Filtering
- **Human Request:** Investigate card payment push failures

### Problem Statement

**Issue 1 (Turn 2): Duplicate Bill Error**
- On retry, NetSuite rejects with: `"This record already exists"`

**Issue 2 (Turn 3): Missing Account Field**
- VendorPayment payload missing required `account` field

**Issue 3 (Turn 4): FieldMapperService Dropping account_id**
- `FieldMapperService.map_ap_payment_fields/2` didn't include `account_id`

**Issue 4 (Turn 5): Wrong Resolution Function**
- Reactor was using `resolve_account/3` instead of `resolve_funding_account/3`

**Issue 5 (Turn 6): GL Account Not Bank Type**
- `resolve_from_account_mapping/3` didn't verify `accttype = 'Bank'`

**Issue 6 (Turn 7): Bank Account Not Available for Subsidiary**
- NetSuite error: `"Invalid Field Value 231 for the following field: account"`
- Bill is in subsidiary 6 (Euro Sub), but bank account `231` not available for that subsidiary
- `resolve_from_bank_account_fallback/4` wasn't filtering by subsidiary

### Root Causes Identified

**GAP-NS-DUPLICATE-BILL-001:** Partial failure — bill created but PushEntityRecord not saved

**GAP-NS-MISSING-ACCOUNT-001:** Reactor/worker weren't passing `bank_account_id` in job_args

**GAP-NS-MISSING-ACCOUNT-002:** `FieldMapperService.map_ap_payment_fields/2` filtered out `account_id`

**GAP-NS-ACCOUNT-TYPE-001:** Using `resolve_account/3` instead of `resolve_funding_account/3`

**GAP-NS-ACCOUNT-TYPE-002:** `resolve_from_account_mapping/3` didn't verify GL account is Bank type

**GAP-NS-SUBSIDIARY-MISMATCH-001:** `resolve_from_bank_account_fallback/4` ignored subsidiary_id parameter

**GAP-NS-SUBSIDIARY-MISMATCH-002:** `resolve_from_account_mapping/3` didn't validate subsidiary availability

### Resolution: ALL SEVEN GAPS FIXED

| File | Change |
|------|--------|
| `push_card_spend_reactor.ex` | Duplicate bill recovery helpers |
| `push_card_spend_reactor.ex` | Added `bank_account_id` to job_args |
| `push_card_spend_reactor.ex` | Changed to `resolve_funding_account/3` |
| `push_card_spend_reactor.ex` | **Pass subsidiary_id to bank account resolution** |
| `apply_bill_payment_worker.ex` | Added `account_id` to payment_data |
| `field_mapper_service.ex` | Added `account_id` to `map_ap_payment_fields/2` |
| `account_mapping_service.ex` | Added Bank type validation in `resolve_from_account_mapping/3` |
| `account_mapping_service.ex` | **Added subsidiary filtering in `resolve_from_bank_account_fallback/4`** |

### Key Knowledge Acquired

1. **NetSuite VendorPayment Account Constraints:**
   - Must be a **Bank-type GL account** (`erp_metadata.accttype = 'Bank'`)
   - Must be **available for the transaction's subsidiary**
   - Error: `"Invalid Field Value X for the following field: account"` means type OR subsidiary mismatch

2. **Subsidiary Filtering:**
   - Bank accounts have `erp_metadata.subsidiary_raw` (comma-separated list like "1, 3, 6")
   - Must filter bank accounts to match the bill's subsidiary
   - Pass `subsidiary_id` from `vendor_info` through to `resolve_funding_account/3`

3. **Full Resolution Chain:**
   1. Reactor gets `subsidiary_id` from `vendor_info`
   2. Calls `get_card_payment_bank_account(conn_id, workspace_id, subsidiary_id)`
   3. `resolve_funding_account/3` receives `subsidiary_id` in opts
   4. `resolve_from_account_mapping/3` validates Bank type
   5. If not Bank → `resolve_from_bank_account_fallback/4` filters by subsidiary

4. **NetSuite OneWorld:**
   - Multi-subsidiary environments require accounts to be available per subsidiary
   - Bank accounts, GL accounts, vendors all have subsidiary restrictions

---

## Previous Session

- **Session ID:** SC-2026-01-19-001
- **Status:** ✅ COMMITTED & IMPLEMENTED
- **Turn:** 4
- **Started:** 2026-01-19
- **Closed:** 2026-01-19
- **Focus:** Bill Payment Push Failure — Apply Sublist Invalid Operation Error
- **Human Request:** Review and analyze the current implementation for push card transactions to NetSuite; bills were being created as "Open" instead of "Paid in Full" due to payment creation failure

### Problem Statement

When pushing card transactions to NetSuite:
1. Bill is created successfully (e.g., ID `627570`)
2. Payment job is scheduled 30 seconds later
3. Worker attempts to create VendorPayment via POST `/vendorPayment`
4. **FAILS** with: `"You have attempted an invalid sublist or line item operation"`

**Error Path:** `o:errorPath: "apply"`

### Root Cause Identified

**GAP-NS-APPLY-REFNUM-001:** The `refnum` field was being added to VendorPayment apply sublist items, but this field is **not valid** for the NetSuite REST API.

**Evidence:**
1. `expense_report_payments.ex` (WORKS) does NOT include `refnum` in apply items
2. `ap_payments.ex` (FAILS) included `refnum` via `add_field("refnum", app[:reference] || app["reference"])`
3. NetSuite REST API documentation does not list `refnum` as a settable field on apply sublist
4. The `refnum` is a READ-ONLY display field that NetSuite populates automatically

### Committee Decision

**UNANIMOUS VOTE (11-0): Remove `refnum` field from apply items**

**Participating Members:**
- Sync Architect
- NetSuite Domain Expert
- Data Mapping Specialist
- Edge Case Hunter
- Accounts Payable Expert
- Test Coverage Analyst
- Standards Enforcer
- Code Fidelity Auditor
- End User Advocate
- Finance Operations Generalist
- Path Defender

### Resolution: GAP-NS-APPLY-REFNUM-001 FIXED

| File | Change |
|------|--------|
| `ap_payments.ex` | Removed `add_field("refnum", ...)` from `build_apply_items/1` function |

**Before:**
```elixir
Enum.map(applications, fn app ->
  %{
    "doc" => build_record_ref(app[:bill_external_id] || app["bill_external_id"]),
    "apply" => true,
    "amount" => format_amount_as_number(app[:amount] || app["amount"])
  }
  |> add_field("refnum", app[:reference] || app["reference"])
end)
```

**After:**
```elixir
Enum.map(applications, fn app ->
  %{
    "doc" => build_record_ref(app[:bill_external_id] || app["bill_external_id"]),
    "apply" => true,
    "amount" => format_amount_as_number(app[:amount] || app["amount"])
  }
end)
```

### Key Knowledge Acquired

1. **NetSuite VendorPayment Apply Sublist Fields:**
   - `doc` — Record reference to the bill being paid (required)
   - `apply` — Boolean to mark line as applied (required)
   - `amount` — Payment amount for this line (required)
   - `refnum` — **READ-ONLY** display field, NOT settable via API

2. **Pattern Consistency:**
   - `expense_report_payments.ex` uses only `doc`, `apply`, `amount` — WORKS
   - `ap_payments.ex` was adding `refnum` — FAILED
   - All VendorPayment apply sublists should follow the same pattern

3. **Expense Reports vs Bills:**
   - Expense Reports have a `complete` flag (can be marked as paid at creation)
   - Bills do NOT have a `complete` flag (must create VendorPayment to mark as paid)
   - Both use VendorPayment for payment linking

---

## Previous Session

- **Session ID:** SC-2026-01-18-001
- **Status:** ⏸️ PAUSED (superseded by SC-2026-01-19-001)
- **Turn:** 1
- **Started:** 2026-01-18
- **Focus:** NetSuite Project/Customer Invalid Field Value Error — Root Cause Analysis
- **Human Request:** Investigate why NetSuite rejects expense report with "Invalid Field Value 53384 for the following field: customer"

### Investigation Summary

**Error:** `Invalid Field Value 53384 for the following field: customer`

**Findings via SuiteQL:**
- Job 53384 is ACTIVE (`isinactive = 'F'`)
- Job 53384 allows expenses (`allowexpenses = 'T'`)
- Job 53384 is in subsidiary 6 (Euro Sub) — matches expense report
- Employee 75509 is in subsidiary 6 — matches
- Parent customer 53379 is in subsidiary 6 — matches

**Key Difference:** Job 53384 has `entitystatus = 5` ("Won") while other jobs have status 2 ("In Progress") or NULL.

**Hypothesis:** The "Won" project status may restrict new expense transactions in NetSuite.

### Pending Actions

1. [ ] Verify in NetSuite UI if job 53384 can be manually assigned to expense report
2. [ ] Check Project Status configuration in NetSuite (`Setup > Project > Project Status`)
3. [ ] Test with job 53385 (no status set) to confirm hypothesis

### Knowledge Captured

- Added "How to Execute SuiteQL Queries" to `shared_context.md` permanent knowledge
- Added investigation findings to current session context

---

## Previous Session

- **Session ID:** SC-2026-01-16-010
- **Status:** ✅ DOCUMENTED
- **Turn:** 4
- **Started:** 2026-01-16
- **Closed:** 2026-01-17
- **Focus:** Dimension-Subsidiary Filtering Architecture — Root Cause Analysis & Permanent Fix
- **Human Request:** Comprehensive documentation of how dimensions, vendors, and GL accounts are filtered by subsidiary in NetSuite OneWorld.

### Resolution: SC-2026-01-16-008 DOCUMENTED

**Problem Found:** Multiple layers of filtering bugs causing "Invalid Field Value" errors when pushing to NetSuite:
1. Vendor filtering used wrong field (`ApVendor.entity_id` instead of `ErpVendor.entity_ids`)
2. GL account filtering in transactions wasn't using `entity_ids`
3. Bank Mapping wasn't filtering by account type (AcctPay for AP Control)
4. Parent LiveView wasn't loading/passing `ap_accounts` to BankMappingTab
5. Ash fragment() syntax unreliable for complex array queries

**Fixes Applied:**

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Added `get_ap_accounts_for_subsidiary/3` for AcctPay accounts |
| `account_mapping_service.ex` | Changed to in-memory filtering (more reliable than Ash fragment) |
| `erp_live.ex` | Added `ap_accounts` loading in `load_tab_data(:bank_mapping)` |
| `erp_live.ex` | Added `ap_accounts={@ap_accounts}` to BankMappingTab component |
| `bank_mapping_tab.ex` | Added `@ap_control_items` constant and account type selection logic |
| `transactions_live.ex` | Added `entity_ids` filtering to `filter_gl_by_expense_type/3` |
| `TransactionQueryService` | Fixed vendor filtering to use `erp_vendor.entity_ids` |
| `push_card_spend_reactor.ex` | Added `check_gl_account_entity_ids_directly/4` fallback |

**Architecture Documentation:** Added comprehensive architecture diagram and tables to `shared_context.md`

---

## Previous Session

- **Session ID:** SC-2026-01-16-009
- **Status:** ✅ RESOLVED
- **Turn:** 1
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Coding Status Not Updating After First Sync — Missing coding_category_id on DimensionTypeConfig
- **Human Request:** After completing ERP sync and clicking "Continue" on Dimensions tab without making changes, UpdateCodingStatus fails to recognize filled dimensions. All 5 CodingAssignments show "No DimensionTypeConfig found for category".

### Resolution: GAP-CODING-STATUS-008 FIXED

**Problem Found:** When user clicks "Continue" on the Dimension Mapping tab without making any changes, `save_tab_data(:dimension_mapping)` was not populating `DimensionTypeConfig.coding_category_id` because:
1. UI state had `coding_category_id = nil` (never extracted from DB after sync)
2. Code fell back to `set_type_enabled` which does NOT set the FK
3. `UpdateCodingStatus.load_dimension_type_config_lookup/1` filters for `not is_nil(coding_category_id)` → returns empty map
4. All CodingAssignments fail to match → coding_status = `:needs_review`

**Root Cause:** The save logic expected `coding_category_id` to be in the UI state, but when user makes no changes, the UI state comes from `build_dimension_data_with_bridge` which may not always populate it.

**Fix Applied:**

| File | Change |
|------|--------|
| `erp_live.ex` | Added `lookup_coding_category_id/3` helper function |
| `erp_live.ex` | Modified `save_tab_data(:dimension_mapping)` to look up `coding_category_id` from CodingCategory table when missing |

**Logic:**
```elixir
# If coding_category_id is nil but this is a standard dimension,
# look it up from CodingCategory table
coding_category_id =
  if is_nil(coding_category_id) and ui_type not in [:vendor, :customer] do
    lookup_coding_category_id(connection_id, ui_type, workspace_id)
  else
    coding_category_id
  end
```

**Result:** DimensionTypeConfig now always has `coding_category_id` set for standard dimensions after saving the Dimension Mapping tab, even when user makes no changes.

---

## Previous Session

- **Session ID:** SC-2026-01-16-008
- **Status:** ✅ RESOLVED
- **Turn:** 3
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** CardHolder ↔ User ↔ Employee Architecture — Multi-Workspace Card Visibility
- **Human Request:** Review the architectural decision to remove `user_id` from CardHolder (GAP-UER-003). Specifically: When a User is linked to multiple Workforces/Entities via IdentityBinding, what happens when they want to see their cards? With `user_id` removed from CardHolder and the link now going through Employee, is cross-workspace card visibility working correctly?

### Resolution: GAP-UER-MIGRATION-001 FIXED

**Problem Found:** Employee.user_id was never populated! All 26 employees had `user_id = NULL` despite having IdentityBindings. This broke the ExpenseCard policy check `card_holder.employee.user_id == ^actor(:id)`.

**Root Cause:** The Phase 1 migration added the `user_id` column to Employee but:
1. The data backfill from IdentityBinding was never run
2. The seed script didn't set `user_id` when creating employees

**Fix Applied:**

| File | Change |
|------|--------|
| `employee.ex` | Added `:user_id` to `create_manual` action accept list |
| `03_workforce.exs` | Added `user_id: user.id` when creating employees |
| `03_workforce.exs` | Added backfill SQL to populate `user_id` from IdentityBinding |
| `operations_bar.ex` | Added nil guard to `get_user_field/2` |

**Data Result:**
- Before: 0/26 employees with user_id
- After: 24/26 employees with user_id (2 have no IdentityBinding)
- 25 ExpenseCards now have valid policy path

### Background

**Commit:** `652f41eeb` by `adrian-cam-rgz <acamacho@paystand.com>` on 2026-01-15  
**Change:** Removed `user_id` and `holder_type` from CardHolder; made `employee_id` required  
**Rationale (GAP-UER-003):** Consolidate identity to single source of truth (`Workforce.Employee`)

### Human Director Concern

> "With the IdentityBinding, if we can be a user that is in multiple workforces, what will happen when we want to see our cards?"

### Current Architecture

```
Identity.User (Global - one per person)
       │
       │ 1:many
       ▼
IdentityBinding (Per-Workspace)
• status: :active | :suspended | :terminated
       │
       │ 1:1
       ▼
Workforce.Employee (Per-Entity within Workspace)
       │
       │ 1:1
       ▼
CardHolder (Per-Entity - links to Employee)
       │
       │ 1:many
       ▼
ExpenseCard (The actual cards)
```

### Key Questions for Committee

1. **Query Path**: How does `ExpenseCard` query work when user wants to see "my cards"?
2. **Cross-Workspace**: Can a user see cards from ALL their workspaces, or only the active one?
3. **Policy Check**: Does `card_holder.employee.user_id == ^actor(:id)` traverse correctly?
4. **Performance**: Is the 3-hop join (Card → CardHolder → Employee → User) efficient?
5. **Edge Cases**: What if Employee has no IdentityBinding? What if binding is suspended?

---

## Previous Session

- **Session ID:** SC-2026-01-16-005
- **Status:** ✅ CLOSED
- **Turns:** 1
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Audit Logging for Employee Push to NetSuite
- **Human Request:** Add audit logs when employees are pushed to NetSuite, 1 log per batch (not per employee)

### Implementation Summary

**SC-2026-01-16-005: Batch Audit Logging for Employee Push**

| File | Change |
|------|--------|
| `erp_employee_orchestrator.ex` | Added `AuditLogger` alias |
| `erp_employee_orchestrator.ex` | Added `create_employee_push_audit_log/3` helper |
| `erp_employee_orchestrator.ex` | Added audit log call in `sync_and_link_employees/4` |

### Audit Log Format

A single audit log is created per batch with:

| Field | Value |
|-------|-------|
| `resource` | `:erp_employee_sync` |
| `resource_id` | ERP Connection ID |
| `action` | `:push_employees_batch` |
| `action_label` | "Employees Pushed to ERP" |
| `message` | "Pushed X employee(s) to netsuite" |

### Metadata Captured

```elixir
%{
  "erp_provider" => "netsuite",
  "erp_connection_id" => "...",
  "batch_summary" => %{
    "total_processed" => 10,
    "already_linked" => 2,
    "newly_linked" => 3,
    "pushed" => 4,
    "failed" => 1
  },
  "pushed_emails" => ["john@example.com", ...],  # up to 50
  "failed_emails" => ["jane@example.com", ...],  # up to 50
  "failed_reasons" => [%{"email" => "...", "error" => "..."}]  # up to 20
}
```

---

## Archived Session

- **Session ID:** SC-2026-01-15-003
- **Status:** PAUSED (pending CardHolder architecture review)
- **Turn:** 2
- **Started:** 2026-01-15
- **Focus:** SOAP-Only File Upload & Attachment Architecture — Eliminate RESTlets/SuiteScripts
- **Human Request:** Design and implement file upload and attachment for expense reports (multiple files) and bills using SOAP Web Services only. RESTlets and SuiteScripts are non-negotiable exclusions.

### GAP-ATTACH-PERM-001: SOAP File Attachment to Expense Report Permission Error

**Error Message:**
```
You do not have permissions to set a value for element expenseReport due to one of the following reasons:
1) The field is read-only
2) An associated feature is disabled
3) The field is available either when a record is created or updated, but not in both cases
```

**Committee Investigation Findings:**

| Finding | Details |
|---------|---------|
| **Record Type** | ✅ Fixed — Now using `expenseReport` (camelCase) per NetSuite schema |
| **SOAP Version** | 2025_1 — Current and supported |
| **Attach Operation** | Using `AttachBasicReference` with correct element order |
| **File Upload** | ✅ Working — Files are successfully uploaded to File Cabinet |

**Root Cause Analysis:**

The error is a **NetSuite role/permission issue**, NOT a code issue. The SOAP request format is correct.

**Required NetSuite Role Permissions:**

| Permission | Tab | Level Required | Purpose |
|------------|-----|----------------|---------|
| **SOAP Web Services** | Setup | **Full** | Required for any SOAP operations |
| **Documents and Files** | Lists | **Edit** or **Full** | To upload files and attach to records |
| **Expense Reports** | Transactions | **Edit** or **Full** | To modify expense reports (attach files) |
| **Employees** | Lists | **View** or **Edit** | If using Employee-Specific Expense Folders |

**Additional Checks:**

1. **Enhanced File Security Feature** — If enabled in NetSuite (`Setup → Company → Enable Features → Company → Data Management`), expense report attachments go to employee-specific folders. The role must have access to those folders.

2. **Custom Form Configuration** — If a custom expense report form is used, ensure the "Files" subtab is visible and not restricted.

3. **Token-Based Authentication Role** — Verify the TBA token was created with a role that has ALL the above permissions. The token inherits the role's permissions.

**How to Verify in NetSuite:**

1. Go to `Setup → Users/Roles → Manage Roles`
2. Find the role used for the TBA integration
3. Check the following permission tabs:
   - **Setup tab**: SOAP Web Services = Full
   - **Lists tab**: Documents and Files = Edit or Full
   - **Transactions tab**: Expense Reports = Edit or Full

**Recommendation:**

Ask the NetSuite administrator to verify/add these permissions to the integration role:

```
Setup → Users/Roles → Manage Roles → [Your Integration Role]

Setup Tab:
  ✓ SOAP Web Services: Full

Lists Tab:
  ✓ Documents and Files: Edit (or Full)
  ✓ Employees: View (if using Employee-Specific Expense Folders)

Transactions Tab:
  ✓ Expense Reports: Edit (or Full)
```

**Note:** Bill attachments (`vendorBill`) are working because the role likely already has "Vendor Bills: Full" permission. Expense Reports need the same level of permission.

### Agenda

1. Review current implementation (hybrid SOAP + RESTlet)
2. Evaluate SOAP-only approach for file upload and attachment
3. Design multi-file attachment strategy for expense reports
4. Assess impact on bills (single receipt per transaction)
5. Identify gaps and implementation plan

### Human Director Clarifications (Turn 2)

1. **SOAP scope:** SOAP is ONLY for file upload and attachment. All other operations (expense reports, bills, payments) continue using REST API.
2. **Filename format:** Use `item-{line_number}-{original_filename}` for uniqueness
3. **Reliability requirement:** All files MUST be uploaded and attached reliably without requiring another push. No partial failures acceptable.

### Committee Decisions

| Decision | Vote | Outcome |
|----------|------|---------|
| SOAP-only for file upload/attachment | 11-0 | ✅ Approved |
| Filename: `item-{line}-{name}` for expense reports only | 11-0 | ✅ Approved |
| Folder: Hybrid (configured OR auto-create via SOAP) | 4-2 | ✅ Approved (Option C) |
| Implementation: SOAP first, then clean RESTlet | 11-0 | ✅ Approved (Option B) |

### Implementation Status

**Phase 1: Implement SOAP File Attachment** ✅ COMPLETE
- [x] Add `search_folder` to SoapClient
- [x] Add `create_folder` to SoapClient  
- [x] Create `FileAttachmentService` with retry logic
- [x] Update `NetSuiteFolderService` for hybrid approach

**Phase 2: Switch Reactors to SOAP** ✅ COMPLETE
- [x] Update `push_reimbursement_complete_reactor.ex` to use SOAP
- [x] Update `push_card_spend_reactor.ex` to use `FileAttachmentService`
- [ ] Integration testing (manual)

**Phase 3: Clean Up RESTlet Code** ✅ COMPLETE
- [x] Mark file-related functions as deprecated in `restlet_client.ex` (keep payment functions)
- [x] Update `erp_live.ex` to check SOAP credentials instead of RESTlet
- [x] Update `connection_tests.ex` to test SOAP file capability
- [x] Add deprecation notice to SuiteScript (keep payment code active)

### Files Created/Modified

| File | Change |
|------|--------|
| `soap_client.ex` | Added `search_folder/2`, `create_folder/2`, `create_expense_report_payment/2` |
| `file_attachment_service.ex` | **NEW** - Reliable file upload/attach with retry |
| `netsuite_folder_service.ex` | Rewritten for hybrid folder management via SOAP |
| `push_reimbursement_complete_reactor.ex` | Updated to use SOAP for file upload/attach |
| `push_card_spend_reactor.ex` | Updated to use `FileAttachmentService` |
| `restlet_client.ex` | File functions marked `@deprecated` (payment functions still active) |
| `erp_live.ex` | Updated to check SOAP credentials for file capability |
| `connection_tests.ex` | Updated to test SOAP file capability instead of RESTlet |
| `teampay_file_upload_restlet.js` | Added deprecation notice for file operations (v1.7.0) |
| `expense_report_payments.ex` | Updated to use SOAP as primary method (`@payment_mode :soap`) |

### Implementation Complete

**SOAP-Only Operations for Expense Reports:**

1. **File Upload** → `SoapClient.upload_file/2`
2. **File Attachment** → `SoapClient.attach_file/4`
3. **Folder Management** → `NetSuiteFolderService.get_or_create_receipts_folder/2`
4. **Expense Report Payment** → `SoapClient.create_expense_report_payment/2` ✅ NEW
5. **Retry Logic** → 3 attempts with exponential backoff
6. **Filename Format**:
   - Expense Reports: `item-{line}-{filename}`
   - Bills: `{filename}` (original)

**RESTlet Status:**
- File operations: **DEPRECATED** (use SOAP)
- Expense Report Payments: **DEPRECATED** (use SOAP) ✅ MIGRATED
- RESTlet can now be completely removed for expense report workflows

---

## Previous Session

- **Session ID:** SC-2026-01-16-007
- **Status:** ✅ APPROVED & IMPLEMENTED
- **Turns:** 3
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** AdmittedUser Audit & Removal from Main Flows
- **Human Request:** Ensure AdmittedUser is not used in any main flow (setup, operations, expense)

### Implementation Summary

**SC-2026-01-16-007: AdmittedUser Removal**

| Component | Change |
|-----------|--------|
| `email_lookup_service.ex` | Refactored to use Employee via IdentityBinding instead of AdmittedUser |
| `teams_user_import_service.ex` | Removed AdmittedUser.create calls |
| `slack_user_import_service.ex` | Removed AdmittedUser.create calls |

### Key Findings

1. **GAP-ADMITTED-LOGIN:** EmailLookupService was reading authentication_method from AdmittedUser
2. **GAP-ADMITTED-IMPORT:** Teams/Slack imports were creating orphaned AdmittedUser records
3. **All main flows verified:** Workforce Setup, Login, Expense App all use Employee

### Gaps Addressed

| Gap ID | Description | Status |
|--------|-------------|--------|
| GAP-ADMITTED-LOGIN | EmailLookupService uses AdmittedUser | ✅ FIXED |
| GAP-ADMITTED-IMPORT-TEAMS | Teams import creates orphaned AdmittedUser | ✅ FIXED |
| GAP-ADMITTED-IMPORT-SLACK | Slack import creates orphaned AdmittedUser | ✅ FIXED |

---

## Previous Session

- **Session ID:** SC-2026-01-16-006
- **Status:** ✅ APPROVED & IMPLEMENTED
- **Turns:** 3
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Identity.User Creation During Employee Invitation — Elliot's Model Compliance
- **Human Request:** Verify Identity.User is created when employees are invited; fix if not

### Implementation Summary

**SC-2026-01-16-006: Identity.User Creation Fix**

| Component | Change |
|-----------|--------|
| `workforce_live.ex` | Modified `send_user_invitation/4` to call `ProvisionEmployeeReactor` |
| `provision_employee_reactor.ex` | Added Step 5: `link_employee_to_user` — Sets `Employee.user_id` |

### Key Findings

1. **GAP-PROVISION-001:** `ProvisionEmployeeReactor` existed but was NEVER CALLED from invitation flow
2. **User Creation Timing:** Identity.User was only created at first login, not at invitation
3. **Fix Applied:** Integrated reactor into `send_user_invitation/4` to create user during invitation

### Gaps Addressed

| Gap ID | Description | Status |
|--------|-------------|--------|
| GAP-PROVISION-001 | Identity.User not created during invitation | ✅ FIXED |
| GAP-ADMITTED-001-005 | AdmittedUser still used by import services | ✅ FIXED (SC-2026-01-16-007) |

---

## Previous Session

- **Session ID:** SC-2026-01-16-005
- **Status:** ✅ APPROVED & CLOSED
- **Turns:** 4
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Elliot's Identity Model Compliance Review — Employee/Identity/ERP Separation
- **Human Request:** Review current implementation against Elliot's strict identity model; keep IdentityBinding; remove User Profile ERP self-service features

### Implementation Summary

**SC-2026-01-16-005: Identity Model Compliance**

| Decision | Action |
|----------|--------|
| Keep IdentityBinding | Cancelled Phase 4 of User/Employee Refactoring |
| Remove User Profile ERP | Removed ~350 lines from `user_profile_edit_live.ex` |
| Admin-controlled ERP sync | Verified existing flow in `workforce_live.ex` |

### Key Findings

1. **IdentityBinding Required:** Authentication reactors (`authenticate_with_oauth_reactor.ex`, `authenticate_with_magic_link_reactor.ex`) check `IdentityBinding.status` for access control
2. **Admin Flow Exists:** `workforce_live.ex` → `sync_invited_employees_to_erp/4` → `ErpEmployeeOrchestrator.sync_employees_for_workspace/3`
3. **GAP-IDENT-GOV-001 (Deferred):** `TerminateEmployeeReactor` sets `User.active = false` (redundant, but not critical due to binding status check)

### Gaps Addressed

| Gap ID | Description | Status |
|--------|-------------|--------|
| GAP-ERP-SELF-CREATE-001 | User Profile ERP self-service features | ✅ REMOVED |
| GAP-PHASE4-CONFLICT | Documentation conflict about IdentityBinding removal | ✅ FIXED |
| GAP-IDENT-GOV-001 | Workforce governs Identity via User.active | ⏸️ DEFERRED |
| GAP-ERP-NOTIFY-001 | Missing admin notification for auto-created ERP employees | ⏸️ DEFERRED |

---

## Archived Session

- **Session ID:** SC-2026-01-16-004
- **Status:** ✅ CLOSED
- **Turns:** 3
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Bulk Employee Push Utility Function
- **Human Request:** Create a utility function where a list of WorkforceEmployee records are pushed to NetSuite, saving the NetSuite response data locally

### Implementation Summary

**SC-2026-01-16-004: Bulk Employee Push with NetSuite Data Persistence**

| File | Change |
|------|--------|
| `netsuite/capabilities/push/employees.ex` | Added `netsuite_data: record` to push result — full NetSuite response now returned |
| `erp_employee_orchestrator.ex` | Added `sync_and_link_employees/4` — single entry point for full sync workflow |
| `erp_employee_orchestrator.ex` | Added `push_employees_bulk/4` — bulk push with fail-soft error handling |
| `erp_employee_orchestrator.ex` | Enhanced `create_local_erp_employee` — uses NetSuite response data for local record |
| `erp_employee_orchestrator.ex` | Added helpers: `get_netsuite_field/2`, `get_netsuite_ref_value/2`, `load_erp_employees_by_email/2` |
| `user_provisioning_service.ex` | Integrated ERP sync into `provision_and_invite/3` — automatically syncs to NetSuite after provisioning |

### API Reference

```elixir
# HIGH-LEVEL: Sync all employees (link existing + push new)
{:ok, summary} = ErpEmployeeOrchestrator.sync_and_link_employees(
  all_workforce_employees,  # Full list of WorkforceEmployee records
  erp_connection,           # ErpConnection struct
  workspace_id,             # Workspace UUID
  subsidiary_id: "1",       # Optional: NetSuite subsidiary
  currency_id: "1"          # Optional: NetSuite currency
)

# Summary format
%{
  already_linked: 10,       # Were already linked before
  newly_linked: [...],      # Linked to existing ERP employees by email match
  pushed: [...],            # Pushed to NetSuite (new records created)
  failed: [...],            # Failed to push
  total_processed: 25,
  total_now_linked: 23
}

# LOW-LEVEL: Push only (no linking step)
{:ok, results} = ErpEmployeeOrchestrator.push_employees_bulk(
  workforce_employees,  # List of WorkforceEmployee records
  erp_connection,       # ErpConnection struct
  workspace_id,         # Workspace UUID
  subsidiary_id: "1",   # Optional: NetSuite subsidiary
  currency_id: "1"      # Optional: NetSuite currency
)
```

### Key Design Decisions

1. **Fail-Soft** — Continues on error, collects all results (no fail-fast)
2. **NetSuite Data Persistence** — Full NetSuite response saved to `erp_metadata.netsuite_response`
3. **Field Extraction** — Uses NetSuite response fields when available, falls back to WorkforceEmployee data
4. **No Extra API Call** — Uses existing `return=representation` header, no sync needed

### Fields Extracted from NetSuite Response

| ErpEmployee Field | NetSuite Keys Checked |
|-------------------|----------------------|
| `first_name` | `firstName`, `first_name` |
| `last_name` | `lastName`, `last_name` |
| `email` | `email` |
| `phone` | `phone`, `mobilePhone` |
| `employee_number` | `entityId`, `employeeNumber` |
| `department_code` | `department.refName` or `department.id` |
| `location_code` | `location.refName` or `location.id` |

---

## Archived Session

- **Session ID:** SC-2026-01-16-003
- **Status:** ✅ CLOSED
- **Turns:** 4
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Workforce Setup Dev Button — Push Employee to NetSuite
- **Human Request:** Add a dev button to workforce setup that allows pushing a selected employee to NetSuite

### Implementation Summary

**SC-2026-01-16-003: Workforce Dev Utilities**

Created a new dev utilities component for the workforce setup page that allows pushing employees to NetSuite.

| File | Change |
|------|--------|
| `components/expense_v2/setup/workforce/dev_utilities.ex` | **NEW** — Dev utilities LiveComponent with "Push to NetSuite" functionality |
| `live/expense_v2/setup/workforce_live.ex` | Added dev utilities component to page header |

### How It Works

1. The dev button appears in the workforce setup header (dev mode only)
2. Click "Dev" → Select "Push to NetSuite"
3. Select an employee from the dropdown
4. Click "Push to NetSuite"
5. The orchestrator handles: adapter call → local ErpEmployee creation → workforce linking

### Key Integration Points

- Uses existing `ErpEmployeeOrchestrator.create_and_link/4` — no new push logic needed
- Uses `employees.ex` push capability for NetSuite API calls
- Automatically gets configured subsidiary from EntityMapping

---

## Archived Session

- **Session ID:** SC-2026-01-16-002
- **Status:** ✅ CLOSED
- **Turns:** 4
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** ERP Setup Bank Mapping UI — Hide Unused Account Fields
- **Human Request:** Hide unused bank mapping fields, show only: Clearing account for bills, ACH funding account, Check funding account, Employee reimbursement account

### Implementation Summary

**SC-2026-01-16-002: Bank Mapping UI Simplification**

| File | Change |
|------|--------|
| `account_mapping.ex` | Added `:employee_reimbursement_account` to configuration_item constraint |
| `account_mapping_service.ex` | Added `:employee_reimbursement_account` to `@configuration_items` |
| `bank_mapping_tab.ex` | Added `@visible_mappings` filter to show only 4 items, added employee reimbursement mapping |

### Visible Account Mappings

| ID | Display Name |
|----|--------------|
| `:teampay_ap_control` | Clearing Account for Bills |
| `:ach_funding_account` | ACH Funding Account |
| `:check_funding_account` | Check Funding Account |
| `:employee_reimbursement_account` | Employee Reimbursement Account |

### Hidden (but preserved) Mappings

- `:good_funds_card_funding`
- `:good_funds_card_balance`
- `:wire_funding_account`
- `:wire_clearing_account`
- `:unclassified_payments`
- `:ap_payment_fees`
- `:uncategorized_card_account`

---

## Archived Session

- **Session ID:** SC-2026-01-16-001
- **Status:** ✅ CLOSED
- **Turns:** 4
- **Started:** 2026-01-16
- **Closed:** 2026-01-16
- **Focus:** Unified Bank Account Resolution Service
- **Human Request:** Create a unified function for resolving bank accounts (ACH, Check, AP Control) from configuration

### Implementation Summary

**GAP-BANK-RESOLVE-001: Unified Bank Account Resolution**

Added `resolve_bank_account/3` to `AccountMappingService` that works with ANY configuration item (not just funding accounts).

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Added `resolve_bank_account/3` — resolves any config item to GL Account external_id |
| `push_card_spend_reactor.ex` | Refactored `get_ap_control_account/2` to use the new service function |

### API Reference

```elixir
# Resolve AP control account (for card transactions)
{:ok, external_id} = AccountMappingService.resolve_bank_account(
  erp_connection_id,
  :teampay_ap_control,
  workspace_id: workspace_id
)

# Resolve ACH funding account
{:ok, external_id} = AccountMappingService.resolve_bank_account(
  erp_connection_id,
  :ach_funding_account,
  workspace_id: workspace_id
)

# Resolve check funding account
{:ok, external_id} = AccountMappingService.resolve_bank_account(
  erp_connection_id,
  :check_funding_account,
  workspace_id: workspace_id
)
```

### Two Functions Now Available

| Function | Works With | Has Fallback? | Use Case |
|----------|------------|---------------|----------|
| `resolve_bank_account/3` | ALL config items | ❌ No | AP control, clearing accounts, any mapping |
| `resolve_funding_account/3` | Funding items only | ✅ Yes (BankAccount) | Payment funding (ACH, Wire, Check) |

### Key Design Decisions

1. **No Fallback** — `resolve_bank_account/3` returns `{:error, :not_configured}` if no mapping exists (unlike `resolve_funding_account/3` which falls back to BankAccount)
2. **All Config Items** — Works with any item in `@configuration_items`, not just funding accounts
3. **Code Elimination** — Removed 40 lines of duplicated logic from `push_card_spend_reactor.ex`

---

## Archived Session

- **Session ID:** SC-2026-01-15-002
- **Status:** ✅ CLOSED
- **Turns:** 15
- **Started:** 2026-01-15
- **Closed:** 2026-01-15
- **Focus:** NetSuite User Linking Architecture — Production-Ready Employee Resolution
- **Human Request:** Review and design the correct approach for pushing to NetSuite without requiring manual employee linking workaround (dev tool)

### Problem Statement

**GAP-EMP-LINK-001: Manual Employee Linking Required for NetSuite Push**

**Root Cause:** The current implementation requires a FK relationship (`erp_employee_id`) from Workforce Employee to ERP Employee BEFORE a push can succeed.

### Solution Implemented

**User Profile ERP Account Configuration**

Added a user-facing ERP Account section to the User Profile page (`/expense/profile`) that allows users to:
1. **Create Account** - Create a new employee record in the ERP (primary action)
2. **Link Existing Account** - Connect to an existing ERP employee record

### Implementation Summary

| Phase | File | Change |
|-------|------|--------|
| **1** | `netsuite/adapter.ex` | Added `:employee` to push capabilities |
| **2** | `erp_employee_orchestrator.ex` | NEW: Provider-agnostic orchestrator service |
| **3** | `user_profile_edit_live.ex` | Added ERP Account card, modals, event handlers |
| **4** | `ADR-ERP-EMP-001.md` | NEW: Architecture Decision Record |

### Bugs Fixed (Turns 11-14)

| Turn | Issue | Fix |
|------|-------|-----|
| 11 | ERP card not showing | Fixed `ErpConnection` field names (`status` not `state`) |
| 12 | `Ash.CiString` render error | Wrapped with `to_string()` |
| 12 | UI showed "NetSuite" | Changed to generic "ERP" |
| 13 | `KeyError: :realm` | Used `NetSuite.Config.build_config/1` |
| 14 | Missing subsidiary/currency | Load from configured EntityMapping |

### Key Design Decisions

1. **Provider-Agnostic** - `ErpEmployeeOrchestrator` works with any ERP that supports `push: :employee`
2. **Capability-Based** - Only shows when `adapter.supports_capability?(:push, :employee)` returns true
3. **Pattern Following** - Follows `EmployeeRecipientOrchestrator` (Dwolla) pattern
4. **No Hardcoding** - Provider names and requirements are dynamic
5. **Config from EntityMapping** - Uses pre-configured subsidiary from ERP setup wizard

### API Reference

```elixir
# Check if feature available
ErpEmployeeOrchestrator.supports_employee_creation?(erp_connection)

# Get configured subsidiary with currency
ErpEmployeeOrchestrator.get_configured_subsidiary_with_currency(erp_connection, workspace_id)

# Get link status
ErpEmployeeOrchestrator.get_link_status(workforce_employee, erp_connection, workspace_id)

# Link to existing
ErpEmployeeOrchestrator.link_existing(workforce_employee, erp_employee_id, workspace_id)

# Create and link
ErpEmployeeOrchestrator.create_and_link(workforce_employee, [subsidiary_id: "1", currency_id: "2"], erp_connection, workspace_id)
```

---

## Archived Session

- **Session ID:** SC-2026-01-15-001
- **Status:** IMPLEMENTATION_COMPLETE
- **Turn:** 7
- **Started:** 2026-01-15
- **Focus:** Reimbursement Payment Push Failure + Separate Vendor Reactor + GL Account Filtering
- **Human Request:** 
  1. Investigate why reimbursement payment push fails with "Expense report not found in apply sublist"
  2. Create separate reactor for vendor updates (architectural improvement)
  3. Investigate and fix invalid GL Account error on bill push (Turn 6-7)

### GAP-ACCT-LINE-002: Invalid GL Account on Bill Push ✅ FIXED

**Problem:** NetSuite bill push fails with:
```
Invalid Field Value 2 for the following field: account
```

**Root Cause Analysis (Turn 6-7):**

The `transactions_live.ex` GL account dropdown was NOT filtering by `account_type`. This allowed users to select:
- Bank accounts (ID 2 = "Checking Account")
- Accounts Receivable
- Other non-expense account types

NetSuite vendor bill expense lines can ONLY accept expense-type GL accounts.

**End-to-End Flow Traced:**

| Phase | Component | Issue Found? |
|-------|-----------|--------------|
| Sync | gl_account_mapper.ex | ✅ Correctly classifies account_type |
| Bridge | dimension_bridge_service.ex | ✅ Correctly bridges entity_ids |
| **UI Display** | **transactions_live.ex** | ❌ **MISSING account_type filter!** |
| Push | push_card_spend_reactor.ex | ✅ Correctly uses external_id |

**Comparison with other modules:**

| Module | Has account_type filtering? |
|--------|----------------------------|
| transaction_detail_live.ex | ✅ YES |
| requests_live.ex | ✅ YES |
| **transactions_live.ex** | ❌ **NO** (before fix) |

**Fix Applied:**

| File | Changes |
|------|---------|
| `transactions_live.ex` | Added `is_gl_account_category?/1` and `filter_gl_by_expense_type/2` helper functions |
| `transactions_live.ex` | Added expense-type filtering after search filter in `load_coding_dimension_lazy_with_codes/6` |

**Filter Logic:**
```elixir
# Only include accounts where:
# - account_type in [:expense, :other]  (valid for expense lines)
# - posting_type == :posting            (not summary/statistical)
# - active == true                      (not deleted/inactive)
```

**Accounts Now Excluded from GL Dropdown:**
- Bank accounts (:asset)
- Accounts Receivable (:asset)
- Accounts Payable (:liability)
- Credit Card (:liability)
- Equity accounts (:equity)
- Revenue/Income accounts (:revenue)
- Summary/parent accounts (posting_type: :summary)
- Statistical accounts (posting_type: :statistical)

**Additional Fix (Turn 6):** Improved user-friendly error messages in UI tooltip.

---

### GAP-VENDOR-REACTOR-001: Separate SetTransactionVendorReactor ✅ IMPLEMENTED

**Problem:** Vendor updates were mixed with general coding updates in `UpdateTransactionCodingReactor`, leading to:
- Mixed concerns (vendor assignment + coding dimensions)
- No dedicated audit trail for vendor changes
- Vendor-dependent coding rules not consistently re-applied
- Bulk vendor operations couldn't be optimized

**Committee Discussion (Turn 4):**

| Member | Position | Rationale |
|--------|----------|-----------|
| **Sync Architect** | ✅ Approve Option B | Clear reactor boundaries, vendor logic reusable |
| **Path Defender** | ✅ Approve Option B | Many call sites are vendor-only; separation reduces complexity |
| **End User Advocate** | ✅ Approve Option B | Must keep synchronous behavior for UX |

**Decision:** Create dedicated `SetTransactionVendorReactor` with:
- Vendor assignment with proper audit trail
- Re-application of coding rules (vendor-dependent rules)
- Coding status update after auto-coding
- Full observability (Tempo, Loki, Prometheus)

**Files Created/Modified:**

| File | Changes |
|------|---------|
| `set_transaction_vendor_reactor.ex` | **NEW** — Dedicated reactor with 6 steps: get_transaction → set_vendor → audit_vendor_change → apply_coding_rules → audit_coding_rules → update_coding_status |
| `transaction_detail_live.ex` | Updated `update_vendor` handler to use new reactor |
| `transactions_live.ex` | Updated `select_vendor`, `apply_vendor_to_selected`, `clear_vendor`, and inline vendor edit to use new reactor |

**Reactor Steps:**

```
SetTransactionVendorReactor
├── 1. get_transaction (load with card_transaction, vendor)
├── 2. set_vendor (set/clear vendor, emit metrics)
├── 3. audit_vendor_change (create audit entry for vendor change)
├── 4. apply_coding_rules (re-apply vendor-dependent coding rules)
├── 5. audit_coding_rules (create audit entry for auto-coded dimensions)
└── 6. update_coding_status (recalculate coding status)
```

**Audit Trail Events:**
- `set_vendor` — Vendor Updated (blue, hero-building-storefront)
- `apply_coding_rules` — Auto-Coded (emerald, hero-sparkles)

**Committee Vote:** APPROVED by Human Director

---

### GAP-COMPLETE-001: `complete: true` Prevents Payment Creation (RE-APPLIED)

**Problem:** When pushing a reimbursement to NetSuite, the expense report was created successfully, but the subsequent payment creation via RESTlet failed with:

```
EXPENSE_REPORT_NOT_FOUND: Expense report not found in apply sublist. 
Ensure it is approved, has an open balance, and the employee ID matches the expense report submitter.
```

**Root Cause:** We were setting `complete: true` on the expense report push, which tells NetSuite the expense report is **already paid/reimbursed**. This closes the balance, so the expense report doesn't appear in the apply sublist when we try to create a payment!

**Evidence from logs:**
- Expense report created successfully with ID 622267
- Status: "Approved by Accounting" 
- `complete: true` was set
- `lineCount: 0` and `availableDocs: []` in RESTlet response (nothing to pay!)

**Additional Evidence (Turn 5):**
- Entity link shows `/contact/19100` instead of `/employee/19100` (potential type mismatch)
- Error "All expense lines are missing required 'category' field" (fallback category 18 was used)
- Error "No active expense accounts found in NetSuite" (warning only)

**Fix Applied (Turn 3, re-applied Turn 5 with diagnostics):**

| File | Change |
|------|--------|
| `expense_reports.ex` | Modified `add_complete_flag/2` to NEVER set `complete: true` |
| `expense_reports.ex` | Added diagnostic log: `SC-2026-01-15-001: NOT setting complete=true` |
| `expense_reports.ex` | Modified `add_accounting_approval/2` to ALWAYS set `accountingApproval: true` |
| `push_reimbursement_complete_reactor.ex` | Changed `complete: true` to `complete: false` in data |

**Verification Log Messages:**
When the new code is loaded, you should see:
```
[NetSuite Push] ExpenseReports - SC-2026-01-15-001: NOT setting complete=true (was: true)
[NetSuite Push] ExpenseReports - This allows the expense report to have an open balance for payment
```

If you still see `Setting 'complete: true'`, the server was NOT restarted.

**Behavior After Fix:**
- Expense report pushed with `approvalstatus: 2` (Approved) + `accountingApproval: true`
- Expense report has an **open balance** (not marked as complete)
- Payment creation via RESTlet should find the expense report in apply sublist
- Payment will mark the expense report as complete automatically

**Human Director Note:**
If error persists after restart, investigate the entity type mismatch (Contact vs Employee).

---

## Previous Session

- **Session ID:** SC-2026-01-14-002
- **Status:** IMPLEMENTATION_COMPLETE
- **Turn:** 3
- **Started:** 2026-01-14
- **Focus:** Disabled Dimension Types Pushed to ERP — Push sends dimensions even when disabled in DimensionTypeConfig
- **Human Request:** NetSuite rejecting bill push with "Invalid Field Value 1514 for the following field: customer" even though Project/Customer dimension is disabled in setup

### Gap Identified & Fixed

**GAP-DIM-PUSH-001: Push Reactor Sends Disabled Dimensions to ERP**

| Attribute | Value |
|-----------|-------|
| Severity | HIGH |
| Root Cause | `extract_header_dimensions/2` and `extract_dimensions_from_assignments/1` in `push_card_spend_reactor.ex` read CodingAssignments without checking if dimension type is enabled in `DimensionTypeConfig` |
| Fix Applied | Added filtering by enabled dimension types from DimensionTypeConfig |
| Strategy | Safety net — filter at push time, ignore disabled dimensions |

### Implementation Details

| File | Changes |
|------|---------|
| `push_card_spend_reactor.ex` | Added `DimensionTypeConfig` alias |
| `push_card_spend_reactor.ex` | Added `get_enabled_dimension_types/2` helper to query enabled dimensions |
| `push_card_spend_reactor.ex` | Modified `extract_header_dimensions/2` to filter by enabled types |
| `push_card_spend_reactor.ex` | Modified `extract_dimensions_from_assignments/2` to accept and filter by enabled types |
| `push_card_spend_reactor.ex` | Modified `extract_dimensions_from_metadata/2` to accept and filter by enabled types |
| `push_card_spend_reactor.ex` | Added `maybe_put_if_enabled/5` and `maybe_put_if_enabled/6` helpers |

**Fix Logic:**
1. Query `DimensionTypeConfig` for enabled dimension types via `get_enabled_dimension_types/2`
2. In `extract_header_dimensions/2`, only include dimensions where type is in enabled set
3. In `extract_dimensions_from_assignments/2`, only include dimensions where type is in enabled set
4. In `extract_dimensions_from_metadata/2`, only include dimensions where type is in enabled set
5. Fail open on error (allow all dimensions) to avoid blocking users

**Committee Vote:** APPROVED by Human Director

### Future Consideration

The committee recommends a follow-up task to:
1. Prevent creation of CodingAssignments for disabled dimensions (proactive)
2. Clean up existing CodingAssignments when dimension is disabled

This is deferred for now; the current fix provides a safety net for push operations.

---

## Previous Session

- **Session ID:** SC-2026-01-14-001
- **Status:** COMPLETED
- **Turn:** 6
- **Started:** 2026-01-14
- **Focus:** Unified Funding Account Resolution + Expense Category Fix
- **Human Request:** Factorize payment method detection / funding account resolution into a single `resolve_funding_account` function; Fix expense category resolution

### Design Approved (Turn 3)

**GAP-FUNDING-001: Unified Funding Account Resolution**

Human Director approved creating a unified `resolve_funding_account/3` function in `AccountMappingService` to:
1. Support explicit configuration item calls (`:ach_funding_account`, `:wire_funding_account`, `:check_funding_account`)
2. Support payment method auto-routing via `:auto` atom
3. Always fallback to BankAccount query

**Scope:** Funding accounts only (not control accounts like `:teampay_ap_control`)

**Design Decision:**
- Add `resolve_funding_account/3` to `AccountMappingService`
- Support two calling conventions: explicit config item AND payment method auto-routing
- Always apply BankAccount fallback for funding accounts
- Refactor `PushReimbursementCompleteReactor` to use the new service function
- Remove deprecated private functions from reactors

**Key Benefits:**
- Single source of truth for funding account resolution
- Eliminates code duplication across reactors
- Testable in isolation (service function vs reactor helper)
- Extensible for new payment methods

**Vote:** APPROVED by Human Director

### Implementation Completed (Turn 4)

| File | Changes |
|------|---------|
| `account_mapping_service.ex` | Added `resolve_funding_account/3` with `:auto` routing, `funding_config_items/0`, `payment_method_mapping/0`, and helper functions |
| `push_reimbursement_complete_reactor.ex` | Replaced `resolve_ach_funding_account/3` calls with `AccountMappingService.resolve_funding_account/3`, removed deprecated private functions (~160 lines), added `AccountMappingService` alias |

### Enhancement: User Payment Method Integration (Turn 5)

Human Director requested using the actual payment method selected by the user on the reimbursements page.

**Change:** Updated `PushReimbursementCompleteReactor` to read `payment.payment_method` from the `ReimbursementPayment` record and pass it to the auto-routing:

```elixir
# Now uses actual user selection from ReimbursementPayment.payment_method
user_payment_method = if payment, do: payment.payment_method, else: :ach

AccountMappingService.resolve_funding_account(
  erp_connection_id,
  :auto,
  workspace_id: workspace_id,
  entity_id: entity_id,
  payment_method: user_payment_method  # :ach, :wire, or :check
)
```

**Behavior:**
- If user selected ACH → resolves `:ach_funding_account`
- If user selected Wire → resolves `:wire_funding_account`
- If user selected Check → resolves `:check_funding_account`
- Falls back to `:ach` if no payment record exists (edge case)

**Payment Method Mapping:**
- `:ach` / `"ach"` → `:ach_funding_account`
- `:wire` / `"wire"` → `:wire_funding_account`
- `:check` / `"check"` → `:check_funding_account`

### Fix: Expense Category Resolution (Turn 6)

**GAP-EXPENSE-CAT-001: Expense Category Not Passed Correctly**

Human Director identified that expense categories might not be passed correctly in the push flow.

**Root Cause Analysis:**

The `resolve_expense_category_from_gl_account` function had two critical bugs:

1. **Missing `erp_connection_id` filter** — The ExpenseCategory query only filtered by `category_name` and `active`, which could return an ExpenseCategory from a different ERP connection in multi-ERP workspaces.

2. **Fragile name-based matching** — The function tried to match GL Account names to ExpenseCategory names, which often don't match (e.g., GL Account "5100 Travel" vs ExpenseCategory "Travel Expenses").

**Solution:**

Created new `resolve_expense_category_for_netsuite/3` function with improved resolution strategy:

1. **Direct external_id use** — If CodingValue has `erp_mirror_type == :expense_category`, use its `external_id` directly
2. **GL Account code matching** — If CodingValue is a GL Account, find ExpenseCategory by `gl_account_code` field
3. **Name fallback with erp_connection_id filter** — As last resort, try name matching but ALWAYS filter by `erp_connection_id`

**Files Modified:**

| File | Changes |
|------|---------|
| `push_reimbursement_complete_reactor.ex` | Added `erp_connection_id` parameter to `build_expense_report_data`, replaced `resolve_expense_category_from_gl_account` with new `resolve_expense_category_for_netsuite/3`, added `erp_connection_id` filter to all ExpenseCategory queries |

**Resolution Strategy:**

```elixir
# New resolution flow:
resolve_expense_category_for_netsuite(coding_value_uuid, erp_connection_id, workspace_id)
  ↓
Step 1: Load CodingValue
  ↓
Step 2: Check erp_mirror_type
  - :expense_category → use external_id directly ✓
  - :gl_account → find ExpenseCategory by gl_account_code
  - other → verify if external_id is valid ExpenseCategory, else use gl_code
  ↓
Step 3: Name fallback (with erp_connection_id filter!)
```

---

## Previous Session

- **Session ID:** SC-2026-01-14-001-B
- **Status:** IMPLEMENTATION_COMPLETE
- **Turn:** 3
- **Started:** 2026-01-14
- **Focus:** Entity/Subsidiary Filtering Gap — Dimension UI Allows Incompatible Values
- **Human Request:** Investigate why UI is allowing users to select Department and GL Account values that are not available for the current entity, leading to push failures like "Department (ID: 17) is not available for entity 6"

### Gap Identified & Fixed

**GAP-DIM-UI-001: Entity/Subsidiary Filtering Not Applied in Transactions List Dropdowns**

| Attribute | Value |
|-----------|-------|
| Severity | HIGH |
| Root Cause | `load_coding_dimension_lazy_with_codes/6` in `transactions_live.ex` loaded ALL CodingValues without checking `CodingValueEntity` junction table |
| Fix Applied | Added entity filtering using `filter_values_by_entity/3` helper |

### Implementation Details

| File | Changes |
|------|---------|
| `transactions_live.ex` | Modified `load_coding_dimension_lazy_with_codes/6` to filter by entity |
| `transactions_live.ex` | Added `filter_values_by_entity/3` helper function |

**Fix Logic:**
1. Get entity's ERP external_id via `get_entity_erp_location_for_filter/2`
2. Query `CodingValueEntity` junction table for restrictions on loaded values
3. Filter to include only values with NO restrictions (globally available) OR matching entity
4. Fail open on error (return all values) to avoid blocking users

**Committee Vote:** UNANIMOUS APPROVAL (Architecture, Sync Architect, End User Advocate, NetSuite Expert)

---

## Previous Session

- **Session ID:** SC-2026-01-13-001
- **Status:** COMPLETED
- **Turn:** 19
- **Started:** 2026-01-13
- **Focus:** Dimension Code Mapping Problem — DimensionTypeConfig FK to CodingCategory
- **Human Request:** Design and implement explicit FK relationship between DimensionTypeConfig and CodingCategory to eliminate hardcoded dimension code mappings

### Design Approved (Turn 18)

**GAP-DIM-FK-001: DimensionTypeConfig → CodingCategory FK Relationship**

Human Director approved adding explicit FK from `DimensionTypeConfig` to `CodingCategory` with UI verification to prevent orphan configs.

**Implementation Completed (Turn 19)**

| File | Changes |
|------|---------|
| Migration `20260114005549` | Added `coding_category_id` column with FK to `coding_dimension_types`, index |
| `dimension_type_config.ex` | Added `coding_category_id` attribute, `coding_category` relationship, `link_to_category` action |
| `dimension_mapping_service.ex` | Added `set_type_enabled_with_category/5`, `load_coding_categories/2`, bridge status helpers |
| `erp_live.ex` | Updated `build_erp_dimensions_from_config` to include bridge status, updated `save_tab_data` to use FK |
| `erp.backfill_dimension_type_config_fk.ex` | New mix task to backfill existing records |

---

## Previous Session (Archived)

- **Session ID:** SC-2026-01-12-001
- **Status:** COMPLETED
- **Turn:** 12
- **Started:** 2026-01-12
- **Focus:** Bidirectional Sync Architecture Overview + Flow-10/11 Integration + tranid Implementation + RESTlet Status UI + Sync Flow Fix
- **Human Request:** Explain the current bidirectional sync system, then integrate ERP coding change propagation; Use Teampay DB ID as NetSuite `tranid`; Show RESTlet status during connection setup (optional feature); Fix broken sync flow

### Implementation Completed (Turn 12)

**GAP-SYNC-002: TenantRequired Error in Cross-Workspace Queries**

The `WorkspaceSyncWorker` was failing with `Ash.Error.Invalid.TenantRequired` because cross-workspace queries were using Ash without a tenant.

**Root Cause:** Ash multi-tenant resources require a `tenant:` option. Cross-workspace scheduling queries cannot provide a tenant because they need to query ALL workspaces.

**Committee Vote:** UNANIMOUS (7-0) — Use direct Ecto queries following `WorkspaceDenormalizationService` pattern.

| File | Function | Fix |
|------|----------|-----|
| `workspace_sync_worker.ex` | `get_active_connections/0` | Direct Ecto query |
| `monitor_sync_health_worker.ex` | `get_active_workspaces_with_erp/0` | Direct Ecto query |
| `push_reconciliation_service.ex` | `list_active_workspace_ids/0` | Direct Ecto query |

**Security Note:** This is safe because:
1. We only read non-sensitive scheduling data (id, workspace_id)
2. This is used to establish tenant context for subsequent operations
3. Pattern approved by Sync Committee (see `WorkspaceDenormalizationService`)

**GAP-SYNC-001: CANCELLED** — The `process/1` warning was a false positive. All 74 `Oban.Pro.Worker` implementations use `@impl Oban.Worker` with `perform/1`, which is correct.

### Implementation Completed (Turn 9)

**SC-2026-01-13-002: RESTlet Status Display in ERP Setup**

Human Director requested showing RESTlet status during connection setup, making it clear the feature is optional.

**Design Decision:**
- Show RESTlet status **after** connection is established (non-blocking)
- Visual indicator with "Optional" badge
- Auto-detect using convention-over-configuration defaults
- Clear guidance if RESTlet not deployed

| File | Change |
|------|--------|
| `erp_components.ex` | Added `restlet_status_banner/1` component with status variants |
| `erp_components.ex` | Added `restlet_status` and `restlet_info` attrs to `connected_healthy_card/1` |
| `erp_live.ex` | Added `:restlet_status` and `:restlet_info` assigns |
| `erp_live.ex` | Added async RESTlet check after connection creation |
| `erp_live.ex` | Added RESTlet check for existing connections on page load |
| `erp_live.ex` | Added `handle_info` handlers for `:check_restlet_status` and `:restlet_status_result` |

**RESTlet Status Values:**
- `:checking` — Test in progress
- `:available` — RESTlet detected (shows "(auto-detected)" if using defaults)
- `:not_found` — RESTlet not deployed (with link to deployment guide)
- `:permission_denied` — RESTlet exists but role lacks access

**Key Principle:** Minimally invasive — no changes to setup domain's core flow. RESTlet check is informational, not blocking.

### Implementation Completed (Turn 7)

**SC-2026-01-12-001: Use Teampay DB ID as NetSuite `tranid`**

Human Director approved using the Teampay database ID as the NetSuite `tranid` field for:
- Customer visibility in NetSuite UI
- Audit/compliance requirements
- Cross-reference during support calls

**Design Decision:**
- Format: `TP-{source_id}` (e.g., `TP-61bb0575-1234-5678-9abc-def012345678`)
- Scope: System-wide (all pushed transactions)
- Trade-off: Overrides NetSuite auto-numbering (accepted)

| File | Change |
|------|--------|
| `push/bills.ex` | Added `tranid` field using `build_teampay_tranid/1` |
| `push/expense_reports.ex` | Added `tranid` field using `build_teampay_tranid/1` |
| `push/ap_payments.ex` | Added `tranid` field using `build_teampay_tranid/1` |
| `push/expense_report_payments.ex` | Replaced `payment_number` with `build_teampay_tranid/1` (3 locations) |
| `field_mapper_service.ex` | **Added `id`, `source_resource_id`, `workspace_id` to field mappings** (Turn 7 fix) |

**Turn 7 Fix:** The `tranid` wasn't appearing because `FieldMapperService.map_to_erp/2` was stripping the `id` field during transformation. Fixed by adding `id`, `source_resource_id`, and `workspace_id` to the bill, expense_report, and ap_payment field mappings.

**Note:** `externalId` pattern (SC-2026-01-13-001) remains for targeted sync optimization. `tranid` is for UI visibility.

### Implementation Completed (Turn 4)

**GAP-BIDI-001: BidirectionalSyncService not integrated into BridgeReactor**

| File | Change |
|------|--------|
| `bridge_reactor.ex` | Added alias for `BidirectionalSyncService` |
| `bridge_reactor.ex` | Added Step 22: `:propagate_erp_coding_changes` |
| `bridge_reactor.ex` | Updated `:aggregate_results` to include `coding_propagation` stats |
| `bridge_reactor.ex` | Updated module docs to document Step 22 |

**Flow-10/11 Now Active:**
- When BridgeWorker runs (every 2 min), Step 22 will call `BidirectionalSyncService.propagate_all_workspaces()`
- ERP coding changes on Bills will propagate to linked `ExpenseCardTransaction` / `ReimbursementItem` records
- Propagation only occurs when accounting period is OPEN (Flow-10)
- Propagation skipped when period is CLOSED (Flow-11)

---

## Previous Session

- **Session ID:** SC-2026-01-10-001 (Closed - Incomplete)
- **Last Session:** SC-2026-01-10-001 (Closed - Incomplete)

---

## Previous Session: SC-2026-01-10-001

- **Session ID:** SC-2026-01-10-001
- **Status:** CLOSED (Incomplete)
- **Turn:** 3
- **Date:** January 10, 2026
- **Focus:** Full Committee Review — Payment Push Failures and Approval Workflow Bypass

### Session Outcome

**Incomplete** — Fixes were implemented but could not be validated because the Phoenix server was not restarted to load the new compiled code.

### Key Accomplishments

| Milestone | Status | Details |
|-----------|--------|---------|
| **Expense Account Fallback** | ✅ Implemented | `ensure_expense_account_id/2` fetches default from NetSuite |
| **Bank Account Fallback** | ✅ Implemented | `ensure_bank_account_id/2` fetches default from NetSuite |
| **Approval Workflow Bypass** | ✅ Implemented | Sets `complete: true` and `approvalstatus: 2` |
| **UI: Row Checkboxes** | ✅ Fixed | Changed from `onclick` to `phx-hook="StopPropagation"` |
| **UI: Mark as Paid Button** | ✅ Fixed | Only appears when ONLY check payments selected |
| **Server Restart** | ❌ Required | New code not yet loaded |
| **Payment Push Validation** | ❌ Pending | Awaiting server restart |

### 🚨 EXPERIMENTAL: Dual Payment Implementation

**⚠️ FOR TESTING ONLY — NOT FOR PRODUCTION ⚠️**

The current implementation includes a **dual payment test mode** (`@dual_test_mode true` in `expense_report_payments.ex`) that simultaneously attempts two payment approaches:

| Approach | Record Type | Memo Suffix | Purpose |
|----------|-------------|-------------|---------|
| **A. Check + Expense Sublist** | `/check` | `[CHECK-TEST]` | Creates Check with expense line items |
| **B. VendorPayment** | `/vendorpayment` | `[VENDORPAY-TEST]` | Attempts to apply payment to expense report |

**Why?** We do not yet know which approach will successfully create a payment that links to the expense report in NetSuite's "Related Records" tab.

**Before Production:** Set `@dual_test_mode false` and choose a single working approach.

### Immediate Next Steps

1. **Restart Phoenix Server** — Required to load new compiled code
2. **Test Expense Report Push** — Verify `approvalstatus` and `complete` fields work
3. **Test Payment Push** — Verify fallback account resolution works
4. **Analyze Results** — Determine which payment approach succeeds
5. **Choose Production Approach** — Disable dual mode

### Session Artifacts

Located in: `artifacts/sessions/SC-2026-01-10-001/`

| File | Description |
|------|-------------|
| `SESSION-SUMMARY.md` | Complete session summary |
| `DUAL-PAYMENT-EXPERIMENT.md` | Detailed documentation of the dual payment experiment |
| `HANDOFF-TO-NEXT-SESSION.md` | Instructions for continuing this work |

---

## Previous Session: SC-2026-01-09-001 (Reimbursement Item Vendor Matching)

- **Session ID:** SC-2026-01-09-001
- **Status:** COMPLETED
- **Turn:** 3
- **Started:** 2026-01-09 UTC
- **Completed:** 2026-01-09 UTC
- **Focus:** Reimbursement Item Vendor Matching — Adding `vendor_id` to ReimbursementItem for Coding Rules

### Topic Summary

Human Director raised the following design question:

> "When matching transactions to vendors, we should also match reimbursement items to an actual vendor. It shouldn't match to the actual vendor on the ERP because for reimbursements (expenses) the vendor is the employee who requested the request, but we want that facilitation for the user to match it to an existing vendor and be more easy to apply the coding rules."

### Key Distinction

| Context | Vendor Meaning |
|---------|----------------|
| **ERP Push** | The **employee** is the vendor (expense report payee) |
| **Coding Rules** | The **merchant/supplier** should drive coding (like card transactions) |

### Implementation: GAP-REIMB-VENDOR-001 ✅ COMPLETED

**Problem:** Reimbursement items cannot participate in vendor-based coding rules because they lack a `vendor_id` field.

**Committee Decision:** Add `vendor_id` (only) to ReimbursementItem. No `vendor_match_method` or `vendor_match_confidence` needed. UI changes deferred to future phase.

**Vote:** APPROVED by Human Director

**Files Modified:**

| File | Changes |
|------|---------|
| `reimbursement_item.ex` | Added `vendor_id` attribute, `vendor` relationship, updated references, added index |
| `apply_coding_rules.ex` | Added `vendor_id` to item_data for rule evaluation |
| `dimension_integration.ex` | Added `vendor_id` to record context |
| Migration `20260109232822` | Added `vendor_id` column with FK to `ap_vendors`, index |

### Next Steps (Deferred to Future Session)

1. **UI Phase:** Add vendor dropdown/lookup in `receipts_live.ex`
2. **Auto-matching (Optional):** Consider automatic vendor resolution from `merchant` field via `MerchantVendorMappingService`

---

## Previous Session: SC-2026-01-09-002 (Receipt File Attachment)

- **Session ID:** SC-2026-01-09-002
- **Status:** CLOSED
- **Focus:** Reimbursement Sync to NetSuite — Receipt File Attachment & Payment Record Investigation

### Key Discoveries

1. **Check requires expense sublist** — A Check with only `apply` sublist is rejected by NetSuite
2. **VendorPayment doesn't work with expense reports** — The `apply` sublist expects Vendor Bill IDs
3. **category_id ≠ GL Account ID** — ExpenseCategory external_id is not the same as GL Account ID
4. **Line-level file attachment is a NetSuite system limitation** (Enhancement Request #665899)
5. **Header-level attachment via `record.attach()` works** — Files appear in Related Records → Files tab
6. **RESTlet v1.4.0** deployed with `attachToHeader` action

---

## Previous Session: SC-2026-01-08-001

### Agenda

Human Director raised three critical topics for full committee discussion:

1. **TOPIC-001**: Accounting Period Constraints — Client-side vs ERP-enforced validation ✅ ANSWERED
2. **TOPIC-002**: Project/Customer Hierarchy in NetSuite Bills — Project not populating ✅ FIXED (GAP-PROJECT-CUSTOMER-001)
3. **TOPIC-003**: Attachment Strategy — Direct upload to NetSuite vs S3 reference links ✅ ANSWERED

### Implementation: GAP-PROJECT-CUSTOMER-001 (Multi-ERP Fix)

**Problem:** Project dimension not being passed to ERP bill line items across ALL four ERPs.

**Root Cause:** Each ERP has a project field on line items, but we weren't populating any of them.

**Committee Vote:** UNANIMOUS (7-0 general committee, 5-0 ERP expert panel)

**Files Modified:**

| ERP | File | Field Added |
|-----|------|-------------|
| NetSuite | `netsuite/capabilities/push/bills.ex` | `customer` (project=customer in NS) |
| NetSuite | `netsuite/capabilities/push/expense_reports.ex` | `customer` |
| Sage Intacct | `sage_intacct/capabilities/push/bills.ex` | `PROJECTID`, `CUSTOMERID` |
| QuickBooks | `quickbooks/capabilities/push/bills.ex` | `ProjectRef`, `CustomerRef` |
| Acumatica | `acumatica/capabilities/push/bills.ex` | `Project`, `ProjectTask` |

### Committee Findings Summary

| Topic | Finding | Resolution |
|-------|---------|------------|
| **Accounting Periods** | We do client-side validation AND ERP enforces. Current approach is correct. | No change needed. Consider moving periods to COLD tier for fresher data. |
| **Project/Customer** | ALL ERPs were missing project field on line items. | ✅ IMPLEMENTED across all 4 ERPs |
| **Attachments** | Direct upload is correct. S3 reference would break auditor workflows. | Current implementation is sound. |

### Committee Members Present

| Role | Member | Status |
|------|--------|--------|
| Chair | Sync Committee Lead | 🟢 Present |
| ERP Expert | NetSuite/Sage/QB Specialist | 🟢 Present |
| Performance Engineer | Query Optimization Specialist | 🟢 Present |
| Ash Framework Expert | Ash/Ecto Specialist | 🟢 Present |
| Frontend Liaison | LiveView/UX Specialist | 🟢 Present |

### Committed Optimizations (PERF-OPT-007, 008)

✅ **Committed** - Micro-optimizations saving ~10-50ms

### New Optimization Under Review

#### PERF-OPT-009: Eliminate N+1 Queries in Vendor Options Loading

**Problem Identified:**
- `get_vendor_options` loads 1000 vendors with `:effective_name` calculation
- The `effective_name` calculation does **N+1 queries** - calls `Ash.get(ErpVendor, id)` for EACH vendor
- With 1000 vendors, this triggers ~1000 additional database queries!

**Root Cause:**
```elixir
# In effective_name.ex calculation:
defp calculate_effective_name(vendor) do
  cond do
    not is_nil(vendor.erp_vendor_id) ->
      # THIS DOES A QUERY PER VENDOR!
      case Ash.get(ErpVendor, vendor.erp_vendor_id, authorize?: false, tenant: vendor.workspace_id) do
        {:ok, erp_vendor} -> erp_vendor.vendor_name
        _ -> nil
      end
    ...
  end
end
```

**Proposed Fix:**
- Instead of loading `:effective_name` calculation, load `:erp_vendor` relationship
- Access `erp_vendor.vendor_name` directly (single JOIN, not N+1)
- Select only needed fields: `[:id, :vendor_number, :erp_vendor_id]`

**Code Change:**
```elixir
# BEFORE (N+1 queries):
vendor_query = Vendor
|> Ash.Query.load([:effective_name, :erp_vendor])

# AFTER (single JOIN):
vendor_query = Vendor
|> Ash.Query.select([:id, :vendor_number, :erp_vendor_id])
|> Ash.Query.load([erp_vendor: [:vendor_name, :subsidiary_ids]])
```

**Expected Impact:** 
- Eliminates ~1000 queries per page load
- Expected improvement: **300-400ms** (the bulk of the 583ms)

---

## Previous Session: SC-2026-01-07-005

- **Status:** COMPLETED

---

## Gaps Master List

| Gap ID | Description | Status | Session |
|--------|-------------|--------|---------|
| **GAP-NS-BOOLEAN-ERROR-001** | AccountMappingService uses strict `and` with nil subsidiary_id causing BadBooleanError | ✅ Fixed | SC-2026-01-19-005 |
| **GAP-EMP-BULK-001** | No utility function for bulk employee push to NetSuite | ✅ Fixed | SC-2026-01-16-004 |
| **GAP-WORKFORCE-DEV-001** | No dev tool to push employees to NetSuite from workforce setup | ❌ Removed | SC-2026-01-16-003 |
| **GAP-BANK-UI-001** | Bank mapping UI shows too many unused fields | ✅ Fixed | SC-2026-01-16-002 |
| **GAP-BANK-RESOLVE-001** | Unified bank account resolution for all config items | ✅ Fixed | SC-2026-01-16-001 |
| **GAP-EMP-LINK-001** | Manual employee linking required for NetSuite push | ✅ Fixed | SC-2026-01-15-002 |
| **GAP-ACCT-LINE-002** | GL dropdown in transactions_live missing account_type filter (allows Bank/AR selection) | ✅ Fixed | SC-2026-01-15-001 |
| **GAP-VENDOR-REACTOR-001** | Vendor updates mixed with coding updates; no dedicated audit trail | ✅ Fixed | SC-2026-01-15-001 |
| **GAP-COMPLETE-001** | `complete: true` on expense report prevents payment creation (closes balance) | ✅ Fixed | SC-2026-01-15-001 |
| **GAP-DIM-PUSH-001** | Push reactor sends disabled dimensions (from CodingAssignment) to ERP | ✅ Fixed | SC-2026-01-14-002 |
| **GAP-DIM-UI-001** | Entity/Subsidiary filtering not applied in transactions list dropdowns | ✅ Fixed | SC-2026-01-14-001-B |
| **GAP-FUNDING-001** | Multiple reactors duplicate funding account resolution logic | ✅ Fixed | SC-2026-01-14-001 |
| **GAP-EXPENSE-CAT-001** | ExpenseCategory resolution missing erp_connection_id filter, fragile name matching | ✅ Fixed | SC-2026-01-14-001 |
| **GAP-SYNC-002** | TenantRequired error in cross-workspace sync queries | ✅ Fixed | SC-2026-01-12-001 |
| **GAP-PAY-ACCOUNT-001** | Check expense sublist requires GL Account ID, but line has no category | ✅ Fixed (fallback) | SC-2026-01-10-001 |
| **GAP-BANK-002** | No bank_account_id configured for ERP connection | ✅ Fixed (fallback) | SC-2026-01-10-001 |
| **GAP-APPROVAL-001** | Expense report stuck in "Pending Accounting Approval" | ✅ Fixed (bypass) | SC-2026-01-10-001 |
| GAP-ATTACH-001 | Line-level file attachment via SuiteScript | ❌ NetSuite Limitation | SC-2026-01-09-002 |
| GAP-PAY-LINES-001 | Check without expense/item sublist rejected | ✅ Understood | SC-2026-01-09-002 |
| **GAP-REIMB-VENDOR-001** | Reimbursement items lack vendor_id for coding rules | ✅ Fixed | SC-2026-01-09-001 |
| **GAP-PROJECT-CUSTOMER-001** | Project field not passed to ERP bill line items (ALL ERPs) | ✅ Fixed | SC-2026-01-08-001 |
| **GAP-PROJECT-STATUS-001** | Project with "Won" status may restrict expense report usage in NetSuite | 🔍 Investigating | SC-2026-01-18-001 |
| GAP-NTROPY-001 | Wrong Ntropy API endpoint | ✅ Fixed | SC-2026-01-06-003 |
| GAP-NTROPY-002 | Wrong JSON path for counterparty | ✅ Fixed | SC-2026-01-06-003 |
| GAP-NTROPY-003 | Access.at on map crash | ✅ Fixed | SC-2026-01-06-003 |
| GAP-NTROPY-004 | Labels field missing | ✅ Fixed | SC-2026-01-06-003 |
| GAP-FUZZY-001 | Fuzzy match LIMIT 100 | ✅ Fixed | SC-2026-01-06-004 |
| GAP-FUZZY-002 | Fuzzy match LIMIT 1000 insufficient for enterprise | ✅ Approved (deferred) | SC-2026-01-06-005 |
| GAP-VND-PUSH-001 | PushCardSpendReactor external_id | ✅ Fixed | SC-2026-01-06-002 |
| GAP-VND-UI-001 | UI vendor ERP status | 📋 Proposed | SC-2026-01-06-001 |
| GAP-VND-MATCH-003 | Entity scoping for ERP vendors | ⏸️ Deferred | SC-2026-01-05-003 |
| GAP-ASH-UPSERT-001 | Raw Ecto used instead of Ash for CodingValueSubsidiary upserts | ⏸️ Paused (appears fixed) | SC-2026-01-07-001 |
| GAP-CODING-VENDOR-001 | Vendor incorrectly considered in coding status | ✅ Fixed | SC-2026-01-07-002 |
| GAP-GL-FILTER-001 | Non-transactional GL accounts (summary/statistical) in dropdowns | ✅ Fixed | SC-2026-01-07-002 |
| GAP-CODING-STATUS-003 | Wrong workspace_id passed to RequiredDimensionValidationService | ✅ Fixed | SC-2026-01-07-003 |
| GAP-CODING-STATUS-004 | Missing tenant in CodingAssignment query | ✅ Fixed | SC-2026-01-07-003 |
| GAP-CODING-STATUS-005 | Accessing non-existent dimension_type attr instead of relationship.code | ✅ Fixed | SC-2026-01-07-003 |
| GAP-CODING-STATUS-006 | Missing short codes (GL, LOC, PROJ) in dimension_type_to_coding_key | ✅ Fixed | SC-2026-01-07-003 |
| **GAP-CODING-STATUS-007** | Seeds don't recalculate coding_status after creating CodingAssignments | ✅ Fixed | SC-2026-01-07-003 |
| **GAP-NS-APPLY-REFNUM-001** | VendorPayment apply sublist rejects `refnum` field — not settable via REST API | ✅ Fixed | SC-2026-01-19-001 |
| **GAP-NS-DUPLICATE-BILL-001** | "This record already exists" error on retry after partial failure — handle as idempotent success | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-MISSING-ACCOUNT-001** | VendorPayment missing required `account` field — bank account not passed to worker | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-MISSING-ACCOUNT-002** | FieldMapperService dropping `account_id` — not included in `map_ap_payment_fields/2` | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-ACCOUNT-TYPE-001** | Using `resolve_account/3` (GL account) instead of `resolve_funding_account/3` (Bank account) | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-ACCOUNT-TYPE-002** | `resolve_from_account_mapping/3` not verifying GL account is Bank type — now validates `accttype` | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-SUBSIDIARY-MISMATCH-001** | `resolve_from_bank_account_fallback/4` not filtering by subsidiary — now filters by `subsidiary_raw` | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-SUBSIDIARY-MISMATCH-002** | `resolve_from_account_mapping/3` not validating subsidiary — now checks `subsidiary_raw` contains subsidiary_id | ✅ Fixed | SC-2026-01-19-002 |
| **GAP-NS-PRIMARY-SUBSIDIARY-001** | `VendorBulkUpsertService` missing `primary_erp_location_id` and `entity_ids` in `upsert_fields` | ✅ Fixed | SC-2026-01-19-003 |
| **GAP-NS-PRIMARY-SUBSIDIARY-002** | `VendorEntitySyncService` only updating `entity_ids`, not `primary_erp_location_id` | ✅ Fixed | SC-2026-01-19-003 |
| **GAP-NS-PRIMARY-SUBSIDIARY-003** | `VendorMapper` had no fallback when `subsidiary` field is null (use first entity_id) | ✅ Fixed | SC-2026-01-19-003 |
| **GAP-QB-TOKEN-PERSIST-001** | QuickBooks refresh token not persisted after OAuth refresh — causes 403 on process restart | ✅ Fixed | SC-2026-01-27-001 |

---

## Session SC-2026-01-27-001: QuickBooks Refresh Token Persistence

**Date:** 2026-01-27
**Status:** COMPLETED
**Focus:** Fix QuickBooks OAuth 403 ApplicationAuthorizationFailed errors after process restart

### Problem

QuickBooks sync was returning `403 ApplicationAuthorizationFailed` errors. Initial permission check worked after process restart, but subsequent syncs failed. Root cause: **QuickBooks refresh tokens are single-use**. When a refresh token is used to get a new access token, QuickBooks returns a new refresh token that must be persisted. The `TokenCache` was caching the new token in ETS but not persisting it to the database.

### Analysis

1. `TokenCache.create_token/2` successfully gets new `access_token` + new `refresh_token` from QuickBooks OAuth
2. New tokens cached in ETS (works for current process)
3. **BUG:** New refresh token not persisted to `ErpConnection.credentials["rest"]["refresh_token"]`
4. On process restart, ETS cache is empty, system reads old (already-used) refresh token from database
5. QuickBooks rejects the old refresh token → 403 error

### Gap Identified

| Gap ID | Description | Status |
|--------|-------------|--------|
| **GAP-QB-TOKEN-PERSIST-001** | QuickBooks refresh token not persisted after OAuth refresh | ✅ Fixed |

### Solution

**1. Updated `QuickBooks.Config` to include connection metadata:**

```elixir
# lib/.../quickbooks/config.ex
@type config :: %{
  ...
  erp_connection_id: String.t() | nil,
  workspace_id: String.t() | nil
}

def build_config(opts) do
  ...
  erp_connection_id = Map.get(opts, "erp_connection_id") || Map.get(opts, :erp_connection_id)
  workspace_id = Map.get(opts, "workspace_id") || Map.get(opts, :workspace_id)
  
  %{
    ...
    erp_connection_id: erp_connection_id,
    workspace_id: workspace_id
  }
end
```

**2. Updated `CapabilityRouter.build_adapter_config/1` to pass connection metadata:**

```elixir
# lib/.../capability_router.ex
defp build_adapter_config(connection) do
  config_input =
    connection.credentials
    |> Map.put("environment", ...)
    |> Map.put("erp_connection_id", connection.id)
    |> Map.put("workspace_id", connection.workspace_id)
  ...
end
```

**3. Added refresh token persistence to `TokenCache`:**

```elixir
# lib/.../quickbooks/token_cache.ex
defp refresh_token(config, cache_key, refresh_token) do
  :ets.delete(@table_name, cache_key)

  with {:ok, token_response} <- create_token(config, refresh_token),
       :ok <- cache_token(cache_key, token_response),
       :ok <- persist_refresh_token(config, token_response.refresh_token) do  # NEW
    {:ok, token_response.token}
  end
end

defp persist_refresh_token(config, new_refresh_token) do
  # Updates ErpConnection.credentials["rest"]["refresh_token"] in database
  # Handles nil connection metadata gracefully (e.g., during setup/tests)
end
```

### Files Modified

1. `lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/config.ex`
   - Added `erp_connection_id` and `workspace_id` to config type and build_config

2. `lib/flame_teampay_payables/ember_erp/adapters/capability_router.ex`
   - Updated `build_adapter_config/1` to pass connection metadata

3. `lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/token_cache.ex`
   - Added `persist_refresh_token/2` and `persist_to_database/3` functions
   - Modified `refresh_token/3` to call persistence after successful token refresh

### Outcome

After this fix:
- New refresh tokens are persisted to database after each OAuth refresh
- Process restarts will use the latest valid refresh token
- Eliminates 403 errors caused by reusing invalidated refresh tokens

---

*Last Updated: Session SC-2026-01-27-001 — QuickBooks Token Persistence Fix*
*Status: CLOSED*

---

## Session SC-2026-01-28-001: QuickBooks Bank Accounts Missing entity_id

**Status:** 🟡 ACTIVE
**Convened:** 2026-01-28
**Trigger:** User report — QuickBooks sync completes but bank accounts table is empty

### Problem Statement

After QuickBooks full sync, the `ember_erp_accounting_bank_accounts` table is empty. Investigation revealed:

1. `BankAccount` resource requires `entity_id` (`allow_nil? false`)
2. QuickBooks is "connection-scoped" (no subsidiaries/entities)
3. `entity_id` passed to sync is `nil` for QuickBooks
4. Bulk upsert attempts fail silently due to validation error

### Initial Investigation

**Members Active:** Chair, ERP Provider Lead (QuickBooks), Data Mapping Specialist

**Findings:**

1. `EntitySyncService.get_scoping_strategy/2` returns `:connection_scoped` for all QuickBooks entities
2. For connection-scoped entities, `entity_id` is typically `nil`
3. `BankAccount` resource is the ONLY resource with `entity_id allow_nil? false`
4. Other resources (Vendor, Employee, GLAccount, etc.) all have `entity_id allow_nil? true`
5. `BankAccountBulkUpsertService.upsert_batch/3` receives `nil` entity_id and passes it through
6. Ash validation rejects records with `nil` entity_id

### Key Question

For QuickBooks (which is always connection-scoped), how should `entity_id` be resolved?

**Options:**
1. **Use default entity from EntityMapping** - Look up the entity associated with this ERP connection
2. **Make entity_id nullable** - Align with other resources (user rejected this approach)
3. **Synthetic entity lookup** - Use workspace's primary/default entity

### Solution

**Root Cause:** BankAccount is the only resource with `entity_id allow_nil? false`. For connection-scoped providers (QuickBooks), the `entity_id` passed to sync is `nil`, causing validation failures.

**Fix Applied:**

1. **Added `get_default_entity/2` to EntityResolutionService:**
   - Looks up EntityMapping with `erp_location_id = "DEFAULT"` (QuickBooks pattern)
   - Falls back to first active mapping with an entity_id
   - Returns the entity_id from the mapping

2. **Updated BankAccountBulkUpsertService:**
   - Added `resolve_entity_id/3` function
   - If explicit entity_id is nil, calls `EntityResolutionService.get_default_entity/2`
   - Logs warning and skips records if no entity_id can be resolved

### Files Modified

1. `lib/flame_teampay_payables/ember_erp/services/entity_resolution_service.ex`
   - Added `get_default_entity/2` function

2. `lib/flame_teampay_payables/ember_erp/services/bulk/bank_account_bulk_upsert_service.ex`
   - Added `resolve_entity_id/3` to look up default entity when nil
   - Fixed upsert_fields to match BankAccount resource attributes

### Gap Closed

| Gap ID | Description | Status |
|--------|-------------|--------|
| **GAP-QB-BANK-ENTITY-001** | QuickBooks bank accounts missing entity_id | ✅ Fixed |

---

*Last Updated: Session SC-2026-01-28-001 — QuickBooks Bank Accounts entity_id Fix*
*Status: CLOSED*
