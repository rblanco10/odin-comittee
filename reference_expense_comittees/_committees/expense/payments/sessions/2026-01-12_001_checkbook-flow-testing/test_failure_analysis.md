# Test Failure Analysis: CHK-P5 and CHK-P8

> **Session**: 2026-01-12_001_checkbook-flow-testing  
> **Date**: 2026-01-12  
> **Conducted By**: Committee (Victoria Sterling, Chair)

---

## Summary

**Initial Status**: 86.7% pass rate (13/15 flows passing)  
**Root Cause**: Incorrect test expectations for VOID webhook event type  
**Status After Fix**: ✅ **100% pass rate (15/15 flows passing)**

---

## Failure Details

### CHK-P5: Check Cancelled
- **Test File**: `p5_check_cancelled_test.exs`
- **Failing Test**: `"parses VOID webhook to check.cancelled event type"`
- **Line**: 140
- **Error**:
  ```
  Assertion with == failed
  code:  assert event.event_type == "check.failed"
  left:  "check.voided"
  right: "check.failed"
  ```

### CHK-P8: Void Check While Pending
- **Test File**: `p8_void_check_pending_test.exs`
- **Failing Test**: `"parses VOID webhook correctly"`
- **Line**: 123
- **Error**:
  ```
  Assertion with == failed
  code:  assert event.event_type == "check.failed"
  left:  "check.voided"
  right: "check.failed"
  ```

---

## Root Cause Analysis

### Implementation Behavior

The actual implementation in `PayoutDisbursement.parse_webhook_event/2` correctly maps VOID status to `"check.voided"`:

```elixir
# From: payout_disbursement.ex:356
defp normalize_checkbook_event_type("VOID"), do: "check.voided"
```

### Test Expectations

Both tests incorrectly expected `"check.failed"` instead of `"check.voided"`:

```elixir
# ❌ INCORRECT (before fix)
assert event.event_type == "check.failed"
```

### Why This Matters

The implementation correctly distinguishes between:
- **`"check.voided"`**: Check was intentionally voided/cancelled (user action)
- **`"check.failed"`**: Check failed due to an error (system failure)

These are semantically different events and should be handled differently:
- Voided checks: User-initiated cancellation, may need different notifications
- Failed checks: System error, may need error handling and retry logic

---

## Fix Applied

### CHK-P5 Fix

**Before**:
```elixir
# VOID maps to check.failed in current implementation
# But semantically it's a cancellation
assert event.event_type == "check.failed"
```

**After**:
```elixir
# VOID maps to check.voided in current implementation
# This is semantically correct - voided is distinct from failed
assert event.event_type == "check.voided"
```

### CHK-P8 Fix

**Before**:
```elixir
# VOID maps to check.failed in current implementation
assert event.event_type == "check.failed"
```

**After**:
```elixir
# VOID maps to check.voided in current implementation
# This is semantically correct - voided is distinct from failed
assert event.event_type == "check.voided"
```

---

## Verification

### Test Results After Fix

```bash
$ MIX_ENV=test mix test test/.../p5_check_cancelled_test.exs test/.../p8_void_check_pending_test.exs

Finished in 0.07 seconds (0.07s async, 0.00s sync)
43 tests, 0 failures
```

✅ **Both test files now pass**

### Full Test Suite Results

Running `T.test_all_flows()` now shows:
- **Total Flows Tested**: 15
- **✅ Passed**: 15
- **❌ Failed**: 0
- **Pass Rate**: 100.0%

---

## Implementation Reference

### Event Type Mapping

From `payout_disbursement.ex`:

```elixir
# Success states
defp normalize_checkbook_event_type("PAID"), do: "check.processed"
defp normalize_checkbook_event_type("DEPOSITED"), do: "check.processed"

# Processing states
defp normalize_checkbook_event_type("IN_PROCESS"), do: "check.in_process"
defp normalize_checkbook_event_type("UNPAID"), do: "check.created"
defp normalize_checkbook_event_type("PRINTED"), do: "check.created"
defp normalize_checkbook_event_type("MAILED"), do: "check.mailed"

# Failure states - each gets distinct event type for proper handling
defp normalize_checkbook_event_type("FAILED"), do: "check.failed"
defp normalize_checkbook_event_type("VOID"), do: "check.voided"  # ← Correct mapping
defp normalize_checkbook_event_type("EXPIRED"), do: "check.expired"
defp normalize_checkbook_event_type("REFUNDED"), do: "check.refunded"
```

### Supported Event Types

The implementation supports these distinct event types:
- `"check.created"` - Check created
- `"check.in_process"` - Check being processed
- `"check.processed"` - Check paid/deposited
- `"check.mailed"` - Physical check mailed
- `"check.failed"` - Check failed (error)
- `"check.voided"` - Check voided (cancelled)
- `"check.expired"` - Check expired
- `"check.refunded"` - Check refunded

---

## Committee Decision

**Decision**: ✅ **Tests Fixed - Implementation is Correct**

**Rationale**:
1. The implementation correctly maps VOID to `"check.voided"` (semantically correct)
2. Tests had incorrect expectations (`"check.failed"` instead of `"check.voided"`)
3. The distinction between `"check.voided"` and `"check.failed"` is important for proper handling
4. Fix aligns tests with actual (correct) implementation behavior

**Action Taken**:
- ✅ Updated CHK-P5 test to expect `"check.voided"`
- ✅ Updated CHK-P8 test to expect `"check.voided"`
- ✅ Verified both tests now pass
- ✅ Confirmed 100% pass rate for all 15 flows

---

## Lessons Learned

1. **Test Expectations Must Match Implementation**: Tests should verify actual behavior, not assumed behavior
2. **Semantic Distinctions Matter**: `"check.voided"` vs `"check.failed"` are different events with different handling requirements
3. **Implementation Was Correct**: The bug was in the tests, not the implementation
4. **Documentation Helps**: The implementation clearly shows the mapping, making it easy to identify the issue

---

## Next Steps

✅ **Complete**: All 15 flows now pass  
✅ **Ready**: Manual testing can proceed with confidence  
⏳ **Pending**: Phoebe to manually test each flow and document results

---

*"Tests are the contract between code and expectations. When they disagree, verify which is correct."*
