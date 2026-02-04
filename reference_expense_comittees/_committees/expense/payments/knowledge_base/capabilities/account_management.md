# Account Management Capability

**Behavior Module**: `FlameTeampayPayables.EmberPayments.Capabilities.AccountManagement.Behavior`  
**Types Module**: `FlameTeampayPayables.EmberPayments.Capabilities.AccountManagement.Types`

## Purpose

The Account Management capability handles operations related to provider accounts - retrieving balances, managing account settings, and accessing account-level information. This capability operates at the provider account level, not individual payment accounts.

## Callback Functions

### Balance Operations

```elixir
@callback get_balance(config, opts) ::
            {:ok, balance_result()} | {:error, term()}

@callback get_balance_history(config, opts) ::
            {:ok, [balance_entry()]} | {:error, term()}
```

### Account Information

```elixir
@callback get_account_info(config) ::
            {:ok, account_info()} | {:error, term()}

@callback update_account_settings(config, settings) ::
            {:ok, account_info()} | {:error, term()}
```

### Statement Operations

```elixir
@callback get_statements(config, opts) ::
            {:ok, [statement()]} | {:error, term()}

@callback download_statement(config, statement_id) ::
            {:ok, binary()} | {:error, term()}
```

### Activity/Transaction History

```elixir
@callback get_activity(config, opts) ::
            {:ok, [activity_entry()]} | {:error, term()}

@callback export_activity(config, opts) ::
            {:ok, export_url()} | {:error, term()}
```

### Webhooks

```elixir
@callback validate_webhook(config, body, signature) ::
            {:ok, :valid} | {:error, :invalid_signature | term()}

@callback parse_webhook_event(config, payload) ::
            {:ok, webhook_event()} | {:error, term()}

@callback supported_webhook_events(config) :: [String.t()]
```

## Type Definitions

### Balance Result

```elixir
@type balance_result :: %{
  available: Money.t(),
  pending: Money.t(),
  total: Money.t(),
  currency: atom(),
  as_of: DateTime.t(),
  accounts: [sub_account_balance()] | nil
}
```

### Sub-Account Balance

```elixir
@type sub_account_balance :: %{
  account_id: String.t(),
  account_name: String.t(),
  available: Money.t(),
  pending: Money.t(),
  type: account_type()
}
```

### Account Info

```elixir
@type account_info :: %{
  account_id: String.t(),
  account_name: String.t(),
  status: account_status(),
  type: account_type(),
  created_at: DateTime.t(),
  settings: map(),
  limits: limits_info()
}
```

### Limits Info

```elixir
@type limits_info :: %{
  daily_transfer_limit: Money.t() | nil,
  per_transfer_limit: Money.t() | nil,
  monthly_volume_limit: Money.t() | nil,
  remaining_daily: Money.t() | nil,
  remaining_monthly: Money.t() | nil
}
```

## Related Resources

### PaymentAccount (`payment_account.ex`)

```elixir
attributes do
  uuid_primary_key :id
  attribute :provider, :atom
  attribute :external_account_id, :string
  attribute :account_type, :atom
  attribute :status, :atom
  attribute :balance_available, :money
  attribute :balance_pending, :money
  attribute :balance_updated_at, :utc_datetime
  attribute :settings, :map
end

relationships do
  belongs_to :workspace, Workspace
  belongs_to :entity, Entity
  belongs_to :payment_connection, PaymentConnection
end

# Manual action for syncing from provider
manual_actions :fetch_accounts, FetchAccounts
```

### EntityProviderAccount (`entity_provider_account.ex`)

Links entities to their accounts at various providers:

```elixir
attributes do
  uuid_primary_key :id
  attribute :provider, :atom
  attribute :external_account_id, :string  # Provider's account/customer ID
  attribute :status, :atom
  attribute :metadata, :map
end

relationships do
  belongs_to :entity, Entity
  belongs_to :workspace, Workspace
end
```

### AccountBalance (`account_balance.ex`)

Historical balance tracking:

```elixir
attributes do
  uuid_primary_key :id
  attribute :available, :money
  attribute :pending, :money
  attribute :total, :money
  attribute :recorded_at, :utc_datetime
  attribute :source, :atom  # :webhook, :api_sync, :manual
end

relationships do
  belongs_to :payment_account, PaymentAccount
end
```

## Provider Implementation Details

### Checkbook

- **Account Types**: Single master account
- **Balance API**: `/account/balance`
- **Activity API**: `/account/activity`
- **Statements**: Monthly PDF generation

### Dwolla

- **Account Types**: Master + funding sources
- **Balance API**: `/funding-sources/{id}/balance`
- **Activity API**: Via transfers listing
- **Statements**: Not available via API

### Marqeta

- **Account Types**: Program funding account, GPA accounts
- **Balance API**: `/gpaorders/{token}/unloads`
- **Activity API**: `/transactions`
- **Statements**: Via reporting API

### WEX

- **Account Types**: Fleet account hierarchy
- **Balance API**: `/accounts/{id}/balance`
- **Activity API**: `/accounts/{id}/transactions`
- **Statements**: Monthly cycle statements

## Balance Synchronization

### Webhook-Driven Updates

```elixir
# When balance webhook received:
def handle_webhook(%{type: "balance.updated"} = event) do
  PaymentAccount
  |> Ash.Query.filter(external_account_id == ^event.account_id)
  |> Ash.update(%{
    balance_available: event.available,
    balance_pending: event.pending,
    balance_updated_at: DateTime.utc_now()
  })
  
  # Also record in history
  AccountBalance.create(%{
    payment_account_id: account.id,
    available: event.available,
    pending: event.pending,
    source: :webhook
  })
end
```

### API Polling (Fallback)

```elixir
# Scheduled job for accounts without webhooks
def sync_balances do
  PaymentAccount
  |> Ash.Query.filter(provider in [:checkbook, :wex])
  |> Ash.read!()
  |> Enum.each(fn account ->
    PaymentAccount.fetch_accounts(account.id)
  end)
end
```

## Common Operations

### Checking Available Balance

```elixir
def has_sufficient_balance?(entity_id, provider, amount) do
  case PaymentAccount
       |> Ash.Query.filter(entity_id == ^entity_id and provider == ^provider)
       |> Ash.read_one() do
    {:ok, %{balance_available: available}} when available >= amount ->
      true
    _ ->
      false
  end
end
```

### Getting Balance Across Providers

```elixir
def get_total_balance(entity_id) do
  PaymentAccount
  |> Ash.Query.filter(entity_id == ^entity_id and status == :active)
  |> Ash.read!()
  |> Enum.reduce(%{}, fn account, acc ->
    currency = Money.to_currency_code(account.balance_available)
    current = Map.get(acc, currency, Money.new(0, currency))
    Map.put(acc, currency, Money.add(current, account.balance_available))
  end)
end
```

## Error Handling

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `:account_not_found` | Invalid account ID | Verify account exists |
| `:balance_unavailable` | Provider API issue | Retry or use cached |
| `:unauthorized` | Bad credentials | Refresh connection |
| `:rate_limited` | Too many requests | Implement backoff |

## Observability

Balance operations emit telemetry:

```elixir
[:ember_payments, :account, :balance_fetch, :start]
[:ember_payments, :account, :balance_fetch, :stop]
[:ember_payments, :account, :balance_fetch, :exception]

# Metrics
:payment_account_balance_gauge  # Current balance per account
:payment_account_sync_duration  # Time to sync balances
```

## Code References

- Behavior: `lib/ember_payments/capabilities/account_management/behavior.ex`
- Types: `lib/ember_payments/capabilities/account_management/types.ex`
- PaymentAccount: `lib/ember_payments/resources/account/payment_account.ex`
- EntityProviderAccount: `lib/ember_payments/resources/account/entity_provider_account.ex`
- AccountBalance: `lib/ember_payments/resources/account/account_balance.ex`
- FetchAccounts: `lib/ember_payments/resources/account/payment_account/manual_actions/fetch_accounts.ex`
