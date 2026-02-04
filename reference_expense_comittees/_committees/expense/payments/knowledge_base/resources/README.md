# Resource Documentation

This directory contains documentation for the Ash Resources that form the data model and action layer of EmberPayments.

## What is an Ash Resource?

An **Ash Resource** is the fundamental building block of the Ash Framework. Each resource defines:

- **Attributes**: Data fields (columns)
- **Relationships**: Associations to other resources
- **Actions**: Operations (CRUD + custom)
- **Calculations**: Computed values
- **Aggregates**: Rollup values
- **Validations**: Data integrity rules
- **Changes**: Mutations triggered during actions
- **Policies**: Authorization rules

## Resource Organization

```
lib/flame_teampay_payables/ember_payments/resources/
├── account/
│   ├── account_balance.ex
│   ├── entity_provider_account.ex
│   └── payment_account.ex
│       └── manual_actions/
│           └── fetch_accounts.ex
├── card/
│   ├── card_authorization.ex
│   ├── card_issuance.ex
│   │   ├── calculations/
│   │   ├── changes/
│   │   └── manual_actions/
│   └── card_transaction.ex
├── config/
│   └── workspace_provider_config.ex
├── connection/
│   ├── connection_test_result.ex
│   └── payment_connection.ex
│       └── manual_actions/
├── identity/
│   ├── beneficial_owner.ex
│   ├── identity_form_schema.ex
│   ├── kyb_application.ex
│   ├── kyb_application_provider.ex
│   ├── kyb_application_revision.ex
│   ├── kyb_document.ex
│   ├── kyb_document_verification.ex
│   ├── kyb_form_field_merger.ex
│   ├── kyb_form_validator.ex
│   ├── kyb_general_form_schema.ex
│   └── kyb_verification.ex
│       └── manual_actions/
├── payout/
│   ├── payout_batch.ex
│   │   ├── calculations/
│   │   └── manual_actions/
│   └── payout_item.ex
├── reconciliation/
│   ├── reconciliation_record.ex
│   ├── reconciliation_trace.ex
│   └── variance_record.ex
├── testing/
│   ├── test_definition.ex
│   ├── test_result.ex
│   ├── test_run.ex
│   └── test_suite.ex
├── transaction/
│   ├── payment_transaction.ex
│   │   ├── changes/
│   │   ├── manual_actions/
│   │   └── validations/
│   └── refund.ex
└── webhook/
    └── payment_webhook_event.ex
        ├── changes/
        └── validations/
```

## Resource Categories

### Core Payment Resources

| Resource | Purpose | Key Relationships |
|----------|---------|-------------------|
| `PaymentTransaction` | Individual payment records | PaymentConnection, Entity |
| `PayoutBatch` | Batch payment groups | PayoutItems, Entity |
| `PayoutItem` | Individual items in batch | PayoutBatch |
| `Refund` | Payment refunds | PaymentTransaction |

### Card Resources

| Resource | Purpose | Key Relationships |
|----------|---------|-------------------|
| `CardIssuance` | Issued card records | Entity, ExpenseCard |
| `CardTransaction` | Card transaction records | CardIssuance |
| `CardAuthorization` | Real-time auth records | CardIssuance |

### Identity Resources

| Resource | Purpose | Key Relationships |
|----------|---------|-------------------|
| `KybApplication` | Verification applications | KybVerification, Entity |
| `KybVerification` | Provider verification state | KybApplication |
| `KybDocument` | Uploaded documents | KybVerification |
| `BeneficialOwner` | Owner information | KybApplication |

### Configuration Resources

| Resource | Purpose | Key Relationships |
|----------|---------|-------------------|
| `PaymentConnection` | Provider credentials | Entity, Workspace |
| `WorkspaceProviderConfig` | Workspace settings | Workspace |
| `EntityProviderAccount` | Provider sub-accounts | Entity |

### Observability Resources

| Resource | Purpose | Key Relationships |
|----------|---------|-------------------|
| `PaymentWebhookEvent` | Webhook audit log | Various (via correlation) |
| `ReconciliationRecord` | Recon run records | VarianceRecord |
| `VarianceRecord` | Discrepancy tracking | ReconciliationRecord |

## Manual Actions vs Reactors

### Manual Actions

Manual actions are simpler operations defined directly in the resource:

```elixir
# In resource definition
actions do
  action :sync_status, :update do
    manual SyncStatus
  end
end

# Manual action module
defmodule SyncStatus do
  use Ash.Resource.ManualAction

  def run(ash_query, _action, arguments, context) do
    # Implementation
  end
end
```

**When to use**: Simple provider calls, single-step operations

### Reactors

Reactors are multi-step workflows with compensation:

```elixir
# Invoked from resource action
actions do
  action :initiate_payment, :create do
    run_reactor InitiatePaymentReactor
  end
end
```

**When to use**: Complex flows, multiple steps, need compensation

## Resource Patterns

### Multi-tenancy

All resources are scoped by workspace:

```elixir
multitenancy do
  strategy :attribute
  attribute :workspace_id
end
```

### Soft Delete

Most resources use soft delete:

```elixir
attributes do
  attribute :deleted_at, :utc_datetime
end

actions do
  destroy :destroy do
    soft? true
    change set_attribute(:deleted_at, &DateTime.utc_now/0)
  end
end
```

### State Machine

Many resources track state:

```elixir
attributes do
  attribute :state, :atom do
    constraints one_of: [:pending, :processing, :completed, :failed]
    default :pending
  end
end

changes do
  change AshStateMachine.transitions([
    from: [:pending], to: [:processing, :cancelled]
    from: [:processing], to: [:completed, :failed]
  ])
end
```

### Calculations

Computed values that don't require storage:

```elixir
calculations do
  calculate :available_balance, :money do
    calculation AvailableBalance
    load [:spending_limit, :month_spent]
  end
end
```

## Common Sub-Modules

### `/changes/`

Mutations applied during actions:

```elixir
# UpdateExpenseCard change
defmodule UpdateExpenseCard do
  use Ash.Resource.Change
  
  def change(changeset, _opts, _context) do
    Ash.Changeset.after_action(changeset, fn _changeset, record ->
      # Update related ExpenseCard
      {:ok, record}
    end)
  end
end
```

### `/validations/`

Custom validation logic:

```elixir
# ValidateAmount validation
defmodule ValidateAmount do
  use Ash.Resource.Validation
  
  def validate(changeset, _opts, _context) do
    amount = Ash.Changeset.get_attribute(changeset, :amount)
    if Money.positive?(amount), do: :ok, else: {:error, "Amount must be positive"}
  end
end
```

### `/calculations/`

Computed attribute implementations:

```elixir
# AvailableBalance calculation
defmodule AvailableBalance do
  use Ash.Resource.Calculation
  
  def calculate(records, _opts, _context) do
    Enum.map(records, fn record ->
      Money.subtract(record.spending_limit, record.month_spent)
    end)
  end
end
```

### `/manual_actions/`

Implementations for manual actions:

```elixir
# IssueCard manual action
defmodule IssueCard do
  use Ash.Resource.ManualAction
  
  def run(ash_query, _action, arguments, context) do
    # Call provider, handle response
  end
end
```

## Resource Documentation Files

- [Payment Transactions](./payment_transactions.md) - Core payment records
- [Identity Resources](./identity_resources.md) - KYB/KYC data model

## Related Documentation

- [Resource Pattern](../architecture/resource_pattern.md)
- [Reactor Pattern](../architecture/reactor_pattern.md)
- [Ash Framework Expert](../../members/technical_specialists/ash_framework_expert.md)
