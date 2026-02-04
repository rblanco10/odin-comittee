# Payment Transaction Resources

Comprehensive documentation for the core payment transaction resources in EmberPayments.

## PaymentTransaction

**Location**: `lib/ember_payments/resources/transaction/payment_transaction.ex`

The central resource for tracking all payment operations - both inbound and outbound money movement.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenancy key |
| `entity_id` | UUID | Paying/receiving entity |
| `provider` | atom | Provider (:dwolla, :checkbook) |
| `payment_connection_id` | UUID | Connection used (Direct Model) |
| `external_payment_id` | string | Provider's payment ID |
| `capability` | atom | :payment_initiation, :payment_collection |
| `direction` | atom | :inbound, :outbound |
| `amount` | Money | Payment amount |
| `currency` | atom | Currency code |
| `rail` | atom | :ach, :wire, :check, :rtp |
| `state` | atom | Current status |
| `description` | string | Payment memo |
| `reference` | string | External reference |
| `recipient_name` | string | Payee name |
| `recipient_account_last_four` | string | Last 4 of account |
| `scheduled_date` | date | Future payment date |
| `estimated_arrival_date` | date | Expected settlement |
| `completed_at` | datetime | When completed |
| `failed_at` | datetime | When failed |
| `failure_reason` | string | Error description |
| `return_code` | string | ACH return code |
| `return_reason` | string | Return description |
| `fee_amount` | Money | Transaction fee |
| `provider_metadata` | map | Raw provider data |
| `idempotency_key` | string | Dedup key |
| `trace_id` | string | Observability trace |

### State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   PAYMENT STATE MACHINE                         │
│                                                                 │
│  ┌─────────┐     ┌───────────┐     ┌───────────┐               │
│  │ pending │────▶│ processing│────▶│ completed │               │
│  └────┬────┘     └─────┬─────┘     └───────────┘               │
│       │                │                                        │
│       │                │                                        │
│       ▼                ▼                                        │
│  ┌─────────┐     ┌──────────┐      ┌──────────┐                │
│  │cancelled│     │  failed  │      │ returned │◀──(completed)  │
│  └─────────┘     └──────────┘      └──────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Actions

#### Create Actions

```elixir
# Standard create (for imports, manual entry)
action :create, :create do
  accept [:workspace_id, :entity_id, :provider, :amount, ...]
end

# Initiate payment (invokes reactor)
action :initiate_payment, :create do
  accept [:workspace_id, :entity_id, :amount, :recipient_data, :rail, ...]
  run_reactor InitiatePaymentReactor
end
```

#### Read Actions

```elixir
# List with filters
action :list, :read do
  filter expr(workspace_id == ^arg(:workspace_id))
  argument :entity_id, :uuid
  argument :state, :atom
  argument :date_from, :date
  argument :date_to, :date
end

# Get by external ID
action :by_external_id, :read do
  get? true
  argument :external_payment_id, :string, allow_nil?: false
  filter expr(external_payment_id == ^arg(:external_payment_id))
end
```

#### Update Actions

```elixir
# Update status from webhook
action :update_status, :update do
  accept [:state, :completed_at, :failed_at, :failure_reason]
end

# Handle return
action :mark_returned, :update do
  accept [:return_code, :return_reason]
  change set_attribute(:state, :returned)
end
```

### Manual Actions

| Action | Purpose | Module |
|--------|---------|--------|
| `initiate_payment` | Start payment flow | InitiatePayment |
| `cancel_payment` | Cancel pending payment | CancelPayment |
| `sync_status` | Sync with provider | SyncStatus |

### Validations

| Validation | Purpose |
|------------|---------|
| `ValidateAmount` | Ensure positive amount |
| `ValidateRouting` | Verify routing number format |
| `ValidateIdempotency` | Prevent duplicate submissions |

### Relationships

```elixir
relationships do
  belongs_to :workspace, EmberWorkspaces.Workspace
  belongs_to :entity, EmberWorkspaces.Entity
  belongs_to :payment_connection, PaymentConnection
  has_many :refunds, Refund
  has_many :webhook_events, PaymentWebhookEvent do
    filter expr(correlation_id == parent(id))
  end
end
```

---

## PayoutBatch

**Location**: `lib/ember_payments/resources/payout/payout_batch.ex`

Groups multiple payment items into a single batch operation for efficient processing.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenancy key |
| `entity_id` | UUID | Paying entity |
| `name` | string | Batch name |
| `description` | string | Batch description |
| `provider` | atom | Target provider |
| `rail` | atom | Payment rail |
| `status` | atom | Batch status |
| `scheduled_date` | date | When to process |
| `submitted_at` | datetime | When submitted |
| `completed_at` | datetime | When fully processed |
| `provider_batch_id` | string | Provider's batch ID |
| `total_amount` | Money | Sum of items |
| `item_count` | integer | Number of items |

### Status Values

```elixir
:draft          # Accepting items
:validating     # Pre-submit validation
:pending        # Submitted, awaiting processing
:processing     # Provider is processing
:completed      # All items processed
:partial        # Some items failed
:failed         # Entire batch failed
:cancelled      # Cancelled before processing
```

### Calculated Status

```elixir
# BatchStatus calculation
calculate :batch_status, :atom do
  calculation BatchStatus
  load [:items]
end

# Implementation determines status from items
def calculate(records, _opts, _context) do
  Enum.map(records, fn batch ->
    cond do
      all_completed?(batch.items) -> :completed
      all_failed?(batch.items) -> :failed
      any_completed?(batch.items) -> :partial
      any_processing?(batch.items) -> :processing
      true -> batch.status
    end
  end)
end
```

### Actions

```elixir
# Create draft batch
action :create, :create do
  accept [:workspace_id, :entity_id, :name, :rail, :scheduled_date]
  change set_attribute(:status, :draft)
end

# Submit batch for processing
action :submit, :update do
  change set_attribute(:status, :pending)
  change set_attribute(:submitted_at, &DateTime.utc_now/0)
  run_reactor SubmitPayoutBatchReactor
end
```

### Manual Actions

| Action | Purpose | Module |
|--------|---------|--------|
| `submit_batch` | Submit for processing | SubmitBatch |
| `sync_batch_status` | Sync with provider | SyncBatchStatus |

---

## PayoutItem

**Location**: `lib/ember_payments/resources/payout/payout_item.ex`

Individual payment within a batch.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `payout_batch_id` | UUID | Parent batch |
| `amount` | Money | Item amount |
| `status` | atom | Item status |
| `recipient_name` | string | Payee name |
| `recipient_account` | string | Account number (encrypted) |
| `recipient_routing` | string | Routing number |
| `description` | string | Item memo |
| `reference` | string | External reference |
| `provider_item_id` | string | Provider's item ID |
| `failure_reason` | string | Error if failed |
| `processed_at` | datetime | When processed |

### Status Values

```elixir
:pending        # In draft batch
:submitted      # Submitted with batch
:processing     # Being processed
:completed      # Successfully paid
:failed         # Payment failed
:returned       # Payment returned
:cancelled      # Item cancelled
```

### Relationships

```elixir
relationships do
  belongs_to :payout_batch, PayoutBatch
end
```

---

## Refund

**Location**: `lib/ember_payments/resources/transaction/refund.ex`

Tracks refunds associated with payments.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Primary key |
| `payment_transaction_id` | UUID | Original payment |
| `amount` | Money | Refund amount |
| `reason` | string | Refund reason |
| `status` | atom | Refund status |
| `external_refund_id` | string | Provider's refund ID |
| `processed_at` | datetime | When processed |

### Relationships

```elixir
relationships do
  belongs_to :payment_transaction, PaymentTransaction
end
```

---

## Usage Patterns

### Creating a Payment

```elixir
# Via reactor (recommended)
{:ok, payment} = PaymentTransaction.initiate_payment(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  amount: Money.new(100_00, :USD),
  recipient_data: %{
    name: "Vendor",
    account_number: "123456789",
    routing_number: "021000021"
  },
  rail: :ach,
  description: "Invoice payment"
})

# Direct create (for imports)
{:ok, payment} = PaymentTransaction.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :dwolla,
  external_payment_id: "imported_123",
  amount: Money.new(100_00, :USD),
  state: :completed
})
```

### Querying Payments

```elixir
# Get pending payments for entity
PaymentTransaction
|> Ash.Query.filter(entity_id == ^entity_id and state == :pending)
|> Ash.read!()

# Get payments by date range
PaymentTransaction
|> Ash.Query.filter(
  workspace_id == ^workspace_id and
  inserted_at >= ^start_date and
  inserted_at <= ^end_date
)
|> Ash.read!()

# Get with related data
PaymentTransaction
|> Ash.Query.filter(id == ^id)
|> Ash.Query.load([:payment_connection, :refunds])
|> Ash.read_one!()
```

### Creating a Batch

```elixir
# Create batch with items
{:ok, batch} = PayoutBatch.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  name: "January Payroll",
  rail: :ach
})

# Add items
for employee <- employees do
  PayoutItem.create(%{
    payout_batch_id: batch.id,
    amount: employee.pay_amount,
    recipient_name: employee.name,
    recipient_account: employee.bank_account,
    recipient_routing: employee.routing_number,
    description: "Payroll - January"
  })
end

# Submit batch
{:ok, submitted} = PayoutBatch.submit(batch.id)
```

## Code References

- **PaymentTransaction**: `lib/ember_payments/resources/transaction/payment_transaction.ex`
- **PayoutBatch**: `lib/ember_payments/resources/payout/payout_batch.ex`
- **PayoutItem**: `lib/ember_payments/resources/payout/payout_item.ex`
- **Refund**: `lib/ember_payments/resources/transaction/refund.ex`
