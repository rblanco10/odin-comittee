# A4: Check Lifecycle Flow

> **Flow Type**: Arterial (Operational)  
> **Provider**: Checkbook.io  
> **Status**: Production  
> **Last Updated**: 2026-01-08  
> **Prerequisite**: A3 (Check Created)

---

## Plain English Summary

After a check is created, its status changes as the recipient receives and cashes it. Checkbook tells us about these changes via webhooks.

**Analogy**: Like package tracking. UPS texts you: "Package shipped", "Out for delivery", "Delivered". Checkbook does the same for checks.

---

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  A4: CHECK LIFECYCLE — "What's Happening With My Check?"                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌───────────┐                                    │
│                        │  UNPAID   │ ← Check generated in Checkbook     │
│                        │ (CREATED) │                                    │
│                        └─────┬─────┘                                    │
│                              │                                          │
│                              ▼                                          │
│                       ┌────────────┐                                    │
│                       │ IN_PROCESS │ ← Being processed                  │
│                       └──────┬─────┘                                    │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                       │
│           │                  │                  │                       │
│    [Digital Path]    [Physical Path]     [Problems]                     │
│           │                  │                  │                       │
│           ▼                  ▼                  ▼                       │
│    ┌──────────┐       ┌──────────┐       ┌──────────┐                   │
│    │  VIEWED  │       │ PRINTED  │       │  FAILED  │                   │
│    │(clicked) │       │          │       │ (error)  │                   │
│    └────┬─────┘       └────┬─────┘       └──────────┘                   │
│         │                  │                                            │
│         │                  ▼                                            │
│         │           ┌──────────┐                                        │
│         │           │  MAILED  │ ← Triggers notification!               │
│         │           │          │                                        │
│         │           └────┬─────┘                                        │
│         │                │                                              │
│         ▼                ▼                                              │
│    ┌──────────────────────────┐                                         │
│    │       DEPOSITED          │ ← Recipient cashed the check            │
│    │     (by recipient)       │                                         │
│    └────────────┬─────────────┘                                         │
│                 │                                                       │
│                 ▼                                                       │
│          ┌───────────┐                                                  │
│          │   PAID    │ ← SUCCESS! Money transferred. ✓                  │
│          │           │                                                  │
│          └───────────┘                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FAILURE/CANCELLATION STATES                                     │   │
│  │                                                                  │   │
│  │  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐          │   │
│  │  │  VOID  │  │ EXPIRED │  │  FAILED  │  │  REFUNDED  │          │   │
│  │  │        │  │         │  │          │  │            │          │   │
│  │  │ Admin  │  │ Uncashed│  │ Bank     │  │ Money      │          │   │
│  │  │canceled│  │ too long│  │ rejected │  │ returned   │          │   │
│  │  └────────┘  └─────────┘  └──────────┘  └────────────┘          │   │
│  │                                                                  │   │
│  │  ALL OF THESE → Budget released back to company                  │   │
│  │               → Notifications sent to admin & employee           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Webhook Events

### Event Types & Actions

| Webhook Event | Internal Status | What We Do |
|---------------|-----------------|------------|
| `CHECK_IN_PROCESS` | `:processing` | Update status |
| `CHECK_PRINTED` | `:processing` | Update status (physical) |
| `CHECK_MAILED` | `:mailed` | **Notify employee** "Your check was mailed!" |
| `CHECK_VIEWED` | `:processing` | Log (recipient saw check) |
| `CHECK_DEPOSITED` | `:processing` | Log (recipient cashing) |
| `CHECK_PAID` | `:completed` | **Mark complete**, close payment |
| `CHECK_VOID` | `:voided` | **Release budget**, notify |
| `CHECK_EXPIRED` | `:expired` | **Release budget**, notify |
| `CHECK_REFUNDED` | `:refunded` | **Release budget** |
| `CHECK_FAILED` | `:failed` | Log error, notify |

### Webhook Payload Example

```json
{
  "event": "CHECK_MAILED",
  "check_id": "chk_abc123",
  "number": 1001,
  "amount": 500.00,
  "status": "MAILED",
  "name": "John Smith",
  "date": "2026-01-08"
}
```

---

## Code Implementation

### Webhook Handler

```elixir
# lib/.../ember_payments/webhooks/webhook_handler.ex
# CheckbookWebhookHandler module

@event_to_status %{
  "CHECK_IN_PROCESS" => :processing,
  "CHECK_PRINTED" => :processing,
  "CHECK_MAILED" => :mailed,
  "CHECK_PAID" => :completed,
  "CHECK_VOID" => :voided,
  "CHECK_EXPIRED" => :expired,
  "CHECK_REFUNDED" => :refunded
}

def handle(payload, context) do
  event = payload["event"]
  check_id = payload["check_id"]
  new_status = Map.get(@event_to_status, event, :unknown)

  case find_payment_by_check_id(check_id) do
    {:ok, payment} ->
      # Update payment status
      result = update_payment_status(payment, new_status, payload)
      
      # Trigger notifications based on event
      case event do
        "CHECK_MAILED" -> trigger_check_mailed_notification(payment)
        "CHECK_VOID" -> trigger_check_voided_notification(payment)
        "CHECK_EXPIRED" -> trigger_check_expired_notification(payment)
        "CHECK_REFUNDED" -> trigger_check_refunded_notification(payment)
        _ -> :ok
      end

      result
      
    {:error, :not_found} ->
      {:ok, %{status: :acknowledged, note: "No matching payment"}}
  end
end
```

### Adapter Webhook Processing

```elixir
# lib/.../adapters/providers/checkbook/adapter.ex

def process_webhook_event(payment_connection, webhook_event) do
  event_type = webhook_event.event_type
  payload = webhook_event.raw_payload

  cond do
    String.starts_with?(event_type, "check.") or String.starts_with?(event_type, "CHECK_") ->
      handle_check_webhook(payment_connection, event_type, payload)
      
    String.starts_with?(event_type, "batch.") ->
      handle_batch_webhook(payment_connection, event_type, payload)
      
    true ->
      {:ok, :ignored}
  end
end
```

### Budget Release on Reversal

```elixir
# When check is voided, expired, or refunded
defp maybe_release_budget_on_reversal(payment, status) when status in [:voided, :expired, :refunded] do
  case ReimbursementBudgetService.release_budget_on_payment_reversal(payment, reversal_reason: status) do
    {:ok, :released} -> Logger.info("Budget released successfully")
    {:ok, :no_budget_transaction} -> Logger.debug("No budget transaction to release")
    {:error, reason} -> Logger.error("Failed to release budget: #{inspect(reason)}")
  end
end
```

---

## Status Mapping

### Checkbook → Internal

| Checkbook Status | Internal State | PayoutBatch State |
|------------------|----------------|-------------------|
| `UNPAID` | `:pending` | `:processing` |
| `IN_PROCESS` | `:processing` | `:processing` |
| `PRINTED` | `:processing` | `:processing` |
| `MAILED` | `:mailed` | `:processing` |
| `PAID` | `:completed` | `:completed` |
| `VOID` | `:voided` | `:cancelled` |
| `EXPIRED` | `:expired` | `:failed` |
| `FAILED` | `:failed` | `:failed` |
| `REFUNDED` | `:refunded` | `:cancelled` |

---

## Notifications Triggered

### CHECK_MAILED

```elixir
def trigger_check_mailed_notification(payment) do
  NotificationService.send_check_mailed_notification(
    payment.employee_id,
    %{
      check_number: payment.check_number,
      amount: payment.amount,
      estimated_delivery: "3-7 business days"
    }
  )
end
```

**Message**: "Your check #1001 for $500.00 has been mailed and should arrive in 3-7 business days."

### CHECK_VOID / CHECK_EXPIRED / CHECK_REFUNDED

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

**Message**: "Your check #1001 for $500.00 has been voided. Please contact your administrator."

---

## Real-Time UI Updates

```elixir
# Broadcast to LiveView
defp broadcast_check_status_to_ui(payment, new_status) do
  ReimbursementBroadcaster.broadcast_payment_status_change(
    payment.workspace_id,
    payment.id,
    new_status
  )
end
```

---

## Webhook Signature Validation

```elixir
# lib/.../adapters/providers/checkbook/capabilities/payout_disbursement.ex

def validate_webhook(config, body, headers) when is_list(headers) do
  signature_header = Enum.find_value(headers, fn
    {"signature", value} -> value
    _ -> nil
  end)
  
  validate_webhook_signature(config, body, signature_header)
end

defp validate_webhook_signature(config, body, signature_header) do
  webhook_secret = config["webhook_secret"]
  {nonce, received_signature} = parse_signature_header(signature_header)
  
  payload = if nonce, do: body <> nonce, else: body
  expected_signature = generate_hmac_sha256(webhook_secret, payload)
  
  if secure_compare(received_signature, expected_signature) do
    {:ok, :valid}
  else
    {:error, :invalid_signature}
  end
end
```

---

## Failure Details Extraction

When a check fails, we extract detailed information:

```elixir
defp extract_checkbook_failure_details(payload) do
  %{
    "reason" => payload["failure_reason"] || payload["reason"],
    "void_reason" => payload["void_reason"],
    "failure_code" => payload["failure_code"],
    "ach_return_code" => payload["ach_return_code"],
    "status" => payload["status"]
  }
end

# ACH return code descriptions
defp ach_return_code_description("R01"), do: "Insufficient funds"
defp ach_return_code_description("R02"), do: "Account closed"
defp ach_return_code_description("R03"), do: "No account/unable to locate"
# ... etc
```

---

## Idempotency

Webhooks may be delivered multiple times. We handle this:

```elixir
# Skip if already in target state
if target_state && payment.state == target_state do
  Logger.info("Payment already in target state (idempotency skip)")
  {:ok, :processed}
else
  # Proceed with update
end
```

---

## Testing Checklist

- [ ] Receive CHECK_IN_PROCESS webhook
- [ ] Receive CHECK_PRINTED webhook (physical)
- [ ] Receive CHECK_MAILED webhook → notification sent
- [ ] Receive CHECK_PAID webhook → payment completed
- [ ] Receive CHECK_VOID webhook → budget released
- [ ] Receive CHECK_EXPIRED webhook → budget released
- [ ] Receive CHECK_REFUNDED webhook → budget released
- [ ] Handle duplicate webhooks (idempotency)
- [ ] Handle unknown check_id gracefully
- [ ] Validate webhook signatures

---

## Related Flows

- **Previous**: [A3: Check Creation](./A3_check_creation.md) — Check must be created first
- **Related**: [A5: Check Cancellation](./A5_check_cancellation.md) — Manually void a check

---

*"From creation to completion, we're watching."*

