# Engineering Handoff: Phase 3 - Production Readiness Fixes

**Session:** SC-2025-12-23-010  
**Date:** 2025-12-24  
**Phase:** Production Readiness Gap Resolution  
**Status:** READY FOR ENGINEERING

---

## Executive Summary

The comprehensive production readiness audit identified critical gaps that must be resolved before Acumatica can be considered production-ready, plus P2 gaps in the ExpenseReportPayment flow.

---

## Gap A-1: Acumatica Mappers (P0 - CRITICAL)

### Problem Statement

Acumatica sync will **FAIL for ALL entities** except vendor_credit because the MapperRegistry only has one mapper registered:

```elixir
defp register_acumatica_mappers do
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Mappers
  register(:acumatica, :vendor_credit, Mappers.VendorCreditMapper)
  # NOTHING ELSE!
end
```

The `/acumatica/mappers/` directory only contains `vendor_credit_mapper.ex`.

### Required Mappers

| Entity | Mapper File | Priority |
|--------|-------------|----------|
| department | department_mapper.ex | P0 |
| location | location_mapper.ex | P0 |
| class | class_mapper.ex | P0 |
| gl_account | gl_account_mapper.ex | P0 |
| vendor | vendor_mapper.ex | P0 |
| employee | employee_mapper.ex | P0 |
| expense_category | expense_category_mapper.ex | P0 |
| bill | bill_mapper.ex | P0 |
| bill_line_item | bill_line_item_mapper.ex | P0 |
| ap_payment | ap_payment_mapper.ex | P0 |
| expense_report | expense_report_mapper.ex | P0 |
| expense_line_item | expense_line_item_mapper.ex | P0 |

### Implementation Pattern

All mappers must implement `map_to_attrs/5`:

```elixir
defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Mappers.DepartmentMapper do
  @moduledoc """
  Maps Acumatica Department data to mirror resource attributes.
  """

  def map_to_attrs(erp_data, workspace_id, entity_id, erp_connection_id, _opts \\ []) do
    %{
      workspace_id: workspace_id,
      entity_id: entity_id,
      erp_connection_id: erp_connection_id,
      external_id: get_value(erp_data, "DepartmentID"),
      erp_system: :acumatica,
      code: get_value(erp_data, "DepartmentID"),
      name: get_value(erp_data, "Description"),
      # ... other fields
      last_synced_at: DateTime.utc_now()
    }
  end

  defp get_value(data, key) do
    case data[key] do
      %{"value" => value} -> value
      value -> value
    end
  end
end
```

### Registry Update

```elixir
defp register_acumatica_mappers do
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Mappers

  register(:acumatica, :department, Mappers.DepartmentMapper)
  register(:acumatica, :location, Mappers.LocationMapper)
  register(:acumatica, :class, Mappers.ClassMapper)
  register(:acumatica, :gl_account, Mappers.GLAccountMapper)
  register(:acumatica, :vendor, Mappers.VendorMapper)
  register(:acumatica, :employee, Mappers.EmployeeMapper)
  register(:acumatica, :expense_category, Mappers.ExpenseCategoryMapper)
  register(:acumatica, :bill, Mappers.BillMapper)
  register(:acumatica, :bill_line_item, Mappers.BillLineItemMapper)
  register(:acumatica, :ap_payment, Mappers.APPaymentMapper)
  register(:acumatica, :expense_report, Mappers.ExpenseReportMapper)
  register(:acumatica, :expense_line_item, Mappers.ExpenseLineItemMapper)
  register(:acumatica, :vendor_credit, Mappers.VendorCreditMapper)
end
```

---

## Gap A-2: ExpenseReportPayment Reconciliation (P2)

### Problem Statement

The BridgeReactor has reconciliation steps for all pushed entity types EXCEPT expense_report_payment. Pushed payments cannot be reconciled back to their mirrors.

### Required Components

1. **Reconciliation Service:**
   - `ember_bridge/services/reconciliation/expense_report_payment_reconciliation_service.ex`

2. **BridgeReactor Step:**
   - Add step 19 for expense_report_payment reconciliation
   - Renumber existing steps 19-20 to 20-21

### Implementation Pattern

```elixir
defmodule FlameTeampayPayables.EmberBridge.Services.Reconciliation.ExpenseReportPaymentReconciliationService do
  @moduledoc """
  Reconciles pushed expense report payments with their synced mirrors.
  """

  require Logger
  require Ash.Query
  import Ash.Expr

  alias FlameTeampayPayables.EmberErp.Resources.PushRequest
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReportPayment

  @mirror_module ExpenseReportPayment

  def reconcile_all_workspaces(opts \\ []) do
    # Find all pushed expense_report_payment requests that aren't bridged
    # Match against synced mirrors by external_id
    # Update PushRequest with mirror_id and bridged_at
  end
end
```

---

## Gap A-3: ExpenseReportPayment Sync (P2)

### Problem Statement

Expense report payments can be pushed TO ERPs but cannot be synced FROM ERPs. This breaks the bi-directional sync pattern.

### Required Components

1. **Sync Capabilities:**
   - `netsuite/capabilities/sync/expense/expense_report_payments.ex`
   - `sage_intacct/capabilities/sync/expense/expense_report_payments.ex`  
   - `acumatica/capabilities/sync/expense/expense_report_payments.ex`

2. **BulkUpsert Service:**
   - `services/bulk/expense_report_payment_bulk_upsert_service.ex`

3. **WorkspaceSyncReactor Update:**
   - Add `:expense_report_payments` to entity order (after expense_reports)
   - Add to appropriate tier (hot or warm)

4. **EntitySyncService Update:**
   - Add bulk_upsert clause for `:expense_report_payments`

5. **Adapter Updates:**
   - Add `:expense_report_payments` to sync capabilities
   - Add `sync_expense_report_payments/2` dispatch function

---

## Implementation Checklist

### Phase 3A: Acumatica Mappers (P0)
- [ ] Create department_mapper.ex
- [ ] Create location_mapper.ex
- [ ] Create class_mapper.ex
- [ ] Create gl_account_mapper.ex
- [ ] Create vendor_mapper.ex
- [ ] Create employee_mapper.ex
- [ ] Create expense_category_mapper.ex
- [ ] Create bill_mapper.ex
- [ ] Create bill_line_item_mapper.ex
- [ ] Create ap_payment_mapper.ex
- [ ] Create expense_report_mapper.ex
- [ ] Create expense_line_item_mapper.ex
- [ ] Update MapperRegistry with all registrations
- [ ] Verify compilation

### Phase 3B: ExpenseReportPayment Reconciliation (P2)
- [ ] Create ExpenseReportPaymentReconciliationService
- [ ] Add BridgeReactor step for reconciliation
- [ ] Verify compilation

### Phase 3C: ExpenseReportPayment Sync (P2)
- [ ] Create BulkUpsert service
- [ ] Create NetSuite sync capability
- [ ] Create Sage Intacct sync capability
- [ ] Create Acumatica sync capability
- [ ] Update all adapters with sync_expense_report_payments
- [ ] Update WorkspaceSyncReactor entity order
- [ ] Update EntitySyncService bulk_upsert dispatch
- [ ] Verify compilation

---

## Estimated Effort

| Task | Complexity | Time |
|------|------------|------|
| 12 Acumatica mappers | Medium | 45 min |
| Mapper registry update | Low | 5 min |
| Reconciliation service | Medium | 15 min |
| BridgeReactor update | Low | 10 min |
| BulkUpsert service | Medium | 15 min |
| 3 Sync capabilities | Medium | 30 min |
| Adapter/Reactor updates | Low | 15 min |
| **Total** | | **~2.25 hours** |

---

## Success Criteria

1. ✅ `mix compile` succeeds with no errors
2. ✅ All Acumatica entity types have registered mappers
3. ✅ ExpenseReportPayment can be reconciled via BridgeReactor
4. ✅ ExpenseReportPayment can be synced from all 3 ERPs
5. ✅ All providers pass production readiness audit

---

## Handoff Complete

**Committee Chair:** Approved for engineering execution  
**Priority:** P0 blocking Acumatica, P2 completing expense payment flow  
**Constraint:** Keep session open after completion

