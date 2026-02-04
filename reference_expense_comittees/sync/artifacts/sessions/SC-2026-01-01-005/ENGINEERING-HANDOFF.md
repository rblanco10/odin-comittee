# Engineering Handoff: Flow-08

**Session:** SC-2026-01-01-005  
**From:** Sync Committee  
**To:** Engineering Team  
**Date:** 2026-01-01

---

## Objective

Implement comprehensive lifecycle tests for **Flow-08: Reimbursement → New Vendor**.

### Critical Invariant

> **Reimbursements NEVER auto-create ERP vendors.**
> 
> The vendor is for attribution/reporting only. No VendorPolicy checks. No vendor creation.

---

## Deliverables

1. **Test File:** `test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_08_lifecycle_test.exs`
2. **All Flow-08 tests passing**
3. **All 294+ ERP tests passing (0 failures)**

---

## Reference Materials

### Flow Documentation
- `docs/agents/architecture/integrations/erps/committees/sync/artifacts/sessions/SC-2025-12-29-001/flows/FLOW-08-REIMBURSEMENT-NEW-VENDOR.md`

### Reference Implementation (Flow-07)
- `test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_07_lifecycle_test.exs`

### Reactor Under Test
- `lib/flame_teampay_payables/ember_erp/resources/reactors/expense/push_expense_report_reactor.ex`

---

## Technical Specification

### Test Structure

```elixir
defmodule FlameTeampayPayables.EmberErp.Integration.Flows.ExpenseReportFlow08LifecycleTest do
  @moduledoc """
  Flow-08 Lifecycle Test: Reimbursement → New Vendor (NO ERP Vendor Creation)
  
  CRITICAL INVARIANT: Reimbursements NEVER create ERP vendors.
  
  Unlike card flows (Flow-02/03) where vendors CAN be auto-created,
  expense reports only reference the vendor for attribution/reporting.
  The vendor stays as a Teampay-only VendorDetail with erp_vendor_id: NULL.
  """
  
  use FlameTeampayPayables.ErpIntegrationCase
  
  @moduletag :integration
  @moduletag :flow
  @moduletag :lifecycle
  @moduletag flow: :flow_08
end
```

### Setup Requirements

1. **Accounting Period:** Create open period (same as Flow-07)
2. **Employee:** Create accounting mirror employee (same as Flow-07)
3. **NO ERP Vendor:** Do NOT create any vendor mirror in setup

```elixir
setup %{ctx: ctx} do
  # Create open accounting period (same as Flow-07)
  open_period = create_accounting_period(ctx)
  
  # Create accounting mirror employee (same as Flow-07)
  accounting_employee = create_accounting_employee(ctx)
  
  # CRITICAL: NO vendor mirror created
  # The vendor "Blue Bottle Coffee" is NEW and should NOT exist in ERP
  
  %{
    open_period: open_period,
    accounting_employee: accounting_employee,
    employee_id: accounting_employee.id,
    employee_external_id: accounting_employee.external_id
  }
end
```

---

## Test Cases

### Test 1: Complete Lifecycle (Push → Sync → Bridge)

**Purpose:** Verify the complete flow works with a new vendor.

**Steps:**
1. Create PushRequest with metadata including merchant name (new vendor)
2. Execute push via `Ash.update(:execute_push)`
3. Verify PushRequest.status == :pushed
4. Verify ONLY :expense_report PushEntityRecord created (NO :vendor)
5. Run sync for expense_reports
6. Verify ExpenseReport mirror created with employee linkage
7. Run reconciliation
8. Verify PushEntityRecord ↔ ExpenseReport linked

**Key Assertions:**
```elixir
# Verify NO vendor entity record was created
vendor_entity_records = get_push_entity_records(push_request.id, :vendor)
assert vendor_entity_records == [], "Reimbursements should NOT create vendor PushEntityRecords"

# Verify only expense_report entity record exists
expense_report_entity_record = get_flow08_push_entity_record(push_request.id, :expense_report)
assert expense_report_entity_record != nil, "Should create expense_report PushEntityRecord"

# Employee verification (learned from Flow-07)
assert expense_report_mirror.employee_id == employee_id
assert expense_report_mirror.employee_number == accounting_employee.employee_number
```

### Test 2: Verify NO Vendor PushEntityRecord

**Purpose:** Explicitly verify the invariant that no vendor is created.

**Steps:**
1. Create PushRequest for expense report with new merchant
2. Execute push
3. Query ALL PushEntityRecords for this request
4. Assert ONLY :expense_report type exists

**Key Assertions:**
```elixir
# Get all entity records for this push request
all_entity_records = Repo.all(
  from per in PushEntityRecord,
  where: per.push_request_id == ^push_request.id
)

# Should have exactly ONE record of type :expense_report
assert length(all_entity_records) == 1
assert List.first(all_entity_records).entity_type == :expense_report

# Explicitly verify no vendor records
vendor_records = Enum.filter(all_entity_records, & &1.entity_type == :vendor)
assert vendor_records == [], "INVARIANT: Reimbursements never create vendor records"
```

### Test 3: Merchant Name Attribution

**Purpose:** Verify merchant name is preserved for reporting.

**Steps:**
1. Create PushRequest with specific merchant name in metadata
2. Execute push
3. Verify push_metadata contains merchant info
4. (After sync) Verify expense line has merchant attribution

**Key Assertions:**
```elixir
# Verify merchant name in metadata
assert pushed_request.push_metadata["merchant_name"] == "Blue Bottle Coffee"

# The merchant is for attribution only - not linked to ERP vendor
```

### Test 4: Employee Payment Verification (Reinforced from Flow-07)

**Purpose:** Ensure payment goes to employee, not vendor.

**Same as Flow-07 Test Case.**

---

## Helper Functions (Unique Names for Flow-08)

```elixir
defp execute_flow08_push(ctx, push_request) do
  # Same implementation as Flow-07
end

defp create_flow08_push_request(ctx, opts) do
  # Similar to Flow-07, but with new vendor metadata
  metadata = %{
    "employee_name" => "Test Employee",
    "expense_amount" => "18.75",  # Different amount for Flow-08
    "merchant_name" => "Blue Bottle Coffee",  # NEW vendor
    "vendor_is_new" => true,  # Flag indicating new vendor
    "test_push" => true,
    "employee_id" => opts[:employee_id],
    "employee_external_id" => opts[:employee_external_id]
  }
  # ... rest of implementation
end

defp get_flow08_push_entity_record(push_request_id, entity_type) do
  # Same implementation as Flow-07
end

defp get_all_push_entity_records(push_request_id) do
  # New helper for Flow-08
  from(per in PushEntityRecord,
    where: per.push_request_id == ^push_request_id,
    select: per
  )
  |> Repo.all()
end

defp seed_flow08_sync_responses(ctx, expense_report_external_id, expense_date, employee) do
  # Same as Flow-07 - NO vendor sync response needed
end

defp configure_flow08_sync_response(ctx, expense_report_external_id, expense_date, employee) do
  # Same as Flow-07
end
```

---

## Critical Rules

1. **Use unique helper names:** `create_flow08_push_request`, `execute_flow08_push`, etc.
2. **Include employee assertions:** Learned from Flow-07 feedback
3. **Explicitly test NO vendor creation:** This is the key invariant
4. **Run full ERP test suite:** All 294+ tests must pass
5. **No shortcuts on tests:** Fix underlying issues, don't skip tests
6. **Use `tail -150`:** When running commands

---

## MockAdapter Configuration

For Flow-08, configure ONLY expense_report push responses:

```elixir
# Configure push response for expense report
MockAdapter.configure_push_response(:expense_report, %{
  external_id: expense_report_external_id,
  metadata: %{"created_at" => DateTime.utc_now() |> DateTime.to_iso8601()}
})

# DO NOT configure :vendor push response - it should never be called
```

---

## Verification Checklist

Before claiming completion:

- [ ] All Flow-08 tests pass
- [ ] Test verifies NO vendor PushEntityRecord created
- [ ] Test verifies merchant name preserved in metadata
- [ ] Employee assertions included (Flow-07 learning)
- [ ] All 294+ ERP tests pass (0 failures)
- [ ] Helper functions uniquely named for Flow-08

---

*Handoff from Sync Committee to Engineering Team*  
*Session: SC-2026-01-01-005*

