# Engineering Handoff: Complete Sync Pipeline

> **Session:** SC-2025-12-23-002
> **Date:** 2025-12-23
> **Status:** Ready for Implementation

---

## Executive Summary

The Sync Committee has completed a thorough review of the sync and bridge architecture. We identified that **dimension sync is incomplete** (jobs, custom_dimensions) and **transaction sync is not implemented** (bills, expense_reports, ap_payments).

**Key Finding:** The bridge infrastructure is complete and waiting for records. The gap is entirely on the sync (mirroring) side.

---

## Architecture Overview

There are **two distinct flows** that operate independently:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  FLOW 1: MIRRORING (ERP → Raw Mirror Tables)                                  ║
║  Location: ember_erp/                                                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  WorkspaceSyncWorker (Oban, queue: :erp_sync)                                ║
║       │                                                                       ║
║       ▼                                                                       ║
║  WorkspaceSyncReactor                                                         ║
║       │  Determines entities via @entity_order + tiered sync                 ║
║       ▼                                                                       ║
║  EntitySyncService.sync_entity/3                                             ║
║       │  Paginated fetch → bulk_upsert dispatch                              ║
║       ▼                                                                       ║
║  BulkUpsertService (e.g., DepartmentBulkUpsertService)                       ║
║       │  Maps via MapperRegistry → Ash.bulk_create with upsert               ║
║       ▼                                                                       ║
║  Accounting Mirror Resource (e.g., Accounting.Core.Department)               ║
║       Table: ember_erp_accounting_*                                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║  FLOW 2: BRIDGING (Mirror Tables → CodingCategory/CodingValue)               ║
║  Location: ember_bridge/                                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  BridgeWorker (Oban, queue: :bridge, every 2 min)                            ║
║       │                                                                       ║
║       ▼                                                                       ║
║  BridgeReactor (8 steps, independent)                                        ║
║       │                                                                       ║
║       ▼                                                                       ║
║  DimensionBridgeService.bridge_entity_type/4                                 ║
║       │  Query: WHERE bridged_at IS NULL OR updated_at > bridged_at          ║
║       ▼                                                                       ║
║  CodingCategory + CodingValue (ember_coding/)                                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Entity Classification

### Category 1: TRUE DIMENSIONS (Sync AND Bridge)

Used for coding expense line items. **Must sync AND bridge to CodingValue.**

| Entity | Current Sync | Current Bridge | Gap |
|--------|--------------|----------------|-----|
| departments | ✅ Working | ✅ Working | None |
| locations | ✅ Working | ✅ Working | None |
| classes | ✅ Working | ✅ Working | None |
| projects | ✅ Working | ✅ Working | None |
| gl_accounts | ✅ Working | ✅ Working | None |
| expense_categories | ✅ Working | ✅ Working | None |
| **jobs** | ❌ Not synced | ✅ Bridge exists | **SYNC GAP** |
| **custom_dimensions** | ❌ Not synced | ✅ Bridge exists | **SYNC GAP** |
| **custom_dimension_values** | ❌ Not synced | ✅ Bridge exists | **SYNC GAP** |

### Category 2: PARTIES (Sync Only, No Bridge)

Referenced by transactions via FK. **Sync only, no bridge needed.**

| Entity | Current Sync | Bridge Needed | Status |
|--------|--------------|---------------|--------|
| vendors | ✅ Working | No | ✅ Complete |
| employees | ✅ Working | No | ✅ Complete |
| customers | ✅ Working | No | ✅ Complete |

### Category 3: REFERENCE DATA (Sync Only, No Bridge)

System context data. **Sync only, no bridge needed.**

| Entity | Current Sync | Bridge Needed | Status |
|--------|--------------|---------------|--------|
| currencies | ✅ Working | No | ✅ Complete |
| subsidiaries | ✅ Working | No | ✅ Complete |
| accounting_periods | ✅ Working | No | ✅ Complete |

### Category 4: TRANSACTIONS (Sync Only, No Bridge)

Financial documents. **Sync only for reconciliation, no bridge needed.**

| Entity | Current Sync | Bridge Needed | Gap |
|--------|--------------|---------------|-----|
| **bills** | ❌ Not synced | No | **SYNC GAP** |
| **bill_line_items** | ❌ Not synced | No | **SYNC GAP** |
| **ap_payments** | ❌ Not synced | No | **SYNC GAP** |
| **expense_reports** | ❌ Not synced | No | **SYNC GAP** |
| **expense_line_items** | ❌ Not synced | No | **SYNC GAP** |

---

## Gap Analysis

### Why Dimensions (jobs, custom_dimensions) Don't Sync

1. **Not in @entity_order** - `WorkspaceSyncReactor` line 62-75 doesn't include them
2. **No BulkUpsertService** - No `JobBulkUpsertService` exists
3. **No EntitySyncService route** - `bulk_upsert(:jobs, ...)` not defined

### Why Transactions Don't Sync

1. **In @entity_tiers but filtered out** - HOT tier entities are filtered by line 529:
   ```elixir
   |> Enum.filter(&(&1 in @entity_order))  # FILTERS OUT bills, expense_reports, ap_payments
   ```
2. **No BulkUpsertService** - None exist for transactions
3. **No EntitySyncService route** - Not defined

---

## Implementation Plan

### Phase 1: Dimension Sync (jobs, custom_dimensions)

**Effort:** ~4-6 hours

#### Task 1.1: Add to @entity_order

File: `ember_erp/resources/reactors/sync/workspace_sync_reactor.ex`

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
  :jobs,                    # ADD
  :custom_dimensions,       # ADD (Sage Intacct)
  :custom_dimension_values, # ADD (Sage Intacct)
  :customers,
  :vendors,
  :employees
]
```

#### Task 1.2: Create JobBulkUpsertService

File: `ember_erp/services/bulk/job_bulk_upsert_service.ex`

Follow pattern from `DepartmentBulkUpsertService`:
- Map via MapperRegistry
- Ash.bulk_create with upsert?: true
- Identity: :unique_erp_job

#### Task 1.3: Create CustomDimensionBulkUpsertService

File: `ember_erp/services/bulk/custom_dimension_bulk_upsert_service.ex`

#### Task 1.4: Create CustomDimensionValueBulkUpsertService

File: `ember_erp/services/bulk/custom_dimension_value_bulk_upsert_service.ex`

#### Task 1.5: Add EntitySyncService Routes

File: `ember_erp/services/entity_sync_service.ex`

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

---

### Phase 2: Transaction Sync (bills, expense_reports, ap_payments)

**Effort:** ~8-12 hours

#### Task 2.1: Add to @entity_order

```elixir
@entity_order [
  # ... existing ...
  :employees,
  :bills,              # ADD
  :bill_line_items,    # ADD
  :ap_payments,        # ADD
  :expense_reports,    # ADD
  :expense_line_items  # ADD
]
```

Note: Transactions should come AFTER parties so vendor/employee lookups can resolve.

#### Task 2.2: Create BillBulkUpsertService

File: `ember_erp/services/bulk/bill_bulk_upsert_service.ex`

**Complexity:** Must resolve `vendor_id` from `vendor_number` via mirror lookup.

#### Task 2.3: Create BillLineItemBulkUpsertService

File: `ember_erp/services/bulk/bill_line_item_bulk_upsert_service.ex`

**Complexity:** Must resolve `bill_id` from parent bill.

#### Task 2.4: Create APPaymentBulkUpsertService

File: `ember_erp/services/bulk/ap_payment_bulk_upsert_service.ex`

#### Task 2.5: Create ExpenseReportBulkUpsertService

File: `ember_erp/services/bulk/expense_report_bulk_upsert_service.ex`

**Complexity:** Must resolve `employee_id` from `employee_number`.

#### Task 2.6: Create ExpenseLineItemBulkUpsertService

File: `ember_erp/services/bulk/expense_line_item_bulk_upsert_service.ex`

#### Task 2.7: Add EntitySyncService Routes

Add all 5 new routes following established pattern.

---

### Phase 3: Verification & Testing

**Effort:** ~4-6 hours

1. **Unit tests** for each BulkUpsertService
2. **Integration test**: Run sync, verify records in mirror tables
3. **Bridge verification**: Confirm BridgeWorker picks up new dimension records
4. **Reconciliation test**: For transactions, verify Option D flow works

---

## File Locations Reference

| Component | Path |
|-----------|------|
| WorkspaceSyncWorker | `ember_erp/workers/workspace_sync_worker.ex` |
| WorkspaceSyncReactor | `ember_erp/resources/reactors/sync/workspace_sync_reactor.ex` |
| EntitySyncService | `ember_erp/services/entity_sync_service.ex` |
| Bulk Upsert Services | `ember_erp/services/bulk/*.ex` |
| Sync Capabilities | `ember_erp/adapters/providers/{provider}/capabilities/sync/` |
| Mirror Resources | `ember_erp/resources/accounting/**/*.ex` |
| BridgeWorker | `ember_bridge/workers/bridge_worker.ex` |
| BridgeReactor | `ember_bridge/reactors/bridge_reactor.ex` |
| DimensionBridgeService | `ember_bridge/services/dimension_bridge_service.ex` |

---

## Success Criteria

- [ ] Jobs sync from Sage Intacct and appear in ember_erp_accounting_jobs
- [ ] Jobs are bridged to CodingValue with category_code "JOB"
- [ ] Custom dimensions sync and bridge correctly
- [ ] Bills sync from all ERPs and appear in ember_erp_accounting_bills
- [ ] Expense reports sync and link to employee records
- [ ] AP payments sync correctly
- [ ] Existing dimension sync continues to work (no regression)
- [ ] Existing bridge continues to work (no regression)

---

*Document prepared by Sync Committee — Session SC-2025-12-23-002*

