# Unit Testing Guide

Patterns and best practices for unit testing EmberPayments components.

## What to Unit Test

Unit tests focus on isolated, deterministic logic:

- Pure functions (no side effects)
- Type validations
- Calculations
- Business rules
- Data transformations
- Error handling

## Test File Structure

```elixir
defmodule FlameTeampayPayables.EmberPayments.SomeModuleTest do
  use FlameTeampayPayables.EmberPayments.Support.Cases.EmberPaymentsCase, async: true
  
  alias FlameTeampayPayables.EmberPayments.SomeModule
  
  @moduletag :unit
  @moduletag :ember_payments
  
  describe "function_name/arity" do
    test "describes expected behavior" do
      # Arrange
      input = build_input()
      
      # Act
      result = SomeModule.function_name(input)
      
      # Assert
      assert result == expected_output()
    end
    
    test "handles edge case" do
      # ...
    end
    
    test "returns error for invalid input" do
      # ...
    end
  end
end
```

## Testing Pure Functions

### Money Calculations

```elixir
describe "calculate_fee/2" do
  test "calculates percentage fee" do
    amount = Money.new(100_00, :USD)
    fee_rate = Decimal.new("0.025")
    
    assert PaymentFees.calculate_fee(amount, fee_rate) == 
      Money.new(2_50, :USD)
  end
  
  test "rounds up fractional cents" do
    amount = Money.new(100_00, :USD)
    fee_rate = Decimal.new("0.0255")  # Would be $2.55
    
    assert PaymentFees.calculate_fee(amount, fee_rate) == 
      Money.new(2_55, :USD)
  end
  
  test "handles zero amount" do
    amount = Money.new(0, :USD)
    
    assert PaymentFees.calculate_fee(amount, Decimal.new("0.025")) == 
      Money.new(0, :USD)
  end
end
```

### Data Transformations

```elixir
describe "normalize_provider_response/2" do
  test "normalizes Dwolla transfer response" do
    raw = %{
      "id" => "abc123",
      "status" => "pending",
      "amount" => %{"value" => "100.00", "currency" => "USD"}
    }
    
    normalized = ResponseNormalizer.normalize_provider_response(:dwolla, raw)
    
    assert normalized == %{
      external_id: "abc123",
      status: :pending,
      amount: Money.new(100_00, :USD)
    }
  end
  
  test "normalizes Checkbook check response" do
    raw = %{
      "check_id" => "chk_xyz",
      "state" => "PAID",
      "amount" => "50.00"
    }
    
    normalized = ResponseNormalizer.normalize_provider_response(:checkbook, raw)
    
    assert normalized == %{
      external_id: "chk_xyz",
      status: :completed,
      amount: Money.new(50_00, :USD)
    }
  end
end
```

## Testing Validations

### Custom Ash Validations

```elixir
describe "ValidateAmount" do
  test "accepts positive amount" do
    changeset = PaymentTransaction.changeset(%PaymentTransaction{}, %{
      amount: Money.new(100_00, :USD)
    })
    
    assert changeset.valid?
  end
  
  test "rejects zero amount" do
    changeset = PaymentTransaction.changeset(%PaymentTransaction{}, %{
      amount: Money.new(0, :USD)
    })
    
    refute changeset.valid?
    assert "must be greater than zero" in errors_on(changeset).amount
  end
  
  test "rejects negative amount" do
    changeset = PaymentTransaction.changeset(%PaymentTransaction{}, %{
      amount: Money.new(-100_00, :USD)
    })
    
    refute changeset.valid?
  end
end
```

### Routing Number Validation

```elixir
describe "ValidateRoutingNumber" do
  @valid_routing_numbers [
    "021000021",  # Chase
    "121000358",  # Bank of America
    "322271627",  # Chase (California)
  ]
  
  @invalid_routing_numbers [
    "12345678",   # Too short
    "1234567890", # Too long
    "000000000",  # Invalid checksum
    "12345678a",  # Non-numeric
  ]
  
  test "accepts valid routing numbers" do
    for routing <- @valid_routing_numbers do
      assert {:ok, _} = RoutingValidator.validate(routing),
        "Expected #{routing} to be valid"
    end
  end
  
  test "rejects invalid routing numbers" do
    for routing <- @invalid_routing_numbers do
      assert {:error, _} = RoutingValidator.validate(routing),
        "Expected #{routing} to be invalid"
    end
  end
  
  test "validates checksum" do
    # ABA routing number checksum algorithm
    # 3(d1 + d4 + d7) + 7(d2 + d5 + d8) + (d3 + d6 + d9) mod 10 == 0
    assert {:error, :invalid_checksum} = 
      RoutingValidator.validate("123456789")
  end
end
```

## Testing Calculations

### Ash Resource Calculations

```elixir
describe "AvailableBalance calculation" do
  test "calculates available balance from limit minus spent" do
    card = build(:card_issuance,
      spending_limit_amount: Money.new(500_00, :USD),
      month_spent: Money.new(150_00, :USD)
    )
    
    # Load calculation
    card = Ash.load!(card, [:available_balance])
    
    assert card.available_balance == Money.new(350_00, :USD)
  end
  
  test "returns zero when fully spent" do
    card = build(:card_issuance,
      spending_limit_amount: Money.new(500_00, :USD),
      month_spent: Money.new(500_00, :USD)
    )
    
    card = Ash.load!(card, [:available_balance])
    
    assert card.available_balance == Money.new(0, :USD)
  end
  
  test "handles over-limit spending" do
    card = build(:card_issuance,
      spending_limit_amount: Money.new(500_00, :USD),
      month_spent: Money.new(550_00, :USD)  # Over limit
    )
    
    card = Ash.load!(card, [:available_balance])
    
    # Should show negative or zero depending on business rule
    assert Money.negative?(card.available_balance) or 
           card.available_balance == Money.new(0, :USD)
  end
end
```

## Testing Type Modules

### Custom Ash Types

```elixir
describe "EmberPayments.Types.PaymentRail" do
  test "casts valid string to atom" do
    assert {:ok, :ach} = PaymentRail.cast("ach")
    assert {:ok, :wire} = PaymentRail.cast("wire")
    assert {:ok, :check} = PaymentRail.cast("check")
  end
  
  test "casts valid atom" do
    assert {:ok, :ach} = PaymentRail.cast(:ach)
  end
  
  test "rejects invalid value" do
    assert :error = PaymentRail.cast("invalid_rail")
    assert :error = PaymentRail.cast(:invalid_rail)
  end
  
  test "dumps to database format" do
    assert {:ok, "ach"} = PaymentRail.dump(:ach)
  end
  
  test "loads from database format" do
    assert {:ok, :ach} = PaymentRail.load("ach")
  end
end
```

## Testing Business Rules

### Provider Selection Logic

```elixir
describe "CapabilityRouter.select_provider/1" do
  test "selects Dwolla for ACH payments" do
    assert {:ok, :dwolla} = CapabilityRouter.select_provider(%{
      capability: :payment_initiation,
      rail: :ach,
      amount: Money.new(100_00, :USD)
    })
  end
  
  test "selects Checkbook for check payments" do
    assert {:ok, :checkbook} = CapabilityRouter.select_provider(%{
      capability: :payment_initiation,
      rail: :check,
      amount: Money.new(100_00, :USD)
    })
  end
  
  test "selects Marqeta for card issuance" do
    assert {:ok, :marqeta} = CapabilityRouter.select_provider(%{
      capability: :card_issuance,
      card_type: :virtual
    })
  end
  
  test "returns error when no provider supports capability" do
    assert {:error, :no_available_provider} = 
      CapabilityRouter.select_provider(%{
        capability: :fx_conversion,  # Not yet supported
        currency_from: :USD,
        currency_to: :EUR
      })
  end
end
```

### Fee Calculation Rules

```elixir
describe "FeeCalculator.calculate/2" do
  test "applies flat fee for small amounts" do
    # Under $100: flat $0.25 fee
    assert FeeCalculator.calculate(:ach, Money.new(50_00, :USD)) ==
      Money.new(25, :USD)
  end
  
  test "applies percentage fee for larger amounts" do
    # Over $100: 0.5% fee
    assert FeeCalculator.calculate(:ach, Money.new(1000_00, :USD)) ==
      Money.new(5_00, :USD)
  end
  
  test "applies minimum fee" do
    # Percentage would be $0.05, but minimum is $0.25
    assert FeeCalculator.calculate(:ach, Money.new(10_00, :USD)) ==
      Money.new(25, :USD)
  end
  
  test "applies maximum fee cap" do
    # Percentage would be $500, but cap is $50
    assert FeeCalculator.calculate(:ach, Money.new(100_000_00, :USD)) ==
      Money.new(50_00, :USD)
  end
end
```

## Testing Error Handling

```elixir
describe "error handling" do
  test "wraps provider errors in standard format" do
    raw_error = %{"code" => "ValidationError", "message" => "Invalid amount"}
    
    {:error, error} = ErrorHandler.normalize_provider_error(:dwolla, raw_error)
    
    assert error.type == :validation_error
    assert error.message == "Invalid amount"
    assert error.provider == :dwolla
    assert error.raw == raw_error
  end
  
  test "handles timeout errors" do
    {:error, error} = ErrorHandler.normalize_provider_error(:dwolla, :timeout)
    
    assert error.type == :timeout
    assert error.retriable? == true
  end
  
  test "handles connection errors" do
    {:error, error} = ErrorHandler.normalize_provider_error(
      :dwolla, 
      %Req.TransportError{reason: :econnrefused}
    )
    
    assert error.type == :connection_error
    assert error.retriable? == true
  end
end
```

## Helper Functions for Tests

```elixir
# test/support/helpers/assertion_helpers.ex
defmodule EmberPayments.Test.AssertionHelpers do
  import ExUnit.Assertions
  
  def assert_money_equal(actual, expected) do
    assert Money.equals?(actual, expected),
      "Expected #{Money.to_string(expected)}, got #{Money.to_string(actual)}"
  end
  
  def assert_state_transition(record, from_state, to_state) do
    assert record.previous_state == from_state
    assert record.state == to_state
  end
  
  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
```

## Test Data Builders

```elixir
# For unit tests that don't need DB
defmodule EmberPayments.Test.Builders do
  def build_payment_params(overrides \\ %{}) do
    %{
      workspace_id: Ecto.UUID.generate(),
      entity_id: Ecto.UUID.generate(),
      amount: Money.new(100_00, :USD),
      rail: :ach,
      recipient_data: %{
        name: "Test Vendor",
        account_number: "123456789",
        routing_number: "021000021"
      }
    }
    |> Map.merge(overrides)
  end
  
  def build_card_params(overrides \\ %{}) do
    %{
      card_type: :virtual,
      spending_limit: Money.new(500_00, :USD),
      cardholder_name: "John Doe"
    }
    |> Map.merge(overrides)
  end
end
```

## Code References

- **Test Case**: `test/support/cases/ember_payments_case.ex`
- **Assertion Helpers**: `test/support/helpers/assertion_helpers.ex`
- **Builders**: `test/support/builders/`
