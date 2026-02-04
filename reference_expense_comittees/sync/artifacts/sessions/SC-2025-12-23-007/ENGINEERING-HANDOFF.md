# SC-2025-12-23-007: Entity-Specific Reconciliation Pattern

## Session Summary

**Date**: 2025-12-23  
**Topic**: Break monolithic reconciliation into entity-specific services  
**Status**: IMPLEMENTATION_COMPLETE  
**Outcome**: Created entity-specific reconciliation services with clear pattern

---

## Problem Statement

The previous `PushReconciliationService` was a monolithic service that:

1. **Hid which entities were processed** - All entity types went through one opaque loop
2. **Provided no per-entity visibility** - Logs showed totals, not entity breakdown
3. **Silently failed for unmapped entities** - Unknown entity types logged warning but continued
4. **Made gaps invisible** - Couldn't look at BridgeReactor and see what's covered

---

## Solution: Entity-Specific Reconciliation Services

Each pushed entity type now has its own explicit reconciliation service following a clear pattern.

### New Service Structure

```
ember_bridge/services/reconciliation/
├── bill_reconciliation_service.ex          # Pattern template
├── expense_report_reconciliation_service.ex
├── ap_payment_reconciliation_service.ex
└── vendor_reconciliation_service.ex
```

### Pattern Template

Each service follows this structure:

```elixir
defmodule [Entity]ReconciliationService do
  # ─── ENTITY CONFIGURATION ───────────────────────────────────────────────────
  @entity_type :bill                    # Atom used in PushRequest.entity_type
  @entity_name "Bill"                   # For logging
  @mirror_module Accounting.AP.Bill     # Accounting mirror resource
  @source_domain "ap"                   # PushRequest.source_domain value

  # ─── PUBLIC API ─────────────────────────────────────────────────────────────
  def reconcile_all_workspaces(opts \\ [])
  def reconcile_workspace(workspace_id, opts \\ [])

  # ─── CORE RECONCILIATION ────────────────────────────────────────────────────
  defp reconcile_push_request(push_request, workspace_id)
  defp find_mirror_by_external_id(external_id, workspace_id)
  defp link_push_request_to_mirror(push_request, mirror, workspace_id)
  defp link_mirror_to_push_request(mirror, push_request, workspace_id)

  # ─── ENTITY-SPECIFIC ────────────────────────────────────────────────────────
  defp link_source_to_mirror(push_request, mirror, workspace_id)
  # Customize for each entity (e.g., Invoice → Bill, ReimbursementRequest → ExpenseReport)
end
```

---

## BridgeReactor Changes

### Before (Monolithic)

```elixir
step :reconcile_push_lifecycle do
  run fn _args, _context ->
    PushReconciliationService.reconcile_all_workspaces()
  end
end
```

### After (Entity-Specific)

```elixir
# Step 9: Reconcile Bills
step :reconcile_bills do
  run fn _args, _context ->
    BillReconciliationService.reconcile_all_workspaces()
  end
end

# Step 10: Reconcile Expense Reports
step :reconcile_expense_reports do
  run fn _args, _context ->
    ExpenseReportReconciliationService.reconcile_all_workspaces()
  end
end

# Step 11: Reconcile AP Payments
step :reconcile_ap_payments do
  run fn _args, _context ->
    APPaymentReconciliationService.reconcile_all_workspaces()
  end
end

# Step 12: Reconcile Vendors
step :reconcile_vendors do
  run fn _args, _context ->
    VendorReconciliationService.reconcile_all_workspaces()
  end
end
```

---

## Entity Coverage Matrix

| Entity Type | Reconciliation Service | Source Linking | Status |
|-------------|----------------------|----------------|--------|
| `:bill` | BillReconciliationService | Invoice → Bill | ✅ |
| `:expense_report` | ExpenseReportReconciliationService | ReimbursementRequest → ExpenseReport | ✅ |
| `:ap_payment` | APPaymentReconciliationService | (none) | ✅ |
| `:vendor` | VendorReconciliationService | (none) | ✅ |
| `:journal_entry` | ❌ Not yet created | (none) | ⏳ |
| `:vendor_credit` | ❌ Not yet created | (none) | ⏳ |
| `:card_transaction` | ❌ Not yet created | (none) | ⏳ |
| `:bill_line_item` | ❌ Not yet created | (none) | ⏳ |
| `:expense_line_item` | ❌ Not yet created | (none) | ⏳ |

---

## Adding New Entity Reconciliation

To add a new entity type, copy the pattern template and:

1. Change module name to `[Entity]ReconciliationService`
2. Update `@entity_type` to the atom used in PushRequest
3. Update `@mirror_module` to the accounting mirror resource
4. Update `@source_domain` to match PushRequest.source_domain
5. Implement `link_source_to_mirror/3` for product domain linking (or leave as no-op)
6. Add step to BridgeReactor
7. Add result to `aggregate_results` step

---

## Stats & Logging

### Per-Entity Stats

Each entity step returns:

```elixir
%{
  success: 5,      # PushRequests successfully reconciled
  not_found: 2,    # Mirrors not yet synced
  error: 0         # Failures
}
```

### Aggregated Stats

BridgeReactor aggregates into:

```elixir
%{
  reconciliation: %{
    bills: %{success: 5, not_found: 2, error: 0},
    expense_reports: %{success: 3, not_found: 1, error: 0},
    ap_payments: %{success: 0, not_found: 0, error: 0},
    vendors: %{success: 1, not_found: 0, error: 0},
    total_success: 9,
    total_not_found: 3,
    total_error: 0
  }
}
```

### BridgeWorker Logs

```
[BridgeWorker] Completed successfully
  reconciliation_bills: "5/2/0"
  reconciliation_expense_reports: "3/1/0"
  reconciliation_ap_payments: "0/0/0"
  reconciliation_vendors: "1/0/0"
  reconciliation_total_success: 9
  ...
```

---

## Benefits

1. **Explicit Coverage**: Looking at BridgeReactor shows exactly which entities are reconciled
2. **Per-Entity Stats**: Each step reports its own success/not_found/error counts
3. **Independent Failure**: One entity failing doesn't block others
4. **Easy to Add**: New entity types = new service + new step
5. **Deviation Flexibility**: Each entity can have custom source linking logic
6. **Clear Pattern**: Template makes it obvious how to add new entities

---

## Deprecated

The monolithic `PushReconciliationService.reconcile_all_workspaces/1` is no longer used by BridgeReactor. It can be deprecated but kept for backwards compatibility if needed elsewhere.

