# Adapter Pattern

> **Historian**: Catherine Wells (H002)  
> **Last Verified**: 2026-01-14

---

## Overview

Adapters abstract external system integrations, providing a consistent interface regardless of the underlying provider (Sage, NetSuite, QuickBooks).

---

## When to Use Adapters

✅ **Use Adapters For**:
- ERP integrations
- Payment gateway integrations
- External API calls
- Provider-specific logic

---

## Basic Pattern

```elixir
defmodule FlamePsAr.EmberErp.Adapters.ErpAdapter do
  @moduledoc """
  Behavior for ERP adapters.
  """

  @callback push_journal(journal :: map()) :: {:ok, map()} | {:error, term()}
  @callback pull_invoices(since :: DateTime.t()) :: {:ok, list()} | {:error, term()}
  @callback test_connection() :: :ok | {:error, term()}
end

defmodule FlamePsAr.EmberErp.Adapters.SageIntacct do
  @behaviour FlamePsAr.EmberErp.Adapters.ErpAdapter

  @impl true
  def push_journal(journal) do
    # Sage-specific implementation
  end

  @impl true
  def pull_invoices(since) do
    # Sage-specific implementation
  end

  @impl true
  def test_connection() do
    # Sage-specific implementation
  end
end

defmodule FlamePsAr.EmberErp.Adapters.NetSuite do
  @behaviour FlamePsAr.EmberErp.Adapters.ErpAdapter

  @impl true
  def push_journal(journal) do
    # NetSuite-specific implementation
  end
  
  # ... other implementations
end
```

---

## Usage

```elixir
defmodule FlamePsAr.EmberErp.Services.ErpPusher do
  def push(journal, provider) do
    adapter = get_adapter(provider)
    adapter.push_journal(journal)
  end

  defp get_adapter(:sage), do: FlamePsAr.EmberErp.Adapters.SageIntacct
  defp get_adapter(:netsuite), do: FlamePsAr.EmberErp.Adapters.NetSuite
  defp get_adapter(:quickbooks), do: FlamePsAr.EmberErp.Adapters.QuickBooks
end
```

---

## Testing with Mocks

```elixir
defmodule FlamePsAr.EmberErp.Adapters.MockAdapter do
  @behaviour FlamePsAr.EmberErp.Adapters.ErpAdapter

  @impl true
  def push_journal(_journal), do: {:ok, %{id: "mock-123"}}
end
```

---

*"Adapters translate dialects; they don't create new languages."*

