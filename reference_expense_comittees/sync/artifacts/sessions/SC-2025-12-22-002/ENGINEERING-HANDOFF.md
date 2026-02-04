# Engineering Handoff: Bridge Implementation

> **Session:** SC-2025-12-22-002
> **Date:** 2025-12-22
> **Audience:** Engineering team implementing the Bridge

---

## Quick Context

**What:** A new system that creates CodingCategory/CodingValue records from ERP mirror tables.

**Why:** Decouple business logic from sync. Currently 80% of support tickets involve sync, and business logic failures can poison sync reliability.

**Key Principle:** Sync and Bridge are completely independent. Sync "wins its own game." Bridge "wins its own game."

---

## Deployment Order (Critical)

```
PHASE 1: Schema Changes (Deploy together)
─────────────────────────────────────────
1. Migration: make_coding_entity_id_optional
2. Migration: add_bridged_at_to_erp_mirrors
3. Deploy resource changes (CodingCategory, CodingValue, ERP mirrors)

⚠️  DO NOT start Bridge worker until Phase 1 is complete

PHASE 2: Bridge Code (Deploy together)
─────────────────────────────────────────
4. Deploy ember_bridge domain + service + reactor + worker
5. Add :bridge queue to Oban config
6. Add cron job for BridgeWorker

PHASE 3: Query Updates (Can be gradual)
─────────────────────────────────────────
7. Update queries to include workspace-wide dimensions
8. Update UI dropdowns
```

---

## Configuration Required

### Oban Queue

Add to `config/config.exs`:

```elixir
config :flame_teampay_payables, Oban,
  queues: [
    # ... existing queues
    bridge: 5  # Start with 5 workers
  ]
```

### Cron Job

Add to Oban plugins:

```elixir
{Oban.Plugins.Cron,
  crontab: [
    # ... existing jobs
    {"*/2 * * * *", FlameTeampayPayables.EmberBridge.Workers.BridgeWorker}
  ]
}
```

---

## Testing Strategy

### Unit Tests

**DimensionBridgeService:**
```elixir
# Test cases:
- bridge_entity_type/4 with no records to bridge → {:ok, 0}
- bridge_entity_type/4 with 5 new records → {:ok, 5}
- bridge_entity_type/4 with 3 updated records → {:ok, 3}
- bridge_entity_type/4 with invalid data → graceful handling, partial success
- ensure_category/5 creates new category when missing
- ensure_category/5 finds existing category
- ensure_category/5 handles workspace-wide (entity_id = nil)
- upsert_coding_value/4 creates new value
- upsert_coding_value/4 updates existing value (by external_id)
- resolve_hierarchy/4 sets parent_id correctly
- link_and_mark_bridged/2 updates both fields
```

**BridgeReactor:**
```elixir
# Test cases:
- All steps complete successfully → returns aggregated stats
- One step fails → other steps still complete (compensation)
- No records to bridge → all steps return 0
```

### Integration Tests

```elixir
# End-to-end scenarios:
- Sync creates Department → Bridge run → CodingCategory exists → CodingValue exists
- Department updated_at > bridged_at → Bridge re-processes
- Workspace-wide Department (entity_id = nil) → CodingValue has entity_id = nil
- Hierarchy: Child department → parent_id set correctly on CodingValue
```

### Manual Testing Checklist

```
□ Create ERP connection
□ Run sync (populates mirror tables)
□ Verify bridged_at is NULL on new records
□ Run Bridge worker manually
□ Verify CodingCategory created
□ Verify CodingValue created
□ Verify bridged_at updated to now()
□ Verify coding_value_id set on mirror record
□ Open expense form, verify new dimension in dropdown
□ Update record in ERP, re-sync
□ Verify updated_at > bridged_at
□ Run Bridge again
□ Verify CodingValue updated
```

---

## Rollback Plan

### If Bridge Fails in Production

1. **Disable cron job** — Comment out in Oban config
2. **Cancel pending jobs** — `Oban.cancel_all_jobs(:bridge)`
3. Bridge failure does NOT affect sync — sync continues working
4. Investigate logs, fix issue, re-enable

### If Migration Fails

**Migration 1 (entity_id optional):**
- Rollback will DELETE workspace-wide records (entity_id = NULL)
- Export these first if needed:
  ```sql
  SELECT * FROM coding_dimension_types WHERE entity_id IS NULL;
  SELECT * FROM coding_dimension_values WHERE entity_id IS NULL;
  ```

**Migration 2 (bridged_at):**
- Safe to rollback — just removes column

---

## Performance Considerations

### Batch Sizes

| Setting | Value | Rationale |
|---------|-------|-----------|
| Query limit per run | 10,000 | Safety cap; prevents runaway queries |
| Processing batch size | 100 | Balance between memory and DB round-trips |

### Expected Performance

| Metric | Expected | Alert Threshold |
|--------|----------|-----------------|
| Records per run | 0-1000 | > 5000 (unusual) |
| Duration | 5-30 seconds | > 2 minutes |
| Memory | < 100MB | > 500MB |

### Tuning

If Bridge is slow:
1. Reduce `@batch_size` in service (trade memory for speed)
2. Add more workers to `:bridge` queue
3. Check for missing indexes on `bridged_at`

---

## Monitoring & Alerting

### Key Metrics to Track

```elixir
# In BridgeWorker, emit these:
PrometheusMetricsService.emit_counter("bridge_runs_total", 1, %{status: "success|failure"})
PrometheusMetricsService.emit_histogram("bridge_duration_ms", duration)
PrometheusMetricsService.emit_gauge("bridge_records_processed", total_bridged)
```

### Suggested Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Bridge failing | 3 consecutive failures | Warning |
| Bridge slow | Duration > 2 min | Warning |
| Bridge backlog | > 10,000 unbridged records | Info |

### Log Queries (Loki)

```
# Find Bridge errors
{app="flame_teampay_payables"} |= "BridgeWorker" |= "error"

# Track bridging activity
{app="flame_teampay_payables"} |= "BridgeReactor" |= "Bridging"
```

---

## Known Edge Cases

### 1. Record Deleted Between Query and Process

**Scenario:** Record queried, then deleted before we process it.
**Handling:** Service catches error, logs warning, continues with next record.

### 2. Concurrent Bridge Runs

**Scenario:** Two Bridge jobs running simultaneously.
**Handling:** Oban uniqueness prevents overlap. But if it happens:
- Same record may be processed twice
- Upsert is idempotent — no data corruption

### 3. ERP Connection Deleted Mid-Bridge

**Scenario:** Admin deletes ERP connection while Bridge is running.
**Handling:** 
- Mirror records cascade-delete (on_delete: :delete)
- CodingValue.erp_connection_id nilified (on_delete: :nilify)
- Bridge continues; orphaned processing is safe

### 4. Very Large Sync

**Scenario:** Initial sync creates 50,000 departments.
**Handling:**
- Bridge processes 10,000 per run (limit)
- 5 runs × 2 min = 10 min to fully bridge
- UI shows dimensions as they're bridged

### 5. Hierarchy Across Batches

**Scenario:** Parent department in batch 2, child in batch 1.
**Handling:**
- Pass 1: Create all CodingValues (no parent_id)
- Pass 2: Resolve hierarchy
- Works within batch; cross-batch hierarchy waits for next run

---

## Files to Grep for Query Updates

After deployment, search for these patterns and update to include workspace-wide:

```bash
# Find entity_id equality checks
rg "entity_id == \^" --type elixir

# Find entity_id in filter expressions
rg "entity_id == \^arg" --type elixir

# Common locations:
# - lib/flame_teampay_payables_web/live/**/*.ex
# - lib/flame_teampay_payables/ember_coding/**/*.ex
# - lib/flame_teampay_payables/ember_expense_card/**/*.ex
```

**Pattern to apply:**
```elixir
# BEFORE
|> Ash.Query.filter(entity_id == ^entity_id)

# AFTER
|> Ash.Query.filter(entity_id == ^entity_id or is_nil(entity_id))
```

---

## Dependencies

### What Must Exist Before Bridge Works

1. `:bridge` Oban queue configured
2. `bridged_at` column exists on all 8 mirror tables
3. `entity_id` is nullable on CodingCategory/CodingValue
4. Partial unique indexes exist (from migration)
5. `link_and_bridge` action exists on mirror resources

### What Bridge Does NOT Depend On

- UnifiedDimensionBridgeService (will be deprecated)
- Sync completing successfully (Bridge handles records whenever they appear)
- Any specific ERP provider (works with all)

---

## Questions for Engineering

Before implementing, clarify:

1. **Observability services:** Are `PrometheusMetricsService`, `LokiLoggingService`, `TempoTracingService` already available?

2. **Test database:** Do integration tests have a clean database with ERP mirror tables?

3. **Oban Pro:** Is `Oban.Pro.Worker` available, or should we use `Oban.Worker`?

4. **Feature flag:** Should Bridge be behind a feature flag for gradual rollout?

---

## Contacts

| Role | Who | For What |
|------|-----|----------|
| Design | Sync Committee | Architecture questions |
| Sync | (TBD) | How sync populates mirrors |
| Coding Domain | (TBD) | CodingCategory/CodingValue behavior |
| Oban | (TBD) | Queue/worker configuration |

---

## Appendix: Quick Copy-Paste

### Add bridged_at to a Resource

```elixir
# In attributes block
attribute :bridged_at, :utc_datetime_usec, 
  allow_nil?: true, 
  public?: true,
  description: "When this record was last bridged to CodingValue"

# In actions block
update :link_and_bridge do
  description "Link to CodingValue and mark as bridged"
  require_atomic? false
  accept [:coding_value_id, :bridged_at]
end

# In code_interface block
define :link_and_bridge
```

### Query Needs-Bridging Records

```elixir
resource
|> Ash.Query.filter(expr(is_nil(bridged_at) or updated_at > bridged_at))
|> Ash.Query.limit(10_000)
|> Ash.read!(authorize?: false)
```

### Include Workspace-Wide in Dropdown

```elixir
CodingCategory
|> Ash.Query.filter(
  is_active == true and (entity_id == ^entity_id or is_nil(entity_id))
)
|> Ash.read!(tenant: workspace_id, authorize?: false)
```

---

*Document created: 2025-12-22 by Sync Committee*
*Good luck, engineers! 🚀*

