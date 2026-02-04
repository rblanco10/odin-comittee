# SC-2025-12-24-003: Comprehensive ERP Integration Gap Analysis

> **Session:** SC-2025-12-24-003
> **Date:** 2025-12-24
> **Status:** ANALYSIS COMPLETE — Critical Gaps Identified
> **Committee:** Full Sync Committee (8 members reviewed)

---

## Executive Summary

The Sync Committee conducted a comprehensive audit of all 4 ERP providers (NetSuite, QuickBooks, Sage Intacct, Acumatica) across Sync, Push, and Bridge integration paths. 

**Finding: The system is NOT production-ready for the WorkspaceSyncReactor path due to missing `fetch_page/3` implementations.**

### Key Statistics

| Layer | Status |
|-------|--------|
| **Adapter Capabilities** | ✅ All 4 ERPs properly declared |
| **CapabilityRouter** | ✅ All entity routes complete |
| **BulkUpsertServices** | ✅ 23 entity services complete |
| **EntitySyncService Routes** | ✅ 23 bulk_upsert routes complete |
| **Push Capabilities** | ✅ 42 push modules across 4 ERPs |
| **BridgeReactor** | ✅ 21 steps complete |
| **Reconciliation Services** | ✅ 10 services complete |
| **fetch_page/3** | ❌ 21/71 modules (30% coverage) |

---

## 🚨 CRITICAL GAP: `fetch_page/3` Implementation

### The Problem

The `EntitySyncService.sync_entity/3` function calls `CapabilityRouter.fetch_page/4`, which requires each sync capability module to implement `fetch_page/3`. Most capability modules only implement `fetch/2`.

**This means the WorkspaceSyncReactor cannot sync most entity types.**

### Gap Matrix (Updated with Verified Counts)

| Provider | Has `fetch_page/3` | Required | **Gap** |
|----------|-------------------|----------|---------|
| **NetSuite** | 12 modules | ~19 modules | 7 missing |
| **QuickBooks** | 3 modules | ~18 modules | 15 missing |
| **Sage Intacct** | 0 modules | ~18 modules | **18 missing** |
| **Acumatica** | 6 modules | ~16 modules | 10 missing |
| **TOTAL** | **21 modules** | **~71 modules** | **50 missing (70%)** |

### NetSuite Detail (Best Case - 12/19 implemented)

| Category | Has `fetch_page/3` | Missing `fetch_page/3` |
|----------|-------------------|----------------------|
| Core/GL | ✅ currencies, departments, locations, classes, gl_accounts, projects, accounting_periods, subsidiaries (8) | — |
| Parties | ✅ vendors, employees, customers (3) | — |
| Expense | ✅ expense_categories (1) | ❌ expense_reports, expense_line_items, expense_report_payments |
| AP | — | ❌ bills, bill_line_items, ap_payments, ap_payment_applications, vendor_credits |
| Treasury | — | ❌ bank_accounts |
| Custom | — | ❌ custom_dimensions, custom_dimension_values |

### QuickBooks Detail (3/18 implemented)

| Category | Has `fetch_page/3` | Missing `fetch_page/3` |
|----------|-------------------|----------------------|
| Core/GL | ✅ currencies, accounting_periods, subsidiaries (3) | ❌ departments, locations, classes, gl_accounts, expense_categories, projects |
| Parties | — | ❌ vendors, employees, customers |
| AP | — | ❌ bills, bill_line_items, ap_payments, ap_payment_applications, vendor_credits |
| Expense | — | ❌ expense_reports, expense_line_items |
| Treasury | — | ❌ bank_accounts |

### Sage Intacct Detail (Worst Case - 0/18 implemented)

**ALL sync capabilities only have `fetch/2`, NO `fetch_page/3` implementations.**

This means **Sage Intacct is completely non-functional** with the WorkspaceSyncReactor.

### Acumatica Detail (6/16 implemented)

| Category | Has `fetch_page/3` | Missing `fetch_page/3` |
|----------|-------------------|----------------------|
| Core/GL | ✅ currencies, accounting_periods, subsidiaries, projects (4) | ❌ departments, locations, classes, gl_accounts, expense_categories |
| Parties | ✅ customers (1) | ❌ vendors, employees |
| Treasury | ✅ bank_accounts (1) | — |
| AP | — | ❌ bills, bill_line_items, ap_payments, ap_payment_applications, vendor_credits |
| Expense | — | ❌ expense_reports, expense_line_items, expense_report_payments |

---

## Architecture Finding: Dual Sync Paths

### Current State

The codebase has TWO active sync paths:

| Path | Used By | Entry Point |
|------|---------|-------------|
| **WorkspaceSyncReactor** | WorkspaceSyncWorker (Oban cron) | EntitySyncService → CapabilityRouter.fetch_page → **fetch_page/3** |
| **SyncReactor** | InterventionService, ExecuteScheduledSync | Direct adapter call → **fetch/2** |

### Usage Locations

```
SyncReactor.run called from:
├── intervention_service.ex (line 554) — Manual entity sync
└── execute_scheduled_sync.ex (line 76) — Scheduled per-entity sync
```

### Issue

- WorkspaceSyncReactor uses the NEW streaming pattern (fetch_page/3)
- SyncReactor uses the OLD batch pattern (fetch/2)
- Most capability modules only implement the OLD pattern
- **Result: WorkspaceSyncReactor cannot sync most entities**

---

## Per-Provider Audit Results

### NetSuite ✅ BEST POSITIONED

| Area | Status | Notes |
|------|--------|-------|
| **Adapter Capabilities** | ✅ Complete | 26 sync + 11 push declared |
| **CapabilityRouter** | ✅ Complete | All 19 entities routed |
| **fetch_page/3** | ⚠️ **63%** | 12/19 implemented (Core/GL + Parties) |
| **Push Modules** | ✅ Complete | 12 push modules exist |
| **BulkUpsert** | ✅ Complete | All 23 services route correctly |

**Production Ready Entities:** currencies, departments, locations, classes, gl_accounts, projects, accounting_periods, subsidiaries, vendors, employees, customers, expense_categories

### QuickBooks ⚠️ NEEDS WORK

| Area | Status | Notes |
|------|--------|-------|
| **Adapter Capabilities** | ✅ Complete | 22 sync + 12 push declared |
| **CapabilityRouter** | ✅ Complete | All 18 entities routed |
| **fetch_page/3** | ❌ **17%** | 3/18 implemented |
| **Push Modules** | ✅ Complete | 12 push modules exist |
| **Legacy Code** | ⚠️ Found | QuickBooks has separate persister reactors |

**Production Ready Entities:** currencies, accounting_periods, subsidiaries ONLY

### Sage Intacct ❌ BLOCKED

| Area | Status | Notes |
|------|--------|-------|
| **Adapter Capabilities** | ✅ Complete | 18 sync + 9 push declared |
| **CapabilityRouter** | ✅ Complete | All 18 entities routed |
| **fetch_page/3** | ❌ **0%** | 0/18 implemented |
| **Push Modules** | ✅ Complete | 9 push modules exist |

**Production Ready Entities:** NONE — Cannot sync with WorkspaceSyncReactor

### Acumatica ⚠️ NEEDS WORK

| Area | Status | Notes |
|------|--------|-------|
| **Adapter Capabilities** | ✅ Complete | 16 sync + 9 push declared |
| **CapabilityRouter** | ✅ Complete | All 16 entities routed |
| **fetch_page/3** | ⚠️ **38%** | 6/16 implemented |
| **Push Modules** | ✅ Complete | 9 push modules exist |

**Production Ready Entities:** currencies, accounting_periods, subsidiaries, projects, customers, bank_accounts

---

## Bridge & Reconciliation Audit

### BridgeReactor

| Area | Status |
|------|--------|
| Dimension Bridging (Steps 1-8) | ✅ Complete |
| Push Reconciliation (Steps 9-19) | ✅ Complete |
| Entity Wrapping (Steps 20-21) | ✅ Complete |
| Total Steps | 21 |

### Reconciliation Services

All 10 entity-specific reconciliation services exist:
- ✅ BillReconciliationService
- ✅ BillLineItemReconciliationService
- ✅ ExpenseReportReconciliationService
- ✅ ExpenseLineItemReconciliationService
- ✅ ExpenseReportPaymentReconciliationService
- ✅ APPaymentReconciliationService
- ✅ APPaymentApplicationReconciliationService
- ✅ VendorReconciliationService
- ✅ JournalEntryReconciliationService
- ✅ VendorCreditReconciliationService

---

## Legacy Code Findings

### SyncRecord References

**27 files** still reference `SyncRecord`. Per memory [[memory:12552562]], the SyncRecord system was supposed to be deleted in SC-2025-12-23-009.

| File Category | Count | Action Needed |
|---------------|-------|---------------|
| QuickBooks persisters | 11 | Evaluate if still used |
| Services | 8 | Verify and clean |
| Domain | 3 | Resource may still exist |
| Other | 5 | Investigate |

### DomainSyncTask/ExecuteTask

**5 files** still reference these patterns:
- `ember_erp/domain.ex`
- `bridge_reactor.ex` (comment only)
- `employee_linking_service.ex` (comment only)
- `vendor_wrapper_service.ex` (comment only)
- `monitor_sync_health_worker.ex`

---

## Recommendations

### Priority 1: Implement `fetch_page/3` (BLOCKING)

**Effort:** 3-5 days per provider

For the WorkspaceSyncReactor to work, each sync capability module needs:

```elixir
@doc """
Fetch one page of records for streaming sync.
"""
def fetch_page(config, cursor, opts \\ []) do
  page_size = Keyword.get(opts, :page_size, 500)
  offset = Map.get(cursor || %{}, :offset, 0)
  
  case fetch_internal(config, offset: offset, limit: page_size) do
    {:ok, records} ->
      has_more = length(records) >= page_size
      next_cursor = if has_more, do: %{offset: offset + page_size}, else: nil
      {:ok, %{records: records, next_cursor: next_cursor, has_more: has_more}}
    error -> error
  end
end
```

**Implementation Order:**
1. Sage Intacct (0% → 100%) — Highest priority, most at risk
2. QuickBooks (14% → 100%)
3. Acumatica (27% → 100%)
4. NetSuite (46% → 100%)

### Priority 2: Unify Sync Paths

Either:
- **Option A:** Migrate SyncReactor callers to WorkspaceSyncReactor
- **Option B:** Make SyncReactor use fetch_page/3 pattern too
- **Option C:** Document the intentional dual-path design

Recommended: **Option A** for simplicity.

### Priority 3: Clean Up Legacy Code

1. Audit SyncRecord usage and remove if truly deprecated
2. Verify QuickBooks persister reactors are needed
3. Clean up DomainSyncTask/ExecuteTask comments

---

## Files Requiring Changes

### High Priority (fetch_page/3 implementation)

**Sage Intacct (23 files):**
```
lib/.../sage_intacct/capabilities/sync/
├── core/ (9 files)
├── ap/ (5 files)
├── expense/ (4 files)
├── parties/ (2 files)
├── treasury/ (1 file)
└── budget/ (1 file)
```

**QuickBooks (18 files missing):**
```
lib/.../quickbooks/capabilities/sync/
├── core/ (4 files) - departments, locations, classes, accounts
├── ap/ (6 files)
├── expense/ (3 files)
├── parties/ (3 files)
└── treasury/ (1 file)
```

**NetSuite (14 files missing):**
```
lib/.../netsuite/capabilities/sync/
├── ap/ (5 files) - bills, bill_line_items, ap_payments, ap_payment_applications, vendor_credits
├── expense/ (3 files) - expense_reports, expense_line_items, expense_report_payments
└── treasury/ (1 file) - bank_accounts
```

**Acumatica (16 files missing):**
```
lib/.../acumatica/capabilities/sync/
├── core/ (4 files)
├── ap/ (5 files)
├── expense/ (4 files)
├── parties/ (2 files)
└── budget/ (1 file)
```

---

## Verification Checklist

After implementing `fetch_page/3`:

- [ ] All capability modules implement `fetch_page/3`
- [ ] WorkspaceSyncReactor can sync all entity types
- [ ] EntitySyncService tests pass for each entity
- [ ] Tiered sync works correctly (hot/warm/cold/static)
- [ ] No regression in existing SyncReactor flows
- [ ] Legacy code cleaned up

---

## ✅ What IS Production Ready

| Layer | Status | Coverage |
|-------|--------|----------|
| **Adapter Capabilities** | ✅ Complete | 4/4 providers |
| **CapabilityRouter Routing** | ✅ Complete | All 71 entity routes |
| **EntitySyncService** | ✅ Complete | 23 bulk_upsert routes |
| **BulkUpsertServices** | ✅ Complete | 23 entity services |
| **Push Capability Modules** | ✅ Complete | 42 modules (NS:12, QBO:12, SI:9, ACU:9) |
| **BridgeReactor** | ✅ Complete | 21 steps |
| **Reconciliation Services** | ✅ Complete | 10 services |
| **VendorWrapper/EmployeeLinking** | ✅ Complete | wrap_all_unbridged, link_all_unbridged |

---

---

## 🔴 GAP #2: Dead SyncRecord References (27 Files)

### The Problem

Per SC-2025-12-23-009, `SyncRecord` resource was **deleted** from the domain (confirmed in `domain.ex` line 59):
```elixir
# SyncRecord and DomainSyncTask removed in SC-2025-12-23-009
# Legacy parallel sync system replaced with BridgeReactor
```

**However, 27 files still reference `SyncRecord`, including ACTIVE WORKERS.**

### Impact

| Severity | Issue |
|----------|-------|
| 🔴 **CRITICAL** | `ProcessEntityTypeWorker` (Oban worker) directly imports and uses SyncRecord |
| 🔴 **CRITICAL** | `InitialSyncService` references SyncRecord |
| 🟡 **BROKEN** | 11 QuickBooks persister reactors reference SyncRecord |
| 🟡 **BROKEN** | `MonitorSyncHealthWorker` queries SyncRecord |
| ⚠️ **DEAD CODE** | Various services have dead imports/aliases |

### Files with Dead SyncRecord References

**Critical (Active Workers):**
| File | Status |
|------|--------|
| `workers/process_entity_type_worker.ex` | 🔴 Active Oban worker — **WILL CRASH** |
| `services/initial_sync_service.ex` | 🔴 Active service — **WILL CRASH** |

**QuickBooks Legacy Persisters (11 files):**
| File | Status |
|------|--------|
| `quickbooks/reactors/persisters/bills_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/classes_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/company_profile_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/customers_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/departments_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/employees_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/expense_categories_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/gl_accounts_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/jobs_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/locations_persister_reactor.ex` | 🟡 Legacy |
| `quickbooks/reactors/persisters/vendors_persister_reactor.ex` | 🟡 Legacy |

**Other Dead References:**
| File | Status |
|------|--------|
| `quickbooks/helpers/sync_record_helper.ex` | ⚠️ Dead helper module |
| `quickbooks/services/full_data_sync_persister.ex` | ⚠️ Dead imports |
| `quickbooks/services/full_data_sync_orchestrator.ex` | ⚠️ Dead imports |
| `quickbooks/services/initial_sync_worker.ex` | ⚠️ Dead imports |
| `workers/monitor_sync_health_worker.ex` | ⚠️ Dead queries |
| `services/observatory_service.ex` | ⚠️ Dead queries |
| `services/dimension_value_service.ex` | ⚠️ Dead imports |
| `services/erp_connection_nuke_service.ex` | ⚠️ Dead cleanup code |
| `netsuite/services/accounting_sync_handler.ex` | ⚠️ Dead imports |
| `resources/sync_log/sync_execution.ex` | ⚠️ Has_many to deleted resource |
| `reactors/sync/sync_reactor.ex` | ⚠️ Dead reactor |
| `coding/integrations/erp/unified_dimension_bridge_service.ex` | ⚠️ Dead imports |
| `coding/integrations/erp/coding_projector.ex` | ⚠️ Dead imports |

---

## 🟡 GAP #3: TODO/FIXME Items (16 Real Issues)

### Critical — Stub Functions (3)

| File | Line | Issue |
|------|------|-------|
| `erp_sync_query_service.ex` | 67 | `sync_transactions/3` is a stub returning `{:ok, :synced}` |
| `erp_sync_query_service.ex` | 75 | `mark_manually_synced/3` is a stub returning `{:ok, :marked}` |
| `erp_sync_query_service.ex` | 83 | `retry_sync/3` is a stub returning `{:ok, :retrying}` |

### Medium — Feature Incomplete (4)

| File | Line | Issue |
|------|------|-------|
| `sage_intacct/.../custom_fields.ex` | 27 | Custom field discovery not implemented |
| `dimension_value_service.ex` | 343 | Hierarchy via parent_id not handled |
| `should_sync.ex` | 16 | Product activation check missing |
| `should_push.ex` | 16 | Product activation check missing |

### Low — Observability Polish (9)

| File | Line | Issue |
|------|------|-------|
| `observatory_service.ex` | 710 | Trend calculation not implemented |
| `observatory_service.ex` | 711 | Prior period comparison not implemented |
| `observatory_service.ex` | 768 | Runbook URL linking not implemented |
| `observatory_service.ex` | 836 | Avg processing time calculation missing |
| `observatory_service.ex` | 837 | Throughput calculation missing |
| `observatory_service.ex` | 1178 | Workspace risk detection not implemented |
| `observatory_service.ex` | 1417 | Workspace name lookup missing |
| `bridge_worker.ex` | 85 | Prometheus metrics not wired |
| `bridge_worker.ex` | 101 | Prometheus metrics not wired |

---

## 🟡 GAP #4: DomainSyncTask/ExecuteTask References (5 Files)

Per memory [[memory:12552562]], these were deleted but references remain:

| File | Type |
|------|------|
| `domain.ex` | Comment only ✅ |
| `bridge_reactor.ex` | Comment only ✅ |
| `employee_linking_service.ex` | Comment only ✅ |
| `vendor_wrapper_service.ex` | Comment only ✅ |
| `monitor_sync_health_worker.ex` | **Active code** 🟡 |

---

## Session Conclusion

**Status:** The comprehensive audit is complete.

### Summary of ALL Gaps

| Gap | Severity | Count | Blocking? |
|-----|----------|-------|-----------|
| **fetch_page/3 missing** | 🔴 Critical | 50 modules | YES — WSR cannot sync |
| **Dead SyncRecord refs** | 🔴 Critical | 27 files | YES — Active workers will crash |
| **TODO stub functions** | 🟡 Medium | 3 functions | NO — but non-functional |
| **TODO incomplete** | 🟡 Medium | 4 items | NO |
| **TODO observability** | 🟢 Low | 9 items | NO |
| **DomainSyncTask refs** | 🟢 Low | 1 file | NO — monitor worker only |

### What IS Production Ready

| Layer | Status | Coverage |
|-------|--------|----------|
| **Adapter Capabilities** | ✅ Complete | 4/4 providers |
| **CapabilityRouter Routing** | ✅ Complete | All 71 entity routes |
| **EntitySyncService** | ✅ Complete | 23 bulk_upsert routes |
| **BulkUpsertServices** | ✅ Complete | 23 entity services |
| **Push Capability Modules** | ✅ Complete | 42 modules |
| **BridgeReactor** | ✅ Complete | 21 steps |
| **Reconciliation Services** | ✅ Complete | 10 services |
| **VendorWrapper/EmployeeLinking** | ✅ Complete | wrap_all_unbridged, link_all_unbridged |

### Recommended Action Plan

**Phase 1: Stop the Bleeding (1-2 days)**
1. Delete or disable `ProcessEntityTypeWorker` — references deleted resource
2. Delete or disable `InitialSyncService` legacy code paths
3. Delete 11 QuickBooks persister reactors (legacy)
4. Clean dead imports from remaining 13 files

**Phase 2: Enable WSR (5-7 days)**
1. Implement `fetch_page/3` in Sage Intacct (18 modules) — 2-3 days
2. Implement `fetch_page/3` in QuickBooks (15 modules) — 1-2 days
3. Implement `fetch_page/3` in Acumatica (10 modules) — 1 day
4. Implement `fetch_page/3` in NetSuite (7 modules) — 0.5 days

**Phase 3: Polish (2-3 days)**
1. Implement `erp_sync_query_service.ex` stub functions
2. Complete TODO items for feature completeness
3. Wire observability metrics

**Total Estimated Effort:** 8-12 days for full production readiness.

---

*Analysis completed: 2025-12-24*
*Committee Session: SC-2025-12-24-003*

