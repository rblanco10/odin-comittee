# Capability Pattern Guide

> **Location**: `ember_payments/capabilities/`

---

## Overview

Capabilities define abstract operations that providers can perform, independent of implementation details.

---

## Capability Structure

```
capabilities/{capability_name}/
├── behavior.ex     # Callback definitions
└── types.ex        # Data type definitions
```

---

## Example: Card Issuance

### behavior.ex
```elixir
defmodule CardIssuance.Behavior do
  @callback issue_card(params :: map(), credentials :: map()) ::
    {:ok, CardIssuance.Types.result()} | {:error, term()}
    
  @callback activate_card(card_id :: String.t(), credentials :: map()) ::
    {:ok, map()} | {:error, term()}
    
  @callback freeze_card(card_id :: String.t(), credentials :: map()) ::
    {:ok, map()} | {:error, term()}
end
```

### types.ex
```elixir
defmodule CardIssuance.Types do
  defstruct [
    :card_id,
    :card_token,
    :last_four,
    :expiry_month,
    :expiry_year,
    :status
  ]
end
```

---

## Available Capabilities

| Capability | Providers | Purpose |
|------------|-----------|---------|
| card_issuance | Marqeta, WEX | Issue virtual/physical cards |
| payout_disbursement | Checkbook, Dwolla | ACH transfers, checks |
| identity_verification | Dwolla, Marqeta | KYB/KYC |
| funding_source_management | Dwolla, Checkbook | Bank account management |
| recipient_management | Dwolla | Payment recipients |
| account_management | All | Account operations |

---

## Capability Router

`adapters/capability_router.ex` selects the best provider:

```elixir
def best_provider_for(:card_issuance, %{card_type: :fleet}) do
  :wex_fleet
end

def best_provider_for(:card_issuance, _params) do
  :marqeta
end

def best_provider_for(:payout_disbursement, %{method: :check}) do
  :checkbook
end

def best_provider_for(:payout_disbursement, %{method: :ach}) do
  :dwolla
end
```

---

*"Capabilities define contracts; implementations must honor them."*
