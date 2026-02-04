# A5: Check Cancellation Flow

> **Flow Type**: Arterial (Operational)  
> **Provider**: Checkbook.io  
> **Status**: Production  
> **Last Updated**: 2026-01-08  
> **Prerequisite**: A3 (Check Created, not yet cashed)

---

## Plain English Summary

Sometimes you need to cancel a check before the recipient cashes it. Maybe it was sent to the wrong person, or the payment is no longer needed.

**Analogy**: Like telling the bank "Stop payment on check #1234." The check becomes worthless if someone tries to cash it.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  A5: CHECK CANCELLATION — "Stop That Check!"                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   WHEN CAN YOU CANCEL?                                                  │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  ✅ CAN Cancel:                  ❌ CANNOT Cancel:              │  │
│   │  • UNPAID (just created)         • PAID (money sent)           │  │
│   │  • IN_PROCESS (processing)       • DEPOSITED (being cashed)    │  │
│   │  • PRINTED (not yet mailed)                                     │  │
│   │  • MAILED (not yet cashed)                                      │  │
│   │  • VIEWED (not yet deposited)                                   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   THE PROCESS:                                                          │
│                                                                         │
│   Admin clicks "Cancel Check"                                           │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  DELETE /v3/check/{check_id}                                    │  │
│   │                                                                 │  │
│   │  Checkbook Response:                                            │  │
│   │  { "status": "VOID", "voided_at": "2026-01-08T..." }            │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  WHAT HAPPENS NEXT:                                             │  │
│   │                                                                 │  │
│   │  1. Check marked VOID in Checkbook                              │  │
│   │  2. PaymentTransaction → :cancelled                             │  │
│   │  3. PayoutBatch → :cancelled                                    │  │
│   │  4. ReimbursementPayment → :voided                              │  │
│   │  5. Budget released back to company                             │  │
│   │  6. Notification sent to employee:                              │  │
│   │     "Your check payment has been voided"                        │  │
│   │  7. Audit log created for compliance                            │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   IF RECIPIENT TRIES TO CASH VOIDED CHECK:                              │
│   → Bank rejects it. The check is worthless.                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Details

### Cancel Check

```
DELETE /v3/check/{check_id}
```

**Response (Success):**
```json
{
  "id": "chk_abc123",
  "status": "VOID",
  "voided_at": "2026-01-08T14:30:00Z"
}
```

**Response (Already Paid - Cannot Cancel):**
```json
{
  "error": "Check cannot be voided",
  "message": "Check has already been paid"
}
```

---

## Code Implementation

### Payout Disbursement Capability

```elixir
# lib/.../adapters/providers/checkbook/capabilities/payout_disbursement.ex

def cancel_payout(credentials_or_connection, payout_id) do
  Logger.info("Cancelling Checkbook payout", payout_id: payout_id)

  config = extract_config(credentials_or_connection)

  case Client.delete(config, "/check/#{payout_id}") do
    {:ok, response} ->
      {:ok, PayoutMapper.map_checkbook_response_to_payout_result(response)}

    {:error, %{status: 404}} ->
      {:error, :payout_not_found}

    {:error, error} ->
      Logger.error("Failed to cancel Checkbook payout",
        payout_id: payout_id,
        error: inspect(error)
      )
      {:error, error}
  end
end
```

### Webhook Handler for Cancellation

When CHECK_VOID webhook arrives (or we cancel via API):

```elixir
# lib/.../adapters/providers/checkbook/adapter.ex

# Cancelled events
event_type in ["check.cancelled"] ->
  case update_payment_transaction(payment_connection, check_id, :cancel_transaction, payload) do
    {:ok, _} ->
      # Update PayoutBatch
      update_payout_batch(payment_connection, check_id, :cancel, payload)
      
      # Process ReimbursementPayment updates and notifications
      process_reimbursement_payment_via_handler(check_id, event_type, payload)
      
      {:ok, :processed}
      
    {:error, error} ->
      {:error, error}
  end
```

### Budget Release

```elixir
# lib/.../ember_payments/webhooks/webhook_handler.ex
# CheckbookWebhookHandler

defp maybe_release_budget_on_reversal(payment, status) when status in [:voided, :expired, :refunded] do
  case ReimbursementBudgetService.release_budget_on_payment_reversal(payment, reversal_reason: status) do
    {:ok, :released} ->
      Logger.info("Budget released successfully")
      
    {:ok, :partial_release} ->
      Logger.warning("Budget partially released")
      
    {:ok, :no_budget_transaction} ->
      Logger.debug("No budget transaction to release")
      
    {:error, reason} ->
      # Log but don't fail the webhook
      Logger.error("Failed to release budget: #{inspect(reason)}")
  end
end
```

---

## Cancellable States

| Current State | Can Cancel? | Notes |
|---------------|-------------|-------|
| `UNPAID` | ✅ Yes | Just created |
| `IN_PROCESS` | ✅ Yes | Still processing |
| `PRINTED` | ✅ Yes | Printed but not mailed |
| `MAILED` | ✅ Yes | In mail, not cashed |
| `VIEWED` | ✅ Yes | Recipient saw it but didn't cash |
| `DEPOSITED` | ❌ No | Recipient is cashing it |
| `PAID` | ❌ No | Money already transferred |
| `VOID` | ❌ No | Already cancelled |
| `EXPIRED` | ❌ No | Already expired |

---

## System State Changes

### PaymentTransaction

```elixir
# State transition
payment |> Ash.Changeset.for_update(:cancel_transaction, %{}) |> Ash.update()

# Result: state → :cancelled
```

### PayoutBatch

```elixir
# State transition
batch |> Ash.Changeset.for_update(:cancel, %{}) |> Ash.update()

# Result: state → :cancelled
```

### ReimbursementPayment

```elixir
# Status update
payment |> update(:update_from_webhook, %{payment_status: :voided}) |> Ash.update()

# Result: payment_status → :voided
```

---

## Notifications

When a check is cancelled, we notify:

### Employee Notification

```elixir
def trigger_check_voided_notification(payment) do
  NotificationService.send_check_voided_notification(
    payment.employee_id,
    %{
      check_number: payment.check_number,
      amount: payment.amount,
      reason: "Voided by administrator"
    }
  )
end
```

**Message**: "Your check #1001 for $500.00 has been voided. Please contact your administrator for more information."

### Audit Log

```elixir
AuditLogger.log(:check_voided, %{
  check_id: check_id,
  payment_id: payment.id,
  voided_by: actor_id,
  voided_at: DateTime.utc_now(),
  reason: reason
})
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `check_already_paid` | Check was cashed | Cannot cancel, money already sent |
| `check_not_found` | Invalid check_id | Verify check_id is correct |
| `check_already_voided` | Already cancelled | No action needed |
| `unauthorized` | No permission | Check credentials/permissions |

### Error Response

```json
{
  "error": "Check cannot be voided",
  "code": "check_already_paid",
  "message": "Check has already been deposited and cannot be cancelled"
}
```

---

## Use Cases

### 1. Wrong Recipient

Admin realizes check was sent to wrong email:
1. Cancel the check immediately
2. Budget is released
3. Create new check to correct recipient

### 2. Payment No Longer Needed

Expense request was rejected after check creation:
1. Cancel the check
2. Budget is released
3. Expense request marked cancelled

### 3. Duplicate Payment

Same payment accidentally created twice:
1. Cancel the duplicate check
2. Original check remains active
3. Audit log records the cancellation

---

## UI Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Admin View: Payment Details                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Payment #12345                                                        │
│   Amount: $500.00                                                       │
│   Recipient: John Smith (john@example.com)                              │
│   Check #: 1001                                                         │
│   Status: MAILED                                                        │
│                                                                         │
│   [View Check Image]  [Cancel Check]  [Resend Notification]            │
│                            ▲                                            │
│                            │                                            │
│                   ┌────────┴────────┐                                   │
│                   │ Click "Cancel"  │                                   │
│                   └────────┬────────┘                                   │
│                            │                                            │
│                            ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Confirmation Dialog:                                           │  │
│   │                                                                 │  │
│   │  "Are you sure you want to cancel this check?"                  │  │
│   │                                                                 │  │
│   │  This will:                                                     │  │
│   │  • Void the check (recipient cannot cash it)                    │  │
│   │  • Release $500.00 back to budget                               │  │
│   │  • Notify the employee                                          │  │
│   │                                                                 │  │
│   │  [Cancel]  [Confirm Cancellation]                               │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Cancel check in UNPAID state
- [ ] Cancel check in IN_PROCESS state
- [ ] Cancel check in MAILED state
- [ ] Attempt to cancel PAID check (should fail)
- [ ] Verify budget is released
- [ ] Verify employee notification is sent
- [ ] Verify audit log is created
- [ ] Verify PaymentTransaction state → :cancelled
- [ ] Verify PayoutBatch state → :cancelled
- [ ] Verify ReimbursementPayment status → :voided

---

## Related Flows

- **Previous**: [A3: Check Creation](./A3_check_creation.md) — Check must exist to cancel
- **Related**: [A4: Check Lifecycle](./A4_check_lifecycle.md) — CHECK_VOID webhook handling

---

*"Stop payment, release budget, notify everyone."*

