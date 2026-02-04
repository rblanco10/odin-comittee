# Implementation Plan: PROP-SCALE-001

> **Proposal:** Streaming Sync with Bulk Upsert  
> **Plan ID:** IMPL-SCALE-001  
> **Date:** 2024-12-21  
> **Authored By:** Implementation Consultant, Sync Architect  
> **Documented By:** Scribe  
> **Status:** Ready for Implementation

---

## Overview

This plan details the implementation sequence for PROP-SCALE-001 (Streaming Sync with Bulk Upsert). The approach is **bottom-up, test-as-you-go**, building one complete vertical slice (Vendors) before expanding to other entity types.

---

## Current State

### What Exists
| Component | Status | Location |
|-----------|--------|----------|
| 25+ sync capabilities (NetSuite) | ✅ Exists | `.../adapters/providers/netsuite/capabilities/sync/` |
| 17 sync handlers | ✅ Exists | `.../ember_erp/services/*_sync_handler.ex` |
| `CapabilityRouter.sync/4` | ✅ Exists | `.../adapters/capability_router.ex` |
| `MapperRegistry` | ✅ Exists | `.../registries/mapper_registry.ex` |
| Ash resources with identities | ✅ Exists | `.../resources/accounting/` |
| `AuthService` | ✅ Exists | `.../ember_integrations/` |

### What Needs Building
| Component | Status | Priority |
|-----------|--------|----------|
| `fetch_page/3` in capabilities | ❌ Needed | Phase 1 |
| `CapabilityRouter.fetch_page/4` | ❌ Needed | Phase 1 |
| `*BulkUpsertService` modules (10) | ❌ Needed | Phase 2 |
| `EntitySyncService` | ❌ Needed | Phase 3 |
| `WorkspaceSyncReactor` | ❌ Needed | Phase 6 |

---

## Dependency Graph

```
                    ┌─────────────────────────┐
                    │  WorkspaceSyncReactor   │
                    │       (Phase 6)         │
                    └───────────┬─────────────┘
                                │ calls
                    ┌───────────▼─────────────┐
                    │   EntitySyncService     │
                    │       (Phase 3)         │
                    └───────────┬─────────────┘
                                │ calls
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
    │CapabilityRouter │ │ *BulkUpsert-  │ │ AuthService   │
    │  .fetch_page/4  │ │   Services    │ │  (existing)   │
    │    (Phase 1)    │ │  (Phase 2)    │ │               │
    └─────────┬───────┘ └───────┬───────┘ └───────────────┘
              │                 │
    ┌─────────▼───────┐ ┌───────▼───────┐
    │ *.fetch_page/3  │ │Ash.bulk_create│
    │   (Phase 1)     │ │  (existing)   │
    └─────────────────┘ └───────────────┘
```

**Build order follows arrows upward** — lower layers must exist before higher layers.

---

## Implementation Phases

### Phase 1: Capability Layer (Vendors Only)

**Goal:** Prove the paginated fetch pattern with one entity type.

#### Task 1.1: Add `fetch_page/3` to Vendors Capability

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/sync/parties/vendors.ex`

**Action:** Add new function alongside existing `fetch/2`

**Implementation:**
```elixir
@doc """
Fetch a single page of vendor records.

Returns {:ok, %{records: list, next_cursor: map | nil, has_more: boolean}}
"""
@impl true
def fetch_page(config, cursor, opts \\ []) do
  page_size = Keyword.get(opts, :page_size, 1000)
  offset = Map.get(cursor || %{}, :offset, 0)
  last_modified = Map.get(cursor || %{}, :last_modified_after)
  
  query = build_suiteql_query(last_modified, page_size, offset)
  
  case Adapter.query_suiteql(config, query, limit: page_size, offset: offset) do
    {:ok, %{records: records, has_more: has_more}} ->
      next_cursor = if has_more do
        %{offset: offset + page_size, last_modified_after: last_modified}
      end
      
      {:ok, %{
        records: records,
        next_cursor: next_cursor,
        has_more: has_more
      }}
      
    {:error, reason} ->
      {:error, reason}
  end
end
```

**Validation:** Test that single page is returned with correct cursor.

---

#### Task 1.2: Add `fetch_page/4` to CapabilityRouter

**File:** `lib/flame_teampay_payables/ember_erp/adapters/capability_router.ex`

**Action:** Add new function mirroring `sync/4` pattern

**Implementation:**
```elixir
@doc """
Fetch a single page of records for an entity type.

Used by EntitySyncService for paginated sync.

## Examples

    CapabilityRouter.fetch_page(
      connection,
      :vendors,
      %{offset: 0},
      page_size: 1000
    )
"""
def fetch_page(connection, entity_type, cursor, opts \\ []) do
  provider = connection.provider
  config = build_config(connection)
  
  with {:ok, adapter} <- AdapterRegistry.get_adapter(provider),
       true <- adapter.supports_capability?(:sync, entity_type) do
    # Call the capability's fetch_page function
    capability_module = get_sync_capability_module(adapter, entity_type)
    
    if function_exported?(capability_module, :fetch_page, 3) do
      capability_module.fetch_page(config, cursor, opts)
    else
      {:error, {:fetch_page_not_implemented, entity_type}}
    end
  else
    {:error, :unknown_provider} ->
      {:error, "Unknown ERP provider: #{provider}"}
    false ->
      {:error, "Provider #{provider} does not support syncing #{entity_type}"}
  end
end

# Helper to get capability module for entity type
defp get_sync_capability_module(adapter, entity_type) do
  # Map entity type to capability module
  # This may need to be implemented based on adapter structure
  apply(adapter, :get_sync_capability, [entity_type])
end
```

**Note:** May need to add `get_sync_capability/1` to adapter or use existing routing logic.

**Validation:** Test that router correctly delegates to capability.

---

### Phase 2: Bulk Upsert Layer (Vendors Only)

**Goal:** Prove the bulk upsert pattern with one entity type.

#### Task 2.1: Create Bulk Services Directory

**Action:** Create directory structure

```
lib/flame_teampay_payables/ember_erp/services/bulk/
```

---

#### Task 2.2: Create VendorBulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk/vendor_bulk_upsert_service.ex`

**Implementation:**
```elixir
defmodule FlameTeampayPayables.EmberErp.Services.Bulk.VendorBulkUpsertService do
  @moduledoc """
  Bulk upsert service for vendors.
  
  Uses Ash.bulk_create with upsert strategy, matching existing codebase patterns
  in InitialSyncService, EmployeeCsvImportService, etc.
  """
  
  require Logger
  
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.Parties.Vendor
  alias FlameTeampayPayables.EmberErp.Registries.MapperRegistry
  
  @doc """
  Upsert a batch of vendor records.
  
  ## Parameters
  - records: List of raw ERP vendor records
  - connection: ERPConnection struct with workspace_id, provider, etc.
  
  ## Returns
  - {:ok, %{succeeded: n, failed: m}}
  """
  def upsert_batch(records, connection) do
    workspace_id = connection.workspace_id
    provider = connection.provider
    
    # 1. Map all records to Vendor attrs
    mapped_records = 
      records
      |> Enum.map(&map_record(&1, provider, connection))
      |> Enum.filter(&match?({:ok, _}, &1))
      |> Enum.map(fn {:ok, attrs} -> Map.put(attrs, :workspace_id, workspace_id) end)
    
    # 2. Bulk upsert using Ash.bulk_create (matches InitialSyncService pattern)
    case Ash.bulk_create(
           mapped_records,
           Vendor,
           :create_from_erp,
           tenant: workspace_id,
           authorize?: false,
           upsert?: true,
           upsert_identity: :unique_erp_vendor,
           upsert_fields: [
             :vendor_name, :email, :status, :phone, :address,
             :erp_metadata, :custom_fields, :last_synced_at, :sync_version
           ],
           return_records?: false,
           return_errors?: true,
           stop_on_error?: false
         ) do
      %Ash.BulkResult{errors: errors} ->
        succeeded = length(mapped_records) - length(errors)
        
        if length(errors) > 0 do
          Logger.warning(
            "VendorBulkUpsert: #{length(errors)} failed: #{inspect(Enum.take(errors, 3))}"
          )
        end
        
        {:ok, %{succeeded: succeeded, failed: length(errors)}}
    end
  end
  
  defp map_record(record, provider, connection) do
    MapperRegistry.map_data(
      provider, 
      :vendor, 
      record, 
      connection.workspace_id, 
      connection.entity_id, 
      connection.id
    )
  end
end
```

**Validation:** Test with mock data that bulk upsert works correctly.

---

### Phase 3: Orchestrator Layer

**Goal:** Create the service that ties fetch and upsert together.

#### Task 3.1: Create EntitySyncService

**File:** `lib/flame_teampay_payables/ember_erp/services/entity_sync_service.ex`

**Implementation:** (Full code in design proposal, key structure below)

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.EntitySyncService do
  @moduledoc """
  Orchestrates paginated fetch + bulk upsert for a single entity type.
  
  Memory-safe: Only one page (1000 records) in memory at a time.
  Resilient: Retry with exponential backoff on transient failures.
  """
  
  require Logger
  
  alias FlameTeampayPayables.EmberErp.Adapters.CapabilityRouter
  alias FlameTeampayPayables.EmberErp.Services.AuthService
  alias FlameTeampayPayables.EmberErp.Services.Bulk
  
  @default_page_size 1000
  @max_retries 3
  
  @doc """
  Sync all records for an entity type, handling pagination internally.
  """
  def sync_entity(connection, entity_type, opts \\ [])
  
  # Core functions:
  # - sync_pages/5 - recursive pagination loop
  # - fetch_page_with_retry/5 - fetch with exponential backoff
  # - bulk_upsert/3 - dispatch to entity-specific service
  
  # Initially only support :vendors
  defp bulk_upsert(:vendors, records, connection) do
    Bulk.VendorBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(entity_type, _records, _connection) do
    {:error, {:unsupported_entity_type, entity_type}}
  end
end
```

**Validation:** Full integration test with mock ERP responses.

---

### Phase 4: Integration Test (Vendors)

**Goal:** Verify complete vendor sync flow works end-to-end.

#### Task 4.1: Test Full Vendor Flow

**Test Cases:**
1. Empty result (no records) → Returns `{:ok, %{records_synced: 0, pages: 0}}`
2. Single page (< 1000 records) → Fetches once, upserts, done
3. Multiple pages → Fetches all pages, upserts each, correct total
4. Retry on rate limit → Backs off and retries
5. Token refresh on 401 → Refreshes and retries

**Validation Criteria:**
- [ ] Correct number of pages fetched
- [ ] Correct number of records upserted
- [ ] No memory accumulation (only 1 page in memory)
- [ ] Retry logic works
- [ ] Stats returned accurately

---

### Phase 5: Expand to All Entity Types

**Goal:** Replicate the pattern for remaining 9 entity types.

#### Task 5.1-5.9: For Each Entity Type

| # | Entity Type | Capability File | BulkUpsertService |
|---|-------------|-----------------|-------------------|
| 5.1 | `gl_accounts` | `.../core/gl_accounts.ex` | `GLAccountBulkUpsertService` |
| 5.2 | `departments` | `.../core/departments.ex` | `DepartmentBulkUpsertService` |
| 5.3 | `locations` | `.../core/locations.ex` | `LocationBulkUpsertService` |
| 5.4 | `classes` | `.../core/classes.ex` | `ClassBulkUpsertService` |
| 5.5 | `projects` | `.../core/projects.ex` | `ProjectBulkUpsertService` |
| 5.6 | `employees` | `.../parties/employees.ex` | `EmployeeBulkUpsertService` |
| 5.7 | `expense_categories` | `.../expense/expense_categories.ex` | `ExpenseCategoryBulkUpsertService` |
| 5.8 | `currencies` | `.../core/currencies.ex` | `CurrencyBulkUpsertService` |
| 5.9 | `accounting_periods` | `.../core/accounting_periods.ex` | `AccountingPeriodBulkUpsertService` |

**For Each Entity Type:**
1. Add `fetch_page/3` to capability module
2. Create `*BulkUpsertService` in `.../services/bulk/`
3. Add dispatch clause to `EntitySyncService.bulk_upsert/3`
4. Test the entity type flow

---

### Phase 6: Reactor Integration

**Goal:** Create the workspace-centric reactor that orchestrates all entity syncs.

#### Task 6.1: Create WorkspaceSyncReactor

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/workspace_sync_reactor.ex`

**Implementation:** (Full code in design proposal)

**Key Structure:**
```elixir
defmodule FlameTeampayPayables.EmberErp.Resources.Reactors.WorkspaceSyncReactor do
  use Ash.Reactor
  
  # Sequential entity sync steps respecting dependencies
  step :sync_currencies, ...
  step :sync_accounting_periods, ...
  step :sync_gl_accounts, ...
  step :sync_departments, wait_for: :sync_gl_accounts
  step :sync_locations, wait_for: :sync_departments
  # ... etc
end
```

**Validation:** Full workspace sync completes all entity types in order.

---

## File Summary

### Files to Create

| # | File Path | Phase |
|---|-----------|-------|
| 1 | `lib/.../ember_erp/services/bulk/` (directory) | 2 |
| 2 | `lib/.../ember_erp/services/bulk/vendor_bulk_upsert_service.ex` | 2 |
| 3 | `lib/.../ember_erp/services/entity_sync_service.ex` | 3 |
| 4 | `lib/.../ember_erp/services/bulk/gl_account_bulk_upsert_service.ex` | 5 |
| 5 | `lib/.../ember_erp/services/bulk/department_bulk_upsert_service.ex` | 5 |
| 6 | `lib/.../ember_erp/services/bulk/location_bulk_upsert_service.ex` | 5 |
| 7 | `lib/.../ember_erp/services/bulk/class_bulk_upsert_service.ex` | 5 |
| 8 | `lib/.../ember_erp/services/bulk/project_bulk_upsert_service.ex` | 5 |
| 9 | `lib/.../ember_erp/services/bulk/employee_bulk_upsert_service.ex` | 5 |
| 10 | `lib/.../ember_erp/services/bulk/expense_category_bulk_upsert_service.ex` | 5 |
| 11 | `lib/.../ember_erp/services/bulk/currency_bulk_upsert_service.ex` | 5 |
| 12 | `lib/.../ember_erp/services/bulk/accounting_period_bulk_upsert_service.ex` | 5 |
| 13 | `lib/.../ember_erp/resources/reactors/workspace_sync_reactor.ex` | 6 |

### Files to Modify

| # | File Path | Change | Phase |
|---|-----------|--------|-------|
| 1 | `.../capabilities/sync/parties/vendors.ex` | Add `fetch_page/3` | 1 |
| 2 | `.../adapters/capability_router.ex` | Add `fetch_page/4` | 1 |
| 3 | `.../capabilities/sync/core/gl_accounts.ex` | Add `fetch_page/3` | 5 |
| 4 | `.../capabilities/sync/core/departments.ex` | Add `fetch_page/3` | 5 |
| 5 | `.../capabilities/sync/core/locations.ex` | Add `fetch_page/3` | 5 |
| 6 | `.../capabilities/sync/core/classes.ex` | Add `fetch_page/3` | 5 |
| 7 | `.../capabilities/sync/core/projects.ex` | Add `fetch_page/3` | 5 |
| 8 | `.../capabilities/sync/parties/employees.ex` | Add `fetch_page/3` | 5 |
| 9 | `.../capabilities/sync/expense/expense_categories.ex` | Add `fetch_page/3` | 5 |
| 10 | `.../capabilities/sync/core/currencies.ex` | Add `fetch_page/3` | 5 |
| 11 | `.../capabilities/sync/core/accounting_periods.ex` | Add `fetch_page/3` | 5 |

---

## Implementation Principles

### 1. One Working Slice First
Build Vendors end-to-end (Phases 1-4) before expanding to other entity types. This proves the pattern works.

### 2. Test Each Layer Before Moving Up
```
Phase 1 → Can I fetch a single page? ✓
Phase 2 → Can I bulk upsert records? ✓  
Phase 3 → Can I orchestrate fetch→upsert loop? ✓
Phase 4 → Does the full flow work? ✓
THEN expand to Phase 5.
```

### 3. Copy Existing Patterns Exactly
Reference these files for patterns:
- `InitialSyncService` → BulkResult handling
- `CapabilityRouter.sync/4` → Routing pattern
- Existing `fetch/2` implementations → SuiteQL query building

### 4. Keep Modules Small and Focused
```
VendorBulkUpsertService    → Only knows how to bulk upsert vendors
EntitySyncService          → Only knows how to orchestrate fetch→upsert
WorkspaceSyncReactor       → Only knows how to sequence entity syncs
```

---

## Checklist for AI Implementation

```
PHASE 1: Capability Layer
[ ] Task 1.1: Add fetch_page/3 to vendors.ex
[ ] Task 1.2: Add fetch_page/4 to capability_router.ex
[ ] Validate: Single page fetch works

PHASE 2: Bulk Upsert Layer  
[ ] Task 2.1: Create bulk/ directory
[ ] Task 2.2: Create VendorBulkUpsertService
[ ] Validate: Bulk upsert works

PHASE 3: Orchestrator Layer
[ ] Task 3.1: Create EntitySyncService
[ ] Validate: Fetch→upsert loop works

PHASE 4: Integration Test
[ ] Task 4.1: Test full vendor flow
[ ] Validate: End-to-end vendor sync works

PHASE 5: Expand to All Entity Types
[ ] Task 5.1: gl_accounts (fetch_page + bulk service)
[ ] Task 5.2: departments
[ ] Task 5.3: locations
[ ] Task 5.4: classes
[ ] Task 5.5: projects
[ ] Task 5.6: employees
[ ] Task 5.7: expense_categories
[ ] Task 5.8: currencies
[ ] Task 5.9: accounting_periods
[ ] Validate: All entity types sync correctly

PHASE 6: Reactor Integration
[ ] Task 6.1: Create WorkspaceSyncReactor
[ ] Validate: Full workspace sync works
```

---

## Related Documents

| Document | Location |
|----------|----------|
| Design Proposal | `design-proposal-streaming-sync.md` |
| Scale Gaps | `gaps.md` |
| Session Context | `../../shared_context.md` |

---

## History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Implementation Consultant | Created implementation sequence |
| 2024-12-21 | Sync Architect | Defined task breakdown |
| 2024-12-21 | Standards Enforcer | Added implementation principles |
| 2024-12-21 | Scribe | Documented as implementation plan |

