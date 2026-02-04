# Engineering Handoff: Flow-07 Implementation

> **Session:** SC-2026-01-01-004  
> **Date:** 2026-01-01  
> **From:** Sync Committee  
> **To:** Engineering Team  
> **Status:** HANDOFF READY

---

## 1. Objective

Implement and verify **Flow-07: Reimbursement → Existing Vendor (Open Period)** with a complete lifecycle test following the patterns established in Flows 1-6.

---

## 2. Deliverables

| Deliverable | Priority | Description |
|-------------|----------|-------------|
| `expense_report_flow_07_lifecycle_test.exs` | 🔴 Critical | Complete lifecycle test |
| MockAdapter updates (if needed) | 🟠 High | Support for `push_expense_report` |
| All ERP tests passing | 🔴 Critical | 0 failures allowed |

---

## 3. Reference Materials

### 3.1 Pattern to Follow

**Primary Reference:** 
```
test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_01_lifecycle_test.exs
```

This test demonstrates the complete lifecycle pattern:
- Push → Sync → Bridge
- Proper setup with accounting period and vendor
- MockAdapter configuration
- Verification of all three phases

### 3.2 Existing Implementation to Use

| Component | Location |
|-----------|----------|
| PushExpenseReportReactor | `lib/flame_teampay_payables/ember_erp/resources/reactors/expense/push_expense_report_reactor.ex` |
| ExpenseReportReconciliationService | `lib/flame_teampay_payables/ember_bridge/services/reconciliation/expense_report_reconciliation_service.ex` |
| ExpenseReport mirror | `lib/flame_teampay_payables/ember_erp/resources/accounting/expense/expense_report.ex` |
| Flow-07 requirements | `docs/.../flows/FLOW-07-REIMBURSEMENT-EXISTING-VENDOR.md` |

---

## 4. Technical Specification

### 4.1 Test File Location

```
test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_07_lifecycle_test.exs
```

### 4.2 Module Name

```elixir
defmodule FlameTeampayPayables.EmberErp.Integration.Flows.ExpenseReportFlow07LifecycleTest do
```

### 4.3 Required Tags

```elixir
@moduletag :integration
@moduletag :flow
@moduletag :lifecycle
@moduletag flow: :flow_07
```

### 4.4 Key Differences from Card Flow Test

| Aspect | Flow-01 (Card) | Flow-07 (Reimbursement) |
|--------|----------------|-------------------------|
| Entity type | `:card_spend` | `:expense_report` |
| Source domain | `"expense_card"` | `"expense"` |
| Source resource type | `"ExpenseCard.ExpenseCardTransaction"` | `"Reimbursements.ReimbursementRequest"` |
| Mirror module | `Bill` | `ExpenseReport` |
| Reconciliation service | `BillReconciliationService` | `ExpenseReportReconciliationService` |
| Push response key | `:bill` | `:expense_report` |
| Sync entity | `:bills` | `:expense_reports` |

### 4.5 Helper Function Naming Convention

**CRITICAL:** Use unique helper names to avoid conflicts:

```elixir
# ✅ CORRECT - Flow-07 specific
defp create_flow07_push_request(ctx, opts)
defp seed_flow07_sync_responses(ctx, external_id, date)
defp configure_flow07_sync_response(ctx, external_id, date)
defp get_flow07_push_entity_record(push_request_id, entity_type)

# ❌ WRONG - Generic names will conflict
defp create_push_request(ctx, opts)  # DON'T USE
```

---

## 5. Test Cases

### TC-07-01: Complete Lifecycle Test (CRITICAL)

```elixir
describe "Complete Flow-07 Lifecycle" do
  test "complete lifecycle: push creates expense report, sync mirrors it, bridge links it", %{
    ctx: ctx,
    open_period: period,
    accounting_employee: employee
  } do
    # ARRANGE
    expense_report_external_id = "LIFECYCLE-EXPR-#{:erlang.unique_integer([:positive])}"
    
    # Configure mock push response
    MockAdapter.configure_push_response(:expense_report, %{
      external_id: expense_report_external_id,
      metadata: %{}
    })
    
    # Seed sync responses
    seed_flow07_sync_responses(ctx, expense_report_external_id, period.begin_date)
    
    # Create push request
    {:ok, push_request} = create_flow07_push_request(ctx, %{
      expense_date: period.begin_date,
      employee_id: employee.id,
      employee_external_id: employee.external_id
    })
    
    # PHASE 1: PUSH
    {:ok, pushed_request} = execute_push(ctx, push_request)
    
    assert pushed_request.status == :pushed
    
    # Verify PushEntityRecord created with correct entity_type
    expense_report_entity_record = get_flow07_push_entity_record(pushed_request.id, :expense_report)
    assert expense_report_entity_record != nil
    assert expense_report_entity_record.external_id == expense_report_external_id
    
    # PHASE 2: SYNC
    configure_flow07_sync_response(ctx, expense_report_external_id, period.begin_date)
    {:ok, sync_result} = run_sync_reactor(ctx, entities: [:expense_reports])
    
    assert :expense_reports in sync_result.completed_entities
    
    # Verify ExpenseReport mirror created
    {:ok, expense_report_mirrors} = ExpenseReport
      |> Ash.Query.filter(external_id == ^expense_report_external_id)
      |> Ash.read(tenant: ctx.workspace.id, authorize?: false)
    
    assert length(expense_report_mirrors) == 1
    expense_report_mirror = List.first(expense_report_mirrors)
    
    # PHASE 3: BRIDGE
    {:ok, reconcile_result} = ExpenseReportReconciliationService.reconcile_workspace(ctx.workspace.id)
    
    assert reconcile_result.success >= 1
    
    # Verify linking
    final_entity_record = get_flow07_push_entity_record(pushed_request.id, :expense_report)
    assert final_entity_record.accounting_resource_id == expense_report_mirror.id
    assert final_entity_record.status == :sync_verified
  end
end
```

### TC-07-02: Push Status Transitions

```elixir
describe "Phase 1: Push" do
  test "ExecutePush correctly handles status transitions", %{ctx: ctx, accounting_employee: employee} do
    # Configure mock for success
    external_id = "PHASE1-EXPR-#{:erlang.unique_integer([:positive])}"
    MockAdapter.configure_push_response(:expense_report, %{external_id: external_id})
    seed_flow07_sync_responses(ctx, external_id, Date.utc_today())
    
    {:ok, push_request} = create_flow07_push_request(ctx, %{
      employee_id: employee.id,
      employee_external_id: employee.external_id
    })
    
    assert push_request.status == :pending
    
    {:ok, result} = execute_push(ctx, push_request)
    
    assert result.status == :pushed
    assert result.processed_at != nil
  end
  
  test "ExecutePush handles reactor failure correctly", %{ctx: ctx} do
    # Create push request with missing required data
    {:ok, push_request} = create_flow07_push_request(ctx, %{
      employee_id: nil,  # Will cause failure
      skip_validation: true
    })
    
    {:ok, result} = execute_push(ctx, push_request)
    
    assert result.status == :failed
    assert result.error_message != nil
  end
end
```

### TC-07-03: Sync Phase

```elixir
describe "Phase 2: Sync" do
  test "ExpenseReport is correctly synced from mock ERP", %{ctx: ctx, accounting_employee: employee} do
    external_id = "SYNC-EXPR-#{:erlang.unique_integer([:positive])}"
    today = Date.utc_today()
    
    # Configure employee sync (expense reports reference employees)
    configure_sync_response(ctx, :employees, [
      %{
        "id" => employee.external_id,
        "entityId" => employee.employee_number,
        "firstName" => "Test",
        "lastName" => "Employee",
        "email" => "test@example.com",
        "isInactive" => false
      }
    ])
    
    {:ok, _} = run_sync_reactor(ctx, entities: [:employees])
    
    # Configure expense report sync
    configure_sync_response(ctx, :expense_reports, [
      %{
        "id" => external_id,
        "tranid" => "EXPR-#{external_id}",
        "trandate" => Date.to_iso8601(today),
        "entity" => employee.external_id,  # Employee, not vendor!
        "total" => "450.00",
        "status" => "approved",
        "isinactive" => "F"
      }
    ])
    
    {:ok, sync_result} = run_sync_reactor(ctx, entities: [:expense_reports])
    
    assert :expense_reports in sync_result.completed_entities
    
    {:ok, reports} = ExpenseReport
      |> Ash.Query.filter(external_id == ^external_id)
      |> Ash.read(tenant: ctx.workspace.id, authorize?: false)
    
    assert length(reports) == 1
  end
end
```

### TC-07-04: Bridge (Reconciliation)

```elixir
describe "Phase 3: Bridge (Reconciliation)" do
  test "PushEntityRecord is linked to ExpenseReport after reconciliation", %{
    ctx: ctx,
    accounting_employee: employee
  } do
    external_id = "RECON-EXPR-#{:erlang.unique_integer([:positive])}"
    today = Date.utc_today()
    now = DateTime.utc_now()
    
    # Setup: Create push request that looks already pushed
    push_record = %PushRequest{
      id: Ash.UUID.generate(),
      workspace_id: ctx.workspace.id,
      erp_connection_id: ctx.connection.id,
      source_domain: "expense",
      source_resource_type: "Reimbursements.ReimbursementRequest",
      source_resource_id: Ash.UUID.generate(),
      entity_type: :expense_report,
      trigger_type: :manual,
      status: :pushed,
      requested_at: now,
      processed_at: now,
      retry_count: 0,
      inserted_at: now,
      updated_at: now
    }
    push_request = Repo.insert!(push_record)
    
    # Setup: Create PushEntityRecord
    push_entity_record = %PushEntityRecord{
      id: Ash.UUID.generate(),
      workspace_id: ctx.workspace.id,
      push_request_id: push_request.id,
      entity_type: :expense_report,
      external_id: external_id,
      status: :pushed,
      pushed_at: now,
      inserted_at: now,
      updated_at: now
    }
    push_entity_record = Repo.insert!(push_entity_record)
    
    # Setup: Create matching ExpenseReport mirror
    expense_report_record = %ExpenseReport{
      id: Ash.UUID.generate(),
      workspace_id: ctx.workspace.id,
      erp_connection_id: ctx.connection.id,
      external_id: external_id,
      report_number: "EXPR-001",
      report_date: today,
      employee_id: employee.id,
      employee_number: employee.employee_number,
      total_amount: Decimal.new("450.00"),
      status: :approved,
      erp_system: ctx.connection.provider,
      last_synced_at: now,
      inserted_at: now,
      updated_at: now
    }
    expense_report = Repo.insert!(expense_report_record)
    
    # Verify not linked yet
    assert push_entity_record.accounting_resource_id == nil
    
    # Run reconciliation
    {:ok, result} = ExpenseReportReconciliationService.reconcile_workspace(ctx.workspace.id)
    
    assert result.success >= 1
    
    # Verify linking
    {:ok, updated_entity_record} = Ash.get(PushEntityRecord, push_entity_record.id,
      tenant: ctx.workspace.id,
      authorize?: false
    )
    assert updated_entity_record.accounting_resource_id == expense_report.id
    assert updated_entity_record.status == :sync_verified
  end
end
```

---

## 6. Setup Requirements

### 6.1 Test Setup Block

```elixir
setup %{ctx: ctx} do
  today = Date.utc_today()
  period_start = %Date{year: today.year, month: today.month, day: 1}
  period_end = Date.end_of_month(period_start)
  now = DateTime.utc_now()

  # Create open accounting period
  period_record = %AccountingPeriod{
    id: Ash.UUID.generate(),
    workspace_id: ctx.workspace.id,
    erp_connection_id: ctx.connection.id,
    external_id: "PERIOD-#{today.year}-#{today.month}",
    period_name: "#{Date.beginning_of_month(today) |> Date.to_string()}",
    year: today.year,
    month: today.month,
    begin_date: period_start,
    end_date: period_end,
    is_open: true,
    status: :active,
    inserted_at: now,
    updated_at: now
  }
  open_period = Repo.insert!(period_record)

  # Create accounting mirror employee (NOT vendor - this is for reimbursements!)
  employee_record = %Employee{
    id: Ash.UUID.generate(),
    workspace_id: ctx.workspace.id,
    erp_connection_id: ctx.connection.id,
    external_id: "EMP-001",
    employee_number: "EMP-001",
    first_name: "Test",
    last_name: "Employee",
    email: "test@example.com",
    erp_system: ctx.connection.provider,
    status: :active,
    last_synced_at: now,
    inserted_at: now,
    updated_at: now
  }
  accounting_employee = Repo.insert!(employee_record)

  %{
    open_period: open_period,
    accounting_employee: accounting_employee,
    employee_id: accounting_employee.id,
    employee_external_id: accounting_employee.external_id
  }
end
```

### 6.2 Required Aliases

```elixir
alias FlameTeampayPayables.EmberErp.Resources.{PushRequest, PushEntityRecord}
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Core.AccountingPeriod
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReport
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Parties.Employee
alias FlameTeampayPayables.EmberBridge.Services.Reconciliation.ExpenseReportReconciliationService
alias FlameTeampayPayables.ErpIntegration.MockAdapter
alias FlameTeampayPayables.Repo
```

---

## 7. MockAdapter Verification

Before implementing, verify MockAdapter supports:

```elixir
# Check if push_expense_report is supported
MockAdapter.configure_push_response(:expense_report, %{...})

# Check if expense_reports sync is supported
configure_sync_response(ctx, :expense_reports, [...])
```

If not supported, add the necessary configuration to MockAdapter.

---

## 8. Verification Requirements

### 8.1 Test Execution

```bash
# Run Flow-07 test only
mix test test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_07_lifecycle_test.exs --trace 2>&1 | tail -150

# Run all ERP tests (REQUIRED - must pass)
mix test test/flame_teampay_payables/ember_erp/ --trace 2>&1 | tail -150
```

### 8.2 Success Criteria

| Criterion | Requirement |
|-----------|-------------|
| Flow-07 tests | All pass |
| All ERP tests | All pass (0 failures) |
| No shortcuts | Tests verify actual behavior, not mocked behavior |
| Proper assertions | Each test case verifies what it claims to verify |

---

## 9. Critical Rules

From session memory [[memory:12666278]]:

- ❌ NEVER use `--force` when compiling
- ❌ NEVER use `head` on output
- ✅ ONLY use `tail -150` or more for command output
- ✅ Use unique helper names (e.g., `create_flow07_push_request`)
- ✅ Use `Code.ensure_loaded!/1` before `function_exported?/3` in tests

---

## 10. Handoff Checklist

| Step | Responsible | Status |
|------|-------------|--------|
| Committee understanding complete | Committee | ✅ |
| Findings documented | Scribe | ✅ |
| Engineering handoff documented | Scribe | ✅ |
| Engineering team receives handoff | Chair | 🔲 PENDING |
| Engineering team plans approach | Engineering | 🔲 PENDING |
| Engineering team implements | Engineering | 🔲 PENDING |
| All ERP tests pass | Engineering | 🔲 PENDING |
| Subcommittee verification | Subcommittees | 🔲 PENDING |

---

*Prepared by Sync Committee*  
*Session: SC-2026-01-01-004*  
*Ready for Engineering Team*

