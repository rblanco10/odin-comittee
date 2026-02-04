# Multi-Entity Data Scoping: Gap Analysis

> **Exact locations of code that needs to change, with before/after examples.**

---

## Gap Summary

| ID | Gap | File | Line Range | Severity |
|----|-----|------|------------|----------|
| GAP-001 | Subsidiary not extracted in NetSuite EmployeeMapper | `netsuite/mappers/employee_mapper.ex` | 197-209 | 🔴 Critical |
| GAP-002 | Subsidiary not extracted in NetSuite VendorMapper | `netsuite/mappers/vendor_mapper.ex` | 255-270 | 🟡 Medium |
| GAP-003 | Location not extracted in SageIntacct EmployeeMapper | `sage_intacct/mappers/employee_mapper.ex` | 236-243 | 🟡 Medium |
| GAP-004 | EntityResolutionService never called | `bulk/*_bulk_upsert_service.ex` | Various | 🔴 Critical |
| GAP-005 | EntityMapping not auto-created | `services/entity_sync_handler.ex` | ~16-18 | 🔴 Critical |
| GAP-006 | No scoping strategy function | `services/entity_sync_service.ex` | N/A | 🔴 Critical |

---

## GAP-001: NetSuite EmployeeMapper Missing Subsidiary

### Location

```
lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/employee_mapper.ex
Lines: 197-209
```

### Current Code

```elixir
defp build_erp_metadata(employee) do
  %{
    entityid: Map.get(employee, "entityid") || Map.get(employee, :entityid),
    terminated: Map.get(employee, "terminated") || Map.get(employee, :terminated),
    supervisor: Map.get(employee, "supervisor") || Map.get(employee, :supervisor),
    manager: Map.get(employee, "manager") || Map.get(employee, :manager),
    department: Map.get(employee, "department") || Map.get(employee, :department),
    location: Map.get(employee, "location") || Map.get(employee, :location),
    createddate: Map.get(employee, "createddate") || Map.get(employee, :createddate),
    lastmodifieddate: Map.get(employee, "lastmodifieddate") || Map.get(employee, :lastmodifieddate),
    sync_source: "netsuite"
  }
end
```

### Required Code

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

defp extract_subsidiary_id(employee) do
  case Map.get(employee, "subsidiary") || Map.get(employee, :subsidiary) do
    %{"id" => id} -> to_string(id)
    %{id: id} -> to_string(id)
    id when is_binary(id) -> id
    id when is_integer(id) -> to_string(id)
    _ -> nil
  end
end

defp extract_subsidiary_name(employee) do
  case Map.get(employee, "subsidiary") || Map.get(employee, :subsidiary) do
    %{"name" => name} -> name
    %{name: name} -> name
    _ -> nil
  end
end
```

---

## GAP-002: NetSuite VendorMapper Missing Subsidiary

### Location

```
lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/mappers/vendor_mapper.ex
Lines: 255-270
```

### Current Code

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
    sync_source: "netsuite"
  }
end
```

### Required Code

Add `subsidiary_id` and `subsidiary_name` fields plus helper functions (same pattern as GAP-001).

---

## GAP-003: SageIntacct EmployeeMapper Missing Location

### Location

```
lib/flame_teampay_payables/ember_erp/adapters/providers/sage_intacct/mappers/employee_mapper.ex
Lines: 236-243
```

### Current Code

```elixir
defp build_sync_metadata(employee) do
  %{
    status: Map.get(employee, "STATUS") || Map.get(employee, "status"),
    title: Map.get(employee, "TITLE") || Map.get(employee, "title"),
    sync_source: "sage_intacct",
    employee_id: extract_external_id(employee)
  }
end
```

### Required Code

```elixir
defp build_sync_metadata(employee) do
  %{
    status: Map.get(employee, "STATUS") || Map.get(employee, "status"),
    title: Map.get(employee, "TITLE") || Map.get(employee, "title"),
    # NEW: Location ID for entity resolution
    location_id: extract_location_id(employee),
    sync_source: "sage_intacct",
    employee_id: extract_external_id(employee)
  }
end

defp extract_location_id(employee) do
  Map.get(employee, "LOCATIONID") || 
  Map.get(employee, "locationid") || 
  Map.get(employee, "LOCATION") || 
  Map.get(employee, "location")
end
```

---

## GAP-004: EntityResolutionService Never Called

### Location

All bulk upsert services in:
```
lib/flame_teampay_payables/ember_erp/services/bulk/
  - employee_bulk_upsert_service.ex
  - vendor_bulk_upsert_service.ex
  - expense_report_bulk_upsert_service.ex
  - (and others)
```

### Current Pattern

```elixir
def upsert_batch(records, connection, opts \\ []) do
  entity_id = Keyword.get(opts, :entity_id)  # Always passed in or nil
  
  # ... mapping and upserting with entity_id as-is
end
```

### Required Pattern

```elixir
def upsert_batch(records, connection, opts \\ []) do
  workspace_id = connection.workspace_id
  erp_connection_id = connection.id
  provider = connection.provider
  explicit_entity_id = Keyword.get(opts, :entity_id)
  
  # NEW: Determine scoping strategy
  scoping = EntitySyncService.get_scoping_strategy(:employees, provider)
  
  mapped_records = Enum.map(records, fn record ->
    mapped = MapperRegistry.map_data(provider, :employee, record, workspace_id, nil, erp_connection_id)
    
    # NEW: Resolve entity_id based on scoping
    entity_id = resolve_entity_id(mapped, scoping, explicit_entity_id, erp_connection_id, workspace_id, provider)
    
    Map.put(mapped, :entity_id, entity_id)
  end)
  
  # ... rest of upsert logic
end

# NEW FUNCTION
defp resolve_entity_id(_mapped, _scoping, explicit, _conn, _ws, _prov) when not is_nil(explicit), do: explicit
defp resolve_entity_id(_mapped, :connection_scoped, _explicit, _conn, _ws, _prov), do: nil
defp resolve_entity_id(mapped, :entity_scoped, _explicit, conn_id, ws_id, provider) do
  erp_location_id = case provider do
    :netsuite -> get_in(mapped, [:erp_metadata, :subsidiary_id])
    :sage_intacct -> get_in(mapped, [:erp_metadata, :location_id])
    _ -> nil
  end
  
  if erp_location_id do
    case EntityResolutionService.resolve_entity(conn_id, ws_id, erp_location_id) do
      {:ok, entity_id} -> entity_id
      {:error, :not_found} ->
        Logger.warning("[EntityResolution] No mapping for #{erp_location_id}")
        nil
    end
  else
    nil
  end
end
```

---

## GAP-005: EntityMapping Not Auto-Created

### Location

```
lib/flame_teampay_payables/ember_erp/services/entity_sync_handler.ex
Lines: 12-18 (after entity upsert)
```

### Current Code

```elixir
def sync(provider, erp_data, workspace_id, entity_id, erp_connection_id) do
  with {:ok, mapped_data} <- map_from_provider(...),
       {:ok, entity} <- upsert_entity(mapped_data, workspace_id) do
    {:ok, entity}  # No EntityMapping created!
  end
end
```

### Required Code

See IMPLEMENTATION-GUIDE.md Part 1.2 for full implementation.

---

## GAP-006: No Scoping Strategy Function

### Location

```
lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex
(New function needed)
```

### Required Code

See IMPLEMENTATION-GUIDE.md Part 1.1 for full implementation.

---

## Gap Dependency Order

Implementation should follow this order:

```
1. GAP-006 (get_scoping_strategy) ─────┐
                                       ├──► 4. GAP-004 (bulk services)
2. GAP-001, GAP-002, GAP-003 (mappers) ┘
                                       
3. GAP-005 (entity mapping creation) ──► Independent, can be done in parallel
```

---

## Verification Checklist

After all gaps are closed:

- [ ] `get_scoping_strategy/2` returns correct values for all entity types
- [ ] NetSuite employee records have `subsidiary_id` in `erp_metadata`
- [ ] NetSuite vendor records have `subsidiary_id` in `erp_metadata`
- [ ] Sage Intacct employee records have `location_id` in `erp_metadata`
- [ ] EntityMappings auto-created when subsidiaries sync
- [ ] Employee sync resolves `entity_id` from subsidiary
- [ ] Vendor sync keeps `entity_id` as nil (connection-scoped)
- [ ] Missing mappings log warning and fallback to nil
- [ ] All existing tests still pass

---

*Gap Analysis prepared by Sync Committee | Session SC-2025-12-21-002*

