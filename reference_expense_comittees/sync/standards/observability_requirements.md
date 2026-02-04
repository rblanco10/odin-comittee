# Observability Requirements

> **Defines the three-pillar observability requirements for sync operations.**

---

## Three Pillars

All sync operations must be instrumented across:

1. **Tempo (Traces)** — Distributed tracing for request flow
2. **Loki (Logs)** — Structured logging for debugging
3. **Prometheus (Metrics)** — Metrics for alerting and dashboards

---

## Trace Requirements (Tempo)

### Required Spans

Every sync operation must have these spans:

| Operation | Span Name | Required Attributes |
|-----------|-----------|---------------------|
| Full sync | `sync.full` | workspace_id, erp_connection_id, entity_types |
| Entity sync | `sync.{entity_type}` | workspace_id, erp_connection_id, record_count |
| ERP fetch | `erp.fetch` | provider, entity_type, page_number |
| Mapping | `mapper.{entity_type}` | provider, field_count |
| Database write | `db.upsert` | entity_type, action (insert/update) |

### Span Nesting

```
sync.full
├── sync.vendors
│   ├── erp.fetch (page 1)
│   ├── mapper.vendor (batch 1)
│   ├── db.upsert (batch 1)
│   ├── erp.fetch (page 2)
│   └── ...
├── sync.bills
│   └── ...
└── ...
```

### Required Attributes

All spans must include:
- `workspace_id`
- `erp_connection_id`
- `trace_id` (automatic)
- `span_id` (automatic)

Entity-specific spans should include:
- `entity_type`
- `provider`
- `record_count` (when applicable)

### Context Propagation

Context must flow through:
- Reactor steps
- Oban jobs
- Async operations

```elixir
# Correct: Pass context to Oban job
%{
  "workspace_id" => workspace_id,
  "otel_ctx" => RI.current_context()  # Serialize context
}

# In job: Restore context
RI.restore_parent_context(args["otel_ctx"])
```

---

## Log Requirements (Loki)

### Structured Logging

All logs must be structured (not string interpolation):

```elixir
# ✅ Correct: Structured
Logger.info("Sync completed", %{
  workspace_id: workspace_id,
  entity_type: :vendor,
  record_count: 150,
  duration_ms: 3500
})

# ❌ Wrong: String interpolation
Logger.info("Sync completed for #{workspace_id}, #{record_count} records")
```

### Required Log Events

| Event | Level | Required Fields |
|-------|-------|-----------------|
| Sync started | info | workspace_id, entity_type, sync_type |
| Sync completed | info | workspace_id, entity_type, record_count, duration_ms |
| Sync failed | error | workspace_id, entity_type, error, trace_id |
| Record skipped | warning | workspace_id, entity_type, external_id, reason |
| Mapper error | error | provider, entity_type, error, erp_data (sanitized) |

### Correlation

All logs must include:
- `trace_id` (for correlation with traces)
- `workspace_id` (for filtering by tenant)
- `erp_connection_id` (for filtering by connection)

---

## Metric Requirements (Prometheus)

### Required Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `sync_duration_seconds` | histogram | provider, entity_type, sync_type | Duration of sync operations |
| `sync_records_total` | counter | provider, entity_type, status | Count of synced records |
| `sync_errors_total` | counter | provider, entity_type, error_type | Count of sync errors |
| `sync_in_progress` | gauge | provider, workspace_id | Currently running syncs |
| `mapper_duration_seconds` | histogram | provider, entity_type | Duration of mapping |
| `mapper_errors_total` | counter | provider, entity_type | Count of mapping errors |

### Label Guidelines

- **Avoid high cardinality**: Don't use `record_id` as a label
- **Use enums**: Labels should be from known sets (provider, entity_type)
- **Be consistent**: Same label names across all metrics

### Alerting Thresholds

Metrics should enable these alerts:
- Sync duration > 5 minutes
- Error rate > 5% of records
- Sync not completing (in_progress for > 30 minutes)
- Mapper errors > 1% of records

---

## Implementation Pattern

Use the ReactorInstrumentation (RI) helper:

```elixir
alias FlameTeampayPayables.Observability.ReactorInstrumentation, as: RI

def sync_entity(entity_type, workspace_id, erp_connection_id) do
  RI.with_step("sync.#{entity_type}", [
    workspace_id: workspace_id,
    erp_connection_id: erp_connection_id,
    entity_type: entity_type
  ], fn ->
    # Sync logic here
  end)
end
```

---

## Checklist for Observability Compliance

- [ ] Root span for overall operation
- [ ] Child spans for sub-operations
- [ ] Spans include required attributes
- [ ] Context propagates through async
- [ ] Logs are structured (not strings)
- [ ] Logs include trace_id
- [ ] Error logs include full context
- [ ] Duration histogram exists
- [ ] Counter for records/errors exists
- [ ] Labels are low-cardinality

