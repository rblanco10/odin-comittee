# Payment Initiation Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PaymentInitiation.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PaymentInitiation.Types`

## Purpose

The Payment Initiation capability handles **push payments** - sending money from an entity to a recipient. This is the core money-movement capability for vendor payments, reimbursements, and any outbound transfers.

## Supported Payment Rails

| Rail | Description | Settlement Time | Typical Use Case |
|------|-------------|-----------------|------------------|
| ACH (US) | Automated Clearing House | 1-3 business days | Standard payments |
| SEPA (EU) | Single Euro Payments Area | 1-2 business days | European transfers |
| Wire | Bank wire transfer | Same day / hours | High-value urgent |
| RTP | Real-Time Payments | Seconds | Instant payments |
| FedNow | Federal Reserve instant | Seconds | Instant US payments |
| SWIFT | International wires | 1-5 business days | Cross-border |

## Callback Functions

### Core Payment Operations

```elixir
@callback send_payment(config, payment_params, opts) ::
            {:ok, payment_result()} | {:error, term()}

@callback get_payment_status(config, payment_id) ::
            {:ok, payment_status()} | {:error, term()}

@callback cancel_payment(config, payment_id) ::
            {:ok, payment_result()} | {:error, term()}
```

### Recipient Management

```elixir
@callback create_recipient(config, recipient_data) ::
            {:ok, recipient_result()} | {:error, term()}

@callback update_recipient(config, recipient_id, recipient_data) ::
            {:ok, recipient_result()} | {:error, term()}

@callback verify_recipient(config, recipient_id) ::
            {:ok, verification_status()} | {:error, term()}
```

### Batch Operations

```elixir
@callback create_payment_batch(config, batch_params) ::
            {:ok, batch_result()} | {:error, term()}

@callback get_batch_status(config, batch_id) ::
            {:ok, batch_status()} | {:error, term()}
```

### Webhooks

```elixir
@callback validate_webhook(config, body, signature) ::
            {:ok, :valid} | {:error, :invalid_signature | term()}

@callback parse_webhook_event(config, payload) ::
            {:ok, webhook_event()} | {:error, term()}

@callback supported_webhook_events(config) :: [String.t()]
```

### Capability Discovery

```elixir
@callback get_capabilities(config) :: capabilities()
```

## Type Definitions

### Payment Parameters

```elixir
@type payment_params :: %{
  amount: Money.t(),
  currency: atom(),
  recipient_id: String.t() | nil,
  recipient_data: recipient_data() | nil,
  rail: payment_rail(),
  description: String.t() | nil,
  reference: String.t() | nil,
  scheduled_date: Date.t() | nil,
  metadata: map()
}
```

### Payment Result

```elixir
@type payment_result :: %{
  payment_id: String.t(),
  status: payment_status(),
  amount: Money.t(),
  rail: payment_rail(),
  estimated_arrival: Date.t() | nil,
  fee: Money.t() | nil,
  metadata: map()
}
```

### Payment Status Lifecycle

```
┌─────────┐    ┌─────────┐    ┌───────────┐    ┌───────────┐
│ pending │───▶│ pending │───▶│ processed │───▶│ completed │
└─────────┘    └─────────┘    └───────────┘    └───────────┘
     │              │               │
     │              │               │
     ▼              ▼               ▼
┌───────────┐  ┌─────────┐    ┌──────────┐
│ cancelled │  │ failed  │    │ returned │
└───────────┘  └─────────┘    └──────────┘
```

## Provider Implementation Details

### Checkbook

- **Rails**: ACH, Check (physical & digital)
- **Key Methods**: `send_check`, `send_ach`
- **Batch Support**: Yes, via check batches
- **Recipient Pre-registration**: Optional

### Dwolla

- **Rails**: ACH, RTP (via partners)
- **Key Methods**: `transfers.create`
- **Batch Support**: Yes, via mass payments
- **Recipient Pre-registration**: Required (Customers)

## Reactor Integration

The `InitiatePaymentReactor` orchestrates payment initiation with full observability:

```elixir
# Step sequence:
1. select_provider     # Choose best provider for payment
2. get_connection      # Get credentials (Platform or Direct model)
3. call_provider       # Make API call to provider
4. create_db_record    # Persist PaymentTransaction

# Compensation on failure:
- If step 4 fails, payment is cancelled at provider
- Prevents orphaned payments
```

## Dual Model Support

### Platform Model (Modern)

```elixir
PaymentTransaction.initiate_payment(
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :dwolla,
  use_platform_model: true,  # Uses CredentialResolver
  actor: actor,
  amount: Money.new(100_00, :USD),
  recipient_data: %{...},
  rail: :ach
)
```

### Direct Model (Legacy)

```elixir
PaymentTransaction.initiate_payment(
  workspace_id: workspace.id,
  entity_id: entity.id,
  amount: Money.new(100_00, :USD),
  recipient_data: %{...},
  rail: :ach
  # Uses PaymentConnection for credentials
)
```

## Observability

The Payment Initiation flow includes comprehensive observability:

- **Tempo Tracing**: Span per step with trace correlation
- **Loki Logging**: Structured logs with trace_id linking
- **Prometheus Metrics**: 
  - `payment_initiation_start`
  - `payment_initiation_stop` (with duration)
  - `payment_initiation_error`

## Error Handling

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `:no_active_connection` | Missing PaymentConnection | Configure connection for entity/provider |
| `:insufficient_funds` | Account balance too low | Add funds or reduce amount |
| `:invalid_recipient` | Bad account/routing number | Verify recipient data |
| `:provider_unavailable` | Provider API down | Retry with backoff or use fallback |
| `:rate_limited` | Too many requests | Implement exponential backoff |

## Code References

- Behavior: `lib/ember_payments/capabilities/payment_initiation/behavior.ex`
- Types: `lib/ember_payments/capabilities/payment_initiation/types.ex`
- Reactor: `lib/ember_payments/reactors/transaction/initiate_payment_reactor.ex`
- Resource: `lib/ember_payments/resources/transaction/payment_transaction.ex`
