# Task Assignments: Complete Sync Pipeline

> **Session:** SC-2025-12-23-002
> **Date:** 2025-12-23
> **Status:** Ready for Engineering Subcommittee

---

## Overview

| Phase | Focus | Estimated Effort | Priority |
|-------|-------|------------------|----------|
| Phase 1 | Dimension Sync (jobs, custom_dimensions) | 4-6 hours | 🔴 High |
| Phase 2 | Transaction Sync (bills, expense_reports, etc.) | 8-12 hours | 🔴 High |
| Phase 3 | Verification & Testing | 4-6 hours | 🟡 Medium |

**Total Effort:** 16-24 hours

---

## Phase 1: Dimension Sync

### TASK-1.1: Add Dimensions to @entity_order

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/sync/workspace_sync_reactor.ex`

**Action:** Update `@entity_order` module attribute

```elixir
@entity_order [
  :currencies,
  :subsidiaries,
  :accounting_periods,
  :departments,
  :locations,
  :classes,
  :gl_accounts,
  :expense_categories,
  :projects,
  :jobs,                    # ADD - Sage Intacct dimension
  :custom_dimensions,       # ADD - Sage Intacct UDDs
  :custom_dimension_values, # ADD - Sage Intacct UDD values
  :customers,
  :vendors,
  :employees
]
```

**Effort:** 15 minutes
**Dependencies:** None
**Verification:** Compile succeeds

---

### TASK-1.2: Create JobBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/job_bulk_upsert_service.ex`

**Template:** Copy from `department_bulk_upsert_service.ex`

**Key Changes:**
- Resource: `Accounting.Core.Job`
- Identity: `:unique_erp_job`
- Upsert fields: `[:job_code, :name, :description, :project_id, :status, ...]`

**Effort:** 1 hour
**Dependencies:** Job resource exists ✅
**Verification:** 
- `JobBulkUpsertService.upsert_batch([...], connection)` works
- Records appear in `ember_erp_accounting_jobs`

---

### TASK-1.3: Create CustomDimensionBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/custom_dimension_bulk_upsert_service.ex`

**Effort:** 1 hour
**Dependencies:** CustomDimension resource exists ✅

---

### TASK-1.4: Create CustomDimensionValueBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/custom_dimension_value_bulk_upsert_service.ex`

**Effort:** 1 hour
**Dependencies:** CustomDimensionValue resource exists ✅

---

### TASK-1.5: Add EntitySyncService Routes

**File:** `lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex`

**Action:** Add before the catch-all clause (before line 300)

```elixir
defp bulk_upsert(:jobs, records, connection, entity_id) do
  Bulk.JobBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:custom_dimensions, records, connection, entity_id) do
  Bulk.CustomDimensionBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:custom_dimension_values, records, connection, entity_id) do
  Bulk.CustomDimensionValueBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end
```

**Effort:** 30 minutes
**Dependencies:** TASK-1.2, TASK-1.3, TASK-1.4
**Verification:** No `:unsupported_entity_type` error for these types

---

### TASK-1.6: Verify Bridge Picks Up Jobs

**Action:** Manual verification

1. Trigger a sync for a Sage Intacct connection
2. Confirm records in `ember_erp_accounting_jobs`
3. Wait for BridgeWorker (or trigger manually)
4. Confirm `coding_values` created with `category_code = 'JOB'`
5. Confirm `bridged_at` is set on Job records

**Effort:** 30 minutes
**Dependencies:** TASK-1.1 through TASK-1.5

---

## Phase 2: Transaction Sync

### TASK-2.1: Add Transactions to @entity_order

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/sync/workspace_sync_reactor.ex`

**Action:** Append after employees (parties must sync first for FK resolution)

```elixir
@entity_order [
  # ... existing 15 entities ...
  :employees,
  # Transaction entities - sync AFTER parties
  :bills,
  :bill_line_items,
  :ap_payments,
  :expense_reports,
  :expense_line_items
]
```

**Effort:** 15 minutes
**Dependencies:** Phase 1 complete

---

### TASK-2.2: Create BillBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/bill_bulk_upsert_service.ex`

**Complexity:** High — must resolve `vendor_id` from `vendor_number`

```elixir
# Pseudo-code for vendor resolution
defp resolve_vendor_id(vendor_number, workspace_id) do
  case Vendor
       |> Ash.Query.filter(vendor_number == ^vendor_number)
       |> Ash.read_one(tenant: workspace_id, authorize?: false) do
    {:ok, vendor} when not is_nil(vendor) -> vendor.id
    _ -> nil  # Allow nil, will be linked on next sync
  end
end
```

**Effort:** 2 hours
**Dependencies:** Vendor sync working ✅

---

### TASK-2.3: Create BillLineItemBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/bill_line_item_bulk_upsert_service.ex`

**Complexity:** Medium — must resolve `bill_id` from parent bill external_id

**Effort:** 1.5 hours
**Dependencies:** TASK-2.2

---

### TASK-2.4: Create APPaymentBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/ap_payment_bulk_upsert_service.ex`

**Complexity:** Medium — vendor resolution similar to bills

**Effort:** 1.5 hours
**Dependencies:** Vendor sync working ✅

---

### TASK-2.5: Create ExpenseReportBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/expense_report_bulk_upsert_service.ex`

**Complexity:** Medium — must resolve `employee_id` from `employee_number`

**Effort:** 1.5 hours
**Dependencies:** Employee sync working ✅

---

### TASK-2.6: Create ExpenseLineItemBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/expense_line_item_bulk_upsert_service.ex`

**Complexity:** Medium — must resolve `expense_report_id` from parent

**Effort:** 1.5 hours
**Dependencies:** TASK-2.5

---

### TASK-2.7: Add EntitySyncService Routes (Transactions)

**File:** `lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex`

```elixir
defp bulk_upsert(:bills, records, connection, entity_id) do
  Bulk.BillBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:bill_line_items, records, connection, entity_id) do
  Bulk.BillLineItemBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:ap_payments, records, connection, entity_id) do
  Bulk.APPaymentBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:expense_reports, records, connection, entity_id) do
  Bulk.ExpenseReportBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end

defp bulk_upsert(:expense_line_items, records, connection, entity_id) do
  Bulk.ExpenseLineItemBulkUpsertService.upsert_batch(records, connection, entity_id: entity_id)
end
```

**Effort:** 30 minutes
**Dependencies:** TASK-2.2 through TASK-2.6

---

## Phase 3: Verification & Testing

### TASK-3.1: Unit Tests for BulkUpsertServices

**Files:** `test/flame_teampay_payables/ember_erp/services/bulk/*_test.exs`

**Coverage:**
- Happy path: valid records upsert
- Conflict handling: update on duplicate
- Invalid data: graceful failure
- FK resolution: vendor/employee lookup

**Effort:** 2 hours

---

### TASK-3.2: Integration Test - Full Sync Flow

**Action:** End-to-end test

1. Connect to sandbox ERP
2. Trigger full sync
3. Verify all entity types populate mirrors
4. Verify bridge creates CodingValues for dimensions
5. Verify transactions have correct FK links

**Effort:** 2 hours

---

### TASK-3.3: Regression Test

**Action:** Verify existing sync/bridge still works

1. Departments still sync and bridge
2. Vendors still sync
3. No performance regression
4. Tiered sync still works correctly

**Effort:** 1 hour

---

## Checklist

### Phase 1: Dimensions
- [ ] TASK-1.1: @entity_order updated
- [ ] TASK-1.2: JobBulkUpsertService created
- [ ] TASK-1.3: CustomDimensionBulkUpsertService created
- [ ] TASK-1.4: CustomDimensionValueBulkUpsertService created
- [ ] TASK-1.5: EntitySyncService routes added
- [ ] TASK-1.6: Bridge verification passed

### Phase 2: Transactions
- [ ] TASK-2.1: @entity_order updated with transactions
- [ ] TASK-2.2: BillBulkUpsertService created
- [ ] TASK-2.3: BillLineItemBulkUpsertService created
- [ ] TASK-2.4: APPaymentBulkUpsertService created
- [ ] TASK-2.5: ExpenseReportBulkUpsertService created
- [ ] TASK-2.6: ExpenseLineItemBulkUpsertService created
- [ ] TASK-2.7: EntitySyncService routes added

### Phase 3: Verification
- [ ] TASK-3.1: Unit tests passing
- [ ] TASK-3.2: Integration test passing
- [ ] TASK-3.3: Regression test passing

---

## Notes

- All new BulkUpsertServices should follow the pattern in `DepartmentBulkUpsertService`
- Use `authorize?: false` for background sync operations
- Use `MapperRegistry` for provider-specific field mapping
- Transactions don't need bridging — they're sync-only for reconciliation
- Jobs and custom_dimensions need bridging — but bridge already exists, just waiting for records

---

*Task assignments prepared by Sync Committee — Session SC-2025-12-23-002*

