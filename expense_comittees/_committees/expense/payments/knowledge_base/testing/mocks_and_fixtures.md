# Mocks & Fixtures Guide

Patterns for creating test doubles and fixtures in EmberPayments testing.

## Mock Strategy Overview

EmberPayments uses a layered mocking approach:

1. **Mox** - Behavior-based mocks for adapters
2. **Factories** - Database record creation (Ex Machina style)
3. **Fixtures** - Static test data (provider responses, schemas)
4. **Stubs** - Simple function replacements

## Mox Setup

### Defining Mocks

```elixir
# test/support/mocks.ex
Mox.defmock(MockDwollaAdapter, for: EmberPayments.Adapters.DwollaAdapter.Behavior)
Mox.defmock(MockCheckbookAdapter, for: EmberPayments.Adapters.CheckbookAdapter.Behavior)
Mox.defmock(MockMarqetaAdapter, for: EmberPayments.Adapters.MarqetaAdapter.Behavior)
Mox.defmock(MockWexAdapter, for: EmberPayments.Adapters.WexAdapter.Behavior)
Mox.defmock(MockAdapterRegistry, for: EmberPayments.Adapters.AdapterRegistry.Behavior)
```

### Configuring for Tests

```elixir
# config/test.exs
config :flame_teampay_payables, :adapters,
  dwolla: MockDwollaAdapter,
  checkbook: MockCheckbookAdapter,
  marqeta: MockMarqetaAdapter,
  wex: MockWexAdapter

config :flame_teampay_payables, :adapter_registry, MockAdapterRegistry
```

### Using in Tests

```elixir
defmodule PaymentTest do
  use ExUnit.Case
  import Mox
  
  setup :verify_on_exit!
  
  test "initiates payment via Dwolla" do
    Mox.expect(MockDwollaAdapter, :send_payment, fn config, params, opts ->
      # Assertions on inputs
      assert params.amount == Money.new(100_00, :USD)
      assert params.rail == :ach
      
      # Return mock response
      {:ok, %{
        payment_id: "mock_pay_123",
        status: :pending,
        estimated_arrival: Date.add(Date.utc_today(), 3)
      }}
    end)
    
    {:ok, payment} = PaymentService.initiate(payment_params())
    assert payment.external_payment_id == "mock_pay_123"
  end
end
```

## Adapter Mock Patterns

### Success Responses

```elixir
defmodule EmberPayments.Test.Mocks.AdapterResponses do
  def dwolla_payment_success(overrides \\ %{}) do
    Map.merge(%{
      payment_id: "dwolla_#{System.unique_integer()}",
      status: :pending,
      amount: Money.new(100_00, :USD),
      estimated_arrival: Date.add(Date.utc_today(), 3),
      fee: Money.new(25, :USD)
    }, overrides)
  end
  
  def checkbook_check_success(overrides \\ %{}) do
    Map.merge(%{
      check_id: "chk_#{System.unique_integer()}",
      check_number: "#{:rand.uniform(99999)}",
      status: :pending,
      amount: Money.new(100_00, :USD)
    }, overrides)
  end
  
  def marqeta_card_success(overrides \\ %{}) do
    Map.merge(%{
      card_token: "card_#{System.unique_integer()}",
      last_four: "4242",
      expiration: %{month: 12, year: 2027},
      status: :inactive
    }, overrides)
  end
end
```

### Error Responses

```elixir
defmodule EmberPayments.Test.Mocks.AdapterErrors do
  def insufficient_funds do
    {:error, %{
      type: :insufficient_funds,
      message: "Insufficient funds in account",
      code: "InsufficientFunds"
    }}
  end
  
  def invalid_recipient do
    {:error, %{
      type: :validation_error,
      message: "Invalid routing number",
      field: :routing_number
    }}
  end
  
  def rate_limited do
    {:error, %{
      type: :rate_limited,
      message: "Too many requests",
      retry_after: 60
    }}
  end
  
  def provider_timeout do
    {:error, :timeout}
  end
  
  def connection_error do
    {:error, %Req.TransportError{reason: :econnrefused}}
  end
end
```

### Webhook Mocks

```elixir
def dwolla_webhook_valid do
  Mox.expect(MockDwollaAdapter, :validate_webhook, fn _, _, _ ->
    {:ok, :valid}
  end)
end

def dwolla_webhook_invalid do
  Mox.expect(MockDwollaAdapter, :validate_webhook, fn _, _, _ ->
    {:error, :invalid_signature}
  end)
end

def dwolla_parse_transfer_completed(resource_id) do
  Mox.expect(MockDwollaAdapter, :parse_webhook_event, fn _, _ ->
    {:ok, %{
      type: :transfer_completed,
      resource_id: resource_id,
      timestamp: DateTime.utc_now()
    }}
  end)
end
```

## Factories

### Factory Definition

```elixir
# test/support/factories/ember_payments_factory.ex
defmodule EmberPayments.Test.Factories.EmberPaymentsFactory do
  use ExMachina.Ecto, repo: FlameTeampayPayables.Repo
  
  # Core workspace/entity (usually from parent factory)
  def workspace_factory do
    %EmberWorkspaces.Workspace{
      id: Ecto.UUID.generate(),
      name: sequence(:workspace_name, &"Workspace #{&1}")
    }
  end
  
  def entity_factory do
    %EmberWorkspaces.Entity{
      id: Ecto.UUID.generate(),
      name: sequence(:entity_name, &"Entity #{&1}"),
      workspace: build(:workspace)
    }
  end
  
  # Payment Connection
  def payment_connection_factory do
    %EmberPayments.Resources.PaymentConnection{
      id: Ecto.UUID.generate(),
      workspace: build(:workspace),
      entity: build(:entity),
      provider: :dwolla,
      state: :active,
      credentials_encrypted: encrypt_credentials(%{
        "api_key" => "test_key",
        "api_secret" => "test_secret"
      })
    }
  end
  
  # Payment Transaction
  def payment_transaction_factory do
    %EmberPayments.Resources.PaymentTransaction{
      id: Ecto.UUID.generate(),
      workspace: build(:workspace),
      entity: build(:entity),
      provider: :dwolla,
      external_payment_id: sequence(:external_id, &"pay_#{&1}"),
      amount: Money.new(100_00, :USD),
      rail: :ach,
      state: :pending,
      direction: :outbound,
      capability: :payment_initiation
    }
  end
  
  # Completed payment variant
  def completed_payment_factory do
    build(:payment_transaction,
      state: :completed,
      completed_at: DateTime.utc_now()
    )
  end
  
  # Failed payment variant
  def failed_payment_factory do
    build(:payment_transaction,
      state: :failed,
      failed_at: DateTime.utc_now(),
      failure_reason: "Insufficient funds"
    )
  end
  
  # Card Issuance
  def card_issuance_factory do
    %EmberPayments.Resources.CardIssuance{
      id: Ecto.UUID.generate(),
      workspace: build(:workspace),
      entity: build(:entity),
      provider: :marqeta,
      external_card_id: sequence(:card_id, &"card_#{&1}"),
      card_type: :virtual,
      last_four: "4242",
      state: :active,
      spending_limit_amount: Money.new(500_00, :USD),
      spending_limit_interval: :monthly
    }
  end
  
  # KYB Application
  def kyb_application_factory do
    %EmberPayments.Resources.KybApplication{
      id: Ecto.UUID.generate(),
      workspace: build(:workspace),
      entity: build(:entity),
      country: "US",
      entity_type: :llc,
      status: :not_started
    }
  end
  
  # Beneficial Owner
  def beneficial_owner_factory do
    %EmberPayments.Resources.BeneficialOwner{
      id: Ecto.UUID.generate(),
      kyb_application: build(:kyb_application),
      first_name: Faker.Person.first_name(),
      last_name: Faker.Person.last_name(),
      date_of_birth: ~D[1980-01-15],
      ownership_percentage: Decimal.new("50"),
      is_control_person: true
    }
  end
end
```

### Using Factories

```elixir
# Build (in memory, no DB)
payment = build(:payment_transaction)
payment = build(:payment_transaction, amount: Money.new(500_00, :USD))

# Insert (persisted to DB)
payment = insert(:payment_transaction)
payment = insert(:payment_transaction, state: :completed)

# Build with association
payment = insert(:payment_transaction, 
  workspace: insert(:workspace),
  entity: insert(:entity)
)

# Use variants
completed = insert(:completed_payment)
failed = insert(:failed_payment)
```

## Fixtures

### Provider Response Fixtures

```elixir
# test/support/fixtures/provider_responses.ex
defmodule EmberPayments.Test.Fixtures.ProviderResponses do
  @dwolla_transfer_response %{
    "_links" => %{
      "self" => %{"href" => "https://api.dwolla.com/transfers/123"}
    },
    "id" => "123",
    "status" => "pending",
    "amount" => %{"value" => "100.00", "currency" => "USD"},
    "created" => "2024-01-15T10:30:00.000Z"
  }
  
  def dwolla_transfer_response(overrides \\ %{}) do
    Map.merge(@dwolla_transfer_response, overrides)
  end
  
  @checkbook_check_response %{
    "check_id" => "chk_abc123",
    "check_number" => "12345",
    "amount" => "100.00",
    "status" => "IN_PROCESS",
    "recipient" => %{
      "name" => "Test Vendor"
    }
  }
  
  def checkbook_check_response(overrides \\ %{}) do
    Map.merge(@checkbook_check_response, overrides)
  end
  
  @marqeta_card_response %{
    "token" => "card_token_123",
    "pan" => "4111111111111234",
    "expiration" => "1227",
    "cvv_number" => "123",
    "state" => "INACTIVE"
  }
  
  def marqeta_card_response(overrides \\ %{}) do
    Map.merge(@marqeta_card_response, overrides)
  end
end
```

### Webhook Payload Fixtures

```elixir
# test/support/fixtures/webhook_payloads.ex
defmodule EmberPayments.Test.Fixtures.WebhookPayloads do
  def dwolla_transfer_completed(transfer_id) do
    %{
      "id" => "evt_#{System.unique_integer()}",
      "resourceId" => transfer_id,
      "topic" => "transfer_completed",
      "timestamp" => DateTime.to_iso8601(DateTime.utc_now()),
      "_links" => %{
        "resource" => %{
          "href" => "https://api.dwolla.com/transfers/#{transfer_id}"
        }
      }
    }
  end
  
  def dwolla_customer_verified(customer_id) do
    %{
      "id" => "evt_#{System.unique_integer()}",
      "resourceId" => customer_id,
      "topic" => "customer_verified",
      "timestamp" => DateTime.to_iso8601(DateTime.utc_now())
    }
  end
  
  def marqeta_authorization(card_token, amount_cents) do
    %{
      "type" => "authorization",
      "state" => "PENDING",
      "token" => "auth_#{System.unique_integer()}",
      "card_token" => card_token,
      "amount" => amount_cents / 100,
      "currency_code" => "USD",
      "merchant" => %{
        "name" => "Test Merchant",
        "mcc" => "5411"
      },
      "created_time" => DateTime.to_iso8601(DateTime.utc_now())
    }
  end
end
```

### Form Schema Fixtures

```elixir
# test/support/fixtures/form_schemas.ex
defmodule EmberPayments.Test.Fixtures.FormSchemas do
  def us_llc_business_data do
    %{
      legal_name: "Test Company LLC",
      doing_business_as: "Test Co",
      ein: "12-3456789",
      incorporation_state: "DE",
      incorporation_date: ~D[2020-01-15],
      address: %{
        street1: "123 Main Street",
        street2: "Suite 100",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US"
      },
      phone: "+14155551234",
      email: "compliance@testco.com",
      website: "https://testco.com",
      industry: "Technology",
      naics_code: "541511"
    }
  end
  
  def beneficial_owner_data do
    %{
      first_name: "Jane",
      last_name: "Smith",
      date_of_birth: ~D[1980-05-15],
      ssn: "123-45-6789",
      ownership_percentage: Decimal.new("50"),
      title: "CEO",
      is_control_person: true,
      address: %{
        street1: "456 Oak Avenue",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US"
      }
    }
  end
end
```

## Stub Module Pattern

For simpler scenarios where Mox is overkill:

```elixir
# test/support/stubs/stub_adapter_registry.ex
defmodule EmberPayments.Test.Stubs.StubAdapterRegistry do
  @behaviour EmberPayments.Adapters.AdapterRegistry.Behavior
  
  def get_adapter(:dwolla), do: {:ok, MockDwollaAdapter}
  def get_adapter(:checkbook), do: {:ok, MockCheckbookAdapter}
  def get_adapter(:marqeta), do: {:ok, MockMarqetaAdapter}
  def get_adapter(:wex), do: {:ok, MockWexAdapter}
  def get_adapter(_), do: {:error, :unknown_provider}
  
  def list_adapters do
    [:dwolla, :checkbook, :marqeta, :wex]
  end
end
```

## Test Helpers

### Mock Setup Helpers

```elixir
defmodule EmberPayments.Test.Helpers.MockSetup do
  import Mox
  
  def setup_successful_payment do
    Mox.expect(MockDwollaAdapter, :send_payment, fn _, params, _ ->
      {:ok, AdapterResponses.dwolla_payment_success(%{
        amount: params.amount
      })}
    end)
  end
  
  def setup_failing_payment(error_type \\ :insufficient_funds) do
    Mox.expect(MockDwollaAdapter, :send_payment, fn _, _, _ ->
      AdapterErrors.apply(error_type)
    end)
  end
  
  def setup_card_issuance do
    Mox.expect(MockMarqetaAdapter, :issue_card, fn _, params, _ ->
      {:ok, AdapterResponses.marqeta_card_success(%{
        card_type: params.card_type
      })}
    end)
  end
  
  def setup_webhook_processing(provider) do
    adapter = get_mock_adapter(provider)
    
    Mox.expect(adapter, :validate_webhook, fn _, _, _ ->
      {:ok, :valid}
    end)
  end
  
  defp get_mock_adapter(:dwolla), do: MockDwollaAdapter
  defp get_mock_adapter(:checkbook), do: MockCheckbookAdapter
  defp get_mock_adapter(:marqeta), do: MockMarqetaAdapter
  defp get_mock_adapter(:wex), do: MockWexAdapter
end
```

### Assertion Helpers

```elixir
defmodule EmberPayments.Test.Helpers.AssertionHelpers do
  import ExUnit.Assertions
  
  def assert_payment_created(result) do
    assert {:ok, payment} = result
    assert payment.id != nil
    assert payment.external_payment_id != nil
    payment
  end
  
  def assert_payment_state(payment, expected_state) do
    assert payment.state == expected_state,
      "Expected payment state #{expected_state}, got #{payment.state}"
  end
  
  def assert_webhook_processed(event) do
    assert event.status == :processed
    assert event.processed_at != nil
  end
  
  def refute_cross_tenant_access(query_result) do
    assert {:error, _} = query_result or
           query_result == {:ok, nil} or
           query_result == {:ok, []}
  end
end
```

## Code References

- **Mocks**: `test/support/mocks.ex`
- **Factories**: `test/support/factories/ember_payments_factory.ex`
- **Fixtures**: `test/support/fixtures/`
- **Helpers**: `test/support/helpers/`
