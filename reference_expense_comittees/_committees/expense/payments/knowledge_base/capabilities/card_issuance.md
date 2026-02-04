# Card Issuance Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.CardIssuance.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.CardIssuance.Types`

## Purpose

The Card Issuance capability manages the complete lifecycle of payment cards - virtual and physical. This includes issuing new cards, managing card states (freeze/unfreeze/cancel), setting spending controls, and retrieving sensitive card details.

## Callback Functions

### Card Lifecycle

```elixir
@callback issue_card(config, card_params, opts) ::
            {:ok, card_result()} | {:error, term()}

@callback get_card(config, card_id) ::
            {:ok, card_details()} | {:error, term()}

@callback activate_card(config, card_id) ::
            {:ok, card_details()} | {:error, term()}

@callback freeze_card(config, card_id, reason) ::
            {:ok, card_details()} | {:error, term()}

@callback unfreeze_card(config, card_id) ::
            {:ok, card_details()} | {:error, term()}

@callback cancel_card(config, card_id) ::
            {:ok, card_details()} | {:error, term()}
```

### Card Controls

```elixir
@callback update_spending_limits(config, card_id, limits) ::
            {:ok, card_details()} | {:error, term()}

@callback update_card_controls(config, card_id, controls) ::
            {:ok, card_details()} | {:error, term()}
```

### Transactions & Sensitive Data

```elixir
@callback get_card_transactions(config, card_id, opts) ::
            {:ok, [card_transaction()]} | {:error, term()}

@callback get_sensitive_details(config, card_id) ::
            {:ok, sensitive_card_data()} | {:error, term()}
```

### Webhooks

```elixir
@callback validate_webhook(config, body, signature) ::
            {:ok, :valid} | {:error, :invalid_signature | term()}

@callback parse_webhook_event(config, payload) ::
            {:ok, webhook_event()} | {:error, term()}

@callback supported_webhook_events(config) :: [String.t()]
```

## Card State Lifecycle

```
                    ┌──────────────┐
                    │   INACTIVE   │ (just issued)
                    └──────┬───────┘
                           │ activate_card
                           ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │              ┌──────────┐               │
        │              │  ACTIVE  │◄──────────────┤
        │              └────┬─────┘               │
        │                   │                     │
        │    freeze_card    │    unfreeze_card    │
        │                   ▼                     │
        │              ┌──────────┐               │
        └─────────────▶│  FROZEN  │───────────────┘
                       └────┬─────┘
                            │ cancel_card (from any state)
                            ▼
                       ┌───────────┐
                       │ CANCELLED │
                       └───────────┘
```

## Card Types

| Type | Description | Provider Support |
|------|-------------|------------------|
| **Virtual** | Instant digital card | Marqeta, WEX |
| **Physical** | Mailed plastic card | Marqeta, WEX |
| **Single-Use** | One-time transaction | Marqeta |
| **Fleet** | Vehicle/fuel card | WEX |

## Spending Limits Structure

```elixir
@type spending_limits :: %{
  daily_amount: Money.t() | nil,
  weekly_amount: Money.t() | nil,
  monthly_amount: Money.t() | nil,
  per_transaction_amount: Money.t() | nil,
  daily_transaction_count: non_neg_integer() | nil,
  weekly_transaction_count: non_neg_integer() | nil,
  monthly_transaction_count: non_neg_integer() | nil
}
```

## Card Controls Structure

```elixir
@type card_controls :: %{
  allowed_merchant_categories: [String.t()],  # MCC codes
  blocked_merchant_categories: [String.t()],
  allowed_countries: [String.t()],            # ISO country codes
  blocked_countries: [String.t()],
  atm_withdrawals_enabled: boolean(),
  online_transactions_enabled: boolean(),
  international_transactions_enabled: boolean(),
  contactless_enabled: boolean()
}
```

## Provider Implementation Details

### Marqeta

- **Card Types**: Virtual, Physical, Single-Use
- **Program Management**: Card programs define default controls
- **Velocity Controls**: Built-in rate limiting
- **JIT Funding**: Just-in-time authorization model
- **Real-time Events**: Webhooks for auth, clearing, refunds

### WEX Fleet

- **Card Types**: Fleet cards for fuel/maintenance
- **Driver Assignment**: Cards linked to drivers/vehicles
- **Fuel Controls**: Gallons, fuel types, odometer validation
- **Merchant Restrictions**: Service station networks
- **ODOM Prompts**: Odometer capture at point of sale

## Related Reactors

| Reactor | Purpose |
|---------|---------|
| `IssueCardReactor` | Multi-step card creation |
| `ActivateCardReactor` | Card activation with validation |
| `FreezeCardReactor` | Freeze with reason tracking |
| `UnfreezeCardReactor` | Unfreeze with audit |
| `CancelCardReactor` | Termination with cleanup |
| `UpdateSpendingLimitsReactor` | Limit changes with validation |
| `UpdateCardControlsReactor` | Control updates with sync |
| `GetSensitiveDetailsReactor` | Secure PAN/CVV retrieval |
| `SetAutocloseReactor` | Scheduled card expiration |

## Integration with EmberExpenseCard

The Card Issuance capability powers the `EmberExpenseCard` domain:

```elixir
# ExpenseCard wraps CardIssuance for business context
EmberExpenseCard.issue_card(%{
  employee_id: employee.id,
  card_type: :virtual,
  spending_limit: Money.new(500_00, :USD),
  department_id: department.id
})

# Internally calls CardIssuance capability via CardIssuance resource
CardIssuance
|> Ash.Changeset.for_create(:issue, %{...})
|> Ash.create()
```

## CardIssuance Resource

The `CardIssuance` Ash resource (`resources/card/card_issuance.ex`) provides:

### Key Calculations

```elixir
# Available balance calculation
calculate :available_balance, :money do
  calculation Calculations.AvailableBalance
end

# Month spent aggregation  
calculate :month_spent, :money do
  calculation Calculations.MonthSpent
end

# Department name from relationship
calculate :department_name, :string do
  calculation Calculations.DepartmentName
end
```

### Manual Actions

```elixir
# Provider-synchronous operations
manual_actions :issue_card, IssueCard
manual_actions :activate_card, ActivateCard
manual_actions :freeze_card, FreezeCard
manual_actions :unfreeze_card, UnfreezeCard
manual_actions :cancel_card, CancelCard
manual_actions :update_spending_limits, UpdateSpendingLimits
manual_actions :update_card_controls, UpdateCardControls
```

## Security Considerations

1. **PAN/CVV Access**: `get_sensitive_details` should be rate-limited and audited
2. **Freeze Authority**: Define who can freeze/unfreeze cards
3. **Limit Changes**: Audit trail for all spending limit modifications
4. **Webhook Validation**: Always verify webhook signatures
5. **PCI Compliance**: Card data handling must follow PCI-DSS

## Observability

Card operations emit telemetry events via `reactors/card/telemetry.ex`:

```elixir
[:ember_payments, :card, :issue, :start]
[:ember_payments, :card, :issue, :stop]
[:ember_payments, :card, :issue, :exception]

[:ember_payments, :card, :freeze, :start]
[:ember_payments, :card, :freeze, :stop]
# ... etc for all operations
```

## Code References

- Behavior: `lib/ember_payments/capabilities/card_issuance/behavior.ex`
- Types: `lib/ember_payments/capabilities/card_issuance/types.ex`
- Resource: `lib/ember_payments/resources/card/card_issuance.ex`
- Reactors: `lib/ember_payments/reactors/card/*.ex`
- Telemetry: `lib/ember_payments/reactors/card/telemetry.ex`
