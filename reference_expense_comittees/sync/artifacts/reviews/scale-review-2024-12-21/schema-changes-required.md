# SyncExecution Schema Changes Required

> **Status**: DOCUMENTATION ONLY - Schema changes not yet implemented
> **Date**: 2024-12-21
> **Related**: WorkspaceSyncReactor implementation

## Current Implementation Workaround

The `WorkspaceSyncReactor` currently works **without** schema changes by storing
workspace-level sync metadata in the existing `cursor_before` and `cursor_after` 
map fields. This is a functional workaround:

```elixir
# cursor_before stores initialization metadata:
%{
  reactor: "WorkspaceSyncReactor",
  sync_mode: "incremental",
  resumed_from: nil  # or entity type string
}

# cursor_after stores progress and completion data:
%{
  current_entity_type: "vendors",
  completed_entities: ["currencies", "subsidiaries", ...],
  entity_stats: %{
    currencies: %{records_synced: 5, failed: 0, duration_ms: 120},
    ...
  },
  total_synced: 1500,
  total_failed: 3,
  duration_ms: 45000,
  bridge_result: "..."
}
```

## Recommended Schema Enhancement

For better querying, reporting, and type safety, the following dedicated fields
should be added to `SyncExecution`:

### File: `lib/flame_teampay_payables/ember_erp/resources/sync_log/sync_execution.ex`

```elixir
attributes do
  # ... existing attributes ...

  # NEW: Workspace sync tracking
  attribute :current_entity_type, :atom do
    description "Currently syncing entity type (for progress display)"
    constraints one_of: [
      :currencies, :subsidiaries, :accounting_periods, :departments,
      :locations, :classes, :gl_accounts, :expense_categories, :projects,
      :customers, :vendors, :employees, :workspace
    ]
  end

  attribute :completed_entities, {:array, :atom} do
    default []
    description "List of successfully synced entity types"
  end

  attribute :entity_stats, :map do
    default %{}
    description "Per-entity sync statistics: %{entity_type => %{records_synced, failed, duration_ms}}"
  end

  attribute :sync_mode, :atom do
    constraints one_of: [:full, :incremental]
    default :incremental
    description "Whether this was a full or incremental sync"
  end

  attribute :resumed_from, :atom do
    description "If this execution was resumed, which entity it started from"
    constraints one_of: [
      nil, :currencies, :subsidiaries, :accounting_periods, :departments,
      :locations, :classes, :gl_accounts, :expense_categories, :projects,
      :customers, :vendors, :employees
    ]
  end

  attribute :duration_ms, :integer do
    description "Total sync duration in milliseconds"
  end
end
```

### Migration Required

A migration would need to add these columns:

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| `current_entity_type` | string/enum | NULL | Yes |
| `completed_entities` | array of strings | `[]` | No |
| `entity_stats` | jsonb | `{}` | No |
| `sync_mode` | string/enum | 'incremental' | No |
| `resumed_from` | string/enum | NULL | Yes |
| `duration_ms` | bigint | NULL | Yes |

### Update Actions

The `:update` action would need to accept the new fields:

```elixir
update :update do
  accept [
    :entity_id,
    :status,
    :started_at,
    :completed_at,
    :records_synced,
    :records_failed,
    :cursor_after,
    :error_message,
    # NEW fields:
    :current_entity_type,
    :completed_entities,
    :entity_stats,
    :sync_mode,
    :resumed_from,
    :duration_ms
  ]
  primary? true
end
```

## Query Improvements with Schema

With dedicated fields, these queries become possible:

```elixir
# Find all workspace syncs
SyncExecution
|> Ash.Query.filter(entity_type == :workspace)
|> Ash.read()

# Find syncs that are partially complete
SyncExecution
|> Ash.Query.filter(
  status == :running and
  length(completed_entities) > 0
)
|> Ash.read()

# Find syncs that failed on a specific entity
SyncExecution
|> Ash.Query.filter(
  current_entity_type == :vendors and
  status == :failed
)
|> Ash.read()
```

## Action Items

1. ✅ **WorkspaceSyncReactor** - Implemented with workaround
2. ✅ **WorkspaceSyncWorker** - Implemented
3. ⏳ **Schema Enhancement** - Documented here, pending implementation
4. ⏳ **Migration** - Not created (Coder cannot create migrations)

## Notes for Implementation

When adding these fields:

1. Use Ash generators: `mix ash.codegen add_workspace_sync_fields`
2. The migration should be additive (no breaking changes)
3. Existing syncs will have NULL for new fields, which is acceptable
4. The workaround using `cursor_before`/`cursor_after` remains compatible

