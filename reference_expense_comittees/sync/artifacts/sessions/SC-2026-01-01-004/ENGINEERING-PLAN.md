# Engineering Plan: Flow-07 Implementation

> **Session:** SC-2026-01-01-004  
> **Date:** 2026-01-01  
> **Author:** Engineering Team  
> **Status:** PLANNING COMPLETE

---

## 1. Pre-Implementation Verification

| Component | Status | Notes |
|-----------|--------|-------|
| MockAdapter.push_expense_report | ✅ Verified | Lines 346-353 in mock_adapter.ex |
| MockAdapter.push_expense_report_payment | ✅ Verified | Lines 365-372 in mock_adapter.ex |
| configure_push_response(:expense_report) | ✅ Verified | Used in push_expense_report_reactor_test.exs |
| configure_response(:expense_reports) | ✅ Verified | Used in push_receipt_file_reactor_test.exs |
| ExpenseReport mirror schema | ✅ Reviewed | Required fields identified |
| Employee mirror schema | ✅ Reviewed | Required fields identified |

---

## 2. Test File Structure

```
test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_07_lifecycle_test.exs
```

### Module Structure

```elixir
defmodule FlameTeampayPayables.EmberErp.Integration.Flows.ExpenseReportFlow07LifecycleTest do
  use FlameTeampayPayables.ErpIntegrationCase
  
  # Aliases
  # Setup
  # Describe: Complete Flow-07 Lifecycle (1 test)
  # Describe: Phase 1: Push (2 tests)
  # Describe: Phase 2: Sync (1 test)
  # Describe: Phase 3: Bridge (1 test)
  # Helper Functions (uniquely named)
end
```

---

## 3. Key Adaptations from Flow-01

| Aspect | Flow-01 (Card) | Flow-07 (Reimbursement) |
|--------|----------------|-------------------------|
| entity_type | `:card_spend` | `:expense_report` |
| source_domain | `"expense_card"` | `"expense"` |
| source_resource_type | `"ExpenseCard.ExpenseCardTransaction"` | `"Reimbursements.ReimbursementRequest"` |
| Mirror module | `Bill` | `ExpenseReport` |
| Related entity module | `Vendor` | `Employee` |
| Reconciliation service | `BillReconciliationService` | `ExpenseReportReconciliationService` |
| Push entity record type | `:bill` | `:expense_report` |
| Sync entity | `:bills` | `:expense_reports` |

---

## 4. Required Schema Fields

### Employee (Setup)

```elixir
%Employee{
  id: Ash.UUID.generate(),
  workspace_id: ctx.workspace.id,
  erp_connection_id: ctx.connection.id,
  external_id: "EMP-001",
  employee_number: "EMP-001",
  first_name: "Test",
  last_name: "Employee",
  full_name: "Test Employee",
  email: "test@example.com",
  erp_system: ctx.connection.provider,
  status: :active,
  last_synced_at: now,
  inserted_at: now,
  updated_at: now
}
```

### ExpenseReport (for Bridge test)

```elixir
%ExpenseReport{
  id: Ash.UUID.generate(),
  workspace_id: ctx.workspace.id,
  erp_connection_id: ctx.connection.id,
  external_id: external_id,
  report_number: "EXPR-001",
  report_date: today,
  employee_id: employee.id,
  employee_number: employee.employee_number,
  total_amount: Decimal.new("450.00"),
  reimbursable_amount: Decimal.new("450.00"),
  non_reimbursable_amount: Decimal.new("0"),
  currency_code: "USD",
  status: :approved,
  erp_system: ctx.connection.provider,
  last_synced_at: now,
  inserted_at: now,
  updated_at: now
}
```

---

## 5. Helper Function Names

All helpers use `flow07` prefix to avoid conflicts:

- `create_flow07_push_request/2`
- `seed_flow07_sync_responses/3`
- `configure_flow07_sync_response/3`
- `get_flow07_push_entity_record/2`
- `execute_flow07_push/2`

---

## 6. Implementation Order

1. Create test file with module declaration and tags
2. Add aliases and imports
3. Implement setup block (period + employee)
4. Implement helper functions
5. Implement TC-07-01: Complete lifecycle test
6. Implement TC-07-02: Push status transitions
7. Implement TC-07-03: Push failure handling
8. Implement TC-07-04: Sync phase test
9. Implement TC-07-05: Bridge reconciliation test
10. Run tests and fix issues
11. Run all ERP tests

---

## 7. Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Sync reactor doesn't support expense_reports | Check WorkspaceSyncReactor entities |
| ExpenseReport unique constraint failures | Use unique external_ids per test |
| Employee FK violations | Create employee in setup before use |

---

*Engineering Team*  
*Session: SC-2026-01-01-004*

