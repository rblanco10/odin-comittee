# Multi-Entity Data Scoping: Complete Implementation Guide

> **For Implementors: All changes needed to enable multi-entity ERP connection sharing.**

---

## Overview

This guide contains ALL code changes needed to implement multi-entity data scoping in a single implementation effort. After completing this guide, synced records will be correctly associated with entities based on their ERP subsidiary/location.

---

## Pre-Implementation Checklist

- [ ] Read PROP-MULTI-ENTITY-001.md for context
- [ ] Understand EntityMapping resource (`resources/connection/entity_mapping.ex`)
- [ ] Understand EntityResolutionService (`services/entity_resolution_service.ex`)
- [ ] Have access to demo workspace with multi-subsidiary NetSuite connection

---

## Part 1: Foundation Changes

### 1.1 Add Scoping Strategy Function

**File:** `lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex`

**Add after existing module attributes:**

```elixir
@doc """
Determines scoping strategy for an entity type on a given provider.

Returns:
  - :connection_scoped - All records shared across entities
  - :entity_scoped - Records should resolve entity via subsidiary/location
  - :hybrid - Check ERP configuration per record
"""
def get_scoping_strategy(entity_type, provider) do
  case {provider, entity_type} do
    # QuickBooks has no multi-entity concept - always connection-scoped
    {:quickbooks, _} -> :connection_scoped
    
    # Entity-scoped types (have subsidiary/location on records)
    {_, type} when type in [:employees, :expense_reports, :bills, :ap_payments, :expense_line_items, :bill_line_items] ->
      :entity_scoped
    
    # Connection-scoped types (shared across entities)
    {_, type} when type in [:vendors, :customers, :gl_accounts, :departments, :locations, :classes, :currencies, :expense_categories, :projects, :accounting_periods] ->
      :connection_scoped
    
    # Subsidiaries themselves are entity-creating, not entity-scoped
    {_, :subsidiaries} -> :connection_scoped
    
    # Default to connection-scoped for safety
    _ -> :connection_scoped
  end
end
```

### 1.2 Add EntityMapping Auto-Creation to Entity Sync

**File:** `lib/flame_teampay_payables/ember_erp/services/entity_sync_handler.ex`

**Add at the end of the `sync/5` function, after successful entity upsert:**

```elixir
def sync(provider, erp_data, workspace_id, entity_id, erp_connection_id) do
  Logger.debug("Syncing entity", provider: provider, workspace_id: workspace_id)

  with {:ok, mapped_data} <- map_from_provider(provider, erp_data, workspace_id, entity_id, erp_connection_id),
       {:ok, entity} <- upsert_entity(mapped_data, workspace_id) do
    
    # NEW: Auto-create EntityMapping for this subsidiary
    :ok = ensure_entity_mapping(entity, erp_connection_id, workspace_id)
    
    {:ok, entity}
  end
end

# NEW: Create EntityMapping if it doesn't exist
defp ensure_entity_mapping(entity, erp_connection_id, workspace_id) do
  alias FlameTeampayPayables.EmberErp.Resources.Connection.EntityMapping
  
  # Check if mapping already exists
  existing = EntityMapping
    |> Ash.Query.filter(
      expr(erp_connection_id == ^erp_connection_id and erp_location_id == ^entity.external_id)
    )
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
  
  case existing do
    {:ok, nil} ->
      # Create new mapping
      EntityMapping
      |> Ash.Changeset.for_create(:create, %{
        workspace_id: workspace_id,
        erp_connection_id: erp_connection_id,
        erp_location_id: entity.external_id,
        erp_location_name: entity.name,
        entity_id: entity.id,
        is_workspace_level: false,
        active: true
      })
      |> Ash.create(tenant: workspace_id, authorize?: false)
      |> case do
        {:ok, _} -> :ok
        {:error, error} ->
          Logger.warning("Failed to create EntityMapping: #{inspect(error)}")
          :ok  # Don't fail sync for mapping issues
      end
    
    {:ok, _existing} ->
      :ok  # Mapping already exists
    
    {:error, error} ->
      Logger.warning("Failed to check EntityMapping: #{inspect(error)}")
      :ok  # Don't fail sync for mapping issues
  end
end
```

---

## Part 2: NetSuite Mapper Changes

### 2.1 Update EmployeeMapper

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/employee_mapper.ex`

**Replace `build_erp_metadata/1`:**

```elixir
defp build_erp_metadata(employee) do
  %{
    entityid: Map.get(employee, "entityid") || Map.get(employee, :entityid),
    terminated: Map.get(employee, "terminated") || Map.get(employee, :terminated),
    supervisor: Map.get(employee, "supervisor") || Map.get(employee, :supervisor),
    manager: Map.get(employee, "manager") || Map.get(employee, :manager),
    department: Map.get(employee, "department") || Map.get(employee, :department),
    location: Map.get(employee, "location") || Map.get(employee, :location),
    # NEW: Subsidiary for entity resolution
    subsidiary_id: extract_subsidiary_id(employee),
    subsidiary_name: extract_subsidiary_name(employee),
    createddate: Map.get(employee, "createddate") || Map.get(employee, :createddate),
    lastmodifieddate: Map.get(employee, "lastmodifieddate") || Map.get(employee, :lastmodifieddate),
    sync_source: "netsuite"
  }
end

# NEW: Extract subsidiary ID from employee record
defp extract_subsidiary_id(employee) do
  case Map.get(employee, "subsidiary") || Map.get(employee, :subsidiary) do
    %{"id" => id} -> to_string(id)
    %{id: id} -> to_string(id)
    id when is_binary(id) -> id
    id when is_integer(id) -> to_string(id)
    _ -> nil
  end
end

# NEW: Extract subsidiary name from employee record
defp extract_subsidiary_name(employee) do
  case Map.get(employee, "subsidiary") || Map.get(employee, :subsidiary) do
    %{"name" => name} -> name
    %{name: name} -> name
    _ -> nil
  end
end
```

### 2.2 Update VendorMapper

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/vendor_mapper.ex`

**Replace `build_erp_metadata/1`:**

```elixir
defp build_erp_metadata(vendor) do
  %{
    entityid: Map.get(vendor, "entityid") || Map.get(vendor, :entityid),
    fullname: Map.get(vendor, "fullname") || Map.get(vendor, :fullname),
    legalname: Map.get(vendor, "legalname") || Map.get(vendor, :legalname),
    type: Map.get(vendor, "type") || Map.get(vendor, :type),
    vendortype: Map.get(vendor, "vendortype") || Map.get(vendor, :vendortype),
    datecreated: Map.get(vendor, "datecreated") || Map.get(vendor, :datecreated),
    createddate: Map.get(vendor, "createddate") || Map.get(vendor, :createddate),
    lastmodifieddate: Map.get(vendor, "lastmodifieddate") || Map.get(vendor, :lastmodifieddate),
    currency: Map.get(vendor, "currency") || Map.get(vendor, :currency),
    balance: Map.get(vendor, "balance") || Map.get(vendor, :balance),
    isperson: Map.get(vendor, "isperson") || Map.get(vendor, :isperson),
    # NEW: Subsidiary for potential entity resolution (hybrid type)
    subsidiary_id: extract_subsidiary_id(vendor),
    subsidiary_name: extract_subsidiary_name(vendor),
    sync_source: "netsuite"
  }
end

# NEW: Extract subsidiary ID from vendor record
defp extract_subsidiary_id(vendor) do
  case Map.get(vendor, "subsidiary") || Map.get(vendor, :subsidiary) do
    %{"id" => id} -> to_string(id)
    %{id: id} -> to_string(id)
    id when is_binary(id) -> id
    id when is_integer(id) -> to_string(id)
    _ -> nil
  end
end

# NEW: Extract subsidiary name from vendor record
defp extract_subsidiary_name(vendor) do
  case Map.get(vendor, "subsidiary") || Map.get(vendor, :subsidiary) do
    %{"name" => name} -> name
    %{name: name} -> name
    _ -> nil
  end
end
```

### 2.3 Update ExpenseReportMapper

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/expense_report_mapper.ex`

**Find `build_erp_metadata` or equivalent and add:**

```elixir
# Add to erp_metadata or raw_data:
subsidiary_id: extract_subsidiary_id(expense_report),
subsidiary_name: extract_subsidiary_name(expense_report),

# Add helper functions (same pattern as employee):
defp extract_subsidiary_id(record) do
  case Map.get(record, "subsidiary") || Map.get(record, :subsidiary) do
    %{"id" => id} -> to_string(id)
    %{id: id} -> to_string(id)
    id when is_binary(id) -> id
    id when is_integer(id) -> to_string(id)
    _ -> nil
  end
end

defp extract_subsidiary_name(record) do
  case Map.get(record, "subsidiary") || Map.get(record, :subsidiary) do
    %{"name" => name} -> name
    %{name: name} -> name
    _ -> nil
  end
end
```

### 2.4 Update BillMapper (if exists)

Apply the same pattern to any bill mapper.

---

## Part 3: Sage Intacct Mapper Changes

### 3.1 Update SageIntacct EmployeeMapper

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/mappers/employee_mapper.ex`

**Replace `build_sync_metadata/1`:**

```elixir
defp build_sync_metadata(employee) do
  %{
    status: Map.get(employee, "STATUS") || Map.get(employee, "status"),
    title: Map.get(employee, "TITLE") || Map.get(employee, "title"),
    # NEW: Location ID for entity resolution (Intacct's equivalent of subsidiary)
    location_id: extract_location_id(employee),
    sync_source: "sage_intacct",
    employee_id: extract_external_id(employee)
  }
end

# NEW: Extract location ID from employee record
defp extract_location_id(employee) do
  Map.get(employee, "LOCATIONID") || 
  Map.get(employee, "locationid") || 
  Map.get(employee, "LOCATION") || 
  Map.get(employee, "location")
end
```

### 3.2 Update SageIntacct VendorMapper

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/mappers/vendor_mapper.ex`

**Add to `erp_metadata` or equivalent:**

```elixir
# Add location_id extraction (same pattern)
location_id: extract_location_id(vendor),

defp extract_location_id(vendor) do
  Map.get(vendor, "LOCATIONID") || 
  Map.get(vendor, "locationid") || 
  Map.get(vendor, "LOCATION") || 
  Map.get(vendor, "location")
end
```

---

## Part 4: Bulk Upsert Service Changes

### 4.1 Update EmployeeBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/employee_bulk_upsert_service.ex`

**Modify `upsert_batch/3` to resolve entity_id:**

```elixir
def upsert_batch(records, connection, opts \\ []) do
  workspace_id = connection.workspace_id
  erp_connection_id = connection.id
  provider = connection.provider
  explicit_entity_id = Keyword.get(opts, :entity_id)
  
  # Determine scoping strategy
  scoping = EntitySyncService.get_scoping_strategy(:employees, provider)
  
  mapped_records = Enum.map(records, fn record ->
    # Map the record first
    mapped = MapperRegistry.map_data(provider, :employee, record, workspace_id, nil, erp_connection_id)
    
    # Resolve entity_id based on scoping strategy
    entity_id = resolve_entity_id(mapped, scoping, explicit_entity_id, erp_connection_id, workspace_id, provider)
    
    Map.put(mapped, :entity_id, entity_id)
  end)
  
  # ... rest of bulk upsert logic
end

defp resolve_entity_id(_mapped, _scoping, explicit_entity_id, _conn_id, _ws_id, _provider) 
  when not is_nil(explicit_entity_id) do
  explicit_entity_id
end

defp resolve_entity_id(_mapped, :connection_scoped, _explicit, _conn_id, _ws_id, _provider) do
  nil
end

defp resolve_entity_id(mapped, :entity_scoped, _explicit, erp_connection_id, workspace_id, provider) do
  # Extract subsidiary/location ID from erp_metadata
  erp_location_id = case provider do
    :netsuite -> get_in(mapped, [:erp_metadata, :subsidiary_id])
    :sage_intacct -> get_in(mapped, [:erp_metadata, :location_id])
    _ -> nil
  end
  
  if erp_location_id do
    case EntityResolutionService.resolve_entity(erp_connection_id, workspace_id, erp_location_id) do
      {:ok, entity_id} -> entity_id
      {:error, :not_found} ->
        Logger.warning(
          "[EntityResolution] No mapping for location #{erp_location_id} on connection #{erp_connection_id}",
          erp_location_id: erp_location_id,
          erp_connection_id: erp_connection_id
        )
        nil
    end
  else
    nil
  end
end
```

### 4.2 Apply Same Pattern to Other Bulk Services

Apply the same `resolve_entity_id` pattern to:
- `VendorBulkUpsertService` (but it's connection-scoped, so will return nil)
- `ExpenseReportBulkUpsertService` (entity-scoped)
- `BillBulkUpsertService` (entity-scoped)
- Any other bulk services for entity-scoped types

---

## Part 5: Required Imports

### Add to BulkUpsertServices

```elixir
alias FlameTeampayPayables.EmberErp.Services.EntityResolutionService
alias FlameTeampayPayables.EmberErp.Services.EntitySyncService
```

### Add to EntitySyncHandler

```elixir
alias FlameTeampayPayables.EmberErp.Resources.Connection.EntityMapping
```

---

## Part 6: Verification Steps

### 6.1 Unit Tests to Add

**File:** `test/flame_teampay_payables/ember_erp/services/entity_resolution_service_test.exs`

```elixir
describe "resolve_entity/3" do
  test "returns entity_id when mapping exists" do
    # Setup: Create EntityMapping
    # Call: resolve_entity(conn_id, ws_id, "sub_123")
    # Assert: Returns {:ok, entity_id}
  end
  
  test "returns :not_found when no mapping" do
    # Call: resolve_entity(conn_id, ws_id, "unknown_sub")
    # Assert: Returns {:error, :not_found}
  end
end
```

**File:** `test/flame_teampay_payables/ember_erp/services/bulk/employee_bulk_upsert_service_test.exs`

```elixir
describe "entity resolution during sync" do
  test "resolves entity_id from subsidiary for NetSuite" do
    # Setup: EntityMapping for subsidiary "4"
    # Sync: Employee with subsidiary: {id: "4"}
    # Assert: Employee.entity_id == mapped entity
  end
  
  test "falls back to nil when no mapping" do
    # Sync: Employee with subsidiary: {id: "999"}
    # Assert: Employee.entity_id == nil
  end
end
```

### 6.2 Manual Verification

1. **Setup Demo Workspace:**
   - NetSuite connection with 2+ subsidiaries
   - Sync subsidiaries first (creates EntityMappings)
   - Verify EntityMappings created in database

2. **Sync Employees:**
   - Run employee sync
   - Verify employees have correct entity_id based on subsidiary

3. **Check Logs:**
   - Verify warning logged for unmapped subsidiaries
   - No errors in sync flow

---

## Quick Reference: Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `services/entity_sync_service.ex` | Add `get_scoping_strategy/2` | 🔴 High |
| `services/entity_sync_handler.ex` | Add `ensure_entity_mapping/3` | 🔴 High |
| `netsuite/mappers/employee_mapper.ex` | Add subsidiary extraction | 🔴 High |
| `netsuite/mappers/vendor_mapper.ex` | Add subsidiary extraction | 🟡 Medium |
| `netsuite/mappers/expense_report_mapper.ex` | Add subsidiary extraction | 🟡 Medium |
| `sage_intacct/mappers/employee_mapper.ex` | Add location extraction | 🟡 Medium |
| `sage_intacct/mappers/vendor_mapper.ex` | Add location extraction | 🟡 Medium |
| `bulk/employee_bulk_upsert_service.ex` | Add entity resolution | 🔴 High |
| Other bulk services | Add entity resolution | 🟡 Medium |

---

## Rollback Plan

If issues arise:

1. **Quick Rollback:** Set all `entity_id` values to nil in bulk services (revert `resolve_entity_id` to always return nil)

2. **Full Rollback:** Revert all mapper changes (remove subsidiary/location extraction)

3. **Data Fix:** Records synced during testing will have entity_id set; can be reset via:
   ```sql
   UPDATE employees SET entity_id = NULL WHERE erp_connection_id = 'xxx';
   ```

---

*Implementation Guide prepared by Sync Committee | Session SC-2025-12-21-002*

