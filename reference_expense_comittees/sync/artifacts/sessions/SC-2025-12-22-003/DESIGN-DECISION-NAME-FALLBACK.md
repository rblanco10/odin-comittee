# Design Decision: Name/Code Fallback for CodingValue Upserts

> **Session:** SC-2025-12-22-003
> **Date:** 2025-12-22
> **Decision:** APPROVED
> **Status:** ✅ IMPLEMENTED & VERIFIED

---

## Problem Statement

When bridging ERP mirror records to CodingValue, the upsert uses `external_id` as the identity key. However, the database also enforces uniqueness on `name` within a dimension type.

**Conflict scenario:**
```
Existing CodingValue:  external_id="DEPT-ENG", name="Engineering"
ERP record to bridge:  external_id="11", name="Engineering"
Result:                ❌ Unique constraint violation on name
```

This occurs when:
1. Two ERP records have the same name but different external identifiers
2. An ERP record was renamed but the external_id changed
3. Data was migrated between ERP systems

---

## Proposed Solution: Name Fallback

When an upsert fails due to a name conflict, fall back to matching by name and update the existing record's `external_id`.

**Flow:**
```
1. Try upsert by external_id (normal path)
2. If fails with name conflict:
   a. Query existing CodingValue by name (same workspace, dimension_type, entity_id)
   b. Update that record's external_id to the new value
   c. Return the updated record
3. Link ERP mirror record to the CodingValue
```

**Result:**
```
Before:  CodingValue external_id="DEPT-ENG", name="Engineering"
After:   CodingValue external_id="11", name="Engineering"  (updated)
```

---

## Trade-offs

| Aspect | Consideration |
|--------|---------------|
| ✅ **Resolves conflicts** | All ERP records can bridge successfully |
| ✅ **Business layer consistent** | One CodingValue per unique name |
| ✅ **"Last write wins"** | Most recent ERP sync is authoritative |
| ⚠️ **Old external_id lost** | Original external_id is overwritten |
| ⚠️ **Audit trail** | No record of previous external_id (unless logged) |

---

## Implementation Details

### Location
`lib/flame_teampay_payables/ember_bridge/services/dimension_bridge_service.ex`

### Changes to `upsert_coding_value/4`

```elixir
defp upsert_coding_value(record, category, config, type_atom) do
  # ... build params ...
  
  case try_upsert(action, params, record.workspace_id) do
    {:ok, cv} ->
      {:ok, cv}

    {:error, %Ash.Error.Unknown{} = error} ->
      # Check if this is a name conflict
      if name_conflict?(error) do
        handle_name_conflict(record, category, config, type_atom, params)
      else
        {:error, error}
      end

    {:error, error} ->
      {:error, error}
  end
end

defp name_conflict?(error) do
  error
  |> inspect()
  |> String.contains?("unique_name")
end

defp handle_name_conflict(record, category, config, type_atom, params) do
  name = Map.get(record, config.name_field) |> sanitize_name()
  
  # Query existing CodingValue by name
  existing = lookup_by_name(
    record.workspace_id,
    record.entity_id,
    category.id,
    name
  )
  
  case existing do
    nil ->
      # Shouldn't happen if we got a name conflict, but handle gracefully
      {:error, :name_conflict_but_not_found}
      
    cv ->
      # Update the existing record's external_id and ERP fields
      update_external_id(cv, record, params)
  end
end

defp lookup_by_name(workspace_id, entity_id, dimension_type_id, name) do
  query =
    CodingValue
    |> Ash.Query.filter(expr(dimension_type_id == ^dimension_type_id and name == ^name))
    |> then(fn q ->
      if entity_id do
        Ash.Query.filter(q, expr(entity_id == ^entity_id))
      else
        Ash.Query.filter(q, expr(is_nil(entity_id)))
      end
    end)

  case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
    {:ok, cv} -> cv
    {:error, _} -> nil
  end
end

defp update_external_id(existing_cv, record, params) do
  # Update the existing CodingValue with new external_id and related fields
  update_params = %{
    external_id: params.external_id,
    external_system: params.external_system,
    erp_connection_id: params.erp_connection_id,
    last_synced_at: params.last_synced_at,
    erp_mirror_type: params.erp_mirror_type,
    erp_mirror_id: params.erp_mirror_id
  }

  existing_cv
  |> Ash.Changeset.for_update(:update, update_params)
  |> Ash.update(tenant: record.workspace_id, authorize?: false)
end
```

---

## Logging

When name fallback occurs, log for visibility:

```elixir
Logger.info("[DimensionBridgeService] Name fallback: updated external_id",
  old_external_id: existing_cv.external_id,
  new_external_id: params.external_id,
  name: name,
  dimension_type_id: category.id
)
```

---

## Test Cases

1. **Normal upsert** - external_id matches existing → update
2. **New record** - external_id not found → create
3. **Name conflict** - external_id differs, name matches → update external_id
4. **Different dimension type** - same external_id, different type → both allowed

---

## Alternatives Considered

### 1. Append suffix to name
```
"Engineering" → "Engineering (2)"
```
**Rejected:** Creates confusing duplicates in UI.

### 2. Fail and report
Log error, require manual resolution.
**Rejected:** Doesn't solve the problem automatically.

### 3. Match on name first
Always match by name, ignore external_id.
**Rejected:** external_id is the canonical ERP identifier.

---

## Decision

**APPROVED:** Implement name fallback with external_id update.

The "last write wins" behavior is acceptable because:
1. The business concept (e.g., "Engineering Department") should exist once
2. ERP identifiers can change over time
3. Logging provides audit trail

---

*Documented: 2025-12-22*
*Session: SC-2025-12-22-003*

