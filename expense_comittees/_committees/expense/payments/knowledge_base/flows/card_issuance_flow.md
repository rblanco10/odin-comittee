# Card Issuance Flow

## Purpose

Issues a new virtual or physical payment card through a card provider (Marqeta or WEX), creating both the provider-side card and the local `CardIssuance` database record with full state synchronization.

## Actors

| Actor | Role |
|-------|------|
| **User/System** | Initiates card request |
| **CardIssuance Resource** | Entry point, action definition |
| **IssueCardReactor** | Multi-step workflow orchestration |
| **Card Provider Adapter** | Makes provider API call (Marqeta/WEX) |
| **Database** | Persists CardIssuance record |
| **ExpenseCard** | Business domain wrapper (optional) |

## Sequence Diagram

```
┌──────────┐  ┌─────────────┐  ┌────────────────┐  ┌─────────┐  ┌────────┐
│  Caller  │  │CardIssuance │  │IssueCardReactor│  │ Adapter │  │Provider│
└────┬─────┘  └──────┬──────┘  └───────┬────────┘  └────┬────┘  └───┬────┘
     │               │                 │                │           │
     │  issue_card() │                 │                │           │
     │──────────────▶│                 │                │           │
     │               │                 │                │           │
     │               │  invoke reactor │                │           │
     │               │────────────────▶│                │           │
     │               │                 │                │           │
     │               │                 │  validate_params            │
     │               │                 │───────────────────────────────▶
     │               │                 │                │           │
     │               │                 │  build_card_params          │
     │               │                 │─────────────────────────────▶
     │               │                 │                │           │
     │               │                 │  issue_card()  │           │
     │               │                 │───────────────▶│           │
     │               │                 │                │  POST /cards
     │               │                 │                │──────────▶│
     │               │                 │                │           │
     │               │                 │                │ card_token│
     │               │                 │                │◀──────────│
     │               │                 │                │           │
     │               │                 │  {:ok, card}   │           │
     │               │                 │◀───────────────│           │
     │               │                 │                │           │
     │               │                 │  create_db_record           │
     │               │                 │────────────────────────────────▶ DB
     │               │                 │                │           │
     │               │                 │  update_expense_card        │
     │               │                 │────────────────────────────────▶
     │               │                 │                │           │
     │               │  {:ok, card}    │                │           │
     │               │◀────────────────│                │           │
     │               │                 │                │           │
     │ {:ok, card}   │                 │                │           │
     │◀──────────────│                 │                │           │
```

## Reactor Steps

### Step 1: Validate Parameters

**Purpose**: Ensure all required card parameters are valid.

**Validations**:
- Card type is supported by provider
- Spending limits are within program limits
- Employee/user exists and is eligible
- Department/entity has card issuance permissions

### Step 2: Build Card Parameters

**Purpose**: Transform business inputs into provider-specific format.

**Marqeta Example**:
```elixir
%{
  card_product_token: program_config.card_product_token,
  user_token: user.provider_user_token,
  fulfillment: %{
    card_personalization: %{
      text: %{
        name_line_1: %{value: cardholder_name}
      }
    },
    shipping: if physical_card, do: shipping_address
  },
  metadata: %{
    department_id: department.id,
    expense_card_id: expense_card.id
  }
}
```

**WEX Example**:
```elixir
%{
  card_type: :fleet,
  driver_id: driver.external_id,
  vehicle_id: vehicle.external_id,
  spending_controls: %{
    fuel_types: [:unleaded, :diesel],
    max_gallons_per_transaction: 50
  }
}
```

### Step 3: Call Provider

**Purpose**: Issue the card at the provider.

**Marqeta**:
```elixir
MarqetaAdapter.issue_card(config, card_params, [])
# Returns: {:ok, %{card_token: "...", pan: "...", expiration: ...}}
```

**WEX**:
```elixir
WexAdapter.issue_card(config, card_params, [])
# Returns: {:ok, %{card_id: "...", card_number: "..."}}
```

### Step 4: Create DB Record

**Purpose**: Persist the CardIssuance record locally.

```elixir
CardIssuance.create(%{
  workspace_id: workspace_id,
  entity_id: entity_id,
  provider: provider,
  external_card_id: result.card_token,
  card_type: card_type,
  last_four: extract_last_four(result),
  expiration_month: result.expiration.month,
  expiration_year: result.expiration.year,
  state: :inactive,  # Newly issued cards are inactive
  cardholder_name: cardholder_name,
  spending_limit_amount: spending_limit,
  spending_limit_interval: :monthly,
  card_controls: default_controls
})
```

### Step 5: Update Expense Card (Optional)

**Purpose**: Link the CardIssuance to the business-domain ExpenseCard.

```elixir
# Via the UpdateExpenseCard change
ExpenseCard.update(expense_card_id, %{
  card_issuance_id: card_issuance.id,
  status: :issued
})
```

## Card State Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    ISSUE_CARD_REACTOR                        │
│                                                              │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │Provider │───▶│ CardIssuance│───▶│ ExpenseCard (link)  │  │
│  │ created │    │   created   │    │     updated         │  │
│  └─────────┘    └─────────────┘    └─────────────────────┘  │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
                    ┌──────────┐
                    │ INACTIVE │ (requires activation)
                    └────┬─────┘
                         │ activate_card
                         ▼
                    ┌──────────┐
                    │  ACTIVE  │ (can transact)
                    └────┬─────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
    freeze │                           │ cancel
           ▼                           ▼
      ┌──────────┐              ┌───────────┐
      │  FROZEN  │              │ CANCELLED │
      └────┬─────┘              └───────────┘
           │ unfreeze
           ▼
      ┌──────────┐
      │  ACTIVE  │
      └──────────┘
```

## Provider-Specific Details

### Marqeta

**Card Products**:
- Virtual (instant)
- Physical (requires shipping)
- Single-use (one transaction)

**JIT Funding**:
- Marqeta uses Just-in-Time funding
- Authorization requests trigger funding webhook
- Real-time balance check required

**Spend Controls**:
- Velocity controls (daily/weekly/monthly)
- MCC restrictions
- Country restrictions

### WEX Fleet

**Card Types**:
- Driver cards
- Vehicle cards
- Generic fleet cards

**Fuel Controls**:
- Gallons per transaction limit
- Fuel type restrictions (unleaded, diesel, etc.)
- Time-of-day restrictions

**ODOM Integration**:
- Odometer capture at point of sale
- Variance detection for fraud

## Error Scenarios

| Scenario | Step | Handling |
|----------|------|----------|
| Invalid card type | 1 | Return `{:error, :invalid_card_type}` |
| User not provisioned | 2 | Create user at provider first |
| Provider API error | 3 | Return provider error, no DB record |
| DB write failure | 4 | **Log orphan**, manual cleanup required |
| Program limit exceeded | 3 | Return `{:error, :program_limit_exceeded}` |

## Related Reactors

| Reactor | Purpose |
|---------|---------|
| `ActivateCardReactor` | Activate inactive card |
| `FreezeCardReactor` | Temporarily suspend card |
| `UnfreezeCardReactor` | Reactivate frozen card |
| `CancelCardReactor` | Permanently cancel card |
| `UpdateSpendingLimitsReactor` | Modify spending limits |
| `UpdateCardControlsReactor` | Change MCC/country restrictions |
| `GetSensitiveDetailsReactor` | Retrieve PAN/CVV securely |
| `SetAutocloseReactor` | Schedule automatic cancellation |

## Telemetry Events

```elixir
# Card issuance telemetry (from reactors/card/telemetry.ex)
[:ember_payments, :card, :issue, :start]
[:ember_payments, :card, :issue, :stop]
[:ember_payments, :card, :issue, :exception]
```

## Usage Examples

### Issue Virtual Card (Marqeta)

```elixir
{:ok, card} = CardIssuance.issue_card(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :marqeta,
  card_type: :virtual,
  cardholder_name: "John Doe",
  spending_limit: Money.new(500_00, :USD),
  spending_limit_interval: :monthly,
  employee_id: employee.id,
  department_id: department.id
})
```

### Issue Physical Card (Marqeta)

```elixir
{:ok, card} = CardIssuance.issue_card(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :marqeta,
  card_type: :physical,
  cardholder_name: "Jane Smith",
  spending_limit: Money.new(1000_00, :USD),
  shipping_address: %{
    street1: "123 Main St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94102",
    country: "US"
  }
})
```

### Issue Fleet Card (WEX)

```elixir
{:ok, card} = CardIssuance.issue_card(%{
  workspace_id: workspace.id,
  entity_id: entity.id,
  provider: :wex,
  card_type: :fleet,
  driver_id: driver.id,
  vehicle_id: vehicle.id,
  fuel_controls: %{
    allowed_fuel_types: [:unleaded, :diesel],
    max_gallons: 50
  }
})
```

## Code References

- **Reactor**: `lib/ember_payments/reactors/card/issue_card_reactor.ex`
- **Resource**: `lib/ember_payments/resources/card/card_issuance.ex`
- **Manual Action**: `lib/ember_payments/resources/card/card_issuance/manual_actions/issue_card.ex`
- **Changes**: `lib/ember_payments/resources/card/card_issuance/changes/update_expense_card.ex`
- **Calculations**: `lib/ember_payments/resources/card/card_issuance/calculations/`
- **Telemetry**: `lib/ember_payments/reactors/card/telemetry.ex`
