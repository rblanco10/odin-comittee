# Flow-10 Engineering Handoff

**Session:** SC-2026-01-01-007  
**Date:** 2026-01-01  
**Status:** READY FOR ENGINEERING

---

## Executive Summary

Flow-10 implements the **Reimbursement → Closed Period (NO Fallback)** scenario. When a reimbursement's expense date falls in a closed accounting period AND period fallback is explicitly disabled, the push MUST be blocked.

This is the complement to Flow-09 which allows fallback to the next open period.

---

## Scenario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOW-10: CLOSED PERIOD, NO FALLBACK                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   TIMELINE                                                                  │
│   March 15        March 31           April 5                                │
│      │               │                  │                                   │
│      ▼               ▼                  ▼                                   │
│   Expense        Period            Reimbursement                            │
│   incurred       closes            approved                                 │
│                                                                             │
│   PRE-CONDITIONS:                                                           │
│   - Expense date: March 15 (CLOSED period)                                  │
│   - allow_period_fallback: FALSE                                            │
│   - Employee: EXISTS in ERP                                                 │
│                                                                             │
│   EXPECTED OUTCOME:                                                         │
│   ✗ Push is BLOCKED                                                         │
│   ✗ NO ExpenseReport created in ERP                                         │
│   ✗ NO vendor PushEntityRecord (reimbursement invariant)                    │
│   ✓ Error message: "closed period and fallback disabled"                    │
│   ✓ status = :blocked                                                       │
│   ✓ period_status = "blocked" in metadata                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Invariants

1. **Reimbursements NEVER create ERP vendors** (from Flow-07/08)
2. **If fallback disabled + closed period → BLOCK push**
3. **Clear error message required**
4. **Original expense date preserved in metadata**
5. **Default behavior (no flag) = fallback ALLOWED** (backward compatibility)

---

## Implementation Requirements

### 1. Modify `check_expense_period_for_date/4`

**File:** `lib/.../reactors/expense/push_expense_report_reactor.ex`

**Current behavior:**
```elixir
defp check_expense_period_for_date(date, workspace_id, erp_connection_id, opts) do
  case ... do
    {:ok, %AccountingPeriod{}} ->
      {:ok, :period_open}

    {:ok, nil} ->
      # Period closed - ALWAYS falls back (PROBLEM!)
      find_next_open_expense_period(date, workspace_id, erp_connection_id, opts)
  end
end
```

**Required behavior:**
```elixir
defp check_expense_period_for_date(date, workspace_id, erp_connection_id, opts) do
  allow_fallback = Keyword.get(opts, :allow_fallback, true)
  
  case ... do
    {:ok, %AccountingPeriod{}} ->
      {:ok, :period_open}

    {:ok, nil} ->
      # Period closed - check if fallback is allowed
      if allow_fallback do
        find_next_open_expense_period(date, workspace_id, erp_connection_id, opts)
      else
        {:error, :fallback_disabled}  # NEW FOR FLOW-10
      end
  end
end
```

### 2. Modify `validate_accounting_period` Step

Extract `allow_period_fallback` from push_metadata and pass to helpers:

```elixir
allow_fallback = push_request.push_metadata["allow_period_fallback"] != false
opts_with_fallback = Keyword.put(opts, :allow_fallback, allow_fallback)

case find_open_period_for_expense_date(expense_date, workspace_id, erp_connection_id, opts_with_fallback) do
  {:error, :fallback_disabled} ->
    # NEW: Handle blocked case for Flow-10
    Logger.warning("PushExpenseReportReactor: Period closed and fallback disabled")
    {:error, "Expense date falls in closed period and period fallback is disabled."}
  ...
end
```

### 3. Add Error Handling for `:fallback_disabled`

In the step's run function, handle the new error:

```elixir
{:error, :fallback_disabled} ->
  Logger.warning("PushExpenseReportReactor: Period closed, fallback disabled for date #{expense_date}")
  TempoTracingService.set_span_attributes([
    {"accounting_period.status", "blocked"},
    {"accounting_period.fallback_disabled", true}
  ])
  {:error, "Expense date falls in closed period and period fallback is disabled. Please adjust the expense date or enable period fallback."}
```

---

## Test Requirements (10 Tests)

| Test ID | Description | Expected |
|---------|-------------|----------|
| F10-T01 | Expense in closed period, fallback=false | status=:blocked |
| F10-T02 | Error message contains "fallback disabled" | String contains expected text |
| F10-T03 | NO ExpenseReport PushEntityRecord created | Zero records |
| F10-T04 | NO vendor PushEntityRecord (reimbursement invariant) | Zero vendor records |
| F10-T05 | Original expense date in metadata | expense_date matches input |
| F10-T06 | period_status = "blocked" or not present | Not "adjusted" |
| F10-T07 | Fallback=true still works (regression check) | Same as Flow-09 |
| F10-T08 | Default (no flag) = fallback allowed (regression) | Same as Flow-09 |
| F10-T09 | Open period, fallback=false still succeeds | status=:pushed |
| F10-T10 | Multiple closed periods, fallback=false | Still blocked |

---

## Files to Modify

1. `lib/.../reactors/expense/push_expense_report_reactor.ex`
   - `validate_accounting_period` step
   - `check_expense_period_for_date/4` helper
   - `find_open_period_for_expense_date/3` helper

2. **NEW:** `test/.../integration/flows/expense_report_flow_10_lifecycle_test.exs`
   - 10 test cases as specified above

---

## Validation Checklist

- [ ] All 10 Flow-10 tests pass
- [ ] All Flow-09 tests still pass (no regression)
- [ ] All ERP integration tests pass (274 tests)
- [ ] Error messages are clear and actionable
- [ ] Backward compatibility maintained (default = fallback allowed)

---

## Notes from Previous Session

From SC-2026-01-01-006 (Flow-09):
> When adding new validation steps to reactors, MUST verify ALL existing tests still pass.

This means after implementing Flow-10, we must run:
```bash
mix test test/flame_teampay_payables/ember_erp --only integration
```

And ensure **0 failures**.

