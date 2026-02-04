# Service Pattern

> **Historian**: Catherine Wells (H002)  
> **Last Verified**: 2026-01-14

---

## Overview

Services encapsulate business logic that doesn't fit cleanly into resource actions or requires coordination between multiple resources.

---

## When to Use Services

✅ **Use Services For**:
- Business logic spanning multiple resources
- Complex calculations
- External integrations
- Operations requiring business rules

❌ **Don't Use Services For**:
- Simple CRUD (use resource actions)
- Multi-step workflows (use Reactors)
- Data validation (use changesets)

---

## Basic Pattern

```elixir
defmodule FlamePsAr.Classic.Domain.Services.BalanceCalculator do
  @moduledoc """
  Calculates receivable balances.
  """

  alias FlamePsAr.Classic.Domain.Receivable

  @doc """
  Calculate balance for a receivable.
  """
  def calculate_balance(receivable) do
    line_total = sum_line_items(receivable)
    payments = sum_payments(receivable)
    fees = sum_fees(receivable)
    
    Decimal.sub(Decimal.add(line_total, fees), payments)
  end

  defp sum_line_items(receivable) do
    # Implementation
  end

  defp sum_payments(receivable) do
    # Implementation
  end

  defp sum_fees(receivable) do
    # Implementation
  end
end
```

---

## Naming Conventions

```
lib/flame_ps_ar/classic/domain/services/
├── balance_calculator.ex
├── aging_calculator.ex
├── fee_calculator.ex
└── payment_applicator.ex
```

---

## Testing Services

```elixir
defmodule FlamePsAr.Classic.Domain.Services.BalanceCalculatorTest do
  use ExUnit.Case

  alias FlamePsAr.Classic.Domain.Services.BalanceCalculator

  test "calculates balance correctly" do
    receivable = build_receivable(line_total: 100, payments: 50)
    assert BalanceCalculator.calculate_balance(receivable) == Decimal.new("50.00")
  end
end
```

---

## Constitutional Considerations

- All money calculations must use Decimal
- Services must accept tenant context
- External calls must have error handling
- Services should be testable in isolation

---

*"Services house business logic; resources house data logic."*

