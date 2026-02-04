# Engineering Handoff: Flow-05 Implementation

> **Session:** SC-2026-01-01-003  
> **Date:** 2026-01-01  
> **Status:** Ready for Implementation

---

## Summary

Flow-05 combines Flow-02 (new vendor auto-creation) and Flow-04 (closed period fallback). The **implementation already exists** in `PushCardSpendReactor`. The gap is **test coverage**.

---

## Architecture Verification

### Code Path Confirmed

```elixir
# Step 4: resolve_vendor
# - Calls handle_missing_vendor/3 if vendor_id is nil
# - Calls VendorPolicy.should_auto_create?/2
# - If allowed: calls auto_create_vendor/3

# Step 5: validate_accounting_period  
# - Calls find_open_period_for_date/3
# - If closed: calls find_next_open_period/4
# - Returns: %{original_date, posting_date, posting_period_id}

# Step 6: transform_to_bill_format
# - Uses vendor_info from Step 4
# - Uses period_info from Step 5
# - Correctly combines both
```

### Key Lines

| File | Lines | Purpose |
|------|-------|---------|
| `push_card_spend_reactor.ex` | 318-340 | `resolve_vendor` step |
| `push_card_spend_reactor.ex` | 426-530 | `auto_create_vendor/3` |
| `push_card_spend_reactor.ex` | 703-762 | `validate_accounting_period` step |
| `push_card_spend_reactor.ex` | 904-960 | `transform_to_bill_format` uses both |

---

## Test Implementation Plan

### File to Create

```
test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_05_lifecycle_test.exs
```

### Test Cases

| Test ID | Description | Priority |
|---------|-------------|----------|
| F05-T01 | New vendor + closed period → status = :pushed | 🔴 Critical |
| F05-T02 | Verify 3 PushEntityRecords created | 🔴 Critical |
| F05-T03 | Bill trandate = original, postingperiod = adjusted | 🔴 Critical |
| F05-T04 | Full lifecycle: Push → Sync → Bridge | 🔴 Critical |
| F05-T05 | Vendor mirror created with correct external_id | 🟠 High |
| F05-T06 | Bill mirror linked via reconciliation | 🟠 High |
| F05-T07 | Amount at threshold (edge) + closed period | 🟡 Medium |
| F05-T08 | push_metadata contains period_status = :adjusted | 🟡 Medium |

### Test Setup Requirements

1. **Accounting Periods:**
   - Create CLOSED period for transaction date
   - Create OPEN period for next month

2. **Vendor Policy:**
   - `creation_mode: :threshold`
   - `threshold: 1000` (or similar)

3. **Mock ERP Responses:**
   - Vendor push → success with external_id
   - Bill push → success with external_id
   - AP Payment push → success with external_id
   - Sync → return vendor and bill

---

## Helper Naming Convention

Use `create_flow05_*` prefix for all helpers to avoid conflicts:

```elixir
defp create_flow05_push_request(ctx, opts)
defp create_flow05_accounting_periods(ctx)
defp create_flow05_vendor_policy(ctx, opts)
```

---

## Critical Requirements

Per session rules:

- ❌ NO `--force` when compiling
- ❌ NO `head` on output  
- ✅ ONLY `tail -150` or more
- ✅ ALL tests must pass (0 failures)
- ✅ Use `Code.ensure_loaded!/1` before `function_exported?/3`
- ✅ Must pass 3 subcommittee reviews

---

## Expected Outcome

After implementation:

```
$ mix test test/flame_teampay_payables/ember_erp/integration/flows/card_spend_flow_05_lifecycle_test.exs
.......

8 tests, 0 failures
```

---

*Documented by Sync Committee Engineering*  
*Session: SC-2026-01-01-003*

