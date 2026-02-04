# Payment Initiation Flow

## Purpose

Initiates an outbound payment (push payment) from an entity to a recipient, handling provider selection, credential resolution, API calls, and database persistence with full compensation support.

## Actors

| Actor | Role |
|-------|------|
| **User/System** | Initiates payment request |
| **PaymentTransaction Resource** | Entry point, action definition |
| **InitiatePaymentReactor** | Multi-step workflow orchestration |
| **CapabilityRouter** | Selects optimal provider |
| **CredentialResolver / PaymentConnection** | Provides API credentials |
| **Provider Adapter** | Makes provider API call |
| **Database** | Persists PaymentTransaction record |
| **Observability Services** | Logs, traces, metrics |

## Sequence Diagram

```
┌──────────┐  ┌──────────────────┐  ┌─────────────────────┐  ┌──────────────┐  ┌─────────┐  ┌────────┐
│  Caller  │  │PaymentTransaction│  │InitiatePaymentReactor│  │CapabilityRouter│  │ Adapter │  │Provider│
└────┬─────┘  └────────┬─────────┘  └──────────┬──────────┘  └──────┬───────┘  └────┬────┘  └───┬────┘
     │                 │                       │                    │               │           │
     │  initiate_payment()                     │                    │               │           │
     │────────────────▶│                       │                    │               │           │
     │                 │                       │                    │               │           │
     │                 │  invoke reactor       │                    │               │           │
     │                 │──────────────────────▶│                    │               │           │
     │                 │                       │                    │               │           │
     │                 │                       │  select_provider   │               │           │
     │                 │                       │───────────────────▶│               │           │
     │                 │                       │                    │               │           │
     │                 │                       │    :dwolla         │               │           │
     │                 │                       │◀───────────────────│               │           │
     │                 │                       │                    │               │           │
     │                 │                       │  get_connection()  │               │           │
     │                 │                       │─────────────────────────────────────────────────▶
     │                 │                       │                    │               │           │
     │                 │                       │  send_payment()    │               │           │
     │                 │                       │────────────────────────────────────▶│           │
     │                 │                       │                    │               │           │
     │                 │                       │                    │               │  API POST │
     │                 │                       │                    │               │──────────▶│
     │                 │                       │                    │               │           │
     │                 │                       │                    │               │ payment_id│
     │                 │                       │                    │               │◀──────────│
     │                 │                       │                    │               │           │
     │                 │                       │  {:ok, result}     │               │           │
     │                 │                       │◀───────────────────────────────────│           │
     │                 │                       │                    │               │           │
     │                 │                       │  create_db_record  │               │           │
     │                 │                       │──────────────────────────────────────────────────▶
     │                 │                       │                    │               │           │ DB
     │                 │                       │                    │               │           │
     │                 │  {:ok, payment}       │                    │               │           │
     │                 │◀──────────────────────│                    │               │           │
     │                 │                       │                    │               │           │
     │ {:ok, payment}  │                       │                    │               │           │
     │◀────────────────│                       │                    │               │           │
     │                 │                       │                    │               │           │
```

## Reactor Steps

### Step 1: Select Provider

**Purpose**: Determine the optimal provider for this payment.

**Inputs**:
- `amount` - Payment amount (Money.t)
- `rail` - Payment rail (:ach, :wire, :rtp, etc.)
- `workspace_id` - Workspace context
- `entity_id` - Paying entity

**Logic**:
```elixir
PaymentOrchestrator.select_provider_for_payment(
  currency: Money.to_currency_code(amount),
  rail: rail,
  amount: amount
)
```

**Outputs**:
- Provider atom (e.g., `:dwolla`, `:checkbook`)

**Observability**:
- Creates root Tempo span for payment initiation
- Logs payment initiation start to Loki
- Emits `payment_initiation_start` Prometheus metric

### Step 2: Get Connection

**Purpose**: Retrieve credentials for the selected provider.

**Inputs**:
- `provider` - From step 1
- `entity_id` - Paying entity
- `workspace_id` - Workspace context
- `use_platform_model` - Boolean flag

**Platform Model Logic**:
```elixir
# Returns :platform_model placeholder
# Credentials resolved in step 3 via AdapterExecutor
{:ok, :platform_model}
```

**Direct Model Logic**:
```elixir
PaymentConnection
|> Ash.Query.filter(
  entity_id == ^entity_id and
  provider == ^provider and
  state == :active
)
|> Ash.read_one()
```

**Outputs**:
- `PaymentConnection` struct (Direct) or `:platform_model` atom (Platform)

### Step 3: Call Provider

**Purpose**: Execute the payment at the provider.

**Inputs**:
- `amount`, `recipient_data`, `rail`, `description` - Payment details
- `workspace_id`, `entity_id` - Context
- `provider` - Selected provider
- `connection` - From step 2
- `actor` - For Platform Model authorization

**Platform Model Logic**:
```elixir
AdapterExecutor.execute(
  provider,
  workspace_id,
  entity_id,
  :payout_disbursement,
  :create_payout,
  [payment_params, []],
  actor
)
```

**Direct Model Logic**:
```elixir
Ash.read(PaymentTransaction,
  action: :initiate_payment_with_provider,
  arguments: [
    amount: amount,
    recipient_data: recipient_data,
    rail: rail,
    description: description,
    provider: provider,
    payment_connection: connection
  ]
)
```

**Outputs**:
- Provider result with `payment_id`, `status`, `estimated_arrival`

**Observability**:
- Child span for provider call
- Logs provider response

### Step 4: Create DB Record

**Purpose**: Persist the PaymentTransaction to the database.

**Inputs**:
- `provider_result` - From step 3
- `connection` - From step 2
- `workspace_id`, `entity_id` - Context

**Logic**:
```elixir
PaymentTransaction.create(%{
  workspace_id: workspace_id,
  entity_id: entity_id,
  provider: result.provider,
  payment_connection_id: payment_connection_id,
  external_payment_id: result.payment_id,
  capability: :payment_initiation,
  direction: :outbound,
  amount: result.amount,
  rail: result.rail,
  description: result.description,
  recipient_name: result.recipient_name,
  state: :pending,
  estimated_arrival_date: result.estimated_arrival,
  provider_metadata: result.metadata
})
```

**Outputs**:
- Persisted `PaymentTransaction` struct

**Compensation** (if DB write fails):
```elixir
# Platform Model: Cancel via AdapterExecutor
AdapterExecutor.execute(
  provider,
  workspace_id,
  entity_id,
  :payout_disbursement,
  :cancel_payout,
  [%{payment_id: external_payment_id}, []],
  actor
)

# Direct Model: Cancel via AdapterRegistry
adapter = AdapterRegistry.get_adapter(provider)
adapter.cancel_payment(config, external_payment_id)
```

**Observability**:
- Logs payment initiation end (success/failure)
- Emits `payment_initiation_stop` or `payment_initiation_error` metric
- Records duration

## Error Scenarios

| Scenario | Step | Handling |
|----------|------|----------|
| No provider available | 1 | Return `{:error, :no_available_provider}` |
| No active connection | 2 | Return `{:error, :no_active_connection}` |
| Provider API error | 3 | Return provider error, no compensation needed |
| DB write failure | 4 | **Compensate**: Cancel payment at provider |
| Insufficient funds | 3 | Return `{:error, :insufficient_funds}` |
| Invalid recipient | 3 | Return `{:error, :invalid_recipient}` |

## Usage Examples

### Platform Model (Modern)

```elixir
{:ok, payment} = PaymentTransaction.initiate_payment(
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :dwolla,
  use_platform_model: true,
  actor: current_user,
  amount: Money.new(100_00, :USD),
  recipient_data: %{
    name: "Acme Corp",
    account_number: "123456789",
    routing_number: "021000021"
  },
  rail: :ach,
  description: "Invoice payment #INV-001"
)
```

### Direct Model (Legacy)

```elixir
{:ok, payment} = PaymentTransaction.initiate_payment(
  workspace_id: workspace.id,
  entity_id: entity.id,
  amount: Money.new(100_00, :USD),
  recipient_data: %{
    name: "Vendor LLC",
    account_number: "987654321",
    routing_number: "021000021"
  },
  rail: :ach,
  description: "PO-2024-001"
)
```

## Observability Details

### Tempo Traces

```
InitiatePaymentReactor (root span)
├── select_provider (child span)
│   └── PaymentOrchestrator.select_provider_for_payment
├── get_connection (child span)
│   └── PaymentConnection query OR :platform_model
├── call_provider (child span)
│   └── AdapterExecutor.execute OR manual action
└── create_db_record (child span)
    └── PaymentTransaction.create
```

### Loki Log Events

```json
{"level":"info","msg":"Payment initiation started","trace_id":"abc123","workspace_id":"ws_1","entity_id":"ent_1","amount":10000,"rail":"ach"}
{"level":"info","msg":"Provider selected","trace_id":"abc123","provider":"dwolla"}
{"level":"info","msg":"Provider call succeeded","trace_id":"abc123","external_payment_id":"pay_xyz"}
{"level":"info","msg":"Payment initiation completed","trace_id":"abc123","payment_id":"uuid","duration_ms":1234}
```

### Prometheus Metrics

```
ember_payments_payment_initiation_total{provider="dwolla",rail="ach",status="success"} 1
ember_payments_payment_initiation_duration_ms{provider="dwolla",rail="ach"} 1234
ember_payments_payment_initiation_errors_total{provider="dwolla",rail="ach",error_type="insufficient_funds"} 0
```

## Code References

- **Reactor**: `lib/ember_payments/reactors/transaction/initiate_payment_reactor.ex`
- **Resource**: `lib/ember_payments/resources/transaction/payment_transaction.ex`
- **Manual Action**: `lib/ember_payments/resources/transaction/payment_transaction/manual_actions/initiate_payment.ex`
- **Capability Router**: `lib/ember_payments/adapters/capability_router.ex`
- **Adapter Executor**: `lib/ember_payments/services/adapter_executor.ex`
