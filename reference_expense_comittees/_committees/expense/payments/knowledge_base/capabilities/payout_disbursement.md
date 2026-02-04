# Payout Disbursement Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PayoutDisbursement.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.PayoutDisbursement.Types`

## Purpose

The Payout Disbursement capability handles **bulk payment operations** - sending multiple payments in a single batch. This is essential for payroll, vendor batch payments, mass refunds, and any scenario requiring efficient high-volume money movement.

## Key Differences from Payment Initiation

| Aspect | Payment Initiation | Payout Disbursement |
|--------|-------------------|---------------------|
| Volume | Single payment | Multiple payments |
| API Calls | 1 per payment | 1 per batch |
| Status | Per-payment | Batch + per-item |
| Cost | Per-transaction | Often discounted |
| Use Case | Ad-hoc payments | Scheduled batches |

## Callback Functions

### Batch Operations

```elixir
@callback create_payout_batch(config, batch_params, opts) ::
            {:ok, batch_result()} | {:error, term()}

@callback submit_batch(config, batch_id) ::
            {:ok, batch_result()} | {:error, term()}

@callback get_batch_status(config, batch_id) ::
            {:ok, batch_status()} | {:error, term()}

@callback cancel_batch(config, batch_id) ::
            {:ok, batch_result()} | {:error, term()}
```

### Item Operations

```elixir
@callback add_batch_item(config, batch_id, item_params) ::
            {:ok, item_result()} | {:error, term()}

@callback remove_batch_item(config, batch_id, item_id) ::
            {:ok, :removed} | {:error, term()}

@callback get_item_status(config, batch_id, item_id) ::
            {:ok, item_status()} | {:error, term()}
```

### Webhooks

```elixir
@callback validate_webhook(config, body, signature) ::
            {:ok, :valid} | {:error, :invalid_signature | term()}

@callback parse_webhook_event(config, payload) ::
            {:ok, webhook_event()} | {:error, term()}

@callback supported_webhook_events(config) :: [String.t()]
```

## Batch Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                      1. CREATE BATCH                             │
│  create_payout_batch(batch_params) → batch_id                    │
│  Status: :draft                                                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                      2. ADD ITEMS                                │
│  add_batch_item(batch_id, item_params) × N                       │
│  Status: :draft                                                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                     3. SUBMIT BATCH                              │
│  submit_batch(batch_id)                                          │
│  Status: :pending                                                │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     ASYNC PROCESSING      │
                    │   (Provider processes)    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
           ┌──────────────┐            ┌──────────────┐
           │  COMPLETED   │            │   PARTIAL    │
           │ (all success)│            │ (some failed)│
           └──────────────┘            └──────────────┘
```

## Batch Status Values

```elixir
:draft          # Created, accepting items
:pending        # Submitted, awaiting processing
:processing     # Currently being processed
:completed      # All items processed successfully
:partial        # Some items failed
:failed         # Entire batch failed
:cancelled      # Batch was cancelled
```

## Item Status Values

```elixir
:pending        # Awaiting processing
:processing     # Currently being processed
:completed      # Payment successful
:failed         # Payment failed
:returned       # Payment returned after completion
:cancelled      # Item was cancelled
```

## Type Definitions

### Batch Parameters

```elixir
@type batch_params :: %{
  name: String.t(),
  description: String.t() | nil,
  rail: payment_rail(),
  scheduled_date: Date.t() | nil,
  funding_source_id: String.t() | nil,
  metadata: map(),
  items: [item_params()] | nil  # Optional inline items
}
```

### Item Parameters

```elixir
@type item_params :: %{
  amount: Money.t(),
  recipient_id: String.t() | nil,
  recipient_data: recipient_data() | nil,
  description: String.t() | nil,
  reference: String.t() | nil,
  metadata: map()
}
```

### Batch Result

```elixir
@type batch_result :: %{
  batch_id: String.t(),
  status: batch_status(),
  item_count: non_neg_integer(),
  total_amount: Money.t(),
  completed_count: non_neg_integer(),
  failed_count: non_neg_integer(),
  pending_count: non_neg_integer(),
  fee: Money.t() | nil,
  metadata: map()
}
```

## Related Resources

### PayoutBatch (`payout_batch.ex`)

```elixir
attributes do
  uuid_primary_key :id
  attribute :name, :string
  attribute :status, :atom
  attribute :rail, :atom
  attribute :scheduled_date, :date
  attribute :submitted_at, :utc_datetime
  attribute :completed_at, :utc_datetime
  attribute :provider_batch_id, :string
end

relationships do
  has_many :items, PayoutItem
  belongs_to :workspace, Workspace
  belongs_to :entity, Entity
  belongs_to :payment_connection, PaymentConnection
end

# Calculated status from items
calculate :batch_status, :atom do
  calculation Calculations.BatchStatus
end
```

### PayoutItem (`payout_item.ex`)

```elixir
attributes do
  uuid_primary_key :id
  attribute :amount, :money
  attribute :status, :atom
  attribute :recipient_name, :string
  attribute :recipient_account, :string
  attribute :recipient_routing, :string
  attribute :description, :string
  attribute :provider_item_id, :string
  attribute :failure_reason, :string
end

relationships do
  belongs_to :payout_batch, PayoutBatch
end
```

## Reactor Integration

### SubmitPayoutBatchReactor

```elixir
# Step sequence:
1. validate_batch    # Ensure batch has items, valid state
2. get_connection    # Retrieve credentials
3. call_provider     # Submit to provider API
4. update_batch      # Update batch status
5. update_items      # Update item statuses

# Compensation:
- If provider fails, batch stays in :draft
- If DB update fails, attempt provider cancellation
```

## Provider Implementation Details

### Checkbook

- **Batch Type**: Check batches
- **Item Limit**: 1000 per batch
- **Supported Rails**: ACH, Check
- **Processing**: Asynchronous with webhooks

### Dwolla

- **Batch Type**: Mass Payments
- **Item Limit**: 5000 per batch
- **Supported Rails**: ACH only
- **Processing**: Asynchronous with webhooks
- **Correlation ID**: Links items to batch

## Usage Patterns

### Creating a Complete Batch

```elixir
# Create batch with inline items
{:ok, batch} = PayoutBatch.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  name: "January Payroll",
  rail: :ach,
  items: [
    %{
      amount: Money.new(2500_00, :USD),
      recipient_data: %{
        name: "John Doe",
        account_number: "123456789",
        routing_number: "021000021"
      }
    },
    %{
      amount: Money.new(3000_00, :USD),
      recipient_data: %{
        name: "Jane Smith",
        account_number: "987654321",
        routing_number: "021000021"
      }
    }
  ]
})

# Submit batch for processing
{:ok, submitted} = PayoutBatch.submit_batch(batch.id)
```

### Incremental Item Addition

```elixir
# Create empty batch
{:ok, batch} = PayoutBatch.create(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  name: "Vendor Payments Q1",
  rail: :ach
})

# Add items incrementally
for vendor <- vendors do
  PayoutItem.create(%{
    payout_batch_id: batch.id,
    amount: vendor.amount_due,
    recipient_data: vendor.payment_details
  })
end

# Submit when ready
{:ok, submitted} = PayoutBatch.submit_batch(batch.id)
```

## Webhook Events

Batches generate webhook events for status changes:

```elixir
# Batch-level events
"batch.submitted"       # Batch was submitted
"batch.processing"      # Batch started processing
"batch.completed"       # All items completed
"batch.partial"         # Some items failed
"batch.failed"          # Entire batch failed

# Item-level events
"batch_item.completed"  # Individual item completed
"batch_item.failed"     # Individual item failed
"batch_item.returned"   # Payment was returned
```

## Error Handling

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `:batch_not_found` | Invalid batch_id | Verify batch exists |
| `:batch_already_submitted` | Re-submit attempt | Cannot modify submitted batch |
| `:empty_batch` | No items in batch | Add items before submitting |
| `:item_limit_exceeded` | Too many items | Split into multiple batches |
| `:insufficient_funds` | Not enough balance | Add funds or reduce batch |
| `:invalid_recipient` | Bad recipient data | Fix item recipient info |

## Performance Considerations

1. **Item Limits**: Respect provider item limits per batch
2. **Bulk Create**: Use inline items when possible for efficiency
3. **Async Processing**: Don't poll for status, use webhooks
4. **Retry Logic**: Individual item failures don't fail the batch
5. **Idempotency**: Use reference/correlation IDs for items

## Code References

- Behavior: `lib/ember_payments/capabilities/payout_disbursement/behavior.ex`
- Types: `lib/ember_payments/capabilities/payout_disbursement/types.ex`
- PayoutBatch: `lib/ember_payments/resources/payout/payout_batch.ex`
- PayoutItem: `lib/ember_payments/resources/payout/payout_item.ex`
- Reactor: `lib/ember_payments/reactors/payout/submit_payout_batch_reactor.ex`
