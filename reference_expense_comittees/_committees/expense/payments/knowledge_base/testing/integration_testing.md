# Integration Testing Guide

Patterns and best practices for integration testing in EmberPayments.

## What Integration Tests Cover

Integration tests verify that components work together correctly:

- Resource actions with database
- Reactor multi-step workflows
- Cross-resource relationships
- Provider adapter contracts
- End-to-end payment flows
- Webhook processing pipelines

## Test Setup

### Base Test Case

```elixir
defmodule FlameTeampayPayables.EmberPayments.IntegrationCase do
  use ExUnit.CaseTemplate
  
  using do
    quote do
      use FlameTeampayPayables.DataCase
      
      import FlameTeampayPayables.EmberPayments.Support.Factories.EmberPaymentsFactory
      import FlameTeampayPayables.EmberPayments.Support.Helpers.PaymentHelpers
      import Mox
      
      alias FlameTeampayPayables.EmberPayments
      
      @moduletag :integration
      @moduletag :ember_payments
      
      setup :verify_on_exit!
      setup :set_mox_from_context
    end
  end
  
  setup tags do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(Repo, shared: not tags[:async])
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
    
    # Create standard test workspace/entity
    workspace = insert(:workspace)
    entity = insert(:entity, workspace: workspace)
    
    {:ok, workspace: workspace, entity: entity}
  end
end
```

## Testing Resource Actions

### CRUD Operations

```elixir
describe "PaymentTransaction CRUD" do
  test "creates payment with all required fields", %{workspace: workspace, entity: entity} do
    params = %{
      workspace_id: workspace.id,
      entity_id: entity.id,
      provider: :dwolla,
      external_payment_id: "ext_123",
      amount: Money.new(100_00, :USD),
      rail: :ach,
      state: :pending
    }
    
    assert {:ok, payment} = PaymentTransaction.create(params)
    assert payment.workspace_id == workspace.id
    assert payment.entity_id == entity.id
    assert payment.state == :pending
  end
  
  test "enforces required fields" do
    assert {:error, changeset} = PaymentTransaction.create(%{})
    
    assert "is required" in errors_on(changeset).workspace_id
    assert "is required" in errors_on(changeset).amount
  end
  
  test "updates payment status" do
    payment = insert(:payment_transaction, state: :pending)
    
    assert {:ok, updated} = PaymentTransaction.update(payment.id, %{
      state: :completed,
      completed_at: DateTime.utc_now()
    })
    
    assert updated.state == :completed
    assert updated.completed_at != nil
  end
end
```

### Relationships

```elixir
describe "PaymentTransaction relationships" do
  test "loads payment_connection", %{workspace: workspace, entity: entity} do
    connection = insert(:payment_connection, 
      workspace: workspace, 
      entity: entity,
      provider: :dwolla
    )
    
    payment = insert(:payment_transaction,
      workspace: workspace,
      entity: entity,
      payment_connection: connection
    )
    
    loaded = PaymentTransaction
    |> Ash.Query.filter(id == ^payment.id)
    |> Ash.Query.load(:payment_connection)
    |> Ash.read_one!()
    
    assert loaded.payment_connection.id == connection.id
  end
  
  test "loads refunds", %{workspace: workspace, entity: entity} do
    payment = insert(:payment_transaction, workspace: workspace, entity: entity)
    refund = insert(:refund, payment_transaction: payment)
    
    loaded = Ash.load!(payment, :refunds)
    
    assert length(loaded.refunds) == 1
    assert hd(loaded.refunds).id == refund.id
  end
end
```

## Testing Reactors

### Successful Flow

```elixir
describe "InitiatePaymentReactor" do
  setup %{workspace: workspace, entity: entity} do
    connection = insert(:payment_connection,
      workspace: workspace,
      entity: entity,
      provider: :dwolla,
      state: :active
    )
    
    # Mock provider response
    Mox.expect(MockDwollaAdapter, :send_payment, fn _config, params, _opts ->
      {:ok, %{
        payment_id: "dwolla_pay_#{System.unique_integer()}",
        status: :pending,
        amount: params.amount
      }}
    end)
    
    {:ok, connection: connection}
  end
  
  test "creates payment through full flow", ctx do
    params = %{
      workspace_id: ctx.workspace.id,
      entity_id: ctx.entity.id,
      amount: Money.new(100_00, :USD),
      recipient_data: %{
        name: "Test Vendor",
        account_number: "123456789",
        routing_number: "021000021"
      },
      rail: :ach
    }
    
    assert {:ok, payment} = PaymentTransaction.initiate_payment(params)
    
    # Verify DB record created
    assert payment.id != nil
    assert payment.state == :pending
    assert payment.external_payment_id =~ "dwolla_pay_"
    assert payment.provider == :dwolla
    
    # Verify relationships
    loaded = Ash.load!(payment, :payment_connection)
    assert loaded.payment_connection.id == ctx.connection.id
  end
end
```

### Compensation Flow

```elixir
describe "InitiatePaymentReactor compensation" do
  test "cancels at provider when DB fails", ctx do
    # Provider succeeds
    Mox.expect(MockDwollaAdapter, :send_payment, fn _, _, _ ->
      {:ok, %{payment_id: "pay_to_cancel", status: :pending}}
    end)
    
    # Expect compensation call
    Mox.expect(MockDwollaAdapter, :cancel_payment, fn _config, "pay_to_cancel" ->
      {:ok, :cancelled}
    end)
    
    # Force DB failure by violating constraint
    params = %{
      workspace_id: ctx.workspace.id,
      entity_id: Ecto.UUID.generate(),  # Non-existent entity
      amount: Money.new(100_00, :USD),
      recipient_data: valid_recipient(),
      rail: :ach
    }
    
    assert {:error, _} = PaymentTransaction.initiate_payment(params)
    
    # Verify compensation was called (Mox verifies on exit)
  end
end
```

## Testing Webhook Processing

```elixir
describe "webhook processing" do
  test "processes payment completion webhook", ctx do
    # Create pending payment
    payment = insert(:payment_transaction,
      workspace: ctx.workspace,
      entity: ctx.entity,
      external_payment_id: "dwolla_123",
      state: :pending
    )
    
    # Simulate webhook
    webhook_payload = %{
      "topic" => "transfer_completed",
      "resourceId" => "dwolla_123",
      "timestamp" => DateTime.to_iso8601(DateTime.utc_now())
    }
    
    # Mock signature validation
    Mox.expect(MockDwollaAdapter, :validate_webhook, fn _, _, _ ->
      {:ok, :valid}
    end)
    
    Mox.expect(MockDwollaAdapter, :parse_webhook_event, fn _, payload ->
      {:ok, %{
        type: :transfer_completed,
        resource_id: payload["resourceId"],
        timestamp: payload["timestamp"]
      }}
    end)
    
    # Process webhook
    assert {:ok, event} = PaymentWebhookEvent.receive_webhook(%{
      provider: :dwolla,
      raw_body: Jason.encode!(webhook_payload),
      signature: "valid_signature"
    })
    
    # Verify payment updated
    updated_payment = Ash.get!(PaymentTransaction, payment.id)
    assert updated_payment.state == :completed
    assert updated_payment.completed_at != nil
  end
  
  test "rejects invalid signature" do
    Mox.expect(MockDwollaAdapter, :validate_webhook, fn _, _, _ ->
      {:error, :invalid_signature}
    end)
    
    assert {:error, :invalid_signature} = PaymentWebhookEvent.receive_webhook(%{
      provider: :dwolla,
      raw_body: "{}",
      signature: "invalid"
    })
  end
end
```

## Testing Multi-tenancy

```elixir
describe "workspace isolation" do
  test "prevents cross-workspace access" do
    workspace1 = insert(:workspace)
    workspace2 = insert(:workspace)
    
    payment1 = insert(:payment_transaction, workspace: workspace1)
    payment2 = insert(:payment_transaction, workspace: workspace2)
    
    # Query scoped to workspace1
    results = PaymentTransaction
    |> Ash.Query.filter(workspace_id == ^workspace1.id)
    |> Ash.read!()
    
    assert length(results) == 1
    assert hd(results).id == payment1.id
    refute Enum.any?(results, &(&1.id == payment2.id))
  end
  
  test "cannot update payment from different workspace" do
    workspace1 = insert(:workspace)
    workspace2 = insert(:workspace)
    
    payment = insert(:payment_transaction, workspace: workspace1)
    
    # Attempt update with wrong workspace context
    assert {:error, _} = PaymentTransaction.update(
      payment.id, 
      %{state: :completed},
      context: %{workspace_id: workspace2.id}
    )
  end
end
```

## Testing End-to-End Flows

### Full Payment Lifecycle

```elixir
describe "payment lifecycle" do
  @tag :slow
  test "payment from initiation to completion", ctx do
    # 1. Initiate payment
    Mox.expect(MockDwollaAdapter, :send_payment, fn _, _, _ ->
      {:ok, %{payment_id: "lifecycle_test", status: :pending}}
    end)
    
    {:ok, payment} = PaymentTransaction.initiate_payment(%{
      workspace_id: ctx.workspace.id,
      entity_id: ctx.entity.id,
      amount: Money.new(100_00, :USD),
      recipient_data: valid_recipient(),
      rail: :ach
    })
    
    assert payment.state == :pending
    
    # 2. Simulate webhook for processing
    simulate_webhook(ctx.workspace, %{
      topic: "transfer_pending",
      resourceId: "lifecycle_test"
    })
    
    payment = Ash.get!(PaymentTransaction, payment.id)
    assert payment.state == :processing
    
    # 3. Simulate webhook for completion
    simulate_webhook(ctx.workspace, %{
      topic: "transfer_completed",
      resourceId: "lifecycle_test"
    })
    
    payment = Ash.get!(PaymentTransaction, payment.id)
    assert payment.state == :completed
    assert payment.completed_at != nil
  end
end
```

### KYB Onboarding Flow

```elixir
describe "KYB onboarding flow" do
  @tag :slow
  test "complete business verification", ctx do
    # 1. Create application
    {:ok, app} = KybApplication.create(%{
      workspace_id: ctx.workspace.id,
      entity_id: ctx.entity.id,
      country: "US",
      entity_type: :llc
    })
    
    # 2. Add business data
    {:ok, revision} = KybApplicationRevision.create(%{
      kyb_application_id: app.id,
      business_data: valid_business_data()
    })
    
    # 3. Upload documents
    for doc_type <- [:articles_of_incorporation, :tax_id_document] do
      {:ok, _doc} = KybDocument.create(%{
        kyb_application_id: app.id,
        document_type: doc_type,
        file_url: "s3://test/#{doc_type}.pdf",
        file_name: "#{doc_type}.pdf"
      })
    end
    
    # 4. Add beneficial owner
    {:ok, owner} = BeneficialOwner.create(%{
      kyb_application_id: app.id,
      first_name: "Jane",
      last_name: "Smith",
      ownership_percentage: Decimal.new("100")
    })
    
    # 5. Submit
    Mox.expect(MockDwollaAdapter, :verify_identity, fn _, _, _ ->
      {:ok, %{verification_id: "ver_123", status: :pending_review}}
    end)
    
    {:ok, submitted} = KybApplication.submit(app.id)
    assert submitted.status == :pending_review
    
    # 6. Simulate approval webhook
    simulate_verification_webhook(%{
      topic: "customer_verified",
      resourceId: "ver_123"
    })
    
    app = Ash.get!(KybApplication, app.id)
    assert app.status == :approved
  end
end
```

## External Provider Integration Tests

```elixir
# These tests hit real provider sandboxes
# Only run manually or in specific CI environments

defmodule EmberPayments.ExternalIntegrationTest do
  use FlameTeampayPayables.EmberPayments.IntegrationCase
  
  @moduletag :external
  @moduletag :slow
  
  @tag :skip  # Uncomment to run manually
  test "real Dwolla sandbox payment" do
    config = %{
      "api_key" => System.get_env("DWOLLA_SANDBOX_KEY"),
      "api_secret" => System.get_env("DWOLLA_SANDBOX_SECRET"),
      "environment" => "sandbox"
    }
    
    {:ok, result} = DwollaAdapter.send_payment(config, %{
      amount: Money.new(1_00, :USD),  # $1 test payment
      recipient_data: sandbox_recipient()
    }, [])
    
    assert result.payment_id != nil
    assert result.status in [:pending, :processing]
  end
end
```

## Helper Functions

```elixir
defmodule EmberPayments.Test.PaymentHelpers do
  def valid_recipient do
    %{
      name: "Test Vendor",
      account_number: "123456789",
      routing_number: "021000021"
    }
  end
  
  def valid_business_data do
    %{
      legal_name: "Test Business LLC",
      ein: "12-3456789",
      incorporation_state: "DE",
      address: %{
        street1: "123 Test St",
        city: "San Francisco",
        state: "CA",
        postal_code: "94102",
        country: "US"
      }
    }
  end
  
  def simulate_webhook(workspace, payload) do
    # ... webhook simulation logic
  end
end
```

## Code References

- **Integration Case**: `test/support/cases/ember_payments_integration_case.ex`
- **Helpers**: `test/support/helpers/payment_helpers.ex`
- **Feature Tests**: `test/ember_payments/features/`
