# Sync Patterns Standard

> **Defines the required patterns for sync-related code.**

---

## Sync Handler Pattern

All sync handlers must follow this structure:

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.XxxSyncHandler do
  @moduledoc """
  Handles syncing [entity] from ERP to Teampay.
  
  ## Responsibilities
  - Map ERP data to Teampay domain model
  - Upsert to database
  - Handle errors gracefully
  """

  alias FlameTeampayPayables.EmberErp.Registries.MapperRegistry

  @doc """
  Syncs a single [entity] from ERP data.
  
  ## Parameters
  - provider: The ERP provider atom (:netsuite, :sage_intacct, etc.)
  - erp_data: Raw data from ERP API
  - workspace_id: The workspace UUID
  - entity_id: The entity UUID
  - erp_connection_id: The connection UUID
  
  ## Returns
  - {:ok, entity} on success
  - {:error, reason} on failure
  """
  def sync(provider, erp_data, workspace_id, entity_id, erp_connection_id) do
    with {:ok, mapped_data} <- map_from_provider(provider, erp_data, workspace_id, entity_id, erp_connection_id),
         {:ok, entity} <- upsert_entity(mapped_data, workspace_id) do
      {:ok, entity}
    else
      {:error, reason} = error ->
        # Log error with context
        Logger.warning("Sync failed", %{
          entity_type: :xxx,
          workspace_id: workspace_id,
          error: inspect(reason)
        })
        error
    end
  end

  # Delegate to MapperRegistry for provider abstraction
  defp map_from_provider(provider, erp_data, workspace_id, entity_id, erp_connection_id) do
    MapperRegistry.map_data(provider, :xxx, erp_data, workspace_id, entity_id, erp_connection_id)
  end

  # Upsert using Ash
  defp upsert_entity(mapped_data, workspace_id) do
    # Implementation details
  end
end
```

### Key Requirements

1. **Provider Agnostic**: Handler must not contain provider-specific logic
2. **MapperRegistry**: Always use MapperRegistry for data transformation
3. **Result Tuples**: Always return `{:ok, result}` or `{:error, reason}`
4. **No Raising**: Never raise exceptions in sync handlers
5. **Logging**: Log errors with full context

---

## Mapper Pattern

All mappers must follow this structure:

```elixir
defmodule FlameTeampayPayables.EmberErp.Mappers.[Provider].[Entity]Mapper do
  @moduledoc """
  Maps [entity] data from [Provider] format to Teampay format.
  """

  @behaviour FlameTeampayPayables.EmberErp.Mappers.Behaviour

  @impl true
  def map_from_erp(erp_data, context) do
    with {:ok, validated} <- validate_input(erp_data),
         {:ok, mapped} <- do_mapping(validated, context) do
      {:ok, mapped}
    end
  end

  defp validate_input(erp_data) do
    # Validate required fields
    # Handle nulls gracefully
  end

  defp do_mapping(data, context) do
    {:ok, %{
      external_id: data["id"],
      name: data["name"] || fallback_name(data),
      # ... other fields
    }}
  end
end
```

### Key Requirements

1. **Behaviour Compliance**: Implement the Mapper.Behaviour
2. **Validation First**: Validate input before mapping
3. **Null Handling**: Handle null values gracefully
4. **Result Tuples**: Return `{:ok, mapped}` or `{:error, reason}`
5. **Context Aware**: Use context for workspace_id, entity_id as needed

---

## Error Handling Pattern

```elixir
# ✅ Correct: Return error tuples
def process(data) do
  case validate(data) do
    {:ok, valid} -> do_work(valid)
    {:error, reason} -> {:error, {:validation_failed, reason}}
  end
end

# ❌ Wrong: Raising exceptions
def process(data) do
  valid = validate!(data)  # Don't raise!
  do_work(valid)
end
```

---

## Registration Pattern

All mappers must be registered:

```elixir
# In MapperRegistry
def register_all do
  # NetSuite
  register(:netsuite, :vendor, 
    FlameTeampayPayables.EmberErp.Mappers.Netsuite.VendorMapper)
  register(:netsuite, :bill,
    FlameTeampayPayables.EmberErp.Mappers.Netsuite.BillMapper)
  
  # Sage Intacct
  register(:sage_intacct, :vendor,
    FlameTeampayPayables.EmberErp.Mappers.SageIntacct.VendorMapper)
  # ...
end
```

---

## Checklist for New Sync Handlers

- [ ] Handler follows SyncHandler pattern
- [ ] Handler uses MapperRegistry (no direct mapper calls)
- [ ] Handler returns result tuples (no raising)
- [ ] Handler logs errors with context
- [ ] Mapper implements Behaviour
- [ ] Mapper validates input
- [ ] Mapper handles nulls
- [ ] Mapper is registered for each provider
- [ ] Tests cover happy path
- [ ] Tests cover error cases

