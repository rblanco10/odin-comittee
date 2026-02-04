# Testing Documentation

Comprehensive testing guides for the EmberPayments domain.

## Testing Philosophy

Testing in EmberPayments follows a layered approach:

1. **Unit Tests** - Test individual functions, validations, calculations
2. **Resource Tests** - Test Ash resource actions, relationships, policies
3. **Integration Tests** - Test cross-resource workflows, reactors
4. **Feature Tests** - Test end-to-end user scenarios
5. **Cross-Cutting Tests** - Security, performance, observability

## Test Organization

```
test/flame_teampay_payables/ember_payments/
├── support/                      # Test utilities
│   ├── cases/                    # Base test case modules
│   │   └── ember_payments_case.ex
│   ├── factories/                # Data factories
│   │   └── ember_payments_factory.ex
│   ├── fixtures/                 # Static test data
│   │   └── provider_responses.ex
│   ├── helpers/                  # Helper functions
│   │   ├── assertion_helpers.ex
│   │   └── payment_helpers.ex
│   └── mocks/                    # Mock implementations
│       └── provider_mocks.ex
├── unit/                         # Unit tests
│   ├── capabilities/
│   ├── services/
│   └── types/
├── resources/                    # Resource tests (1:1 with lib/)
│   ├── transaction/
│   ├── card/
│   ├── identity/
│   └── webhook/
├── reactors/                     # Reactor tests
│   ├── transaction/
│   ├── card/
│   └── identity/
├── features/                     # Feature workflow tests
│   ├── 01_payment_initiation/
│   ├── 02_card_management/
│   └── 03_kyb_onboarding/
├── integration/                  # Integration tests
│   ├── provider_integration/
│   └── cross_domain/
└── cross_cutting/               # Cross-cutting concerns
    ├── security/
    ├── multitenancy/
    ├── performance/
    └── observability/
```

## Test Categories

| Category | What It Tests | Speed | External Deps |
|----------|---------------|-------|---------------|
| Unit | Pure functions, logic | Fast | None |
| Resource | CRUD, validations | Fast | DB |
| Reactor | Multi-step flows | Medium | DB, Mocks |
| Feature | E2E workflows | Medium | DB, Mocks |
| Integration | Real providers | Slow | External APIs |

## Quick Commands

```bash
# Run all ember_payments tests
mix test test/flame_teampay_payables/ember_payments/

# Run by category
mix test test/flame_teampay_payables/ember_payments/unit/
mix test test/flame_teampay_payables/ember_payments/resources/
mix test test/flame_teampay_payables/ember_payments/reactors/

# Run by tag
mix test --only unit
mix test --only integration
mix test --only slow
mix test --exclude slow

# Run specific feature
mix test test/flame_teampay_payables/ember_payments/features/01_payment_initiation/
```

## Test Tags

```elixir
@moduletag :ember_payments      # All ember_payments tests
@moduletag :unit               # Pure unit tests
@moduletag :integration        # Integration tests
@moduletag :slow               # Long-running tests
@moduletag :external           # Hits external APIs
@moduletag :security           # Security-focused tests
@tag :wip                      # Work in progress
```

## Documentation Files

- [Unit Testing](./unit_testing.md) - Testing individual components
- [Integration Testing](./integration_testing.md) - Testing workflows and providers
- [Mocks & Fixtures](./mocks_and_fixtures.md) - Test data patterns

## Key Testing Principles

### 1. Test Behavior, Not Implementation

```elixir
# ❌ Don't test internal implementation
test "sets status field to :completed" do
  changeset = PaymentTransaction.changeset(txn, %{})
  assert Ecto.Changeset.get_field(changeset, :state) == :completed
end

# ✅ Test observable behavior
test "completes payment and updates status" do
  {:ok, payment} = PaymentTransaction.complete(payment.id)
  assert payment.state == :completed
  assert payment.completed_at != nil
end
```

### 2. Use Factories for Test Data

```elixir
# Use factories for consistent, valid test data
payment = insert(:payment_transaction, 
  amount: Money.new(100_00, :USD),
  state: :pending
)
```

### 3. Mock External Services

```elixir
# Mock provider responses for deterministic tests
Mox.expect(MockDwollaAdapter, :send_payment, fn _config, _params, _opts ->
  {:ok, %{payment_id: "test_123", status: :pending}}
end)
```

### 4. Test Error Paths

```elixir
# Always test failure scenarios
test "returns error for insufficient funds" do
  Mox.expect(MockDwollaAdapter, :send_payment, fn _, _, _ ->
    {:error, :insufficient_funds}
  end)
  
  assert {:error, :insufficient_funds} = 
    PaymentTransaction.initiate_payment(params)
end
```

### 5. Isolate Tests

```elixir
# Each test should be independent
setup do
  :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
  Ecto.Adapters.SQL.Sandbox.mode(Repo, {:shared, self()})
  :ok
end
```

## Testing Reactors

Reactors require special testing considerations:

```elixir
describe "InitiatePaymentReactor" do
  setup do
    # Set up mocks for all provider calls
    Mox.stub_with(MockAdapterRegistry, TestAdapterRegistry)
    :ok
  end
  
  test "completes all steps successfully" do
    params = %{
      workspace_id: workspace.id,
      entity_id: entity.id,
      amount: Money.new(100_00, :USD),
      recipient_data: valid_recipient(),
      rail: :ach
    }
    
    {:ok, payment} = InitiatePaymentReactor.run(params)
    
    assert payment.state == :pending
    assert payment.external_payment_id != nil
  end
  
  test "compensates on DB failure after provider call" do
    # Provider succeeds
    Mox.expect(MockDwollaAdapter, :send_payment, fn _, _, _ ->
      {:ok, %{payment_id: "test_123"}}
    end)
    
    # DB fails
    Mox.expect(MockRepo, :insert, fn _ ->
      {:error, :db_error}
    end)
    
    # Compensation cancels at provider
    Mox.expect(MockDwollaAdapter, :cancel_payment, fn _, "test_123" ->
      {:ok, :cancelled}
    end)
    
    assert {:error, _} = InitiatePaymentReactor.run(params)
  end
end
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Run fast tests
      run: mix test --exclude slow --exclude external
      
    - name: Run slow tests
      run: mix test --only slow
      
    - name: Run external integration tests
      if: github.ref == 'refs/heads/main'
      run: mix test --only external
      env:
        DWOLLA_API_KEY: ${{ secrets.DWOLLA_SANDBOX_KEY }}
```

## Coverage Goals

| Area | Target Coverage |
|------|----------------|
| Capabilities | 90%+ |
| Resources | 85%+ |
| Reactors | 90%+ |
| Services | 80%+ |
| Adapters | 70%+ (hard to test external) |

## Related Documentation

- [QA Specialists](../../members/qa_specialists/)
- [Testing Expert](../../members/technical_specialists/testing_expert.md)
