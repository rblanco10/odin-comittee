# Flow-09 Engineering Handoff

> **Session:** SC-2026-01-01-006  
> **Date:** 2026-01-01  
> **Status:** Ready for Engineering

---

## Executive Summary

Flow-09 combines:
- **Reimbursement pattern** (Flows 07/08): ExpenseReport, employee payment, no vendor liability
- **Closed period pattern** (Flow-04): Fallback to next open period, preserve original date

**Critical Finding:** `PushExpenseReportReactor` currently lacks period validation. This must be added.

---

## Flow-09 Specification

### Scenario

- Employee submits reimbursement for expense on **March 15** (CLOSED period)
- March period closes on **March 31**
- Reimbursement approved on **April 5** (OPEN period)
- Sync triggered **April 6**

### Expected Behavior

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FLOW-09: REIMBURSEMENT → CLOSED PERIOD FALLBACK                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INPUTS:                                                                   │
│   - expense_date: March 15 (in CLOSED period)                               │
│   - employee: John Doe                                                      │
│   - vendor: Delta Airlines (attribution only)                               │
│   - amount: $450                                                            │
│                                                                             │
│   PERIOD VALIDATION:                                                        │
│   1. Check if March 15 is in open period → NO (March closed)                │
│   2. Find next open period → April 2025                                     │
│   3. Apply fallback:                                                        │
│      - PRESERVE expense_date: March 15                                      │
│      - SET posting_period: April 2025                                       │
│      - SET period_status: "adjusted"                                        │
│                                                                             │
│   ERP RECORDS CREATED:                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ ExpenseReport:                                                      │   │
│   │   - employee: John Doe (PAYEE - NOT VENDOR)                         │   │
│   │   - expense_date: March 15 (PRESERVED)                              │   │
│   │   - posting_period: April 2025 (ADJUSTED)                           │   │
│   │   - amount: $450                                                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   CRITICAL INVARIANTS:                                                      │
│   ✓ Creates ExpenseReport (NOT Vendor Bill)                                 │
│   ✓ Payment is to EMPLOYEE (NOT vendor)                                     │
│   ✓ NO vendor PushEntityRecord created                                      │
│   ✓ Expense date PRESERVED                                                  │
│   ✓ Posting period ADJUSTED to next open                                    │
│   ✓ period_status = "adjusted" in metadata                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Requirements

### 1. Add Period Validation Step to PushExpenseReportReactor

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/expense/push_expense_report_reactor.ex`

**Pattern:** Copy from `PushCardSpendReactor.validate_accounting_period` (lines 702-786)

**New Step (insert after Step 2 - load_source_expense_report):**

```elixir
# ============================================
# STEP 2.5: Validate Accounting Period
# ============================================
# Flow-09: Reimbursement → Closed Period Fallback
step :validate_accounting_period do
  argument :push_request, result(:validate_push_request)
  argument :source_expense_report, result(:load_source_expense_report)

  run fn %{push_request: push_request, source_expense_report: source_report}, _context ->
    RI.with_step("validate_accounting_period", [
      reactor: :push_expense_report,
      push_request_id: push_request.id
    ], fn ->
      Logger.info("PushExpenseReportReactor: Validating accounting period")

      # Extract expense date from source or metadata
      expense_date = extract_expense_date(source_report, push_request)

      # Skip validation in test mode if explicitly requested
      skip_period_validation = push_request.push_metadata["test_push"] == true &&
                               push_request.push_metadata["skip_period_validation"] == true

      if skip_period_validation do
        Logger.debug("PushExpenseReportReactor: Test mode - skipping period validation")
        {:ok, %{period_status: :open, posting_date: expense_date}}
      else
        case find_open_period_for_date(
          expense_date,
          push_request.workspace_id,
          push_request.erp_connection_id
        ) do
          {:ok, :period_open} ->
            {:ok, %{period_status: :open, posting_date: expense_date}}

          {:ok, {:adjusted, %AccountingPeriod{} = next_period}} ->
            {:ok, %{
              period_status: :adjusted,
              posting_date: next_period.begin_date,
              original_date: expense_date,
              posting_period_id: next_period.external_id,
              posting_period_name: next_period.period_name
            }}

          {:error, :no_periods_synced} ->
            {:error, "No accounting periods synced. Please sync periods first."}

          {:error, :no_open_period_found} ->
            {:error, "No open accounting period found. All periods are closed."}
        end
      end
    end)
  end
end
```

### 2. Update transform_to_erp_format Step

Add period validation result as argument and include in ERP data:

```elixir
step :transform_to_erp_format do
  argument :source_expense_report, result(:load_source_expense_report)
  argument :related_line_items, result(:load_related_line_items)
  argument :push_request, result(:validate_push_request)
  argument :period_validation, result(:validate_accounting_period)  # NEW

  run fn %{..., period_validation: period_validation}, _context ->
    # ... existing transformation ...
    
    # Add period info to ERP data
    erp_data = erp_data
    |> Map.put("posting_period_id", period_validation[:posting_period_id])
    |> Map.put("posting_date", period_validation.posting_date)
    |> Map.put("_period_status", period_validation.period_status)
    |> Map.put("_original_date", period_validation[:original_date])
    
    {:ok, erp_data}
  end
end
```

### 3. Update complete_push_request Step

Include period status in metadata:

```elixir
# In complete_push_request
metadata = Map.merge(push_request.push_metadata || %{}, %{
  # ... existing metadata ...
  "period_status" => to_string(erp_data["_period_status"]),
  "posting_date" => Date.to_string(erp_data["posting_date"]),
  "expense_date" => Date.to_string(erp_data["_original_date"] || erp_data["posting_date"])
})
```

### 4. Add Period Helper Functions

Copy from `PushCardSpendReactor`:
- `find_open_period_for_date/3`
- `check_periods_exist_and_find_next/4`
- `find_next_open_period/4`
- `extract_expense_date/2` (adapt for reimbursement context)

---

## Test Specification

### Test File

**Path:** `test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_09_lifecycle_test.exs`

### Test Cases

| Test ID | Description | Assertion |
|---------|-------------|-----------|
| F09-T01 | Transaction in closed period uses fallback | status = :pushed |
| F09-T02 | Original expense date preserved in metadata | push_metadata["expense_date"] = March 15 |
| F09-T03 | Posting period set to next open period | push_metadata["posting_date"] in April |
| F09-T04 | Period status is "adjusted" | push_metadata["period_status"] = "adjusted" |
| F09-T05 | ExpenseReport PushEntityRecord created | entity_type = :expense_report |
| F09-T06 | NO vendor PushEntityRecord created | vendor_records == [] |
| F09-T07 | Employee linkage correct after sync | expense_report.employee_id set |
| F09-T08 | Complete lifecycle with period adjustment | Push → Sync → Bridge all succeed |
| F09-T09 | No periods synced returns error | status = :failed, error mentions "periods" |
| F09-T10 | All periods closed returns error | status = :failed, error mentions "closed" |

### Test Setup Pattern

```elixir
setup %{ctx: ctx} do
  today = Date.utc_today()
  
  # Last month: CLOSED (expense date will be here)
  last_month_start = today |> Date.beginning_of_month() |> Date.add(-1) |> Date.beginning_of_month()
  
  # This month: OPEN (fallback target)
  this_month_start = Date.beginning_of_month(today)
  
  # Create periods
  {:ok, closed_period} = create_flow09_accounting_period(ctx, %{
    period_name: "Last Month",
    start_date: last_month_start,
    end_date: Date.end_of_month(last_month_start),
    is_open: false  # CLOSED
  })
  
  {:ok, open_period} = create_flow09_accounting_period(ctx, %{
    period_name: "This Month", 
    start_date: this_month_start,
    end_date: Date.end_of_month(this_month_start),
    is_open: true  # OPEN
  })
  
  # Create employee (required for reimbursement)
  {:ok, employee} = create_flow09_employee(ctx)
  
  %{
    closed_period: closed_period,
    open_period: open_period,
    employee: employee,
    expense_date: Date.add(last_month_start, 14)  # 15th of last month
  }
end
```

---

## Verification Checklist

After implementation, verify:

- [ ] `validate_accounting_period` step added to PushExpenseReportReactor
- [ ] Period status captured in push_metadata
- [ ] Expense date preserved when period adjusted
- [ ] All 10 tests pass
- [ ] ALL ERP tests still pass (0 failures)
- [ ] Employee assertions verified (learned from Flow-07)
- [ ] No vendor records created (learned from Flow-08)

---

## Dependencies

This implementation depends on:
- `AccountingPeriod` resource (exists ✅)
- `PushExpenseReportReactor` (exists ✅, needs modification)
- `ExpenseReportReconciliationService` (exists ✅)
- Period validation helpers in `PushCardSpendReactor` (exists ✅, copy pattern)

---

*Documented by Sync Committee Scribe*  
*Session: SC-2026-01-01-006*

