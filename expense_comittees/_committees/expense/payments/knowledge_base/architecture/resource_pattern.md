# Resource Pattern Guide

> **Location**: `ember_payments/resources/`

---

## Overview

Ash Resources define the data model for ember_payments, including attributes, actions, and policies.

---

## Resource Structure

```elixir
defmodule PayoutItem do
  use Ash.Resource,
    domain: EmberPayments,
    data_layer: AshPostgres.DataLayer

  attributes do
    uuid_primary_key :id
    attribute :status, :atom
    attribute :amount, Money.Ecto.Composite.Type
    timestamps()
  end

  relationships do
    belongs_to :payout_batch, PayoutBatch
  end

  actions do
    defaults [:read, :create, :update]
    
    update :submit do
      change set_attribute(:status, :processing)
    end
  end

  policies do
    policy action_type(:read) do
      authorize_if actor_attribute_equals(:workspace_id, :workspace_id)
    end
  end
end
```

---

## Key Resources

### Connection
```
resources/connection/
├── payment_connection.ex     # Provider credentials per workspace
```

### Card
```
resources/card/
├── card_issuance.ex          # Card records
├── card_transaction.ex       # Settled transactions
├── card_authorization.ex     # Auth events
```

### Payout
```
resources/payout/
├── payout_batch.ex           # Batch header
├── payout_item.ex            # Individual payouts
```

### Identity
```
resources/identity/
├── kyb_application.ex        # KYB applications
├── kyb_verification.ex       # Per-provider verification
├── beneficial_owner.ex       # Beneficial owners
```

### Webhook
```
resources/webhook/
├── payment_webhook_event.ex  # Incoming webhooks
```

---

## Policy Pattern

All resources enforce workspace scoping:

```elixir
policies do
  policy action_type(:read) do
    authorize_if relates_to_actor_via(:workspace)
  end
  
  policy action_type(:create) do
    authorize_if actor_present()
  end
end
```

---

*"Resources are the data foundation; design them carefully."*
