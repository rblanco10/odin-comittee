# Column Mapping Reference

> **Subcommittee**: SC11  
> **Last Verified**: 2026-01-14

---

## Overview

Ash uses snake_case for attributes while Loopback2/MySQL uses camelCase. The `source:` option bridges this gap.

---

## Mapping Pattern

```elixir
attribute :owner_id, :string do
  source :ownerId
  allow_nil? false
end
```

---

## Common Mappings

| Ash Attribute | MySQL Column | source: Option |
|---------------|--------------|----------------|
| `owner_id` | `ownerId` | `:ownerId` |
| `customer_id` | `customerId` | `:customerId` |
| `receivable_id` | `receivableId` | `:receivableId` |
| `created_at` | `createdAt` | `:createdAt` |
| `updated_at` | `updatedAt` | `:updatedAt` |
| `deleted_at` | `deletedAt` | `:deletedAt` |
| `line_total` | `lineTotal` | `:lineTotal` |
| `due_date` | `dueDate` | `:dueDate` |
| `payment_method_id` | `paymentMethodId` | `:paymentMethodId` |

---

## Verification Command

To verify column mapping works correctly:

```elixir
# Create record in Ash
{:ok, receivable} = Ash.create(Receivable, %{...})

# Verify in MySQL
mysql> SELECT ownerId, customerId FROM receivables WHERE id = '...';
```

---

## Common Mistakes

### Missing source: Option

```elixir
# WRONG - will create owner_id column
attribute :owner_id, :string

# CORRECT - maps to ownerId column
attribute :owner_id, :string do
  source :ownerId
end
```

### Typos in source: Value

```elixir
# WRONG - typo will break mapping
attribute :owner_id, :string do
  source :ownerid  # lowercase 'i'
end

# CORRECT
attribute :owner_id, :string do
  source :ownerId  # camelCase
end
```

---

*"A column by any other name would break legacy."*

