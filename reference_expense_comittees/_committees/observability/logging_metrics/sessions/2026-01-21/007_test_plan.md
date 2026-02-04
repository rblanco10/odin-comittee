# Test Plan: Operation-End Event Gap Fix Validation

> **Session**: 2026-01-21_007  
> **Prepared By**: SC16 Quality Assurance Subcommittee  
> **Date**: 2026-01-21

---

## 1. Overview

This test plan validates that the logging gap fix correctly emits `*_end` events for early step failures in all 5 card operation reactors.

---

## 2. Test Scope

### 2.1 Reactors Modified

| Reactor | Steps with New Error Logging | Helper Function Added |
|---------|------------------------------|----------------------|
| FreezeCardReactor | validate_actor, fetch_card, get_connection, validate_state | `log_operation_end_on_step_error/3` |
| UnfreezeCardReactor | validate_actor, fetch_card, get_connection, validate_state | `log_operation_end_on_step_error/3` |
| CancelCardReactor | validate_actor, fetch_card, get_connection, validate_state | `log_operation_end_on_step_error/3` |
| IssueCardReactor | validate_actor, get_connection | `log_operation_end_on_step_error/3` |
| UpdateSpendingLimitsReactor | validate_actor, fetch_card, get_connection | `log_operation_end_on_step_error/3` |

### 2.2 New Field Added

All `*_end` events now include a `failed_at_step` field that identifies which step caused the failure.

---

## 3. Test Scenarios

### 3.1 FreezeCardReactor

| Scenario ID | Step | Trigger Condition | Expected Log Event |
|-------------|------|-------------------|-------------------|
| FR-001 | validate_actor | Pass `actor: nil` | `ember_payments_card_freeze_end` with `status="error"`, `failed_at_step="validate_actor"` |
| FR-002 | fetch_card | Pass non-existent `card_id` | `ember_payments_card_freeze_end` with `status="error"`, `failed_at_step="fetch_card"` |
| FR-003 | get_connection | Card with no active PaymentConnection | `ember_payments_card_freeze_end` with `status="error"`, `failed_at_step="get_connection"` |
| FR-004 | validate_state | Card in `:cancelled` state | `ember_payments_card_freeze_end` with `status="error"`, `failed_at_step="validate_state"` |

### 3.2 UnfreezeCardReactor

| Scenario ID | Step | Trigger Condition | Expected Log Event |
|-------------|------|-------------------|-------------------|
| UR-001 | validate_actor | Pass `actor: nil` | `ember_payments_card_unfreeze_end` with `status="error"`, `failed_at_step="validate_actor"` |
| UR-002 | fetch_card | Pass non-existent `card_id` | `ember_payments_card_unfreeze_end` with `status="error"`, `failed_at_step="fetch_card"` |
| UR-003 | get_connection | Card with no active PaymentConnection | `ember_payments_card_unfreeze_end` with `status="error"`, `failed_at_step="get_connection"` |
| UR-004 | validate_state | Card in `:active` state (not frozen) | `ember_payments_card_unfreeze_end` with `status="error"`, `failed_at_step="validate_state"` |

### 3.3 CancelCardReactor

| Scenario ID | Step | Trigger Condition | Expected Log Event |
|-------------|------|-------------------|-------------------|
| CR-001 | validate_actor | Pass `actor: nil` | `ember_payments_card_cancel_end` with `status="error"`, `failed_at_step="validate_actor"` |
| CR-002 | fetch_card | Pass non-existent `card_id` | `ember_payments_card_cancel_end` with `status="error"`, `failed_at_step="fetch_card"` |
| CR-003 | get_connection | Card with no active PaymentConnection | `ember_payments_card_cancel_end` with `status="error"`, `failed_at_step="get_connection"` |
| CR-004 | validate_state | Card already cancelled | `ember_payments_card_cancel_end` — NOTE: This returns `skip: true`, not error |

### 3.4 IssueCardReactor

| Scenario ID | Step | Trigger Condition | Expected Log Event |
|-------------|------|-------------------|-------------------|
| IR-001 | validate_actor | Pass `actor: nil` | `ember_payments_card_issuance_end` with `status="error"`, `failed_at_step="validate_actor"` |
| IR-002 | get_connection | Entity with no active PaymentConnection | `ember_payments_card_issuance_end` with `status="error"`, `failed_at_step="get_connection"` |

### 3.5 UpdateSpendingLimitsReactor

| Scenario ID | Step | Trigger Condition | Expected Log Event |
|-------------|------|-------------------|-------------------|
| SL-001 | validate_actor | Pass `actor: nil` | `ember_payments_card_limits_update_end` with `status="error"`, `failed_at_step="validate_actor"` |
| SL-002 | fetch_card | Pass non-existent `card_id` | `ember_payments_card_limits_update_end` with `status="error"`, `failed_at_step="fetch_card"` |
| SL-003 | get_connection | Card with `payment_connection: nil` | `ember_payments_card_limits_update_end` with `status="error"`, `failed_at_step="get_connection"` |

---

## 4. Validation Methods

### 4.1 Unit Test Approach (Recommended)

```elixir
# Example test for FreezeCardReactor validate_actor failure
defmodule FreezeCardReactorLoggingTest do
  use ExUnit.Case
  import ExUnit.CaptureLog
  
  test "logs operation-end event when validate_actor fails" do
    # Arrange: Set up mock expectations for LokiLoggingService
    expect(LokiLoggingService, :log_card_freeze_end, fn opts ->
      assert opts[:status] == "error"
      assert opts[:failed_at_step] == "validate_actor"
      assert opts[:error_reason] =~ "actor_required"
      :ok
    end)
    
    # Act: Call reactor with nil actor
    result = FreezeCardReactor.run(%{
      card_id: "some-card-id",
      reason: "test",
      actor: nil,  # This triggers validate_actor failure
      use_platform_model: false
    })
    
    # Assert
    assert {:error, :actor_required} = result
  end
end
```

### 4.2 Integration Test with Log Capture

```elixir
test "freeze card with missing connection logs end event" do
  # Create card without payment_connection
  card = insert(:card_issuance, payment_connection: nil)
  
  log = capture_log(fn ->
    FreezeCardReactor.run(%{
      card_id: card.id,
      reason: "test",
      actor: %{id: "user-123"},
      use_platform_model: false
    })
  end)
  
  # Verify the error was logged (if using Logger)
  assert log =~ "no_active_connection" or log =~ "get_connection"
end
```

### 4.3 Manual Verification via Grafana

Query to run in Grafana/Loki after triggering a failure:

```logql
{domain="ember_payments"} 
| json 
| event_type=~"ember_payments_card_.*_end" 
| status="error" 
| failed_at_step!=""
```

Expected result: Should show logs with the new `failed_at_step` field populated.

---

## 5. Dashboard Verification

### 5.1 Tier 2 Card Operations Dashboard

After implementing the fix, the Tier 2 dashboard query:

```logql
sum by (status) (
  count_over_time({domain="ember_payments", event_type=~"ember_payments_card_.*_end"}[$__range])
)
```

Should now include failures from early step errors, not just `call_provider` failures.

### 5.2 New Dashboard Panel (Recommended)

Add a panel to show failures by step:

```logql
sum by (failed_at_step) (
  count_over_time(
    {domain="ember_payments"} 
    | json 
    | event_type=~"ember_payments_card_.*_end" 
    | status="error" 
    | failed_at_step!="" 
    [$__range]
  )
)
```

---

## 6. Test Execution

### 6.1 Compilation Check

```bash
cd campsite/flames/flame_teampay_payables
mix compile --warnings-as-errors
```

**Expected**: No compilation errors or warnings

### 6.2 Existing Test Suite

```bash
mix test
```

**Expected**: All existing tests pass (no regressions)

### 6.3 Manual Smoke Test

1. Start the application locally
2. Trigger a freeze operation on a card with no active PaymentConnection
3. Check Loki/Grafana for the `ember_payments_card_freeze_end` event
4. Verify `failed_at_step="get_connection"` is present
5. Verify the Tier 2 dashboard now shows this failure

---

## 7. Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| All 5 reactors compile without errors | ⬜ |
| Helper function `log_operation_end_on_step_error/3` added to all reactors | ⬜ |
| Early step failures emit `*_end` events with `status="error"` | ⬜ |
| New `failed_at_step` field populated correctly | ⬜ |
| Tier 2 dashboard shows previously-hidden failures | ⬜ |
| No double-logging (end event emitted exactly once per failure) | ⬜ |
| Existing tests pass (no regressions) | ⬜ |

---

## 8. Sign-Off

| Role | Name | Sign-Off | Date |
|------|------|----------|------|
| QA Lead | James Wright | ⬜ | |
| Chair | Dr. Alexandra Chen | ⬜ | |
| Human Director | | ⬜ | |

---

*Document prepared by SC16 Quality Assurance Subcommittee*

