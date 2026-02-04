# PROP-MULTI-ENTITY-001: Data Scoping Architecture

> **Proposal for multi-entity ERP connection sharing and data scoping.**

---

## Metadata

| Field | Value |
|-------|-------|
| **Proposal ID** | PROP-MULTI-ENTITY-001 |
| **Author** | Architecture Lead |
| **Session** | SC-2025-12-21-002 |
| **Status** | DRAFT |
| **Created** | 2025-12-21 |

---

## 1. Executive Summary

This proposal addresses how multiple entities can share a single ERP connection while maintaining proper data scoping. It defines which data is **connection-scoped** (shared across entities) versus **entity-scoped** (specific to a subsidiary), and provides implementation guidance for closing existing gaps.

---

## 2. Problem Statement

### Current State

1. **ERP connections are configured** with one connection potentially serving multiple entities
2. **EntityMapping exists** to map ERP subsidiaries to internal entities
3. **EntityResolutionService exists** to resolve erp_location_id → entity_id
4. **BUT: These are never used** — subsidiary field is ignored during sync

### Critical Gaps Identified

| Gap | Description | Impact |
|-----|-------------|--------|
| G1 | `subsidiary` field not captured in mappers | Cannot determine record ownership |
| G2 | `EntityResolutionService` never called | Entity association impossible |
| G3 | All records get `entity_id = nil` | No entity-level data isolation |
| G4 | No data scoping classification | Unclear which records need entity_id |

---

## 3. Data Scoping Classification

### 3.1 Connection-Scoped Data

> **Data that belongs to the ERP connection as a whole, not to any specific entity/subsidiary.**

These records should have `entity_id = nil` and be accessible by all entities on the connection.

| Entity Type | Rationale |
|-------------|-----------|
| `vendors` | Vendors are shared across subsidiaries in most ERPs |
| `customers` | Customers typically shared (unless OneWorld with customer-subsidiary restriction) |
| `gl_accounts` | Chart of accounts usually shared (though some ERPs support subsidiary-specific accounts) |
| `departments` | Often shared organizational structure |
| `locations` | Physical locations typically shared |
| `classes` | Classification dimension usually shared |
| `currencies` | Global currency list |
| `projects` | Typically shared (though can be subsidiary-specific) |
| `expense_categories` | Usually shared expense types |

### 3.2 Entity-Scoped Data

> **Data that belongs to a specific entity/subsidiary. Must be associated via EntityMapping.**

These records have a `subsidiary` field in the ERP and should resolve to our `entity_id`.

| Entity Type | Subsidiary Field | Resolution Logic |
|-------------|------------------|------------------|
| `employees` | `subsidiary` | Resolve via EntityResolutionService |
| `expense_reports` | `subsidiary` | Inherit from employee or header |
| `bills` | `subsidiary` | Transaction subsidiary |
| `ap_payments` | `subsidiary` | Transaction subsidiary |
| `bank_accounts` | May have subsidiary | Account-level if present |
| `accounting_periods` | May be subsidiary-specific | Check ERP configuration |

### 3.3 Hybrid Data

> **Data that can be either connection-scoped OR entity-scoped depending on ERP configuration.**

| Entity Type | When Connection-Scoped | When Entity-Scoped |
|-------------|------------------------|-------------------|
| `vendors` | Standard config | OneWorld with vendor-subsidiary restriction |
| `gl_accounts` | Standard config | Subsidiary-specific accounts enabled |
| `projects` | Shared projects | Project-subsidiary assignment |

---

## 4. Proposed Architecture

### 4.1 Mapper Enhancement Pattern

Every mapper should:

1. **Extract subsidiary field** from raw ERP data
2. **Store it in `erp_metadata`** for all records
3. **Optionally resolve entity_id** based on data scoping classification

```elixir
# Pattern for mappers

def map_to_attrs(netsuite_data, workspace_id, entity_id, erp_connection_id, opts \\ []) do
  record = extract_record(netsuite_data)
  
  # Extract subsidiary ID from record (NetSuite pattern)
  subsidiary_id = extract_subsidiary_id(record)
  
  %{
    workspace_id: workspace_id,
    erp_connection_id: erp_connection_id,
    # entity_id: resolved below or passed in
    entity_id: resolve_entity_id(entity_id, subsidiary_id, erp_connection_id, workspace_id, opts),
    # ... other fields ...
    erp_metadata: build_erp_metadata(record)  # NOW includes subsidiary!
  }
end

defp extract_subsidiary_id(record) do
  case Map.get(record, "subsidiary") || Map.get(record, :subsidiary) do
    %{"id" => id} -> id
    %{id: id} -> id
    id when is_binary(id) -> id
    id when is_integer(id) -> to_string(id)
    _ -> nil
  end
end

defp resolve_entity_id(explicit_entity_id, _subsidiary_id, _conn_id, _ws_id, _opts) 
  when not is_nil(explicit_entity_id) do
  # If explicitly provided, use it
  explicit_entity_id
end

defp resolve_entity_id(nil, nil, _conn_id, _ws_id, _opts) do
  # No subsidiary = connection-scoped
  nil
end

defp resolve_entity_id(nil, subsidiary_id, erp_connection_id, workspace_id, opts) do
  # Has subsidiary, resolve to entity
  if Keyword.get(opts, :resolve_entity, false) do
    case EntityResolutionService.resolve_entity(erp_connection_id, workspace_id, subsidiary_id) do
      {:ok, entity_id} -> entity_id
      {:error, :not_found} -> nil  # No mapping = treat as connection-scoped
    end
  else
    nil  # Don't resolve, keep as connection-scoped
  end
end

defp build_erp_metadata(record) do
  %{
    # ... existing fields ...
    subsidiary_id: extract_subsidiary_id(record),  # NEW!
    subsidiary_name: extract_subsidiary_name(record),  # NEW!
    sync_source: "netsuite"
  }
end
```

### 4.2 Sync Flow Decision Points

```
┌────────────────────────────────────────────────────────────┐
│                     SYNC INITIATED                          │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  Is this entity type CONNECTION-SCOPED?                    │
│  (vendors, gl_accounts, customers, etc.)                   │
└─────────────────────────┬──────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │ YES                           │ NO
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────────┐
│ Sync all records    │       │ Is this entity type         │
│ entity_id = nil     │       │ ENTITY-SCOPED?              │
│ (connection-scoped) │       │ (employees, expense_reports)│
└─────────────────────┘       └─────────────┬───────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │ YES                       │ HYBRID
                              ▼                           ▼
                  ┌─────────────────────┐   ┌─────────────────────────┐
                  │ Extract subsidiary  │   │ Check ERP configuration │
                  │ from each record    │   │ to determine scoping    │
                  │ Resolve via         │   │ per record              │
                  │ EntityResolution    │   └─────────────────────────┘
                  │ Service             │
                  └─────────────────────┘
```

### 4.3 EntitySyncService Enhancement

```elixir
# In EntitySyncService

def sync_entity(connection, entity_type, opts \\ []) do
  # Determine scoping strategy for this entity type
  scoping = get_scoping_strategy(entity_type)
  
  case scoping do
    :connection_scoped ->
      # All records belong to connection, entity_id = nil
      sync_pages(connection, entity_type, cursor, page_size, nil, stats)
      
    :entity_scoped ->
      # Each record needs entity resolution
      sync_pages_with_resolution(connection, entity_type, cursor, page_size, stats)
      
    :hybrid ->
      # Check each record's subsidiary field
      sync_pages_with_conditional_resolution(connection, entity_type, cursor, page_size, stats)
  end
end

defp get_scoping_strategy(entity_type) do
  case entity_type do
    type when type in [:vendors, :customers, :gl_accounts, :departments, 
                       :locations, :classes, :currencies, :expense_categories] ->
      :connection_scoped
      
    type when type in [:employees, :expense_reports, :bills, :ap_payments] ->
      :entity_scoped
      
    _ ->
      :hybrid
  end
end
```

---

## 5. Implementation Plan

### Phase 0: Foundation (Required First)

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 0.1 | Add `create_entity_mapping/4` to EntitySyncHandler | 1h | TBD |
| 0.2 | Wire EntityMapping creation after subsidiary sync | 1h | TBD |
| 0.3 | Create `get_scoping_strategy/2` function with provider awareness | 1h | TBD |
| 0.4 | Add fallback logging for missing mappings | 30m | TBD |

### Phase 1: NetSuite Employee Scoping (Pilot)

> **Start with employees only to validate the pattern before expanding.**

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 1.1 | Add `subsidiary_id/name` extraction to NetSuite EmployeeMapper | 1h | TBD |
| 1.2 | Add `subsidiary` to `erp_metadata` in EmployeeMapper | 30m | TBD |
| 1.3 | Wire EntityResolutionService.resolve_entity in employee sync | 1h | TBD |
| 1.4 | Add unit tests for entity resolution | 1h | TBD |
| 1.5 | Validate in demo workspace (multi-subsidiary scenario) | 2h | TBD |

**Milestone 1:** Employee records correctly associated with entities based on subsidiary.

### Phase 2: Sage Intacct Location Scoping

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 2.1 | Add `LOCATIONID` extraction to SageIntacct EmployeeMapper | 1h | TBD |
| 2.2 | Add `location_id` to `erp_metadata` | 30m | TBD |
| 2.3 | Map Intacct LOCATIONID → erp_location_id | 30m | TBD |
| 2.4 | Test with Intacct multi-location workspace | 2h | TBD |

**Milestone 2:** Same pattern verified for Sage Intacct.

### Phase 3: Remaining Entity-Scoped Types

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 3.1 | Apply pattern to ExpenseReportMapper (NetSuite + Intacct) | 2h | TBD |
| 3.2 | Apply pattern to BillMapper (NetSuite + Intacct) | 2h | TBD |
| 3.3 | Apply pattern to ApPaymentMapper (NetSuite + Intacct) | 2h | TBD |
| 3.4 | Integration tests for all entity-scoped types | 2h | TBD |

**Milestone 3:** All transaction types correctly entity-scoped.

### Phase 4: Hybrid Types & Configuration

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 4.1 | Add `vendor_subsidiary_restricted?/1` config check | 2h | TBD |
| 4.2 | Implement hybrid scoping for vendors | 2h | TBD |
| 4.3 | Document configuration requirements | 1h | TBD |

**Milestone 4:** Hybrid types correctly scoped based on ERP configuration.

### Phase 5: Production Rollout

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 5.1 | Deploy Phase 1 (employees) to production | 1h | TBD |
| 5.2 | Monitor for 1 week, collect metrics | — | TBD |
| 5.3 | Deploy remaining phases | 1h each | TBD |
| 5.4 | Update `sync_patterns.md` documentation | 1h | TBD |

---

### Total Effort Estimate

| Phase | Effort |
|-------|--------|
| Phase 0 | 3.5h |
| Phase 1 | 5.5h |
| Phase 2 | 4h |
| Phase 3 | 8h |
| Phase 4 | 5h |
| Phase 5 | 3h |
| **Total** | **~29 hours** |

---

## 6. Migration Considerations

### Existing Data

Records already synced without entity_id can be:
1. **Left as-is** — They'll be correctly scoped on next sync
2. **Backfilled** — Re-run sync with resolution enabled
3. **Manually updated** — For specific records needing correction

### Backwards Compatibility

- All changes are additive (new fields in erp_metadata)
- entity_id remains nullable (no schema changes required)
- Existing queries continue to work

---

## 7. Skeptic Concerns & Resolutions

> **The following concerns were raised by the Skeptic and have been addressed:**

### 7.1 EntityMapping Origin (Who Creates Them?)

**Concern:** The proposal assumes EntityMappings exist but doesn't explain their origin.

**Resolution:** EntityMappings are created through two flows:

```
FLOW 1: Automatic from Subsidiary Sync
────────────────────────────────────────
Subsidiaries synced from ERP
         │
         ▼
EntitySyncHandler creates Entity records
         │
         ▼
Post-sync hook creates EntityMapping:
  - erp_location_id = subsidiary.id
  - entity_id = newly created Entity.id
  - is_workspace_level = false

FLOW 2: Manual During Onboarding
────────────────────────────────────────
Admin configures connection
         │
         ▼
UI shows list of ERP subsidiaries
         │
         ▼
Admin maps each subsidiary to an Entity
         │
         ▼
EntityMapping created per selection
```

**Implementation:** Add `create_entity_mapping/4` call to `EntitySyncHandler` after entity upsert.

### 7.2 Missing Mapping Behavior

**Concern:** What happens when a record has a subsidiary that isn't mapped?

**Resolution:** Explicit fallback with warning logging:

```elixir
defp resolve_entity_id(nil, subsidiary_id, erp_connection_id, workspace_id, _opts) do
  case EntityResolutionService.resolve_entity(erp_connection_id, workspace_id, subsidiary_id) do
    {:ok, entity_id} -> 
      entity_id
      
    {:error, :not_found} ->
      # EXPLICIT FALLBACK: Log warning, treat as connection-scoped
      Logger.warning(
        "[EntityResolution] No mapping for subsidiary #{subsidiary_id} " <>
        "on connection #{erp_connection_id}. Treating as connection-scoped.",
        subsidiary_id: subsidiary_id,
        erp_connection_id: erp_connection_id,
        workspace_id: workspace_id
      )
      nil  # Connection-scoped fallback
  end
end
```

**Rationale:** This is safer than failing the sync. Unmapped records are visible at workspace level, and admins can fix mappings later.

### 7.3 Hybrid Type Configuration Detection

**Concern:** Vendors can be shared OR subsidiary-restricted depending on ERP config.

**Resolution:** Add configuration awareness:

```elixir
defp get_scoping_strategy(entity_type, connection) do
  case entity_type do
    :vendors ->
      # Check ERP configuration for vendor-subsidiary restriction
      if vendor_subsidiary_restricted?(connection) do
        :entity_scoped
      else
        :connection_scoped
      end
      
    # ... other types
  end
end

defp vendor_subsidiary_restricted?(connection) do
  # NetSuite: Check company preferences for "Vendor Per Subsidiary"
  # Sage Intacct: Check dimension configuration
  # QuickBooks: Always connection-scoped (no subsidiary concept)
  case connection.provider do
    :netsuite ->
      get_in(connection.settings, ["preferences", "vendorPerSubsidiary"]) == true
    :sage_intacct ->
      get_in(connection.settings, ["dimensions", "vendorLocationRestricted"]) == true
    _ ->
      false
  end
end
```

### 7.4 Incremental Rollout Strategy

**Concern:** Changing all mappers at once risks bugs in stable sync flow.

**Resolution:** Phased rollout by entity type:

| Phase | Entity Types | Risk | Validation |
|-------|--------------|------|------------|
| **Phase 1** | `employees` only | Low | Employees are clearly entity-scoped |
| **Phase 2** | `expense_reports`, `bills` | Medium | Transaction types |
| **Phase 3** | Hybrid types (`vendors`, etc.) | High | Requires config detection |

Each phase includes:
- [ ] Implementation
- [ ] Unit tests
- [ ] Demo workspace validation
- [ ] 1 week production soak
- [ ] Next phase approval

### 7.5 Records Synced Before Mapping

**Concern:** What about records synced before EntityMapping is configured?

**Resolution:** 

1. **Existing records stay as-is** (entity_id = nil, connection-scoped)
2. **Next incremental sync** will resolve entity_id if mapping now exists
3. **Optional backfill** via admin action: "Re-resolve entity associations"

```elixir
# Admin action to backfill entity associations
def backfill_entity_associations(entity_type, erp_connection_id, workspace_id) do
  # Stream all records of this type for this connection
  # For each with subsidiary_id in erp_metadata but entity_id = nil
  # Attempt resolution, update if successful
end
```

---

## 8. Cross-Provider Analysis

> **Investigated by Multi-ERP Generalist to verify pattern consistency.**

### 8.1 NetSuite OneWorld

| Aspect | Value |
|--------|-------|
| **Location Concept** | `subsidiary` (dedicated table) |
| **Field on Records** | `subsidiary: {id: "4", name: "..."}` |
| **Session Scoping** | Per-subsidiary via SuiteQL filter |
| **Our Abstraction** | `subsidiary.id` → `erp_location_id` |
| **Pattern Applies?** | ✅ Yes — full entity scoping support |

### 8.2 Sage Intacct

| Aspect | Value |
|--------|-------|
| **Location Concept** | `LOCATION` (dimension) |
| **Field on Records** | `LOCATIONID: "LOC001"` on employees, transactions |
| **Session Scoping** | Location-scoped sessions via `entity_id` in config |
| **Our Abstraction** | `LOCATIONID` → `erp_location_id` |
| **Pattern Applies?** | ✅ Yes — `LOCATIONID` is the subsidiary equivalent |

**Sage Intacct Implementation:**
```elixir
# In SageIntacct EmployeeMapper
defp extract_location_id(employee) do
  # LOCATIONID is the Intacct equivalent of subsidiary
  Map.get(employee, "LOCATIONID") || Map.get(employee, "locationid")
end

# This should be added to erp_metadata and used for entity resolution
```

### 8.3 QuickBooks Online

| Aspect | Value |
|--------|-------|
| **Location Concept** | None (no multi-subsidiary) |
| **Field on Records** | N/A |
| **Session Scoping** | N/A — single company |
| **Our Abstraction** | Not needed |
| **Pattern Applies?** | ⚠️ N/A — QBO is always connection-scoped |

**QuickBooks Implication:** For QBO connections, ALL data is connection-scoped by design. No EntityMapping or resolution needed. The `get_scoping_strategy/2` should short-circuit for QBO:

```elixir
defp get_scoping_strategy(_entity_type, %{provider: :quickbooks}) do
  :connection_scoped  # QBO has no multi-entity concept
end
```

### 8.4 Summary: Provider Capabilities

| Provider | Multi-Entity | Field Name | Resolution Needed |
|----------|--------------|------------|-------------------|
| NetSuite | ✅ Yes | `subsidiary` | Yes |
| Sage Intacct | ✅ Yes | `LOCATIONID` | Yes |
| QuickBooks | ❌ No | N/A | No (all connection-scoped) |
| Acumatica | ⚠️ TBD | `Branch`? | Needs investigation |
| Xero | ⚠️ TBD | N/A? | Needs investigation |

---

## 9. Open Questions (Remaining)

| # | Question | Status | Recommendation |
|---|----------|--------|----------------|
| Q1 | Should we filter ERP queries by subsidiary? | ✅ Resolved | No — pull all, resolve locally |
| Q2 | Verify pattern for Sage Intacct | ✅ Resolved | Uses `LOCATIONID` — same pattern applies |
| Q3 | Verify pattern for QuickBooks | ✅ Resolved | N/A — no multi-entity in QBO |
| Q4 | Acumatica Branch/Company scoping | ⏳ | Needs future investigation |

---

## 8. Success Criteria

This proposal is successful when:

- [ ] All mappers extract and store subsidiary field
- [ ] EntityResolutionService is called for entity-scoped types
- [ ] Employee/ExpenseReport records have correct entity_id
- [ ] Connection-scoped records (vendors, etc.) work unchanged
- [ ] Pattern documented for future entity types
- [ ] Works across all supported ERP providers

---

## 9. References

- `EntityMapping` resource: `resources/connection/entity_mapping.ex`
- `EntityResolutionService`: `services/entity_resolution_service.ex`
- `ErpConnection.scope_type`: `resources/connection/erp_connection.ex`
- NetSuite subsidiary docs: See `knowledge/erp_quirks/netsuite.md`

---

## Appendix A: NetSuite Subsidiary Field Patterns

### On Employee Records
```json
{
  "id": "123",
  "entityid": "EMP001",
  "subsidiary": {"id": "4", "name": "Acme East"}
}
```

### On Vendor Records (When Restricted)
```json
{
  "id": "456",
  "companyname": "Supplier Inc",
  "subsidiary": null  // null = shared across all subsidiaries
}
```

### On Transaction Records (Bills, etc.)
```json
{
  "id": "789",
  "subsidiary": "4",  // Sometimes just the ID
  "trandate": "2024-01-15"
}
```

---

*Prepared by Architecture Lead | Sync Committee Session SC-2025-12-21-002*

