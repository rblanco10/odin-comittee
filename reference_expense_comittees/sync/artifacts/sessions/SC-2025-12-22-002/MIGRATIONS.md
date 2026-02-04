# Bridge Migrations

> **Session:** SC-2025-12-22-002
> **Date:** 2025-12-22

---

## Overview

Two migrations are required for the Bridge system:

1. **Make entity_id optional** on CodingCategory/CodingValue
2. **Add bridged_at** to all ERP mirror tables

---

## Migration 1: Make Coding entity_id Optional

**File:** `priv/repo/migrations/XXXXXX_make_coding_entity_id_optional.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.MakeCodingEntityIdOptional do
  @moduledoc """
  Makes entity_id optional on coding_dimension_types and coding_dimension_values.
  
  This enables workspace-wide dimensions where entity_id = NULL means
  "available to all entities in the workspace".
  
  ## Changes
  
  - coding_dimension_types.entity_id: NOT NULL → NULL allowed
  - coding_dimension_values.entity_id: NOT NULL → NULL allowed
  - New partial unique indexes for NULL and non-NULL cases
  """

  use Ecto.Migration

  def up do
    # =========================================
    # 1. CodingCategory (coding_dimension_types)
    # =========================================
    
    # Make entity_id nullable
    alter table(:coding_dimension_types) do
      modify :entity_id, :uuid, null: true
    end

    # Drop old unique indexes that include entity_id
    # (These may have different names depending on how they were created)
    drop_if_exists index(:coding_dimension_types, [:workspace_id, :entity_id, :name],
      name: :coding_dimension_types_workspace_entity_name_unique_idx)
    drop_if_exists index(:coding_dimension_types, [:workspace_id, :entity_id, :code],
      name: :coding_dimension_types_workspace_entity_code_unique_idx)

    # Create partial indexes for NULL entity_id case (workspace-wide)
    create unique_index(:coding_dimension_types, [:workspace_id, :name],
      where: "entity_id IS NULL AND archived_at IS NULL",
      name: :coding_dim_types_ws_null_entity_name_idx)

    create unique_index(:coding_dimension_types, [:workspace_id, :code],
      where: "entity_id IS NULL AND archived_at IS NULL",
      name: :coding_dim_types_ws_null_entity_code_idx)

    # Create partial indexes for non-NULL entity_id case (entity-scoped)
    create unique_index(:coding_dimension_types, [:workspace_id, :entity_id, :name],
      where: "entity_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_types_ws_entity_name_idx)

    create unique_index(:coding_dimension_types, [:workspace_id, :entity_id, :code],
      where: "entity_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_types_ws_entity_code_idx)

    # =========================================
    # 2. CodingValue (coding_dimension_values)
    # =========================================
    
    # Make entity_id nullable
    alter table(:coding_dimension_values) do
      modify :entity_id, :uuid, null: true
    end

    # Drop old unique indexes
    drop_if_exists index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :name],
      name: :coding_dimension_values_workspace_entity_type_name_unique_idx)
    drop_if_exists index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :code],
      name: :coding_dimension_values_workspace_entity_type_code_unique_idx)
    drop_if_exists index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :external_id, :external_system],
      name: :coding_dimension_values_external_id_unique_idx)

    # Create partial indexes for NULL entity_id (workspace-wide)
    create unique_index(:coding_dimension_values, 
      [:workspace_id, :dimension_type_id, :name],
      where: "entity_id IS NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_null_entity_type_name_idx)

    create unique_index(:coding_dimension_values, 
      [:workspace_id, :dimension_type_id, :code],
      where: "entity_id IS NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_null_entity_type_code_idx)

    create unique_index(:coding_dimension_values, 
      [:workspace_id, :dimension_type_id, :external_id, :external_system],
      where: "entity_id IS NULL AND external_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_null_entity_external_idx)

    # Create partial indexes for non-NULL entity_id (entity-scoped)
    create unique_index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :name],
      where: "entity_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_entity_type_name_idx)

    create unique_index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :code],
      where: "entity_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_entity_type_code_idx)

    create unique_index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :external_id, :external_system],
      where: "entity_id IS NOT NULL AND external_id IS NOT NULL AND archived_at IS NULL",
      name: :coding_dim_vals_ws_entity_external_idx)
  end

  def down do
    # =========================================
    # Reverse CodingValue changes
    # =========================================
    
    # Drop new partial indexes
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_null_entity_type_name_idx)
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_null_entity_type_code_idx)
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_null_entity_external_idx)
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_entity_type_name_idx)
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_entity_type_code_idx)
    drop_if_exists index(:coding_dimension_values, [],
      name: :coding_dim_vals_ws_entity_external_idx)

    # Delete any rows with NULL entity_id (can't make NOT NULL with NULLs)
    execute "DELETE FROM coding_dimension_values WHERE entity_id IS NULL"

    # Make entity_id NOT NULL again
    alter table(:coding_dimension_values) do
      modify :entity_id, :uuid, null: false
    end

    # Recreate original indexes
    create unique_index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :name],
      name: :coding_dimension_values_workspace_entity_type_name_unique_idx)
    create unique_index(:coding_dimension_values, 
      [:workspace_id, :entity_id, :dimension_type_id, :code],
      name: :coding_dimension_values_workspace_entity_type_code_unique_idx)

    # =========================================
    # Reverse CodingCategory changes
    # =========================================
    
    drop_if_exists index(:coding_dimension_types, [],
      name: :coding_dim_types_ws_null_entity_name_idx)
    drop_if_exists index(:coding_dimension_types, [],
      name: :coding_dim_types_ws_null_entity_code_idx)
    drop_if_exists index(:coding_dimension_types, [],
      name: :coding_dim_types_ws_entity_name_idx)
    drop_if_exists index(:coding_dimension_types, [],
      name: :coding_dim_types_ws_entity_code_idx)

    execute "DELETE FROM coding_dimension_types WHERE entity_id IS NULL"

    alter table(:coding_dimension_types) do
      modify :entity_id, :uuid, null: false
    end

    create unique_index(:coding_dimension_types, [:workspace_id, :entity_id, :name],
      name: :coding_dimension_types_workspace_entity_name_unique_idx)
    create unique_index(:coding_dimension_types, [:workspace_id, :entity_id, :code],
      name: :coding_dimension_types_workspace_entity_code_unique_idx)
  end
end
```

---

## Migration 2: Add bridged_at to ERP Mirror Tables

**File:** `priv/repo/migrations/XXXXXX_add_bridged_at_to_erp_mirrors.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddBridgedAtToErpMirrors do
  @moduledoc """
  Adds bridged_at column to all ERP mirror tables.
  
  This column tracks when each record was last processed by the Bridge.
  Records with bridged_at IS NULL or updated_at > bridged_at need bridging.
  """

  use Ecto.Migration

  @mirror_tables [
    :ember_erp_accounting_departments,
    :ember_erp_accounting_locations,
    :ember_erp_accounting_classes,
    :ember_erp_accounting_projects,
    :ember_erp_accounting_gl_accounts,
    :ember_erp_accounting_jobs,
    :ember_erp_accounting_expense_categories,
    :ember_erp_accounting_custom_dimension_values
  ]

  def up do
    for table <- @mirror_tables do
      alter table(table) do
        add :bridged_at, :utc_datetime_usec, null: true
      end

      # Index for finding records that need bridging (NULL bridged_at)
      create index(table, [:bridged_at],
        where: "bridged_at IS NULL",
        name: "#{table}_needs_bridging_idx")

      # Index for finding stale records (updated_at > bridged_at)
      # This composite index helps the query:
      # WHERE bridged_at IS NULL OR updated_at > bridged_at
      create index(table, [:updated_at, :bridged_at],
        name: "#{table}_stale_bridge_idx")
    end
  end

  def down do
    for table <- @mirror_tables do
      drop_if_exists index(table, [], name: "#{table}_needs_bridging_idx")
      drop_if_exists index(table, [], name: "#{table}_stale_bridge_idx")

      alter table(table) do
        remove :bridged_at
      end
    end
  end
end
```

---

## Migration Order

1. Run `make_coding_entity_id_optional` first
2. Run `add_bridged_at_to_erp_mirrors` second
3. Deploy code changes
4. Start Bridge worker

---

## Rollback Considerations

### Migration 1 Rollback

**Warning:** Rollback will DELETE any workspace-wide records (entity_id = NULL).

Before rolling back:
1. Export workspace-wide categories/values
2. Plan to recreate them entity-scoped

### Migration 2 Rollback

Safe to rollback. Just removes the bridged_at column.

---

*Document created: 2025-12-22 by Sync Committee*

