# Bridge Resource Changes

> **Session:** SC-2025-12-22-002
> **Date:** 2025-12-22

---

## Overview

This document details the changes required to existing Ash resources.

---

## 1. CodingCategory Changes

**File:** `lib/flame_teampay_payables/ember_coding/definitions/resources/coding_category.ex`

### Change 1: Make entity_id Optional

```elixir
# BEFORE
attribute :entity_id, :uuid,
  allow_nil?: false,
  description: "Entity this dimension type belongs to"

# AFTER
attribute :entity_id, :uuid,
  allow_nil?: true,
  description: "Entity scope (NULL = workspace-wide, available to all entities)"
```

### Change 2: Update Validation

```elixir
# BEFORE
validate present([:name, :code, :workspace_id, :entity_id])

# AFTER
validate present([:name, :code, :workspace_id])
# Note: entity_id removed from required fields
```

### Change 3: Update Identities

```elixir
# BEFORE
identities do
  identity :unique_name_per_entity, [:workspace_id, :entity_id, :name]
  identity :unique_code_per_entity, [:workspace_id, :entity_id, :code]
end

# AFTER
identities do
  # Entity-scoped identities (entity_id IS NOT NULL)
  identity :unique_name_per_entity, [:workspace_id, :entity_id, :name],
    where: expr(not is_nil(entity_id))
  identity :unique_code_per_entity, [:workspace_id, :entity_id, :code],
    where: expr(not is_nil(entity_id))
  
  # Workspace-wide identities (entity_id IS NULL)
  identity :unique_name_workspace_wide, [:workspace_id, :name],
    where: expr(is_nil(entity_id))
  identity :unique_code_workspace_wide, [:workspace_id, :code],
    where: expr(is_nil(entity_id))
end
```

### Change 4: Update postgres block

```elixir
postgres do
  # ... existing config ...
  
  # Add identity where clauses for Ash to generate correct SQL
  identity_wheres_to_sql [
    unique_name_per_entity: "entity_id IS NOT NULL AND archived_at IS NULL",
    unique_code_per_entity: "entity_id IS NOT NULL AND archived_at IS NULL",
    unique_name_workspace_wide: "entity_id IS NULL AND archived_at IS NULL",
    unique_code_workspace_wide: "entity_id IS NULL AND archived_at IS NULL"
  ]
  
  # Remove auto-generated indexes, use custom ones from migration
  skip_unique_indexes [
    :unique_name_per_entity,
    :unique_code_per_entity,
    :unique_name_workspace_wide,
    :unique_code_workspace_wide
  ]
end
```

---

## 2. CodingValue Changes

**File:** `lib/flame_teampay_payables/ember_coding/definitions/resources/coding_value.ex`

### Change 1: Make entity_id Optional

```elixir
# BEFORE
attribute :entity_id, :uuid,
  allow_nil?: false,
  description: "Entity this dimension value belongs to"

# AFTER
attribute :entity_id, :uuid,
  allow_nil?: true,
  description: "Entity scope (NULL = workspace-wide)"
```

### Change 2: Update Validation

```elixir
# BEFORE
validate present([:name, :code, :workspace_id, :entity_id, :dimension_type_id])

# AFTER
validate present([:name, :code, :workspace_id, :dimension_type_id])
# Note: entity_id removed from required fields
```

### Change 3: Update Identities

```elixir
# BEFORE
identities do
  identity :unique_name_per_type, [:workspace_id, :entity_id, :dimension_type_id, :name]
  identity :unique_code_per_type, [:workspace_id, :entity_id, :dimension_type_id, :code]
  identity :unique_external_id, [:workspace_id, :entity_id, :dimension_type_id, :external_id, :external_system],
    where: expr(not is_nil(external_id))
end

# AFTER
identities do
  # Entity-scoped identities
  identity :unique_name_per_type, [:workspace_id, :entity_id, :dimension_type_id, :name],
    where: expr(not is_nil(entity_id))
  identity :unique_code_per_type, [:workspace_id, :entity_id, :dimension_type_id, :code],
    where: expr(not is_nil(entity_id))
  identity :unique_external_id, [:workspace_id, :entity_id, :dimension_type_id, :external_id, :external_system],
    where: expr(not is_nil(entity_id) and not is_nil(external_id))
  
  # Workspace-wide identities
  identity :unique_name_workspace_wide, [:workspace_id, :dimension_type_id, :name],
    where: expr(is_nil(entity_id))
  identity :unique_code_workspace_wide, [:workspace_id, :dimension_type_id, :code],
    where: expr(is_nil(entity_id))
  identity :unique_external_id_workspace_wide, [:workspace_id, :dimension_type_id, :external_id, :external_system],
    where: expr(is_nil(entity_id) and not is_nil(external_id))
end
```

### Change 4: Update upsert_from_erp Action

The identity used for upsert needs to handle both cases:

```elixir
create :upsert_from_erp do
  description "Create or update a value from ERP sync"
  upsert? true
  
  # Use appropriate identity based on entity_id
  # For workspace-wide (entity_id = nil), use :unique_external_id_workspace_wide
  # For entity-scoped, use :unique_external_id
  upsert_identity :unique_external_id  # Ash will match based on where clause
  
  # ... rest unchanged
end
```

---

## 3. ERP Mirror Table Changes (All 8 Tables)

These changes apply to:
- `Department`
- `Location`
- `Class`
- `Project`
- `GLAccount`
- `Job`
- `ExpenseCategory`
- `CustomDimensionValue`

### Change 1: Add bridged_at Attribute

```elixir
# ADD to attributes block
attribute :bridged_at, :utc_datetime_usec, 
  allow_nil?: true, 
  public?: true,
  description: "When this record was last bridged to CodingValue"
```

### Change 2: Add link_and_bridge Action

```elixir
# ADD to actions block
update :link_and_bridge do
  description "Link to CodingValue and mark as bridged"
  require_atomic? false
  accept [:coding_value_id, :bridged_at]
end
```

### Example: Department Changes

**File:** `lib/flame_teampay_payables/ember_erp/resources/accounting/core/department.ex`

```elixir
# In attributes block, ADD:
attribute :bridged_at, :utc_datetime_usec, 
  allow_nil?: true, 
  public?: true,
  description: "When this record was last bridged to CodingValue"

# In actions block, ADD:
update :link_and_bridge do
  description "Link to CodingValue and mark as bridged"
  require_atomic? false
  accept [:coding_value_id, :bridged_at]
end

# In code_interface block, ADD:
define :link_and_bridge
```

---

## 4. Query Pattern Updates

Any code that queries CodingCategory or CodingValue by entity needs updating:

### Before

```elixir
CodingCategory
|> Ash.Query.filter(entity_id == ^entity_id)
```

### After

```elixir
CodingCategory
|> Ash.Query.filter(entity_id == ^entity_id or is_nil(entity_id))
# This returns both entity-scoped AND workspace-wide categories
```

### Files to Update

Search for patterns like:
- `entity_id == ^entity_id`
- `entity_id == ^arg(:entity_id)`

In these files:
- `lib/flame_teampay_payables_web/live/**/*.ex` (LiveViews with dropdowns)
- `lib/flame_teampay_payables/ember_coding/**/*.ex` (Coding domain)
- `lib/flame_teampay_payables/ember_expense_card/**/*.ex` (Transaction coding)

---

## 5. UI Considerations

### Dropdown Queries

When populating coding dropdowns, include workspace-wide options:

```elixir
def load_coding_categories(workspace_id, entity_id) do
  CodingCategory
  |> Ash.Query.filter(
    is_active == true and (entity_id == ^entity_id or is_nil(entity_id))
  )
  |> Ash.read!(tenant: workspace_id, authorize?: false)
end
```

### Display Labels

Consider showing scope in UI:

```elixir
def category_label(category) do
  if category.entity_id do
    category.name
  else
    "#{category.name} (All Entities)"
  end
end
```

---

## Summary Checklist

| Resource | Change | Status |
|----------|--------|--------|
| CodingCategory | entity_id optional | ⏳ Pending |
| CodingCategory | Update validation | ⏳ Pending |
| CodingCategory | Update identities | ⏳ Pending |
| CodingValue | entity_id optional | ⏳ Pending |
| CodingValue | Update validation | ⏳ Pending |
| CodingValue | Update identities | ⏳ Pending |
| Department | Add bridged_at | ⏳ Pending |
| Department | Add link_and_bridge | ⏳ Pending |
| Location | Add bridged_at | ⏳ Pending |
| Location | Add link_and_bridge | ⏳ Pending |
| Class | Add bridged_at | ⏳ Pending |
| Class | Add link_and_bridge | ⏳ Pending |
| Project | Add bridged_at | ⏳ Pending |
| Project | Add link_and_bridge | ⏳ Pending |
| GLAccount | Add bridged_at | ⏳ Pending |
| GLAccount | Add link_and_bridge | ⏳ Pending |
| Job | Add bridged_at | ⏳ Pending |
| Job | Add link_and_bridge | ⏳ Pending |
| ExpenseCategory | Add bridged_at | ⏳ Pending |
| ExpenseCategory | Add link_and_bridge | ⏳ Pending |
| CustomDimensionValue | Add bridged_at | ⏳ Pending |
| CustomDimensionValue | Add link_and_bridge | ⏳ Pending |

---

*Document created: 2025-12-22 by Sync Committee*

