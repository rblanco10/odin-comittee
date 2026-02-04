# Resource Pattern

> **Historian**: Catherine Wells (H002)  
> **Last Verified**: 2026-01-14

---

## Overview

Ash Resources are the primary building blocks for data modeling. This pattern documents standard resource conventions for the AR domain.

---

## Standard Resource Structure

```elixir
defmodule FlamePsAr.Classic.Domain.Receivable do
  use Ash.Resource,
    domain: FlamePsAr.Classic.Domain,
    data_layer: AshMysql.DataLayer

  mysql do
    table "receivables"
    repo FlamePsAr.Repo
  end

  attributes do
    uuid_primary_key :id, writable?: true

    attribute :owner_id, :string do
      source :ownerId
      allow_nil? false
    end

    attribute :amount, :decimal do
      constraints [precision: 10, scale: 2]
      allow_nil? false
    end

    attribute :status, :atom do
      constraints [one_of: [:created, :active, :inactive]]
      default :created
    end

    timestamps()
  end

  relationships do
    belongs_to :customer, Customer do
      source_attribute :customer_id
      attribute_type :string
    end

    has_many :line_items, ReceivableLineItem
  end

  actions do
    defaults [:read, :destroy]

    create :create do
      accept [:owner_id, :customer_id, :amount]
    end

    update :update do
      accept [:amount, :status]
    end
  end

  policies do
    policy action_type(:read) do
      authorize_if expr(owner_id == ^actor(:tenant))
    end
  end
end
```

---

## Required Conventions

### 1. Legacy Column Mapping

```elixir
attribute :owner_id, :string do
  source :ownerId  # camelCase for MySQL
end
```

### 2. Decimal for Money

```elixir
attribute :amount, :decimal do
  constraints [precision: 10, scale: 2]
end
```

### 3. Tenant Isolation

```elixir
policies do
  policy action_type(:read) do
    authorize_if expr(owner_id == ^actor(:tenant))
  end
end
```

---

## Related Documentation

- Column mapping: `knowledge_base/legacy/column_mapping.md`
- State machines: `knowledge_base/architecture/state_machines.md`

---

*"Resources are the vocabulary of your domain."*

