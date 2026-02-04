# Design Proposal: Streaming Sync with Bulk Upsert

> **Session ID:** scale-review-2024-12-21  
> **Proposal ID:** PROP-SCALE-001  
> **Date:** 2024-12-21  
> **Authored By:** Sync Architect  
> **Documented By:** Scribe  
> **Status:** Committee Approved  
> **Revision:** 2 (Committee Refinements Applied)

---

## Executive Summary

This proposal addresses critical scalability gaps in the current sync architecture that prevent achieving the target of **2-5 minute incremental sync latency** across **1000+ workspaces**. The core changes introduce:

1. **Paginated Fetch** — Return one page at a time from adapters via new `fetch_page/3` callback
2. **Bulk Upsert** — Replace N+1 queries with `Ash.bulk_create` batch operations
3. **EntitySyncService** — New orchestrator that handles fetch→save→repeat loop with retry logic
4. **Error Resilience** — Exponential backoff, token refresh, and partial failure handling

---

## Problem Statement

### Current Architecture Issues

The existing sync implementation has two compounding scalability problems:

#### Issue 1: Memory Accumulation at Adapter Level

Current capability implementations (e.g., `Parties.Vendors.fetch/2`) use recursive pagination that **accumulates all records in memory** before returning:

```
fetch_all_records(config, cursor, ..., offset \\ 0, acc \\ [])
  │
  ├── Fetch page 1 (1000 records)  ─────────────▶ acc = [1000 records]
  ├── Fetch page 2 (1000 records)  ─────────────▶ acc = [2000 records]
  ├── Fetch page 3 (1000 records)  ─────────────▶ acc = [3000 records]
  │   ...
  └── Fetch page N                 ─────────────▶ acc = [N×1000 records]
      │
      └── ONLY NOW returns {:ok, %{records: all_50000_records}}
                                   ▲
                                   │
                         ALL 50K RECORDS IN MEMORY
```

**Impact:** A vendor sync for a large enterprise with 50,000 vendors loads all 50K records into BEAM process memory before any can be saved.

#### Issue 2: N+1 Queries at Handler Level

Current sync handlers (e.g., `VendorSyncHandler.sync/5`) process records **one at a time** with individual database lookups:

```elixir
# For EACH of 50,000 records:
1. Ash.read_one (find by external_id)      →  SELECT ... WHERE external_id = ?
2. Ash.read_one (find by vendor_number)    →  SELECT ... WHERE vendor_number = ?
3. Ash.create or Ash.update               →  INSERT/UPDATE

# Total: 50,000 records × 2-3 queries = 100,000-150,000 database roundtrips
```

**Impact:** A 50K vendor sync generates ~150K database queries, taking hours instead of minutes.

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    PROPOSED: PAGINATED FETCH + BULK UPSERT                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                     EntitySyncService (Orchestrator)                         │    │
│  │                                                                              │    │
│  │  def sync_entity(connection, entity_type, opts) do                           │    │
│  │    sync_pages(connection, entity_type, cursor, stats)                        │    │
│  │      1. Fetch ONE page with retry (1000 records)                            │    │
│  │      2. Bulk upsert that page (1 query via Ash.bulk_create)                 │    │
│  │      3. If has_more, recurse with next_cursor; else done                    │    │
│  │  end                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  FLOW:                                                                               │
│                                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Fetch      │───▶│  Bulk       │───▶│  Update     │───▶│  Fetch      │───▶ ...  │
│  │  Page 1     │    │  Upsert     │    │  Stats      │    │  Page 2     │          │
│  │  1000 recs  │    │  1000 recs  │    │             │    │  1000 recs  │          │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘          │
│        │                                                                             │
│        └── Retry with backoff on: rate_limit, timeout, 5xx errors                   │
│        └── Refresh token on: 401 unauthorized                                        │
│                                                                                      │
│  MEMORY: Only 1 page (1000 records) in memory at any time                           │
│  DB QUERIES: 1 bulk upsert per 1000 records (not 3000 individual queries)           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Design

### Layer 1: Capability Interface — `fetch_page/3`

Add new `fetch_page/3` callback to capability modules. This is **additive** — existing `fetch/2` remains unchanged.

**New Callback Signature:**
```elixir
@callback fetch_page(config :: map(), cursor :: map() | nil, opts :: keyword()) ::
  {:ok, %{
    records: [map()],         # Single page of records
    next_cursor: map() | nil, # Cursor for next page (nil if no more)
    has_more: boolean()       # Explicit flag
  }} | {:error, term()}
```

**Implementation Example — `Parties.Vendors`:**
```elixir
defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Capabilities.Sync.Parties.Vendors do
  @behaviour FlameTeampayPayables.EmberErp.Adapters.Capabilities.Sync.Behaviour
  
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
  
  # Existing fetch/2 can delegate or remain for backwards compatibility
  @impl true
  def fetch(config, opts), do: fetch_all_records(config, opts)
end
```

**Key Point:** Returns ONE page, does NOT accumulate.

---

### Layer 2: Bulk Upsert Services

Create entity-specific bulk upsert services using `Ash.bulk_create` with upsert — a pattern already established in the codebase.

**New Module: `VendorBulkUpsertService`**
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
  
  Returns {:ok, %{succeeded: n, failed: m}} following codebase conventions.
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
           upsert_identity: :unique_erp_vendor,  # Uses existing identity
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

**Note:** Uses `:unique_erp_vendor` identity which already exists on Vendor resource:
```elixir
# In vendor.ex
identities do
  identity :unique_vendor_number, [:workspace_id, :vendor_number]
  identity :unique_erp_vendor, [:workspace_id, :erp_connection_id, :external_id]
end
```

---

### Layer 3: EntitySyncService (Orchestrator)

New service that orchestrates the fetch→save loop with retry logic and error handling.

**New Module: `EntitySyncService`**
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
  
  ## Options
  - `:page_size` - Records per page (default: 1000)
  - `:time_cursor` - Only sync records modified after this timestamp
  
  ## Returns
  - `{:ok, %{records_synced: n, pages: m, failed: f, duration_ms: t}}`
  - `{:error, %{reason: term, stats: map}}`
  """
  def sync_entity(connection, entity_type, opts \\ []) do
    page_size = Keyword.get(opts, :page_size, @default_page_size)
    time_cursor = Keyword.get(opts, :time_cursor)
    
    initial_cursor = build_cursor(time_cursor)
    start_time = System.monotonic_time(:millisecond)
    
    result = sync_pages(connection, entity_type, initial_cursor, page_size, %{
      records_synced: 0,
      pages: 0,
      failed: 0
    })
    
    duration = System.monotonic_time(:millisecond) - start_time
    
    case result do
      {:ok, stats} -> 
        {:ok, Map.put(stats, :duration_ms, duration)}
      {:error, reason} -> 
        {:error, Map.put(reason, :duration_ms, duration)}
    end
  end
  
  # --- Core Pagination Loop ---
  
  defp sync_pages(connection, entity_type, cursor, page_size, stats) do
    case fetch_page_with_retry(connection, entity_type, cursor, page_size) do
      {:ok, %{records: [], has_more: false}} ->
        # Done - no more records
        {:ok, stats}
        
      {:ok, %{records: records, next_cursor: next, has_more: has_more}} ->
        # Bulk upsert this batch
        case bulk_upsert(entity_type, records, connection) do
          {:ok, %{succeeded: n, failed: f}} ->
            updated = %{stats | 
              records_synced: stats.records_synced + n,
              pages: stats.pages + 1,
              failed: stats.failed + f
            }
            
            Logger.info("Synced page #{updated.pages} for #{entity_type}",
              records: length(records),
              succeeded: n,
              failed: f,
              total: updated.records_synced,
              has_more: has_more
            )
            
            # Continue or finish
            if has_more && next do
              sync_pages(connection, entity_type, next, page_size, updated)
            else
              {:ok, updated}
            end
            
          {:error, reason} ->
            {:error, %{reason: reason, stats: stats, cursor: cursor}}
        end
        
      {:error, reason} ->
        {:error, %{reason: reason, stats: stats, cursor: cursor}}
    end
  end
  
  # --- Fetch with Retry Logic ---
  
  defp fetch_page_with_retry(conn, entity_type, cursor, page_size, attempts \\ @max_retries)
  
  defp fetch_page_with_retry(_conn, entity_type, _cursor, _page_size, 0) do
    Logger.error("EntitySyncService: Max retries exceeded for #{entity_type}")
    {:error, :max_retries_exceeded}
  end
  
  defp fetch_page_with_retry(conn, entity_type, cursor, page_size, attempts) do
    case CapabilityRouter.fetch_page(conn, entity_type, cursor, page_size: page_size) do
      {:ok, result} -> 
        {:ok, result}
        
      {:error, :rate_limited} ->
        backoff = 1000 * (@max_retries - attempts + 1)
        Logger.warning("Rate limited, backing off #{backoff}ms")
        Process.sleep(backoff)
        fetch_page_with_retry(conn, entity_type, cursor, page_size, attempts - 1)
        
      {:error, :unauthorized} ->
        Logger.info("Token expired, refreshing...")
        case AuthService.refresh_token(conn) do
          {:ok, refreshed_conn} -> 
            fetch_page_with_retry(refreshed_conn, entity_type, cursor, page_size, attempts - 1)
          error -> 
            error
        end
        
      {:error, reason} when attempts > 1 ->
        Logger.warning("Fetch failed: #{inspect(reason)}, retrying...")
        Process.sleep(500)
        fetch_page_with_retry(conn, entity_type, cursor, page_size, attempts - 1)
        
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  # --- Entity Type Dispatch ---
  
  defp bulk_upsert(:vendors, records, connection) do
    Bulk.VendorBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:gl_accounts, records, connection) do
    Bulk.GLAccountBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:departments, records, connection) do
    Bulk.DepartmentBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:locations, records, connection) do
    Bulk.LocationBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:classes, records, connection) do
    Bulk.ClassBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:employees, records, connection) do
    Bulk.EmployeeBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:expense_categories, records, connection) do
    Bulk.ExpenseCategoryBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:projects, records, connection) do
    Bulk.ProjectBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:currencies, records, connection) do
    Bulk.CurrencyBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(:accounting_periods, records, connection) do
    Bulk.AccountingPeriodBulkUpsertService.upsert_batch(records, connection)
  end
  
  defp bulk_upsert(entity_type, _records, _connection) do
    {:error, {:unsupported_entity_type, entity_type}}
  end
  
  # --- Helpers ---
  
  defp build_cursor(nil), do: %{}
  defp build_cursor(time), do: %{last_modified_after: time}
end
```

---

### Layer 4: CapabilityRouter Extension

Add `fetch_page/4` to CapabilityRouter alongside existing `sync/4`.

```elixir
# In capability_router.ex

@doc """
Fetch a single page of records for an entity type.
Used by EntitySyncService for paginated sync.
"""
def fetch_page(connection, entity_type, cursor, opts \\ []) do
  adapter = get_adapter(connection.provider)
  config = build_config(connection)
  
  capability_module = get_sync_capability(adapter, entity_type)
  
  if function_exported?(capability_module, :fetch_page, 3) do
    capability_module.fetch_page(config, cursor, opts)
  else
    {:error, {:fetch_page_not_implemented, entity_type}}
  end
end
```

---

### Layer 5: WorkspaceSyncReactor

With EntitySyncService handling the heavy lifting, the reactor becomes a thin orchestrator:

```elixir
defmodule FlameTeampayPayables.EmberErp.Resources.Reactors.WorkspaceSyncReactor do
  @moduledoc """
  Workspace-centric sync reactor.
  
  Syncs all entity types for a single workspace in one reactor invocation.
  Each entity type delegates to EntitySyncService which handles pagination.
  """
  
  use Ash.Reactor
  
  alias FlameTeampayPayables.EmberErp.Services.EntitySyncService
  
  @entity_types [
    :currencies,
    :accounting_periods, 
    :gl_accounts,
    :departments,
    :locations,
    :classes,
    :projects,
    :employees,
    :vendors,
    :expense_categories
  ]
  
  input :erp_connection
  input :time_cursor
  input :entity_types, default: @entity_types
  
  # Step 1: Create execution record
  step :create_execution do
    run fn args, _ ->
      SyncExecution.create_for_connection(args.erp_connection)
    end
  end
  
  # Step 2: Auth check/refresh
  step :ensure_auth do
    run fn args, _ ->
      AuthService.ensure_valid_token(args.erp_connection)
    end
    wait_for :create_execution
  end
  
  # Entity sync steps - each delegates to EntitySyncService
  # Service handles ALL pagination, bulk upsert, and retries internally
  
  step :sync_currencies do
    run fn args, _ ->
      sync_if_enabled(:currencies, args)
    end
    wait_for :ensure_auth
  end
  
  step :sync_accounting_periods do
    run fn args, _ ->
      sync_if_enabled(:accounting_periods, args)
    end
    wait_for :ensure_auth
  end
  
  step :sync_gl_accounts do
    run fn args, _ ->
      sync_if_enabled(:gl_accounts, args)
    end
    wait_for :ensure_auth
  end
  
  step :sync_departments do
    run fn args, _ ->
      sync_if_enabled(:departments, args)
    end
    wait_for :sync_gl_accounts  # Departments may reference GL accounts
  end
  
  step :sync_locations do
    run fn args, _ ->
      sync_if_enabled(:locations, args)
    end
    wait_for :sync_departments
  end
  
  step :sync_classes do
    run fn args, _ ->
      sync_if_enabled(:classes, args)
    end
    wait_for :sync_locations
  end
  
  step :sync_projects do
    run fn args, _ ->
      sync_if_enabled(:projects, args)
    end
    wait_for :sync_classes
  end
  
  step :sync_employees do
    run fn args, _ ->
      sync_if_enabled(:employees, args)
    end
    wait_for :sync_projects
  end
  
  step :sync_vendors do
    run fn args, _ ->
      sync_if_enabled(:vendors, args)
    end
    wait_for :sync_employees
  end
  
  step :sync_expense_categories do
    run fn args, _ ->
      sync_if_enabled(:expense_categories, args)
    end
    wait_for :sync_vendors
  end
  
  # Final step: Aggregate results and mark complete
  step :finalize do
    run fn args, _ ->
      results = aggregate_results(args)
      SyncExecution.complete(args.create_execution, results)
    end
    wait_for :sync_expense_categories
  end
  
  # --- Helpers ---
  
  defp sync_if_enabled(entity_type, args) do
    if entity_type in args.entity_types do
      EntitySyncService.sync_entity(
        args.erp_connection,
        entity_type,
        time_cursor: args.time_cursor
      )
    else
      {:ok, :skipped}
    end
  end
  
  defp aggregate_results(args) do
    # Collect results from all sync steps
    %{
      currencies: args.sync_currencies,
      accounting_periods: args.sync_accounting_periods,
      gl_accounts: args.sync_gl_accounts,
      departments: args.sync_departments,
      locations: args.sync_locations,
      classes: args.sync_classes,
      projects: args.sync_projects,
      employees: args.sync_employees,
      vendors: args.sync_vendors,
      expense_categories: args.sync_expense_categories
    }
  end
end
```

---

## Edge Cases & Error Handling

### Handled Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **Connection timeout mid-page** | Retry with exponential backoff (1s, 2s, 3s) |
| **Rate limiting (429)** | Backoff and retry at fetch level |
| **Token expiry mid-sync** | Refresh token on 401, then retry |
| **Duplicate records in batch** | Handled by upsert identity |
| **Null/missing required fields** | Pre-filter in mapper, log warning |
| **Empty page but has_more=true** | Treat as done (guard in sync_pages) |
| **Partial batch failure** | Log errors, continue with succeeded count |

### Error Handling Pattern

Following codebase conventions from `InitialSyncService`:

```elixir
# Partial failure is logged and counted, not fatal
case Ash.bulk_create(...) do
  %Ash.BulkResult{errors: errors} ->
    succeeded = length(records) - length(errors)
    if length(errors) > 0 do
      Logger.warning("#{length(errors)} records failed: #{inspect(Enum.take(errors, 3))}")
    end
    {:ok, %{succeeded: succeeded, failed: length(errors)}}
end
```

---

## Performance Comparison

| Metric | Current | Proposed | Improvement |
|--------|---------|----------|-------------|
| **Memory (50K vendors)** | 50,000 records in RAM | 1,000 records in RAM | **50× reduction** |
| **DB Queries (50K vendors)** | ~150,000 queries | ~50 queries | **3,000× reduction** |
| **Sync Duration (50K vendors)** | ~2-4 hours | ~2-5 minutes | **50× faster** |
| **Reactor Complexity** | Contains fetch/save logic | Pure orchestration | **Separation of concerns** |

---

## Implementation Checklist

### Files to Create

| File | Purpose |
|------|---------|
| `lib/.../ember_erp/services/entity_sync_service.ex` | Orchestrator with pagination + retry |
| `lib/.../ember_erp/services/bulk/vendor_bulk_upsert_service.ex` | Vendor bulk upsert |
| `lib/.../ember_erp/services/bulk/gl_account_bulk_upsert_service.ex` | GL Account bulk upsert |
| `lib/.../ember_erp/services/bulk/department_bulk_upsert_service.ex` | Department bulk upsert |
| `lib/.../ember_erp/services/bulk/location_bulk_upsert_service.ex` | Location bulk upsert |
| `lib/.../ember_erp/services/bulk/class_bulk_upsert_service.ex` | Class bulk upsert |
| `lib/.../ember_erp/services/bulk/employee_bulk_upsert_service.ex` | Employee bulk upsert |
| `lib/.../ember_erp/services/bulk/project_bulk_upsert_service.ex` | Project bulk upsert |
| `lib/.../ember_erp/services/bulk/expense_category_bulk_upsert_service.ex` | Expense Category bulk upsert |
| `lib/.../ember_erp/services/bulk/currency_bulk_upsert_service.ex` | Currency bulk upsert |
| `lib/.../ember_erp/services/bulk/accounting_period_bulk_upsert_service.ex` | Accounting Period bulk upsert |
| `lib/.../ember_erp/resources/reactors/workspace_sync_reactor.ex` | New workspace-centric reactor |

### Files to Modify

| File | Change |
|------|--------|
| `capability_router.ex` | Add `fetch_page/4` function |
| `netsuite/.../vendors.ex` | Add `fetch_page/3` callback |
| `netsuite/.../gl_accounts.ex` | Add `fetch_page/3` callback |
| `netsuite/.../departments.ex` | Add `fetch_page/3` callback |
| (all other sync capabilities) | Add `fetch_page/3` callback |

### Identities Required (Already Exist)

| Resource | Identity | Fields |
|----------|----------|--------|
| Vendor | `:unique_erp_vendor` | `[:workspace_id, :erp_connection_id, :external_id]` |
| GLAccount | `:unique_erp_account` | (verify exists or add) |
| Department | `:unique_erp_department` | (verify exists or add) |
| (other resources) | `:unique_erp_*` | (verify exists or add) |

---

## Design Decisions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Ash.bulk_create vs Ecto.insert_all** | `Ash.bulk_create` | Already used throughout codebase, provides validation |
| **Progress Storage** | Not needed for v1 | Cursors are short-lived; add if cross-restart resume needed |
| **Partial Failure Handling** | Log and continue | Matches codebase pattern in InitialSyncService |
| **Parallel Entity Syncs** | Sequential | Simpler, less memory, maintains dependency order |
| **Page Size** | Fixed 1000 | NetSuite's max, simple and proven |
| **Stream.resource pattern** | No (simple recursion) | Matches codebase style, simpler to understand |

---

## Related Gaps

| Gap ID | Title | Addressed By |
|--------|-------|--------------|
| GAP-SCALE-MEM-001 | ERP fetch accumulates all records | `fetch_page` pattern |
| GAP-SCALE-DB-001 | N+1 queries in sync handlers | Bulk upsert services |

---

## Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Sync Architect | — | ✅ Authored | 2024-12-21 |
| Standards Enforcer | — | ✅ Pattern Aligned | 2024-12-21 |
| Edge Case Hunter | — | ✅ Edge Cases Covered | 2024-12-21 |
| Dependency Guardian | — | ✅ Entity Order Verified | 2024-12-21 |
| Data Quality Specialist | — | ✅ Integrity Confirmed | 2024-12-21 |
| Scribe | — | ✅ Documented | 2024-12-21 |
| Human | — | ⏳ Pending | — |

---

## History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Sync Architect | Initial proposal based on scale review findings |
| 2024-12-21 | Scribe | Formalized into design document |
| 2024-12-21 | Committee | Reviewed and provided refinements |
| 2024-12-21 | Scribe | Applied committee refinements (Rev 2) |
