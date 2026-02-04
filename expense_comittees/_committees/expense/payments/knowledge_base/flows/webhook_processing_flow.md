# Webhook Processing Flow

## Purpose

Receives, validates, and processes asynchronous events from payment providers, updating local state to reflect real-time changes in payment status, card transactions, verification results, and other provider-originated events.

## Actors

| Actor | Role |
|-------|------|
| **Payment Provider** | Sends webhook HTTP requests |
| **Phoenix Controller** | Receives HTTP request |
| **PaymentWebhookEvent Resource** | Persists and processes event |
| **Provider Adapter** | Validates signature, parses payload |
| **Domain Resources** | Updated based on event type |
| **Observability** | Logs, metrics, alerts |

## High-Level Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         WEBHOOK PROCESSING FLOW                            │
│                                                                            │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ RECEIVE  │──▶│   VALIDATE   │──▶│    STORE     │──▶│    PROCESS     │  │
│  │ REQUEST  │   │  SIGNATURE   │   │    EVENT     │   │     EVENT      │  │
│  └──────────┘   └──────────────┘   └──────────────┘   └────────────────┘  │
│       │               │                   │                   │            │
│       ▼               ▼                   ▼                   ▼            │
│  HTTP POST      Adapter.validate    PaymentWebhook    Domain resource     │
│  from provider  _webhook()          Event.create()    updates             │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram

```
┌────────┐  ┌───────────┐  ┌─────────────────┐  ┌────────────────────┐  ┌──────────┐
│Provider│  │ Controller│  │PaymentWebhook   │  │ProcessEvent Change │  │ Resource │
│        │  │           │  │Event            │  │                    │  │          │
└───┬────┘  └─────┬─────┘  └────────┬────────┘  └─────────┬──────────┘  └────┬─────┘
    │             │                 │                     │                  │
    │ POST /webhooks/dwolla        │                     │                  │
    │────────────▶│                 │                     │                  │
    │             │                 │                     │                  │
    │             │ validate_signature                    │                  │
    │             │────────────────▶│                     │                  │
    │             │                 │                     │                  │
    │             │ {:ok, :valid}   │                     │                  │
    │             │◀────────────────│                     │                  │
    │             │                 │                     │                  │
    │             │ create_event    │                     │                  │
    │             │────────────────▶│                     │                  │
    │             │                 │                     │                  │
    │             │                 │ process_event       │                  │
    │             │                 │───────────────────▶│                  │
    │             │                 │                     │                  │
    │             │                 │                     │ update_resource  │
    │             │                 │                     │─────────────────▶│
    │             │                 │                     │                  │
    │             │                 │ {:ok, processed}    │                  │
    │             │                 │◀───────────────────│                  │
    │             │                 │                     │                  │
    │             │ {:ok, event}    │                     │                  │
    │             │◀────────────────│                     │                  │
    │             │                 │                     │                  │
    │ 200 OK      │                 │                     │                  │
    │◀────────────│                 │                     │                  │
```

## Phase 1: Receive Request

### Controller Endpoint

```elixir
# Router
scope "/webhooks" do
  post "/checkbook", WebhookController, :checkbook
  post "/dwolla", WebhookController, :dwolla
  post "/marqeta", WebhookController, :marqeta
  post "/wex", WebhookController, :wex
end

# Controller
def dwolla(conn, _params) do
  raw_body = conn.assigns[:raw_body]
  signature = get_req_header(conn, "x-request-signature-sha-256")
  
  case PaymentWebhookEvent.receive_webhook(%{
    provider: :dwolla,
    raw_body: raw_body,
    signature: signature,
    headers: conn.req_headers
  }) do
    {:ok, event} ->
      conn |> put_status(200) |> json(%{received: true})
    
    {:error, :invalid_signature} ->
      conn |> put_status(401) |> json(%{error: "Invalid signature"})
    
    {:error, reason} ->
      conn |> put_status(422) |> json(%{error: inspect(reason)})
  end
end
```

### Raw Body Preservation

```elixir
# Plug to preserve raw body for signature validation
defmodule PreserveRawBody do
  def init(opts), do: opts
  
  def call(conn, _opts) do
    {:ok, body, conn} = Plug.Conn.read_body(conn)
    Plug.Conn.assign(conn, :raw_body, body)
  end
end
```

## Phase 2: Validate Signature

### Signature Validation

```elixir
# ValidateSignature validation module
defmodule ValidateSignature do
  use Ash.Resource.Validation
  
  def validate(changeset, _opts, _context) do
    provider = Ash.Changeset.get_attribute(changeset, :provider)
    raw_body = Ash.Changeset.get_attribute(changeset, :raw_body)
    signature = Ash.Changeset.get_attribute(changeset, :signature)
    
    adapter = AdapterRegistry.get_adapter!(provider)
    config = get_webhook_config(provider)
    
    case adapter.validate_webhook(config, raw_body, signature) do
      {:ok, :valid} -> :ok
      {:error, :invalid_signature} -> {:error, "Invalid webhook signature"}
      {:error, reason} -> {:error, inspect(reason)}
    end
  end
end
```

### Provider-Specific Signatures

**Checkbook**: HMAC-SHA256
```elixir
def validate_webhook(config, body, signature) do
  secret = config["webhook_secret"]
  expected = :crypto.mac(:hmac, :sha256, secret, body) |> Base.encode16(case: :lower)
  
  if Plug.Crypto.secure_compare(expected, signature) do
    {:ok, :valid}
  else
    {:error, :invalid_signature}
  end
end
```

**Dwolla**: HMAC-SHA256 (X-Request-Signature-SHA-256)
```elixir
def validate_webhook(config, body, signature) do
  secret = config["webhook_secret"]
  expected = :crypto.mac(:hmac, :sha256, secret, body) |> Base.encode16(case: :lower)
  
  if Plug.Crypto.secure_compare(expected, signature) do
    {:ok, :valid}
  else
    {:error, :invalid_signature}
  end
end
```

**Marqeta**: HMAC-SHA1 (multiple secrets supported)
```elixir
def validate_webhook(config, body, signature) do
  secrets = config["webhook_secrets"]  # Array of active secrets
  
  valid = Enum.any?(secrets, fn secret ->
    expected = :crypto.mac(:hmac, :sha, secret, body) |> Base.encode64()
    Plug.Crypto.secure_compare(expected, signature)
  end)
  
  if valid, do: {:ok, :valid}, else: {:error, :invalid_signature}
end
```

## Phase 3: Store Event

### PaymentWebhookEvent Resource

```elixir
# Create event record for idempotency and audit
%PaymentWebhookEvent{
  id: "evt_uuid",
  provider: :dwolla,
  event_type: "transfer_completed",
  event_id: "evt_12345",              # Provider's event ID (idempotency key)
  payload: %{...},                     # Parsed JSON payload
  raw_payload: "...",                  # Original raw body
  signature: "abc123...",              # Original signature
  status: :received,                   # :received → :processing → :processed/:failed
  processed_at: nil,
  processing_error: nil,
  correlation_id: "txn_uuid",         # Our related resource ID
  received_at: ~U[2024-01-15 10:30:00Z]
}
```

### Idempotency Check

```elixir
# Check if event already processed
defp check_idempotency(provider, event_id) do
  case PaymentWebhookEvent
       |> Ash.Query.filter(provider == ^provider and event_id == ^event_id)
       |> Ash.read_one() do
    {:ok, nil} -> :new_event
    {:ok, %{status: :processed}} -> :already_processed
    {:ok, %{status: :failed}} -> :retry_allowed
    {:ok, _} -> :processing
  end
end
```

## Phase 4: Process Event

### ProcessEvent Change Module

```elixir
defmodule ProcessEvent do
  use Ash.Resource.Change
  
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn changeset, event ->
      case process_event_by_type(event) do
        {:ok, _} ->
          event
          |> Ash.Changeset.for_update(:mark_processed, %{
            status: :processed,
            processed_at: DateTime.utc_now()
          })
          |> Ash.update()
        
        {:error, reason} ->
          event
          |> Ash.Changeset.for_update(:mark_failed, %{
            status: :failed,
            processing_error: inspect(reason)
          })
          |> Ash.update()
      end
    end)
  end
  
  defp process_event_by_type(%{provider: :dwolla, event_type: type} = event) do
    case type do
      "transfer_completed" -> handle_transfer_completed(event)
      "transfer_failed" -> handle_transfer_failed(event)
      "customer_verified" -> handle_customer_verified(event)
      "customer_verification_document_needed" -> handle_doc_needed(event)
      _ -> {:ok, :ignored}
    end
  end
end
```

### Event Handlers

**Transfer Completed**:
```elixir
defp handle_transfer_completed(event) do
  external_id = event.payload["resourceId"]
  
  PaymentTransaction
  |> Ash.Query.filter(external_payment_id == ^external_id)
  |> Ash.read_one()
  |> case do
    {:ok, txn} ->
      PaymentTransaction.update(txn.id, %{
        state: :completed,
        completed_at: DateTime.utc_now(),
        provider_metadata: Map.merge(txn.provider_metadata, event.payload)
      })
    
    {:ok, nil} ->
      Logger.warning("Webhook for unknown transaction", external_id: external_id)
      {:ok, :unknown_transaction}
  end
end
```

**Card Authorization** (Marqeta):
```elixir
defp handle_authorization(event) do
  card_token = event.payload["card_token"]
  
  # Update CardAuthorization resource
  CardAuthorization.create(%{
    external_auth_id: event.payload["token"],
    card_issuance_id: find_card_by_token(card_token).id,
    amount: Money.new(event.payload["amount"], :USD),
    merchant_name: event.payload["merchant"]["name"],
    merchant_category_code: event.payload["merchant"]["mcc"],
    status: map_auth_status(event.payload["state"]),
    authorized_at: parse_timestamp(event.payload["created_time"])
  })
end
```

## Webhook Event Types by Provider

### Checkbook

| Event Type | Description | Handler |
|------------|-------------|---------|
| `CHECK_PAID` | Check was cashed | Update PaymentTransaction |
| `CHECK_EXPIRED` | Check expired | Update PaymentTransaction |
| `CHECK_VOIDED` | Check was voided | Update PaymentTransaction |
| `ACH_COMPLETED` | ACH settled | Update PaymentTransaction |
| `ACH_RETURNED` | ACH returned | Handle return |

### Dwolla

| Event Type | Description | Handler |
|------------|-------------|---------|
| `transfer_completed` | Payment settled | Update PaymentTransaction |
| `transfer_failed` | Payment failed | Update PaymentTransaction |
| `transfer_returned` | Payment returned | Handle return |
| `customer_verified` | KYC approved | Update KybVerification |
| `customer_verification_document_needed` | Need docs | Update KybVerification |

### Marqeta

| Event Type | Description | Handler |
|------------|-------------|---------|
| `authorization` | Card auth request | Create CardAuthorization |
| `authorization.clearing` | Auth cleared | Update CardTransaction |
| `authorization.reversal` | Auth reversed | Update CardAuthorization |
| `refund` | Refund processed | Create Refund |
| `card.activated` | Card activated | Update CardIssuance |
| `card.terminated` | Card cancelled | Update CardIssuance |

### WEX

| Event Type | Description | Handler |
|------------|-------------|---------|
| `transaction.posted` | Transaction posted | Create CardTransaction |
| `transaction.declined` | Transaction declined | Log decline |
| `card.status_changed` | Card status update | Update CardIssuance |
| `exception.detected` | Fraud alert | Create alert |

## Error Handling

### Retry Strategy

```elixir
# Failed events can be retried
def retry_failed_webhooks do
  PaymentWebhookEvent
  |> Ash.Query.filter(status == :failed and retry_count < 3)
  |> Ash.read!()
  |> Enum.each(fn event ->
    PaymentWebhookEvent.reprocess(event.id)
  end)
end
```

### Dead Letter Queue

```elixir
# Events that fail repeatedly
def handle_dead_letter(event) do
  Logger.error("Webhook permanently failed", 
    event_id: event.id, 
    provider: event.provider,
    event_type: event.event_type
  )
  
  # Alert operations team
  AlertService.send_alert(:webhook_dead_letter, %{
    event_id: event.id,
    provider: event.provider,
    error: event.processing_error
  })
end
```

## Observability

### Metrics

```elixir
# Webhook processing metrics
:telemetry.execute(
  [:ember_payments, :webhook, :received],
  %{count: 1},
  %{provider: event.provider, event_type: event.event_type}
)

:telemetry.execute(
  [:ember_payments, :webhook, :processed],
  %{duration: duration_ms},
  %{provider: event.provider, event_type: event.event_type, status: status}
)
```

### Logging

```elixir
Logger.info("Webhook received",
  provider: event.provider,
  event_type: event.event_type,
  event_id: event.event_id
)

Logger.info("Webhook processed",
  provider: event.provider,
  event_type: event.event_type,
  event_id: event.event_id,
  correlation_id: event.correlation_id,
  duration_ms: duration
)
```

## Code References

- **Resource**: `lib/ember_payments/resources/webhook/payment_webhook_event.ex`
- **ProcessEvent**: `lib/ember_payments/resources/webhook/payment_webhook_event/changes/process_event.ex`
- **ValidateSignature**: `lib/ember_payments/resources/webhook/payment_webhook_event/validations/validate_signature.ex`
- **ValidatePayload**: `lib/ember_payments/resources/webhook/payment_webhook_event/validations/validate_payload.ex`
