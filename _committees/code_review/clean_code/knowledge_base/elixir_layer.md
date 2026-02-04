# Elixir-Specific Layer

> **Extends**: Shared Clean Code Rubric  
> **Language**: Elixir  
> **Reviewer**: S001 - Elixir Idioms Reviewer

---

## Overview

This layer extends the shared rubric with Elixir-specific checks. These checks leverage Elixir's functional nature, pattern matching, and OTP patterns.

---

## 1. Pattern Matching Clarity

### Good Patterns

```elixir
# Destructure in function heads
def process(%User{status: :active} = user), do: activate(user)
def process(%User{status: :pending} = user), do: remind(user)
def process(%User{status: :inactive}), do: {:error, :inactive}

# Clear pattern matching
def handle_result({:ok, data}), do: {:ok, transform(data)}
def handle_result({:error, reason}), do: {:error, reason}
```

### Bad Patterns

```elixir
# Nested conditionals instead of pattern matching
def process(user) do
  if user.status == :active do
    activate(user)
  else
    if user.status == :pending do
      remind(user)
    else
      {:error, :inactive}
    end
  end
end

# Over-nested pattern matching
def handle({:ok, %{data: %{user: %{profile: %{name: name}}}}}) do
  # Too deep - extract intermediate steps
end
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Nested if/case where pattern matching is clearer | Should Fix |
| Over-nested patterns (>3 levels) | Should Fix |
| Missing pattern match clause | Must Fix |

---

## 2. Function Heads & Guards

### Good Patterns

```elixir
# Multiple clauses, specific to general
def fetch(id) when is_integer(id), do: Repo.get(User, id)
def fetch(id) when is_binary(id), do: Repo.get_by(User, external_id: id)
def fetch(_), do: {:error, :invalid_id}

# Guards in function head
def calculate_discount(amount) when amount > 100, do: amount * 0.1
def calculate_discount(amount) when amount > 50, do: amount * 0.05
def calculate_discount(_amount), do: 0
```

### Bad Patterns

```elixir
# Type checking in body instead of guard
def fetch(id) do
  if is_integer(id) do
    Repo.get(User, id)
  else
    Repo.get_by(User, external_id: id)
  end
end

# Clauses in wrong order (general before specific)
def calculate_discount(_amount), do: 0
def calculate_discount(amount) when amount > 100, do: amount * 0.1  # Never reached!
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Type checking in body when guard works | Should Fix |
| Clauses in wrong order | Must Fix |
| Missing catch-all clause when needed | Should Fix |

---

## 3. Pipeline Readability

### Good Patterns

```elixir
# Consistent abstraction level
def process_order(params) do
  params
  |> validate_params()
  |> build_order()
  |> calculate_totals()
  |> save_order()
end

# Reasonable length (5-7 stages)
def transform_data(data) do
  data
  |> parse()
  |> validate()
  |> normalize()
  |> enrich()
  |> format()
end
```

### Bad Patterns

```elixir
# Mixed abstraction levels
def process_order(params) do
  params
  |> Map.get(:items)                    # Low-level
  |> Enum.filter(&(&1.quantity > 0))    # Low-level
  |> calculate_totals()                 # High-level
  |> Map.put(:tax, calculate_tax())     # Low-level
  |> save_order()                       # High-level
end

# Side effects mid-pipeline
def process(data) do
  data
  |> transform()
  |> tap(&send_notification/1)  # Side effect mid-pipe
  |> save()
end

# Too long (>10 stages)
def process(data) do
  data
  |> step1()
  |> step2()
  # ... 15 more steps
end
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Side effects mid-pipeline | Should Fix |
| Mixed abstraction levels | Should Fix |
| Pipeline >10 stages | Should Fix |
| Pipeline >15 stages | Must Fix |

---

## 4. Module Boundaries

### Good Patterns

```elixir
# Clear public API
defmodule MyApp.Orders do
  @moduledoc "Public API for order management."
  
  # Public functions at top
  def create(params), do: ...
  def get(id), do: ...
  def list(filters), do: ...
  
  # Private functions at bottom
  defp validate(params), do: ...
  defp calculate_totals(items), do: ...
end

# Behaviours for polymorphism
defmodule MyApp.PaymentProvider do
  @callback charge(amount :: integer()) :: {:ok, reference()} | {:error, term()}
end

defmodule MyApp.StripeProvider do
  @behaviour MyApp.PaymentProvider
  
  @impl true
  def charge(amount), do: ...
end
```

### Bad Patterns

```elixir
# God module
defmodule MyApp.Utils do
  def format_date(date), do: ...
  def send_email(to, body), do: ...
  def calculate_tax(amount), do: ...
  def validate_user(user), do: ...
  # ... 50 more unrelated functions
end

# Everything public
defmodule MyApp.Orders do
  def create(params), do: ...
  def validate(params), do: ...      # Should be private
  def calculate_totals(items), do: ... # Should be private
end
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| God module (>500 lines, unrelated functions) | Must Fix |
| Missing @moduledoc on public module | Should Fix |
| Implementation details exposed as public | Should Fix |

---

## 5. Naming Conventions

### Conventions

| Convention | Example | Notes |
|------------|---------|-------|
| `?` suffix | `valid?`, `empty?`, `admin?` | Returns boolean |
| `!` suffix | `fetch!`, `save!`, `validate!` | Raises on failure |
| `snake_case` | `calculate_total`, `user_name` | All identifiers |
| Meaningful atoms | `:payment_failed` | Not `:pf` |

### Good Patterns

```elixir
def valid?(user), do: ...
def fetch_user!(id), do: ...  # Raises if not found
def fetch_user(id), do: ...   # Returns {:ok, _} or {:error, _}

defmodule MyApp.PaymentProcessor do  # Noun
  def process_payment(payment), do: ...  # Verb phrase
end
```

### Bad Patterns

```elixir
def isValid(user), do: ...     # Wrong: camelCase, no ?
def getUser(id), do: ...       # Wrong: camelCase
def fetchUser(id), do: ...     # Wrong: camelCase

defmodule MyApp.ProcessPayments do  # Wrong: verb as module name
end
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Missing `?` on boolean function | Should Fix |
| Missing `!` on raising function | Should Fix |
| camelCase instead of snake_case | Must Fix |

---

## 6. Error Handling

### Good Patterns

```elixir
# Consistent tuple returns
def fetch_user(id) do
  case Repo.get(User, id) do
    nil -> {:error, :not_found}
    user -> {:ok, user}
  end
end

# With block with meaningful else
with {:ok, user} <- fetch_user(id),
     {:ok, order} <- create_order(user, params) do
  {:ok, order}
else
  {:error, :not_found} -> {:error, "User not found"}
  {:error, :invalid_params} -> {:error, "Invalid order parameters"}
  {:error, reason} -> {:error, "Unexpected: #{inspect(reason)}"}
end

# Bang function for crash-on-failure
def fetch_user!(id) do
  case fetch_user(id) do
    {:ok, user} -> user
    {:error, reason} -> raise "Failed to fetch user: #{inspect(reason)}"
  end
end
```

### Bad Patterns

```elixir
# Returning nil for errors
def fetch_user(id) do
  Repo.get(User, id)  # Returns nil on not found - caller doesn't know it's an error
end

# Catch-all else
with {:ok, user} <- fetch_user(id),
     {:ok, order} <- create_order(user, params) do
  {:ok, order}
else
  _ -> {:error, "Something went wrong"}  # Lost all context!
end

# Bare strings for error reasons
{:error, "user not found"}  # Should be {:error, :user_not_found}
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Returning nil for errors | Must Fix |
| Catch-all else clause | Should Fix |
| Bare strings for error reasons | Should Fix |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                      ELIXIR LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PATTERN MATCHING                                                │
│  □ Destructure in function heads                                 │
│  □ Avoid nested if/case when pattern matching works              │
│  □ Keep patterns readable (≤3 levels deep)                       │
│                                                                  │
│  FUNCTION HEADS & GUARDS                                         │
│  □ Order clauses specific → general                              │
│  □ Use guards instead of body conditionals                       │
│  □ Include catch-all when appropriate                            │
│                                                                  │
│  PIPELINES                                                       │
│  □ Consistent abstraction level                                  │
│  □ No side effects mid-pipeline                                  │
│  □ ≤7 stages (≤10 max)                                           │
│                                                                  │
│  MODULE BOUNDARIES                                               │
│  □ Clear public API with @doc                                    │
│  □ Private functions stay private                                │
│  □ Behaviours for polymorphism                                   │
│                                                                  │
│  NAMING                                                          │
│  □ ? for booleans, ! for raising                                 │
│  □ snake_case everywhere                                         │
│  □ Meaningful atoms                                              │
│                                                                  │
│  ERROR HANDLING                                                  │
│  □ {:ok, _} / {:error, _} tuples                                 │
│  □ Meaningful else clauses in with                               │
│  □ Atoms for error reasons                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*"Elixir's power comes from embracing functional patterns, not fighting them."*
