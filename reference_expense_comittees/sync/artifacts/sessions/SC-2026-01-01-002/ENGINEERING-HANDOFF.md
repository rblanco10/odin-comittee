# Engineering Handoff: Flow-04 Closed Period Fallback

> **Session:** SC-2026-01-01-002  
> **Date:** 2026-01-01  
> **Status:** Ready for Implementation

---

## Executive Summary

Flow-04 (Card Transaction → Closed Period Fallback) has a **critical implementation gap**. The period fallback logic exists but sets dates incorrectly. This handoff documents the required fix.

---

## Problem Statement

### Current Behavior (INCORRECT)

When a transaction's date falls in a closed period:

```
Transaction Date: March 28, 2025 (closed period)
Next Open Period: April 2025 (starts April 1)

CURRENT OUTPUT:
  trandate = "2025-04-01"      ← WRONG (uses adjusted date)
  postingperiod = auto-derived ← Not explicitly set
  memo = "... [Original date: 2025-03-28]"
```

### Required Behavior (PER SPEC)

```
Transaction Date: March 28, 2025 (closed period)
Next Open Period: April 2025 (starts April 1)

REQUIRED OUTPUT:
  trandate = "2025-03-28"      ← PRESERVE original transaction date
  postingperiod = "Apr 2025"   ← EXPLICITLY set to next open period
```

**Why this matters:**
- `trandate` is visible in NetSuite UI and reports
- Users expect to see the actual transaction date, not when it was posted
- Audit trail requires original date preservation

---

## Gap Analysis

| Gap ID | Location | Issue | Severity |
|--------|----------|-------|----------|
| GAP-PERIOD-003 | `PushCardSpendReactor` | Uses adjusted date for `transaction_date` | 🔴 Critical |
| GAP-PERIOD-004 | NetSuite adapter | No `postingperiod` field support | 🔴 Critical |

---

## Implementation Plan

### Phase 1: Update PushCardSpendReactor

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/ap/push_card_spend_reactor.ex`

**Change 1:** Update `validate_accounting_period` step to return period ID

```elixir
# Current (line ~749):
{:ok, %{period_status: :adjusted, posting_date: adjusted_date, original_date: transaction_date}}

# Required:
{:ok, %{
  period_status: :adjusted, 
  posting_date: adjusted_date, 
  original_date: transaction_date,
  posting_period_id: next_period.external_id,  # ADD THIS
  posting_period_name: next_period.period_name  # ADD THIS
}}
```

**Change 2:** Update `find_next_open_period` to return full period info

```elixir
# Current (line ~877-879):
{:ok, %AccountingPeriod{begin_date: next_period_start}} ->
  {:ok, {:adjusted, next_period_start}}

# Required:
{:ok, %AccountingPeriod{} = period} ->
  {:ok, {:adjusted, period}}  # Return full period object
```

**Change 3:** Update `transform_to_bill_format` to use original date

```elixir
# Current (lines 921-933):
posting_date = period_info.posting_date
bill_data = %{
  bill_date: posting_date,
  transaction_date: posting_date,
  ...
}

# Required:
# Determine which date to use for trandate
transaction_date = case period_info do
  %{original_date: orig} when not is_nil(orig) -> orig
  %{posting_date: pd} -> pd
end

bill_data = %{
  bill_date: transaction_date,           # Original date for trandate
  transaction_date: transaction_date,    # Original date for trandate
  posting_period_id: period_info[:posting_period_id],  # For explicit postingperiod
  posting_period_name: period_info[:posting_period_name],
  ...
}
```

### Phase 2: Update NetSuite Adapter

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/push/bills.ex`

**Change:** Add `postingperiod` field to `transform_to_netsuite_format`

```elixir
# Current (line ~383-401):
defp transform_to_netsuite_format(data, custom_fields, dimensions) do
  %{}
  |> add_field("entity", build_entity_ref(...))
  |> add_field("trandate", format_date(data[:transaction_date] || ...))
  |> add_field("duedate", format_date(data[:due_date] || ...))
  ...
end

# Required:
defp transform_to_netsuite_format(data, custom_fields, dimensions) do
  %{}
  |> add_field("entity", build_entity_ref(...))
  |> add_field("trandate", format_date(data[:transaction_date] || ...))
  |> add_field("duedate", format_date(data[:due_date] || ...))
  |> add_field("postingperiod", build_record_ref(
    data[:posting_period_id] || data["posting_period_id"]
  ))  # ADD THIS
  ...
end
```

### Phase 3: Create Flow-04 Test File

**File:** `test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_04_lifecycle_test.exs`

**Required Tests:**

| Test ID | Description | Validation |
|---------|-------------|------------|
| F04-T01 | Transaction in closed period uses fallback | Status = :pushed |
| F04-T02 | Original transaction date preserved in trandate | Check metadata |
| F04-T03 | Posting period explicitly set to next open | Check metadata |
| F04-T04 | Period status = :adjusted in metadata | Verify period_info |
| F04-T05 | Bill and Payment both use correct dates | Both records checked |
| F04-T06 | Original date appended to memo | Memo contains date |
| F04-T07 | No periods synced → FAIL HARD | Error returned |
| F04-T08 | All periods closed → FAIL with message | Error returned |

---

## Test Execution Requirements

After implementation, verify:

1. **Flow-04 tests:** All 8 tests pass
2. **Other flow tests:** Flow-01, 02, 03, 06 still pass
3. **All ERP integration tests:** Full suite passes
4. **All reconciliation tests:** No regressions

---

## Files to Modify

| File | Change Type |
|------|-------------|
| `push_card_spend_reactor.ex` | Modify |
| `netsuite/capabilities/push/bills.ex` | Modify |
| `card_spend_flow_04_lifecycle_test.exs` | Create |
| `FLOW-04-CARD-CLOSED-PERIOD-FALLBACK.md` | Update |

---

## Acceptance Criteria

- [ ] Original transaction date preserved in `trandate`
- [ ] `postingperiod` explicitly set when adjusted
- [ ] Period info includes period ID
- [ ] Memo includes original date when adjusted
- [ ] All 8 Flow-04 tests pass
- [ ] All other flow tests pass
- [ ] All ERP integration tests pass
- [ ] 3+ subcommittees approve

---

*Documented by Sync Committee Scribe*  
*Session: SC-2026-01-01-002*

