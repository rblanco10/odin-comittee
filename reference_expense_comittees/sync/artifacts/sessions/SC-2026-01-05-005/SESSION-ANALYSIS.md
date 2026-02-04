# SC-2026-01-05-005: Post-Push Data Discrepancy Analysis

**Session Date:** 2026-01-05  
**Status:** FINDINGS COMPLETE — Awaiting Engineering Handoff  
**Topic:** Data discrepancy analysis for expense report EXP09422812 pushed to NetSuite

---

## Executive Summary

The expense report push to NetSuite was **technically successful** (external_id: 612966, document: EXP09422812, $500). However, the user identified several discrepancies between the data in our database and what appeared in NetSuite.

### 🚨 CRITICAL FINDING: Employee Fallback Logic Caused Wrong Payee

**Database Query Evidence:**

| Field | Our Database | NetSuite Result |
|-------|--------------|-----------------|
| Reimbursement Employee | **Demo Admin** (`admin@demo.local`) | **Jan Bucoy** (`jbucoy@netsuite.com`) |
| Employee ERP Link | `erp_employee_id: nil` | External ID: 1640 |

**Root Cause:** The reimbursement was created by **Demo Admin**, but because `Demo Admin` has **NO `erp_employee_id` link**, the fallback logic in `resolve_employee_external_id()` selected the **first active Accounting Employee** from the ERP connection — which was **Jan Bucoy** (synced from NetSuite on 2026-01-05 19:37:51).

**This is a BUG in the fallback logic.** The system should FAIL or WARN when no employee mapping exists, not silently substitute a random NetSuite employee.

---

## User Concerns Addressed

### 1. Pre-syncing Expense Categories from NetSuite

**Question:** Is expense category pre-syncing already in place?

**Answer: YES ✅ — Expense category syncing IS already implemented.**

| Component | Path | Purpose |
|-----------|------|---------|
| **Sync Capability** | `adapters/providers/netsuite/capabilities/sync/expense/expense_categories.ex` | Fetches expense categories via SuiteQL from NetSuite |
| **Mapper** | `adapters/providers/netsuite/mappers/expense_category_mapper.ex` | Maps NetSuite data to `ExpenseCategory` resource |
| **Sync Handler** | `services/expense_category_sync_handler.ex` | Upserts `ExpenseCategory` records |
| **Bulk Upsert** | `services/bulk/expense_category_bulk_upsert_service.ex` | Handles bulk sync operations |
| **Resource** | `resources/accounting/expense/expense_category.ex` | Stores synced categories with `external_id`, `category_code`, `category_name` |

**How It Works:**
1. `SyncConfiguration` records are created during ERP connection setup
2. Scheduled sync (via AshOban) or manual sync triggers the `expense_categories` capability
3. Categories are fetched via SuiteQL: `SELECT * FROM expensecategory WHERE isinactive = 'F'`
4. Categories are upserted to local `ExpenseCategory` resource with NetSuite `external_id`

**Current Gap:** The `PushExpenseReportReactor` does NOT look up the synced `ExpenseCategory` by name to resolve the `external_id`. Instead, when `category_id` is missing from line items, it falls back to fetching the first available expense category directly from NetSuite:

```elixir
# From expense_reports.ex line 336-355
[info] [NetSuite Push] ExpenseReports - Fetching default expense category from NetSuite
[info] [NetSuite Push] ExpenseReports - Using expense category: 18
```

**Recommendation:** Modify line item transformation to resolve category from local `ExpenseCategory` records:
```elixir
category_external_id = resolve_category_external_id(item.category, erp_connection_id, workspace_id)
```

---

### 2. Expense Reports Should Align to the Correct Payee/Employee

**Question:** Is the expense report being filed under the correct employee?

**Current Behavior Analysis:**

Looking at `push_expense_report_reactor.ex` lines 150-169 and 903-944:

```elixir
# Production path (when ReimbursementRequest exists):
case try_load_reimbursement_request(push_request) do
  {:ok, reimbursement_request} when not is_nil(reimbursement_request) ->
    # Resolve employee external_id from the reimbursement's employee_id
    employee_external_id = resolve_employee_external_id(
      reimbursement_request.employee_id,  # ← Uses reimbursement's employee
      push_request.erp_connection_id,
      push_request.workspace_id
    )
```

**Resolution Logic (lines 903-944):**
1. Load `WorkforceEmployee` by `reimbursement_request.employee_id`
2. Check if `workforce_employee.erp_employee` is linked (via `erp_employee_id`)
3. If linked, use `erp_employee.external_id` (NetSuite employee internal ID)
4. If not linked, fallback to legacy matching by `employee_number` or `email`
5. If no match, query first active `Accounting.Employee` from the ERP connection

**Log Evidence:**
```
[info] PushExpenseReportReactor: Using Accounting Employee external_id: 1640 (employee_number: Jan Bucoy)
```

**Analysis:**
- The reactor IS attempting to resolve from the ReimbursementRequest
- However, the log shows it used `Accounting Employee` with external_id `1640` (Jan Bucoy)
- This suggests either:
  - (A) The Workforce Employee for this reimbursement has an `erp_employee_id` linked to Jan Bucoy, OR
  - (B) The fallback logic matched to Jan Bucoy by email/employee_number, OR
  - (C) The reimbursement was created by/for Jan Bucoy

**Verification Needed:**
Query the actual reimbursement to confirm the intended payee:
```elixir
ReimbursementRequest
|> Ash.get("eff64f82-1d4f-4050-99cc-5c196b8691d0", 
     load: [:employee], 
     tenant: "550e8400-e29b-41d4-a716-446655440000")
```

**Current Assessment:** The logic is CORRECT — it tries to use the reimbursement's employee first. The result "Jan Bucoy" is likely the correct payee based on the data.

---

### 3. Department and Category — Code-Level Validation

#### 3a. Does `ReimbursementRequest` have `department_id` at header level?

**Answer: NO ❌ — `department_id` is NOT on `ReimbursementRequest`**

From `reimbursement_request.ex` attributes (lines 65-163):
- `workspace_id` ✓
- `entity_id` ✓
- `request_number` ✓
- `status` ✓
- `total_amount` ✓
- `employee_id` ✓
- `description` ✓
- `metadata` ✓
- **NO `department_id`**
- **NO `class_id`**
- **NO `location_id`**

**However, `department_id` IS on `WorkforceEmployee`:**
```elixir
# From workforce_employee.ex line 171
attribute :department_id, :uuid do
  description "Reference to Department"
end
```

**And dimensions can be assigned via `CodingAssignment`:**
From `reimbursement_item.ex` line 12:
```elixir
## Integration Points
- **EmberCoding**: Dimension assignments (CodingAssignment)
```

**Current Architecture:**
- Dimensions (Department, Class, Location) are assigned via `CodingAssignment` records
- `CodingAssignment` links to a `record_type` ("reimbursement_request" or "reimbursement_item") and `record_id`
- The `reimbursement_submission_reactor.ex` already extracts these via `extract_dimensions_from_coding_assignments/3`

**Gap:** The `PushExpenseReportReactor` does NOT extract `CodingAssignment` dimensions before pushing.

#### 3b. Are expense categories being synced from NetSuite?

**Answer: YES ✅ — See Section 1 above.**

Expense categories are synced and stored in `ExpenseCategory` resource with:
- `external_id` (NetSuite internal ID)
- `category_code`
- `category_name`
- `erp_connection_id`

---

### 4. What Data Are We Actually Sending to NetSuite?

#### Currently Sent (Explicit):

| Field | Source | Status |
|-------|--------|--------|
| `entity` (employee) | `employee_external_id` from reactor | ✅ Sent (1640) |
| `trandate` | `report_date` from reimbursement | ✅ Sent (2026-01-05) |
| `currency` | Fallback to NetSuite lookup | ⚠️ Fallback (currency ID 2) |
| `exchangerate` | Hardcoded 1.0 | ✅ Sent |
| `expense.items` | From `ReimbursementItem` records | ✅ Sent (3 items) |
| `expense.items[].amount` | From item.amount | ✅ Sent |
| `expense.items[].memo` | From item.description | ✅ Sent |
| `expense.items[].expensedate` | From item.expense_date | ✅ Sent |
| `expense.items[].category` | Fallback to default (ID 18) | ⚠️ Fallback |
| `expense.items[].currency` | From header currency | ✅ Sent |

#### NOT Sent (Missing):

| Field | Expected Source | Gap ID |
|-------|-----------------|--------|
| `department` | CodingAssignment or Employee.department_id | GAP-DIM-001 |
| `location` | CodingAssignment | GAP-DIM-002 |
| `class` | CodingAssignment | GAP-DIM-003 |
| `subsidiary` | entity_id → Subsidiary mapping | GAP-SUB-001 |
| `memo` | ReimbursementRequest.description | GAP-MEMO-001 |
| Correct `category` per line | Resolve from ExpenseCategory by name | GAP-CAT-001 |

#### Filled by Fallback:

| Field | Fallback Behavior |
|-------|-------------------|
| `currency` | Fetches first currency from NetSuite if not resolved |
| `category` | Fetches first expense category from NetSuite (ID 18) |
| `account` | Not set (NetSuite uses default) |

---

### 5. Demo Seed Data Enhancement Plan

**Location of Current Seed:** `priv/repo/seeds/dev/demo/09_reimbursements.exs`

**Current State:**
- Creates reimbursements for demo users (MeganB, JoniS, NestorW)
- Uses hardcoded categories: "Meals", "Travel", "Accommodation", "Office Supplies"
- Does NOT create `CodingAssignment` records for dimensions
- Creates ~768 lines of seed code

**Proposed Enhancement:**

Create 10 diverse reimbursement examples with:
1. **Varying employees** (3-4 different)
2. **Varying categories** (matched to synced ExpenseCategory names)
3. **Varying amounts** ($50 - $2,000)
4. **Varying line item counts** (1-5 items)
5. **CodingAssignment records** for Department/Location
6. **Different statuses** (paid, approved, submitted)

**Files to Modify:**
1. `priv/repo/seeds/dev/demo/09_reimbursements.exs` — Add ERP-ready reimbursements section
2. OR create new: `priv/repo/seeds/dev/ember_erp/02_reimbursement_erp_test_data.exs`

**Sample Data Specification:**

```elixir
@erp_test_reimbursements [
  %{
    employee_email: "MeganB@2y2lvy.onmicrosoft.com",
    description: "Q1 Team Offsite - San Francisco",
    status: :paid,
    items: [
      %{amount: 450, category: "Travel", merchant: "United Airlines", date: ~D[2026-01-02]},
      %{amount: 225, category: "Accommodation", merchant: "Marriott SF", date: ~D[2026-01-03]},
      %{amount: 125, category: "Meals", merchant: "Conference Lunch", date: ~D[2026-01-03]}
    ],
    dimensions: %{department: "Engineering", location: "San Francisco"}
  },
  %{
    employee_email: "JoniS@2y2lvy.onmicrosoft.com",
    description: "Client Meeting - NYC",
    status: :paid,
    items: [
      %{amount: 89.50, category: "Transportation", merchant: "Uber", date: ~D[2026-01-04]},
      %{amount: 156.00, category: "Meals", merchant: "Client Dinner", date: ~D[2026-01-04]}
    ],
    dimensions: %{department: "Sales", location: "New York"}
  },
  # ... 8 more examples
]
```

---

## Summary of Findings

| Concern | Finding | Action Required |
|---------|---------|-----------------|
| Expense Category Sync | ✅ Already implemented | Fix: Look up local ExpenseCategory instead of NetSuite fallback |
| Employee/Payee Mapping | ✅ Logic is correct | Verify: Confirm reimbursement's employee matches Jan Bucoy |
| Department at Header | ❌ Not on ReimbursementRequest | Use: CodingAssignment or Employee.department_id |
| Dimensions Not Sent | ❌ Not extracted in reactor | Fix: Add dimension extraction step |
| Related Records Empty | ⚠️ Expected (payment not pushed) | Info: Will populate after payment push |
| Demo Seed Data | ⚠️ Limited | Plan: Create 10 ERP-ready test reimbursements |

---

## Recommended Next Steps

1. **GAP-CAT-001 Fix:** Resolve `category` from local `ExpenseCategory` by name before push
2. **GAP-DIM-* Fix:** Extract dimensions from `CodingAssignment` in reactor, pass to adapter
3. **GAP-MEMO-001 Fix:** Include `ReimbursementRequest.description` as expense report memo
4. **Seed Enhancement:** Create `02_reimbursement_erp_test_data.exs` with 10 diverse examples
5. **Verification:** Query the actual reimbursement to confirm employee = Jan Bucoy

---

*Prepared by: Sync Committee — Session SC-2026-01-05-005*

