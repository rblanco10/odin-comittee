# Scale Architecture Gaps

> **Session ID:** scale-review-2024-12-21
> **Session Topic:** NetSuite Sync at Scale (1000 Workspaces)
> **Captured By:** Scribe
> **Source:** Sync Architect analysis of scheduler, queue, and memory patterns

---

## Summary

| ID | Title | Severity | Category | Status | Resolution |
|----|-------|----------|----------|--------|------------|
| GAP-SCALE-MEM-001 | ERP fetch accumulates all records in memory | 🟠 Medium | Implementation | Design Proposed | [PROP-SCALE-001](design-proposal-streaming-sync.md) |
| GAP-SCALE-DB-001 | N+1 queries in sync handlers | 🟠 Medium | Implementation | Design Proposed | [PROP-SCALE-001](design-proposal-streaming-sync.md) |
| GAP-SCALE-SCHED-001 | Scheduler bottleneck at hour boundaries | 🟡 Low | Design | Open | — |
| GAP-SCALE-BRIDGE-001 | Dimension bridge runs for non-dimension syncs | 🟡 Low | Design | Open | — |

---

## Gap: ERP Fetch Accumulates All Records in Memory

**ID:** GAP-SCALE-MEM-001
**Identified By:** Sync Architect
**Turn:** 3 (Scale Architecture Trace)
**Severity:** Medium
**Category:** Implementation

### Description

The NetSuite capability modules (and other providers) use a recursive pagination pattern that accumulates ALL records in memory before returning to the sync handler.

```elixir
# Current pattern in vendors.ex (and similar files)
defp fetch_all_vendors(config, ..., offset \\ 0, acc \\ []) do
  case Adapter.query_suiteql(config, query, limit: page_size, offset: offset) do
    {:ok, %{records: records, has_more: has_more}} ->
      all_records = acc ++ records   # ← ACCUMULATES!
      if has_more do
        fetch_all_vendors(..., offset + page_size, all_records)  # ← RECURSIVE
      else
        return_result(all_records, has_more)
      end
  end
end
```

### Impact

- For a workspace with 50,000 vendors: ~50MB held in memory during sync
- Combined with Oban concurrency (global_limit: 15), could be 15 × 50MB = 750MB
- No backpressure mechanism — continues fetching even if memory is tight
- GC cannot reclaim intermediate pages since they're accumulated in `acc`

### Current State

All provider sync capabilities follow this pattern:
- `netsuite/capabilities/sync/parties/vendors.ex`
- `sage_intacct/capabilities/sync/parties/vendors.ex`
- `quickbooks/capabilities/sync/parties/employees.ex`
- (and all other entity type fetchers)

### Desired State

Stream pages to the handler incrementally, processing records between pages:

```elixir
# Streaming pattern
def fetch(config, opts) do
  Stream.resource(
    fn -> {0, []} end,  # Initial state
    fn {offset, _} ->
      case fetch_page(config, offset) do
        {:ok, %{records: records, has_more: true}} ->
          {records, {offset + page_size, records}}
        {:ok, %{records: records, has_more: false}} ->
          {records, :done}
      end
    end,
    fn _ -> :ok end
  )
end
```

### Suggested Resolution

1. Refactor sync capabilities to return a `Stream` instead of a list
2. Modify sync handlers to consume the stream in chunks
3. Process and persist each chunk before fetching next page
4. Allow GC to reclaim memory between chunks

### Effort Estimate

- [x] Medium (1-3 days)

### Dependencies

- Requires changes to CapabilityRouter.sync/4 return type
- Requires changes to all sync handlers to consume streams
- May need SyncReactor step restructuring

### Related

- GAP-SCALE-DB-001: N+1 queries exacerbates this by holding records while querying
- SyncReactor: `sync_entity_type_via_router/6`
- **Design Proposal**: [PROP-SCALE-001](design-proposal-streaming-sync.md) — Streaming Sync with Bulk Upsert

### Status

- [ ] Open
- [x] Design Proposed: [PROP-SCALE-001](design-proposal-streaming-sync.md)
- [ ] In Progress
- [ ] Resolved
- [ ] Accepted Risk
- [ ] Won't Fix

### History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Sync Architect | Identified during 1000-workspace scale analysis |
| 2024-12-21 | Sync Architect | Design proposal created: PROP-SCALE-001 |

---

## Gap: N+1 Queries in Sync Handlers

**ID:** GAP-SCALE-DB-001
**Identified By:** Sync Architect
**Turn:** 3 (Scale Architecture Trace)
**Severity:** Medium
**Category:** Implementation

### Description

Sync handlers process records one at a time with individual read + write queries per record:

```elixir
# Current pattern in sync_entity_type_via_router
{synced, failed} =
  Enum.reduce(records, {0, 0}, fn record, {success, fail} ->
    # Per record: 1 read query (check exists) + 1 write query (create/update)
    case handler.sync(provider, record, workspace_id, entity_id, conn_id) do
      {:ok, _} -> {success + 1, fail}
      {:error, _} -> {success, fail + 1}
    end
  end)
```

And inside the handler:

```elixir
def upsert_vendor(attrs, workspace_id, ...) do
  query = Vendor |> Ash.Query.filter(external_id == ^attrs.external_id)
  case Ash.read_one(query, ...) do   # ← 1 query
    {:ok, nil} -> Ash.create(...)    # ← 1 query
    {:ok, existing} -> Ash.update(...) # ← 1 query
  end
end
```

### Impact

- 50,000 vendors = 100,000 queries minimum (50K reads + 50K writes)
- At ~2ms per query = 200 seconds of DB time per entity type
- Database connection pool contention across concurrent syncs
- Long sync duration affects scheduler fairness

### Current State

All 17 sync handlers follow the pattern:
- VendorSyncHandler, EmployeeSyncHandler, DepartmentSyncHandler, etc.

### Desired State

Use Ash bulk operations for batch upserts:

```elixir
def sync(provider, records, workspace_id, entity_id, conn_id) do
  # Map all records first
  attrs_list = Enum.map(records, fn record ->
    MapperRegistry.map_data(provider, :vendor, record, ...)
  end)
  
  # Bulk upsert
  Ash.bulk_create(
    attrs_list,
    Vendor,
    :create_from_erp,
    upsert?: true,
    upsert_identity: :unique_vendor,
    upsert_fields: [:vendor_name, :email, :status, ...],
    tenant: workspace_id,
    authorize?: false
  )
end
```

### Suggested Resolution

1. Add upsert identity to all ERP mirror resources
2. Refactor sync handlers to use `Ash.bulk_create` with `upsert?: true`
3. Process in batches of 500-1000 for memory balance
4. Return bulk result summary instead of individual results

### Effort Estimate

- [x] Medium (1-3 days)

### Dependencies

- Each resource needs `:unique_*` identity defined
- Ash.bulk_create error handling differs from individual creates
- May need to adjust observability (can't trace individual records as easily)

### Related

- GAP-SCALE-MEM-001: Memory held during N+1 processing
- Ash.bulk_create documentation
- **Design Proposal**: [PROP-SCALE-001](design-proposal-streaming-sync.md) — Streaming Sync with Bulk Upsert

### Status

- [ ] Open
- [x] Design Proposed: [PROP-SCALE-001](design-proposal-streaming-sync.md)
- [ ] In Progress
- [ ] Resolved
- [ ] Accepted Risk
- [ ] Won't Fix

### History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Sync Architect | Identified during 1000-workspace scale analysis |
| 2024-12-21 | Sync Architect | Design proposal created: PROP-SCALE-001 |

---

## Gap: Scheduler Bottleneck at Hour Boundaries

**ID:** GAP-SCALE-SCHED-001
**Identified By:** Sync Architect
**Turn:** 3 (Scale Architecture Trace)
**Severity:** Low
**Category:** Design

### Description

If all 10,000 SyncConfigurations are scheduled hourly (common default), they all become due at minute :00, creating a thundering herd:

```
Minute 0: 10,000 configs due (next_scheduled_at <= now())
  - Scheduler picks 500 (record_limit)
  - 9,500 remain waiting

Minute 1: Scheduler picks 500
  - 9,000 remain

...

Minute 19: Scheduler picks 500
  - 500 remain

Minute 20: All configs scheduled ✓
```

### Impact

- Worst case: 20 minutes before all configs are even *scheduled*
- Plus processing time: adds another 2-10 minutes per sync
- Some workspaces wait 22+ minutes for their hourly sync to complete
- Uneven load distribution across the hour

### Current State

```elixir
oban do
  triggers do
    trigger :run_scheduled_sync do
      scheduler_cron "* * * * *"  # Runs every minute
      stream_batch_size 100
      record_limit 500            # Max 500 per scheduler run
    end
  end
end
```

### Desired State

Stagger sync schedules across the hour:

1. **During onboarding**: Assign randomized cron offset per workspace
   ```
   Workspace A: "5 * * * *"   (minute 5)
   Workspace B: "23 * * * *"  (minute 23)
   Workspace C: "47 * * * *"  (minute 47)
   ```

2. **Or**: Use `next_scheduled_at` with randomized offsets during creation

3. **Or**: Increase `record_limit` if infrastructure supports it

### Suggested Resolution

Option A: Randomize during SyncConfiguration creation:
```elixir
def calculate_next_run(sync_frequency, enabled) do
  # Add 0-59 minute offset based on workspace_id hash
  base_time = Crontab.CronExpression.Parser.parse!(sync_frequency)
  offset = :erlang.phash2(workspace_id, 60)
  # Shift next_scheduled_at by offset minutes
end
```

Option B: Increase scheduler capacity:
```elixir
record_limit 2000  # Process 4x more per minute
```

### Effort Estimate

- [x] Small (< 1 day)

### Dependencies

- None — can be done independently

### Related

- SyncConfiguration.Changes.CalculateNextScheduledAt

### Status

- [x] Open
- [ ] In Progress
- [ ] Resolved
- [ ] Accepted Risk
- [ ] Won't Fix

### History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Sync Architect | Identified during 1000-workspace scale analysis |

---

## Gap: Dimension Bridge Runs for Non-Dimension Syncs

**ID:** GAP-SCALE-BRIDGE-001
**Identified By:** Sync Architect
**Turn:** 3 (Scale Architecture Trace)
**Severity:** Low
**Category:** Design

### Description

The `complete_execution` step of SyncReactor calls `bridge_erp_to_coding_values()` unconditionally after EVERY sync, regardless of entity type:

```elixir
# SyncReactor complete_execution step
bridge_erp_to_coding_values(
  data.workspace_id,
  data.entity_id,
  data.connection.id,
  data.connection.provider
)
```

The bridge then iterates through ALL 7+ dimension types:

```elixir
@dimension_types [
  %{type: :department, ...},
  %{type: :location, ...},
  %{type: :class, ...},
  %{type: :project, ...},
  %{type: :gl_account, ...},
  %{type: :job, ...},
  %{type: :expense_category, ...}
]
```

### Impact

- Vendor sync triggers full dimension bridge (7 types × 3 passes each)
- If dimension tables are empty: harmless but wasteful (~100ms overhead)
- If dimension tables are populated: unnecessary re-processing
- For 1000 workspaces × 10 entity types × hourly = 10,000 unnecessary bridge runs/hour

### Current State

```elixir
# No conditional check on entity_type
bridge_erp_to_coding_values(...)
```

### Desired State

Only run dimension bridge for dimension entity types:

```elixir
@dimension_entity_types [:departments, :locations, :classes, :projects, 
                         :gl_accounts, :jobs, :expense_categories, 
                         :custom_dimensions, :custom_dimension_values]

if data.entity_type in @dimension_entity_types do
  bridge_erp_to_coding_values(...)
end
```

Or, run bridge only after the LAST dimension type in a batch sync.

### Suggested Resolution

Add entity type check before calling bridge:

```elixir
# In complete_execution step
if should_bridge?(data.entity_type) do
  bridge_erp_to_coding_values(...)
end

defp should_bridge?(entity_type) do
  entity_type in [:departments, :locations, :classes, :projects, 
                  :gl_accounts, :jobs, :expense_categories,
                  :custom_dimensions, :custom_dimension_values]
end
```

### Effort Estimate

- [x] Small (< 1 day)

### Dependencies

- None — simple conditional addition

### Related

- UnifiedDimensionBridgeService
- SyncReactor.complete_execution

### Status

- [x] Open
- [ ] In Progress
- [ ] Resolved
- [ ] Accepted Risk
- [ ] Won't Fix

### History

| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Sync Architect | Identified during dimension bridge analysis |

---

## Appendix: Scale Calculations

### Capacity Formula

```
Required Sync Throughput = Workspaces × EntityTypes × SyncsPerHour

For 1000 workspaces, 10 entity types, hourly sync:
  = 1000 × 10 × 1 = 10,000 syncs/hour needed
```

### Current Capacity

```
Throughput = GlobalLimit × (60 min / AvgSyncDuration)

With global_limit: 10, avg sync: 3 min:
  = 10 × (60 / 3) = 200 syncs/hour

Deficit: 10,000 needed / 200 available = 50x shortfall
```

### Recommendations

1. **Reduce sync frequency**: Hourly → 4x daily = 4x improvement
2. **Increase global_limit**: 10 → 30 = 3x improvement  
3. **Optimize sync duration**: 3 min → 1 min = 3x improvement
4. **Combined**: Could achieve 36x improvement

---

*Document created by Scribe following committee gap template.*

