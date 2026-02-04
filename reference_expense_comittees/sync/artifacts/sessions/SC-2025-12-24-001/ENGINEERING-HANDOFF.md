# Engineering Handoff: SC-2025-12-24-001

## Domain Entity Unification & Cross-ERP Sync Production Readiness

**Session:** SC-2025-12-24-001  
**Date:** 2025-12-24  
**Status:** PARTIALLY EXECUTED — Session remains OPEN  
**Priority:** P0 (Pre-production foundation)

---

## 🎯 Execution Summary

### ✅ COMPLETED PHASES

| Phase | Description | Commit Message |
|-------|-------------|----------------|
| **Phase 0** | CapabilityRouter — Added ALL provider mappings | `feat(ember_erp): complete CapabilityRouter with all 4 ERP providers` |
| **Phase 1a** | Create Subsidiary resource (rename from Entity) | `refactor(ember_erp): Entity → Subsidiary unification` |
| **Phase 1b** | Update SubsidiaryBulkUpsertService | `refactor(ember_erp): SubsidiaryBulkUpsertService uses unified Subsidiary` |
| **Phase 2a** | Delete Job resource (unified into Project) | `refactor(ember_erp): Job → Project unification` |
| **Phase 3b** | Update @entity_order and @entity_tiers | `feat(ember_erp): expanded entity order with all 22 entities` |
| **Phase 4** | Add missing bulk upsert services | `feat(ember_erp): add APPaymentApplication, BankAccount, CustomDimension bulk services` |
| **Verify** | Compilation successful | ✅ `mix compile` passes |

### ⏳ REMAINING PHASES

| Phase | Description | Priority | Est. Effort |
|-------|-------------|----------|-------------|
| **Phase 1c** | Add Subsidiary adapters for Sage/QBO/Acumatica | P1 | 2-3 hrs |
| **Phase 2b** | Update Project adapters (NetSuite jobs → projects) | P2 | 1 hr |
| **Phase 3a** | Add missing sync capabilities (currencies, periods) | P2 | 2-3 hrs |
| **Phase 5** | Add missing mappers for all providers | P2 | 3-4 hrs |

---

---

## Executive Summary

This handoff addresses fundamental architecture issues discovered during production readiness audit:

1. **CapabilityRouter only routes NetSuite** — Other ERPs silently fail
2. **Entity naming inconsistency** — Jobs/Projects, Entity/Subsidiary confusion
3. **Missing sync capabilities** — Currencies, Periods not syncing for all ERPs
4. **Incomplete @entity_order** — Several entities with capability files not in sync loop

### Unification Decisions (Committee Approved)

| Concept | Old (Fragmented) | New (Unified) | Rationale |
|---------|------------------|---------------|-----------|
| Organizational Units | `Entity`, `Subsidiary` | **`Subsidiary`** | Standard accounting term |
| Work Tracking | `Job`, `Project` | **`Project`** | Industry standard |
| Custom Dimensions | Per-ERP mechanisms | **`CustomDimension` + `CustomDimensionValue`** | Already exists, just complete adapters |
| Accounting Periods | NetSuite/Sage only | **All ERPs** | Essential for close process |
| Currencies | NetSuite/Sage only | **All ERPs** | Essential for multi-currency |

---

## Current State Analysis

### Resources Inventory

| Resource | File | Table | Status |
|----------|------|-------|--------|
| `Entity` | `accounting/core/entity.ex` | `ember_erp_accounting_entities` | ❌ RENAME to Subsidiary |
| `Job` | `accounting/core/job.ex` | `ember_erp_accounting_jobs` | ❌ DELETE (merge to Project) |
| `Project` | `accounting/core/project.ex` | `ember_erp_accounting_projects` | ✅ KEEP as unified resource |
| `CustomDimension` | `accounting/core/custom_dimension.ex` | `ember_erp_accounting_custom_dimensions` | ✅ KEEP |
| `CustomDimensionValue` | `accounting/core/custom_dimension_value.ex` | `ember_erp_accounting_custom_dimension_values` | ✅ KEEP |
| `Currency` | `accounting/core/currency.ex` | exists | ✅ Add adapters |
| `AccountingPeriod` | `accounting/core/accounting_period.ex` | exists | ✅ Add adapters |

### Bulk Upsert Services Inventory

| Service | Current Target | New Target |
|---------|---------------|------------|
| `SubsidiaryBulkUpsertService` | `Entity` resource | Rename to use `Subsidiary` |
| `ProjectBulkUpsertService` | `Project` resource | ✅ Keep |
| (missing) `JobBulkUpsertService` | N/A | DELETE concept |
| `CurrencyBulkUpsertService` | `Currency` | ✅ Keep, add provider mappers |
| `AccountingPeriodBulkUpsertService` | `AccountingPeriod` | ✅ Keep, add provider mappers |

### CapabilityRouter Gap Analysis

Currently in `get_sync_capability_module/2`:

| Provider | Mapped Entities | Missing Entities |
|----------|-----------------|------------------|
| **NetSuite** | 13 entities | 13+ missing |
| **Sage Intacct** | 0 entities | ALL |
| **QuickBooks** | 0 entities | ALL |
| **Acumatica** | 0 entities | ALL |

**This means only NetSuite sync works through WorkspaceSyncReactor!**

---

## Implementation Plan

### Phase 0: Critical Fix — CapabilityRouter (P0)

**Files to modify:**
- `lib/flame_teampay_payables/ember_erp/adapters/capability_router.ex`

**Task:** Add `get_sync_capability_module/2` clauses for ALL providers and ALL entity types.

```elixir
# Pattern for each provider:
defp get_sync_capability_module(:sage_intacct, :vendors) do
  FlameTeampayPayables.EmberErp.Adapters.Providers.SageIntacct.Capabilities.Sync.Parties.Vendors
end

defp get_sync_capability_module(:quickbooks, :vendors) do
  FlameTeampayPayables.EmberErp.Adapters.Providers.QuickBooks.Capabilities.Sync.Parties.Vendors
end

defp get_sync_capability_module(:acumatica, :vendors) do
  FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Capabilities.Sync.Parties.Vendors
end
# ... for ALL entity types
```

### Phase 1: Entity Unification — Subsidiary

**Step 1.1: Rename Entity → Subsidiary**

| Component | Old | New |
|-----------|-----|-----|
| Resource file | `entity.ex` | `subsidiary.ex` |
| Module name | `...Core.Entity` | `...Core.Subsidiary` |
| Table name | `ember_erp_accounting_entities` | `ember_erp_accounting_subsidiaries` |
| Identity | `:unique_erp_entity` | `:unique_erp_subsidiary` |

**Step 1.2: Update all references**

- `SubsidiaryBulkUpsertService` → use new `Subsidiary` module
- `EntityMapper` → rename to `SubsidiaryMapper`
- `EntitySyncService.bulk_upsert(:subsidiaries, ...)` → route to correct service
- Domain registration in `domain.ex`

**Step 1.3: Create migration**

```elixir
def change do
  rename table("ember_erp_accounting_entities"), to: table("ember_erp_accounting_subsidiaries")
  
  # Update indexes
  drop_if_exists index("ember_erp_accounting_entities", [:workspace_id, :entity_code])
  create unique_index("ember_erp_accounting_subsidiaries", [:workspace_id, :subsidiary_code])
end
```

**Step 1.4: Add Sage Intacct adapter**

Create `sage_intacct/capabilities/sync/core/subsidiaries.ex` that:
- Reads from Sage Intacct's `LOCATIONENTITY` object
- Maps to unified `Subsidiary` resource

**Step 1.5: Handle single-entity ERPs (QuickBooks)**

For ERPs without multi-entity:
- Create implicit "root" subsidiary representing the connection
- Set `subsidiary_code = "ROOT"` or connection name

### Phase 2: Entity Unification — Project (Delete Job)

**Step 2.1: Verify no production data in Job table**

```sql
SELECT COUNT(*) FROM ember_erp_accounting_jobs;
-- Should be 0 or acceptable to lose
```

**Step 2.2: Delete Job resource**

- Delete `lib/.../accounting/core/job.ex`
- Remove from `domain.ex` resources list
- Delete any `JobBulkUpsertService` if exists
- Delete any `job_mapper.ex` files

**Step 2.3: Update adapters to use Project**

| ERP | Current | New |
|-----|---------|-----|
| NetSuite | `sync_projects` reads "jobs" | Keep, rename internally |
| Sage Intacct | `sync_jobs` + `sync_projects` | ONLY `sync_projects` |
| QuickBooks | `sync_jobs` | Rename to `sync_projects`, map from QBO Jobs/Projects |
| Acumatica | N/A | Add `sync_projects` |

**Step 2.4: Migration to drop Job table**

```elixir
def change do
  drop_if_exists table("ember_erp_accounting_jobs")
end
```

### Phase 3: Complete Sync Coverage

**3.1: Add missing sync capabilities**

| Entity | NetSuite | Sage Intacct | QuickBooks | Acumatica |
|--------|----------|--------------|------------|-----------|
| `subsidiaries` | ✅ exists | ⬜ CREATE | ⬜ CREATE (synthetic) | ⬜ CREATE |
| `currencies` | ✅ exists | ✅ exists | ⬜ CREATE | ⬜ CREATE |
| `accounting_periods` | ✅ exists | ✅ exists | ⬜ CREATE (synthetic) | ⬜ CREATE |
| `customers` | ✅ exists | ⬜ CREATE | ✅ exists | ⬜ CREATE |
| `expense_report_payments` | ✅ exists | ✅ exists | ⬜ CREATE | ✅ exists |
| `ap_payment_applications` | ✅ exists | ✅ exists | ✅ exists | ✅ exists |
| `bank_accounts` | ✅ exists | ✅ exists | ✅ exists | ⬜ CREATE |

**3.2: Update @entity_order in WorkspaceSyncReactor**

```elixir
@entity_order [
  # Static/Core (STATIC tier - daily)
  :currencies,
  :subsidiaries,
  :accounting_periods,
  :bank_accounts,  # ADD
  
  # Coding dimensions (COLD tier - hourly)
  :departments,
  :locations,
  :classes,
  :gl_accounts,
  :expense_categories,
  :projects,
  :custom_dimensions,       # ADD
  :custom_dimension_values, # ADD
  :budgets,                 # ADD
  
  # Parties (WARM tier - 16 min)
  :customers,
  :vendors,
  :employees,
  
  # Transactions (HOT tier - every run)
  :bills,
  :bill_line_items,
  :ap_payments,
  :ap_payment_applications,  # ADD
  :expense_reports,
  :expense_line_items,
  :expense_report_payments,
  :vendor_credits
]
```

**3.3: Update @entity_tiers**

```elixir
@entity_tiers %{
  hot: [
    :expense_reports, :expense_line_items, :expense_report_payments,
    :bills, :bill_line_items, :ap_payments, :ap_payment_applications,
    :vendor_credits
  ],
  warm: [:vendors, :employees, :projects, :customers],
  cold: [
    :gl_accounts, :departments, :classes, :expense_categories,
    :custom_dimensions, :custom_dimension_values, :budgets
  ],
  static: [
    :currencies, :subsidiaries, :locations, :accounting_periods, :bank_accounts
  ]
}
```

### Phase 4: Add Missing Bulk Upsert Services

| Entity | Service Needed | Priority |
|--------|---------------|----------|
| `ap_payment_applications` | `APPaymentApplicationBulkUpsertService` | P1 |
| `bank_accounts` | `BankAccountBulkUpsertService` | P2 |
| `budgets` | `BudgetBulkUpsertService` | P2 |
| `custom_dimensions` | `CustomDimensionBulkUpsertService` | P2 |
| `custom_dimension_values` | `CustomDimensionValueBulkUpsertService` | P2 |

### Phase 5: Add Missing Mappers

Each ERP needs mappers for all synced entities:

| Entity | NetSuite | Sage Intacct | QuickBooks | Acumatica |
|--------|----------|--------------|------------|-----------|
| `subsidiary` | ✅ (EntityMapper→rename) | ⬜ CREATE | ⬜ CREATE | ⬜ CREATE |
| `currency` | ✅ | ⬜ CREATE | ⬜ CREATE | ⬜ CREATE |
| `accounting_period` | ✅ | ⬜ CREATE | ⬜ CREATE | ⬜ CREATE |
| `customer` | ✅ | ⬜ CREATE | ✅ | ⬜ CREATE |
| `bank_account` | ✅ | ⬜ CREATE | ⬜ CREATE | ⬜ CREATE |

---

## File Changes Summary

### Files to CREATE

```
# Phase 0 - No new files, just modify capability_router.ex

# Phase 1 - Subsidiary Unification
lib/flame_teampay_payables/ember_erp/resources/accounting/core/subsidiary.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/capabilities/sync/core/subsidiaries.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/mappers/subsidiary_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/capabilities/sync/core/subsidiaries.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/mappers/subsidiary_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/capabilities/sync/core/subsidiaries.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/mappers/subsidiary_mapper.ex

# Phase 3 - Missing Sync Capabilities
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/capabilities/sync/core/currencies.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/capabilities/sync/core/accounting_periods.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/mappers/currency_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/mappers/accounting_period_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/capabilities/sync/core/currencies.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/capabilities/sync/core/accounting_periods.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/mappers/currency_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/mappers/accounting_period_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/capabilities/sync/parties/customers.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/mappers/customer_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/capabilities/sync/parties/customers.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/mappers/customer_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/capabilities/sync/expense/expense_report_payments.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/mappers/expense_report_payment_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/capabilities/sync/treasury/bank_accounts.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/mappers/bank_account_mapper.ex

# Phase 4 - Missing Bulk Upsert Services
lib/flame_teampay_payables/ember_erp/services/bulk/ap_payment_application_bulk_upsert_service.ex
lib/flame_teampay_payables/ember_erp/services/bulk/bank_account_bulk_upsert_service.ex
lib/flame_teampay_payables/ember_erp/services/bulk/budget_bulk_upsert_service.ex
lib/flame_teampay_payables/ember_erp/services/bulk/custom_dimension_bulk_upsert_service.ex
lib/flame_teampay_payables/ember_erp/services/bulk/custom_dimension_value_bulk_upsert_service.ex

# Migrations
priv/repo/migrations/TIMESTAMP_rename_entity_to_subsidiary.exs
priv/repo/migrations/TIMESTAMP_drop_job_table.exs
```

### Files to DELETE

```
lib/flame_teampay_payables/ember_erp/resources/accounting/core/entity.ex
lib/flame_teampay_payables/ember_erp/resources/accounting/core/job.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/entity_mapper.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/capabilities/sync/core/jobs.ex (if exists)
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/capabilities/sync/core/jobs.ex (if exists)
```

### Files to MODIFY

```
# Phase 0
lib/flame_teampay_payables/ember_erp/adapters/capability_router.ex

# Phase 1-5
lib/flame_teampay_payables/ember_erp/domain.ex
lib/flame_teampay_payables/ember_erp/services/bulk/subsidiary_bulk_upsert_service.ex
lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex
lib/flame_teampay_payables/ember_erp/resources/reactors/sync/workspace_sync_reactor.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/adapter.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/adapter.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/quickbooks/adapter.ex
lib/flame_teampay_payables/ember_erp/adapters/providers/acumatica/adapter.ex
```

---

## Execution Order

### ✅ Executed (This Session)

1. ✅ Phase 0: Fix CapabilityRouter — **DONE**
2. ✅ Phase 1a: Create Subsidiary resource (rename from Entity) — **DONE**
3. ✅ Phase 1b: Update SubsidiaryBulkUpsertService — **DONE**
4. ✅ Phase 2a: Delete Job resource — **DONE**
5. ✅ Phase 3b: Update @entity_order and @entity_tiers — **DONE**
6. ✅ Phase 4: Add missing bulk upsert services — **DONE**
7. ✅ Verification: Compilation successful — **DONE**

### ⏳ Remaining (Pending Execution)

8. ⬜ Phase 1c: Add Subsidiary adapters for Sage/QBO/Acumatica
9. ⬜ Phase 2b: Update Project adapters (NetSuite jobs → projects)
10. ⬜ Phase 3a: Add missing sync capabilities (currencies, periods)
11. ⬜ Phase 5: Add missing mappers for all providers

### Verification

After each phase:
1. `mix compile` (note: do NOT use `--force` flag)
2. Verify no missing module references
3. Test basic sync flow for each provider

---

## Adapter Translation Matrix

### Subsidiary (New Unified Entity)

| ERP | API Object | Endpoint/Query | Notes |
|-----|------------|----------------|-------|
| NetSuite | `subsidiary` | SuiteQL: `SELECT * FROM subsidiary` | OneWorld only |
| Sage Intacct | `LOCATIONENTITY` | `readByQuery LOCATIONENTITY` | Always available |
| QuickBooks | N/A | Synthetic | Create root from connection |
| Acumatica | `Company` + `Branch` | REST: `/entity/Default/.../Company` | Flatten hierarchy |

### Project (Unified, replacing Job)

| ERP | API Object | Endpoint/Query | Notes |
|-----|------------|----------------|-------|
| NetSuite | `job` | SuiteQL: `SELECT * FROM job` | "Job" = Project in NS |
| Sage Intacct | `PROJECT` | `readByQuery PROJECT` | Ignore JOB object |
| QuickBooks | `Project` | Query: `select * from Project` | Newer API |
| Acumatica | `Project` | REST: `/entity/Default/.../Project` | Full support |

### Currency

| ERP | API Object | Endpoint/Query | Notes |
|-----|------------|----------------|-------|
| NetSuite | `currency` | SuiteQL: `SELECT * FROM currency` | Full support |
| Sage Intacct | `CURRENCY` | `readByQuery CURRENCY` | Full support |
| QuickBooks | `CompanyInfo.Currency` or `Currency` | Query if multi-currency enabled | May be single currency |
| Acumatica | `Currency` | REST: `/entity/Default/.../Currency` | Full support |

### Accounting Period

| ERP | API Object | Endpoint/Query | Notes |
|-----|------------|----------------|-------|
| NetSuite | `accountingperiod` | SuiteQL | Full support |
| Sage Intacct | Reporting API | Period-based | Implicit periods |
| QuickBooks | N/A | Synthesize from fiscal year | Generate 12 monthly periods |
| Acumatica | `FinancialPeriod` | REST API | Full support |

---

## Success Criteria

1. **All 4 ERPs can sync all common entities** through WorkspaceSyncReactor
2. **Unified naming** — `Subsidiary`, `Project`, no `Entity` or `Job`
3. **CapabilityRouter** routes ALL providers correctly
4. **@entity_order** includes all 22+ entity types
5. **Compilation** succeeds with no warnings
6. **Tests** pass (existing + new coverage)

---

*Engineering Handoff prepared by Sync Committee*  
*Session: SC-2025-12-24-001*  
*Date: 2025-12-24*

