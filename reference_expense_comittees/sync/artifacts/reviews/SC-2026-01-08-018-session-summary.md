# Sync Committee Session: SC-2026-01-08-018

## Session Metadata
- **Session ID**: SC-2026-01-08-018
- **Date**: January 8, 2026
- **Status**: IMPLEMENTATION ROUND
- **Focus**: Reimbursement Sync with NetSuite - Implementation and Investigation

---

## Session Objectives

1. Implement test fix to evaluate if removing `complete: true` flag allows payment to properly link to expense report
2. Investigate whether dimension sync filters by subsidiary
3. Document all findings and learnings from this and previous sessions
4. **NEW**: Investigate subsidiary mismatch - Euro Sub selected but Honeycomb Holdings Inc. used in expense reports

---

## ⚠️ CRITICAL FINDING: Subsidiary Mismatch Issue (GAP-SUB-002)

### User Report
- User selects **Euro Sub** during ERP setup wizard
- Expense reports are being created under **Honeycomb Holdings Inc.** subsidiary in NetSuite
- This is a critical data integrity issue

### Evidence
Screenshot shows expense report `EXP09422834` with:
- **SUBSIDIARY**: Honeycomb Holdings Inc. ← **WRONG** (should be Euro Sub)
- **COMPLETE**: Checked (the checkbox is ticked)
- **Employee**: Jan Bucoy
- **Currency**: USA
- **Posting Period**: Jan 2026

### Investigation Status
🔍 **UNDER INVESTIGATION** - Need to trace where subsidiary is being resolved during push

---

## ⚠️ CRITICAL FINDING: Dimension Sync Does NOT Filter by Subsidiary (GAP-SUB-001)

### Investigation Results
Queried local database for all synced dimensions. **None have subsidiary information stored.**

### Subsidiaries in NetSuite

| ID | Name |
|----|------|
| 6 | **Euro Sub** |
| 5 | Foreign Sub |
| 7 | Foreign UK |
| 3 | **Honeycomb Holdings Inc.** |
| 1 | Honeycomb Mfg. |
| 4 | test sub |

### Dimension Sync Status

| Dimension Type | Count | Subsidiary Stored? |
|----------------|-------|--------------------|
| Departments | 14 | ❌ NOT STORED |
| Locations | 16 | ❌ NOT STORED |
| Classes | 18 | ❌ NOT STORED |
| Projects | 22 | ❌ NOT STORED |
| Expense Categories | 16 | N/A |
| GL Accounts | 30+ | ❌ NOT STORED |

### Root Cause
SuiteQL sync queries fetch ALL dimensions from ALL subsidiaries but do NOT extract or store the `subsidiary` field from the response.

### Impact
1. Dimension IDs from wrong subsidiaries may be used in transactions
2. NetSuite may reject transactions with "Invalid Field Value" errors for dimensions
3. Example: Project ID 1514 (`AB&I Holdings : Lobby Remodel`) may belong to a different subsidiary

### Recommendation
1. Update dimension mappers to extract `subsidiary` field
2. Store subsidiary ID in `erp_metadata` JSONB column
3. Filter dimension dropdown lists by selected subsidiary in UI
4. Validate dimension IDs against subsidiary before push

---

## ✅ FIX IMPLEMENTED: Subsidiary Mismatch (GAP-SUB-002 / SC-2026-01-08-020)

### Problem
User selects **Euro Sub** (ID: 6) during ERP wizard setup, but expense reports were being created under **Honeycomb Holdings Inc.** (ID: 3) in NetSuite.

### Root Cause Analysis

```
ERP Setup Wizard
     ↓
User selects "Euro Sub" (ID: 6)
     ↓
Stored in erp_entity_mappings table ✓
(erp_location_id: "6", erp_location_name: "Euro Sub")
     ↓
PushReimbursementCompleteReactor
     ↓
build_expense_report_data() called
     ↓
❌ Did NOT query EntityMapping for subsidiary
❌ Did NOT include subsidiary_id in data
     ↓
NetSuite ExpenseReports Adapter
     ↓
subsidiary_id = nil (not provided)
     ↓
NetSuite API
     ↓
Used employee's PRIMARY subsidiary (Honeycomb Holdings Inc.)
```

### Entity Mapping Evidence
```
=== ENTITY MAPPING ===
ERP Location ID: 6          ← This is the NetSuite subsidiary ID for Euro Sub
ERP Location Name: Euro Sub ← User's selection during ERP wizard setup
Entity ID: <uuid>           ← Internal entity reference
```

### Fix Implemented

**File**: `push_reimbursement_complete_reactor.ex`

1. **Added EntityMapping alias**:
```elixir
# SC-2026-01-08-020: Add EntityMapping to resolve configured subsidiary
alias FlameTeampayPayables.EmberErp.Resources.Connection.EntityMapping
```

2. **Created resolve_subsidiary_from_entity_mapping/2 function**:
```elixir
# SC-2026-01-08-020: Resolve subsidiary external_id from EntityMapping
defp resolve_subsidiary_from_entity_mapping(erp_connection_id, workspace_id) do
  query =
    EntityMapping
    |> Ash.Query.filter(
      expr(erp_connection_id == ^erp_connection_id and active == true)
    )

  case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
    {:ok, mapping} ->
      Logger.info(
        "PushReimbursementCompleteReactor: Resolved subsidiary from EntityMapping: #{mapping.erp_location_id} (#{mapping.erp_location_name})"
      )
      mapping.erp_location_id
    # ... error handling ...
  end
end
```

3. **Updated load_reimbursement_data step** to resolve subsidiary:
```elixir
# SC-2026-01-08-020: Resolve subsidiary from EntityMapping
subsidiary_external_id = resolve_subsidiary_from_entity_mapping(
  push_request.erp_connection_id,
  push_request.workspace_id
)
```

4. **Updated build_expense_report_data/6** to accept and include subsidiary:
```elixir
defp build_expense_report_data(reimbursement, line_items, employee_external_id, workspace_id, _has_payment \\ false, subsidiary_external_id \\ nil) do
  %{
    # ... other fields ...
    # SC-2026-01-08-020: Include subsidiary from EntityMapping
    subsidiary_external_id: subsidiary_external_id,
    # ...
  }
end
```

### Expected Behavior After Fix
1. Reactor queries `EntityMapping` for the ERP connection
2. Retrieves `erp_location_id` (e.g., "6" for Euro Sub)
3. Passes this as `subsidiary_external_id` in expense report data
4. NetSuite adapter uses this value for the `subsidiary` field
5. Expense report is created in **Euro Sub** instead of defaulting to employee's primary subsidiary

### Verification
After restarting the server, check the logs for:
```
PushReimbursementCompleteReactor: Resolved subsidiary from EntityMapping: 6 (Euro Sub)
```

And in NetSuite, the expense report should show:
- **SUBSIDIARY**: Euro Sub

---

## 🚨 CRITICAL FINDING: Employee-Subsidiary Incompatibility (GAP-EMP-001 / SC-2026-01-08-022)

### Problem Discovered
When testing, even after passing the correct `subsidiary: {"id": "6"}` (Euro Sub), NetSuite rejected the expense report with:
```
"Transaction nexus Germany (5) is not valid for transaction subsidiary Honeycomb Holdings Inc. (3)."
```

### Root Cause Analysis
1. **User selects Euro Sub (ID: 6)** during ERP wizard setup → Stored correctly in `EntityMapping`
2. **Our code passes `subsidiary: {"id": "6"}`** in the payload → ✅ Correct
3. **Employee ID 1640** belongs to **Honeycomb Holdings Inc. (ID: 3)** in NetSuite
4. **NetSuite overrides our subsidiary** with the employee's subsidiary

**Key Insight**: NetSuite expense reports **inherit the subsidiary from the employee**, not from the explicit `subsidiary` field in the payload. If the expense report's dimensions (location, department, class) don't match the employee's subsidiary, the transaction is rejected with a nexus error.

### Solution Implemented
Added employee-subsidiary compatibility validation in `push_reimbursement_complete_reactor.ex`:

1. **Extract employee's subsidiary** from `erp_metadata.subsidiary_id` (already captured during employee sync)
2. **Compare against target subsidiary** from EntityMapping
3. **Return clear error** if mismatch, explaining how to fix:
   - Re-link employee to one in the correct subsidiary, OR
   - Select a different subsidiary in ERP settings

### Files Modified
- `push_reimbursement_complete_reactor.ex`:
  - `resolve_employee_external_id/3` now returns `{external_id, employee_subsidiary_id}` tuple
  - `resolve_subsidiary_from_entity_mapping/2` now returns `{external_id, name}` tuple
  - Added `validate_employee_subsidiary_compatibility/4` function
  - Updated `load_reimbursement_data` step to validate before proceeding

### User Action Required
The user needs to either:
1. Re-run the ERP wizard and select **Honeycomb Holdings Inc.** as the subsidiary (matching employee 1640), OR
2. Link the reimbursement to an employee that belongs to **Euro Sub**

---

## ⚠️ FINDING: Location Invalid for Subsidiary (GAP-LOC-001)

### Problem Discovered
After fixing subsidiary and employee validation, expense report push failed with:
```
"Error while accessing a resource. You have entered an Invalid Field Value 6 for the following field: location."
```

### Root Cause
The dimensions (location, department, class, project/customer) synced from NetSuite are **not filtered by subsidiary**. When we select "Euro Sub" (ID 6) during ERP setup, the synced dimensions may belong to "Honeycomb Holdings Inc." (ID 3) or other subsidiaries.

The location with external_id `6` is not a valid location for the Euro Sub subsidiary, causing NetSuite to reject it.

### Required Fix (GAP-SUB-001)
To properly support dimensions, we need:
1. Update dimension sync queries to filter by subsidiary
2. Store subsidiary information with each synced dimension
3. Validate dimensions against selected subsidiary before push
4. Filter dimension dropdowns in UI by selected subsidiary

---

## ❌ REVERTED: Customer (Project) Omission (SC-2026-01-08-021)

### Problem
After fixing subsidiary (SC-2026-01-08-020), the expense report push still failed with:
```
Error while accessing a resource. You have entered an Invalid Field Value 53385 
for the following field: customer.
```

### Root Cause
The project (customer) ID `53385` exists in NetSuite but belongs to a **different subsidiary** than Euro Sub (ID: 6). This confirms the dimension-subsidiary mismatch issue (GAP-SUB-001).

### Temporary Fix
Until proper subsidiary-aware dimension sync is implemented, the `customer_id` field is omitted from expense line items with a warning log:

```elixir
# SC-2026-01-08-021 TEST: Omit customer_id (project) temporarily
customer_id = resolve_coding_value_external_id(metadata["project"], workspace_id)
if customer_id do
  Logger.warning("PushReimbursementCompleteReactor: Skipping customer_id (project) #{customer_id} - dimension-subsidiary validation not yet implemented (GAP-SUB-001)")
end

%{
  # ... other fields ...
  # SC-2026-01-08-021 TEST: customer_id omitted until GAP-SUB-001 is resolved
  # customer_id: customer_id
}
```

### Long-Term Solution Required (GAP-SUB-001)
1. Update dimension sync queries to filter by subsidiary
2. Store subsidiary association with each synced dimension
3. Validate dimension IDs against transaction subsidiary before push
4. Fail or warn if dimension is invalid for the selected subsidiary

---

## Implementation: Test Fix SC-2026-01-08-019

### Hypothesis
Setting `complete: true` on expense reports causes NetSuite to mark them as "Paid In Full" immediately, bypassing the payment application mechanism that creates the Related Records link. By NOT setting this flag, the expense report should remain in "Awaiting Payment" status, allowing the Check payment application to:
1. Change the status to "Paid In Full"
2. Create the Related Records link between expense report and payment

### Code Change
**File**: `push_reimbursement_complete_reactor.ex`

```elixir
# SC-2026-01-08-019 TEST: Removed complete flag - NetSuite requires expense report to be in
# "Awaiting Payment" status for the Check/VendorPayment apply sublist to create the Related Records link.
# Setting complete: true causes NetSuite to mark it as "Paid In Full" immediately, bypassing the
# payment application mechanism that creates the link.
defp build_expense_report_data(reimbursement, line_items, employee_external_id, workspace_id, _has_payment \\ false) do
  %{
    # ...other fields...
    # SC-2026-01-08-019 TEST: NOT setting complete flag - payment application should change status
    # Previous: complete: has_payment
    complete: false,
    # ...rest of data...
  }
end
```

### Expected Behavior After Fix
1. Expense report pushes to NetSuite → Status: "Awaiting Payment" (or "Pending Accounting Approval" based on workflow)
2. Check/VendorPayment pushes with `apply` sublist referencing expense report
3. NetSuite processes payment application → Status changes to "Paid In Full"
4. Related Records Link appears on expense report showing the payment

---

## Investigation: Dimension Sync Subsidiary Filtering

### Finding: DIMENSIONS ARE NOT FILTERED BY SUBSIDIARY

| Dimension | SuiteQL Query | Subsidiary Filter? |
|-----------|---------------|-------------------|
| Departments | `SELECT * FROM department` | ❌ NO |
| Locations | `SELECT * FROM location` | ❌ NO |
| Classes | `SELECT * FROM classification` | ❌ NO |
| Projects | `SELECT * FROM job` | ❌ NO |
| GL Accounts | `SELECT * FROM account` | ❌ NO |
| ExpenseCategories | `SELECT * FROM expensecategory` | ❌ NO |

### Impact
This means we are syncing **ALL dimensions from ALL subsidiaries** in NetSuite. This can cause:

1. **Dimension ID Mismatches**: A dimension ID that is valid in one subsidiary may not be valid in another
2. **Invalid Field Value Errors**: NetSuite may reject transactions with dimensions from wrong subsidiaries
3. **Category Fallback Issues**: The category resolution may find a match by name but use an ID that's invalid for the transaction's subsidiary

### Related Errors Observed
- `Error while accessing a resource. You have entered an Invalid Field Value 1514 for the following field: customer.`
- This was likely caused by a project (customer) ID that exists in NetSuite but is not valid for the selected subsidiary

### Recommendation for Future Enhancement
Add subsidiary filtering to dimension sync queries:

```sql
-- For Departments (via join table)
SELECT d.* FROM department d
INNER JOIN departmentSubsidiaryMap dsm ON d.id = dsm.department
WHERE dsm.subsidiary = :selected_subsidiary_id

-- For Locations (via join table)
SELECT l.* FROM location l  
INNER JOIN locationSubsidiaryMap lsm ON l.id = lsm.location
WHERE lsm.subsidiary = :selected_subsidiary_id

-- For GL Accounts (has subsidiary field)
SELECT * FROM account WHERE subsidiary = :selected_subsidiary_id
```

---

## Session History: Complete Findings Log

### Session SC-2026-01-06-014 through SC-2026-01-08-018

#### GAP-CAT-001: Category ID Resolution (RESOLVED)
- **Issue**: `category_id` was being populated with raw UUIDs instead of NetSuite external IDs
- **Fix**: Updated reactor to resolve category UUID to external ID via `CodingValue.external_id`

#### GAP-CAT-002: ExpenseCategory GL Account Code (RESOLVED)
- **Issue**: `ExpenseCategory.gl_account_code` was empty in database, causing resolution to fail
- **Root Cause**: NetSuite's `expensecategory` table doesn't directly expose GL account linkage via SuiteQL
- **Fix**: Changed resolution logic to match by category name instead of GL account code

#### GAP-CAT-003: Category Name Number Prefix (RESOLVED)
- **Issue**: Category name in Teampay had number prefix (e.g., "1 Test Nick") from `accountsearchdisplayname`, but ExpenseCategory in NetSuite doesn't have this prefix
- **Fix**: Added name variant logic to try multiple formats:
  1. Original name: "1 Test Nick"
  2. Without number prefix: "Test Nick"
  3. Without colon format: "1 Test Nick" → "Test Nick" (for "1: Test Nick" format)

#### GAP-DIM-001: Department/Location/Class Dimension Mapping (RESOLVED)
- **Issue**: Dimensions were not being passed to NetSuite adapter
- **Fix**: Updated reactor to extract dimension UUIDs from metadata and resolve to external IDs

#### GAP-DIM-002: Customer (Project) Dimension Mapping (RESOLVED)
- **Issue**: Project dimension was not being mapped to NetSuite's `customer` field
- **Fix**: Added `customer_id` resolution for projects in expense line items

#### GAP-PAY-001: Payment Amount Field (RESOLVED)
- **Issue**: `build_payment_data/4` was trying to access `payment.amount` which doesn't exist
- **Fix**: Changed to use `reimbursement.total_amount` for payment amount

#### GAP-PAY-002: Decimal to Float Conversion (RESOLVED)
- **Issue**: `JsonBuilder` was converting Decimal to string, causing NetSuite to reject with "Unable to parse value '312.0' (String) from the Number field (total)"
- **Fix**: Changed `JsonBuilder.transform_value/1` to use `Decimal.to_float/1`

#### GAP-PAY-003: Currency ID Mismatch (RESOLVED)
- **Issue**: Expense report and payment were resolving currencies independently, leading to potential mismatches
- **Fix**: Captured `resolved_currency_id` from expense report push result and passed it to payment push

#### GAP-STATUS-001: Expense Report Complete Flag (TESTING)
- **Issue**: Setting `complete: true` causes NetSuite to mark expense report as "Paid In Full" immediately, bypassing payment application mechanism
- **Fix (SC-2026-01-08-019)**: Removed `complete: true` flag to allow payment application to change status

#### GAP-LINK-001: Related Records Link (INVESTIGATING)
- **Issue**: Related Records Link not appearing on expense report in NetSuite
- **Hypothesis**: The `complete: true` flag was preventing the payment application from creating the link
- **Test**: SC-2026-01-08-019 - Push without `complete: true` flag

#### GAP-SUB-001: Dimension Subsidiary Filtering (IDENTIFIED)
- **Issue**: Dimension syncs fetch ALL records from ALL subsidiaries
- **Impact**: May cause invalid field value errors when using dimension IDs from wrong subsidiary
- **Status**: Identified, recommendation documented for future enhancement

---

## NetSuite Technical Reference

### Check Record Endpoint
- **Endpoint**: `/services/rest/record/v1/check`
- **Purpose**: Creates a payment record (check) that can be applied to expense reports
- **Key Field**: `apply` sublist - links the check to payable documents
- **Apply Structure**:
```json
{
  "apply": {
    "items": [{
      "doc": {"id": "<expense_report_internal_id>"},
      "apply": true,
      "amount": <payment_amount>
    }]
  }
}
```

### Expense Report Status Workflow
1. **Draft** → Initial creation
2. **Pending Approval** → Submitted, awaiting approval
3. **Pending Accounting Approval** → Approved, awaiting accounting
4. **Approved** → Fully approved
5. **Awaiting Payment** → Ready for payment application
6. **Paid In Full** → Payment applied (Related Records Link created)

### Complete Flag Behavior
- `complete: true` → Skips approval workflow, sets status directly to "Paid In Full"
- This bypasses the payment application mechanism that creates Related Records links

---

## Files Modified in This Session Series

### Primary Files
1. `push_reimbursement_complete_reactor.ex` - Main reactor for reimbursement sync
2. `expense_reports.ex` - NetSuite adapter for expense report push
3. `expense_report_payments.ex` - NetSuite adapter for payment push
4. `json_builder.ex` - Decimal to float conversion fix

### Documentation Files
1. This session summary

---

## 🔍 TURN 15 ANALYSIS: Test Results for RT0020

### Test Execution Summary (January 8, 2026)

| Request # | ID | Amount | Error/Status |
|-----------|---|--------|--------------|
| **REIM-2026-0066** | `647310ba...` | $120 | ✅ **partial** - Expense report pushed (ext: 615466), **payment NOT pushed** |
| REIM-2026-0065 | `21a8877f...` | $119 | ❌ `Invalid Field Value 53384 for customer` |
| **REIM-2026-0064 (RT0020)** | `abe37418...` | $118 | ❌ `Invalid Field Value 6 for location` |
| REIM-2026-0063 (RT0017) | `a794cdbc...` | $117 | ❌ `Invalid Field Value 6 for location` |

### Key Finding: RT0020 FAILED
The user reported RT0020 was uploaded successfully, but database records confirm it **FAILED** with:
```
"Error while accessing a resource. You have entered an Invalid Field Value 6 for the following field: location."
```

The NetSuite screenshot showing EXP09422835 is from **REIM-2026-0066** (a different reimbursement), not RT0020!

### Comparison: Why REIM-2026-0066 Succeeded

| Field | REIM-2026-0064 (RT0020) - FAILED | REIM-2026-0066 - SUCCESS |
|-------|----------------------------------|--------------------------|
| Location | `abd3cb54...` → "6 - Tipalti" (ext_id: 6) | `9d5b96a1...` → "9 - Berlin" (ext_id: 9) |
| Project | `99060840...` → "PROJECT_1_FOR_EURO_SUB" | **NO PROJECT** |
| Department | `548b209c...` → "1 - Admin" | `548b209c...` → "1 - Admin" |
| Class | `202c4685...` → "10 - Accessories" | `202c4685...` → "10 - Accessories" |

**Key Differences:**
1. Location "6 - Tipalti" (ext_id: 6) is **NOT valid for Euro Sub** - causes failure
2. Location "9 - Berlin" (ext_id: 9) **IS valid for Euro Sub** - allows success
3. Having a project dimension causes a secondary failure (customer_id: 53384 invalid)

### GAP-PAY-005: Payment Push Silent Failure (INVESTIGATING)

For the successful expense report push (REIM-2026-0066):
- ✅ Expense report pushed (external_id: 615466)
- ✅ Payment exists with `payment_status = completed`
- ❌ **No payment entity record created** - payment push failed silently
- ❓ Failure reason not captured in metadata (fixed with SC-2026-01-08-024)

**Possible Causes:**
1. Missing `bank_account_id` - NetSuite Check records may require an account
2. NetSuite API error not being captured properly
3. Configuration issue with the payment adapter

**Fix Applied (SC-2026-01-08-024):**
- Added `payment_failure_reason` to push_metadata
- Added debug logging for payment data before push
- Next push attempt will capture the actual failure reason

---

## Next Steps

1. **Test SC-2026-01-08-019**: Restart server, create new reimbursement, sync and verify:
   - Expense report status is NOT "Paid In Full" immediately
   - Payment push executes successfully
   - Related Records Link appears on expense report

2. **If test succeeds**: The `complete: true` flag was the issue. Consider adding logic to only set complete when there's NO payment (for immediate completion scenarios).

3. **If test fails**: Further investigate NetSuite's expense report workflow and check record linking requirements.

4. **Future Enhancement**: Implement subsidiary filtering for dimension syncs to prevent cross-subsidiary dimension ID issues.

---

## Committee Members Active in This Session

- **Chair**: Session direction and routing
- **Technical Specialist**: Implementation of test fix
- **Data Mapping Specialist**: Dimension sync investigation
- **Scribe**: Documentation and session recording

---

*Document generated by Sync Committee - SC-2026-01-08-018*

