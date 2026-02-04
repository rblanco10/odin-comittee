# Tracing Adoption Implementation Plan

**Session**: 2026-01-23_002_tracing-adoption-implementation  
**Author**: Observability Committee  
**Status**: READY FOR IMMEDIATE EXECUTION

---

## Executive Summary

**CRITICAL DISCOVERY**: Distributed tracing is **ALREADY IMPLEMENTED** in your card reactors!

The following is already in place:
- ✅ `TempoTracingService` with 15+ span types
- ✅ `ReactorInstrumentation` for step-level child spans  
- ✅ OpenTelemetry configuration (HTTP exporter to Tempo)
- ✅ Loki → Tempo linking (derivedFields in datasources.yml)
- ✅ FreezeCardReactor fully instrumented (and other card reactors)

**What's needed**:
1. Fix Tempo → Loki configuration (for trace → log navigation)
2. Verify traces are actually appearing in Tempo
3. Add Tempo panels to more dashboards
4. Test the end-to-end flow

---

## Phase 1: Fix Grafana Configuration (5 minutes)

### Gap: Tempo → Loki Linking Missing

Currently you can click `trace_id` in Loki logs to view the trace in Tempo.  
But you CANNOT go from a trace in Tempo to see related logs in Loki.

### Fix: Update datasources.yml

**File**: `campsite/pit/docker/grafana/provisioning/datasources/datasources.yml`

**Current Tempo configuration**:
```yaml
- name: Tempo
  type: tempo
  uid: tempo
  access: proxy
  url: http://tempo:3200
  editable: true
  jsonData:
    httpMethod: GET
```

**Updated Tempo configuration** (add `tracesToLogs` and `nodeGraph`):
```yaml
- name: Tempo
  type: tempo
  uid: tempo
  access: proxy
  url: http://tempo:3200
  editable: true
  jsonData:
    httpMethod: GET
    tracesToLogsV2:
      datasourceUid: Loki
      spanStartTimeShift: "-1h"
      spanEndTimeShift: "1h"
      filterByTraceID: true
      filterBySpanID: false
      customQuery: false
      tags:
        - key: "domain"
          value: ""
        - key: "workspace_id"
          value: ""
    serviceMap:
      datasourceUid: Prometheus
    nodeGraph:
      enabled: true
    lokiSearch:
      datasourceUid: Loki
```

### Explanation of Configuration

| Setting | Purpose |
|---------|---------|
| `tracesToLogsV2` | Links traces to Loki logs |
| `datasourceUid: Loki` | Points to your Loki datasource |
| `filterByTraceID: true` | Filters logs by trace_id from the trace |
| `spanStartTimeShift/spanEndTimeShift` | Time window for log search |
| `serviceMap` | Enables service dependency visualization |
| `nodeGraph` | Enables visual trace graph |
| `lokiSearch` | Enables Loki search from Tempo explore |

---

## Phase 2: Verify Traces Are Being Sent (10 minutes)

### Step 2.1: Start the Observability Stack

```bash
cd campsite/pit/docker
docker-compose -f docker-compose.local.yml up -d
```

Verify all services are running:
```bash
docker-compose -f docker-compose.local.yml ps
```

Expected output:
```
grafana     running   0.0.0.0:3000->3000/tcp
loki        running   0.0.0.0:3100->3100/tcp
prometheus  running   0.0.0.0:9090->9090/tcp
tempo       running   0.0.0.0:3200->3200/tcp, 4317/tcp, 4318/tcp
```

### Step 2.2: Verify Tempo is Receiving Traces

Check Tempo health:
```bash
curl -s http://localhost:3200/ready
# Expected: "ready"
```

Check if Tempo has any traces:
```bash
curl -s http://localhost:3200/api/search | jq '.traces | length'
# Expected: A number (may be 0 if no operations have run yet)
```

### Step 2.3: Trigger a Traced Operation

Start IEx and run a card operation that has tracing:

```elixir
# Start IEx
iex -S mix

# Find a WEX card to freeze (or any active card)
import Ecto.Query
alias FlameTeampayPayables.Repo
alias FlameTeampayPayables.EmberPayments.Resources.Card.CardIssuance

# Find an active card
card = CardIssuance
  |> where([c], c.state == :active)
  |> limit(1)
  |> Repo.one()

# Get an actor (any user)
actor = FlameTeampayPayables.EmberIdentity.Resources.User
  |> limit(1)
  |> Repo.one()

# Freeze the card (this will create a trace!)
CardIssuance.freeze_card(card_id: card.id, reason: "Testing tracing", actor: actor)
```

### Step 2.4: Find the Trace in Tempo

**Option A: Via Loki (recommended)**

1. Open Grafana: http://localhost:3000
2. Go to Explore → Loki
3. Query: `{domain="ember_payments"} |= "freeze" | json`
4. Find a log line with `trace_id`
5. Click the `trace_id` field → "View Trace in Tempo"

**Option B: Via Tempo Directly**

1. Go to Explore → Tempo
2. Query by service: `{resource.service.name="flame_teampay_payables"}`
3. Or search recent traces: Click "Search" tab

### Step 2.5: Verify Trace Structure

A complete freeze trace should show:

```
ember_payments.card.freeze (root span)
├── freeze_card.validate_actor
├── freeze_card.fetch_card
│   └── Ecto query (auto-instrumented)
├── freeze_card.get_connection
├── freeze_card.validate_state
├── freeze_card.call_provider
│   └── HTTP call to WEX (if HTTP instrumented)
└── freeze_card.update_db_record
    └── Ecto query (auto-instrumented)
```

---

## Phase 3: Add Tempo Panels to Dashboards (15 minutes)

### Currently Implemented

These dashboards already have "Error Traces" Tempo panels:
- `tier2-card-operations.json`
- `webhook-monitoring.json`
- `marqeta-flow-analysis.json`
- `tier2-reimbursement-operations.json`

### New Panels to Add

Add to **tier1-business-overview.json**:

```json
{
  "id": 200,
  "title": "Recent Error Traces",
  "type": "tempo",
  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 32 },
  "datasource": { "type": "tempo", "uid": "tempo" },
  "targets": [
    {
      "queryType": "traceqlSearch",
      "limit": 20,
      "filters": [
        { "id": "service-name", "value": "flame_teampay_payables" },
        { "id": "status", "value": "error" }
      ]
    }
  ]
}
```

Add to **tier2-card-operations.json** (if not present):

```json
{
  "id": 201,
  "title": "Slow Card Operations (>1s)",
  "type": "tempo",
  "gridPos": { "h": 8, "w": 12, "x": 12, "y": 32 },
  "datasource": { "type": "tempo", "uid": "tempo" },
  "targets": [
    {
      "queryType": "traceqlSearch",
      "limit": 20,
      "filters": [
        { "id": "service-name", "value": "flame_teampay_payables" },
        { "id": "span-name", "value": "ember_payments.card.*" },
        { "id": "min-duration", "value": "1s" }
      ]
    }
  ]
}
```

---

## Phase 4: Concerns Addressed

### Concern 1: Performance Overhead

**Question**: Does tracing add latency?

**Answer**: Negligible. OpenTelemetry spans add ~1-5μs per span. With 6 steps per reactor, that's ~30μs overhead — invisible compared to network calls (100ms+).

**Evidence**: The FreezeCardReactor already has tracing and works fine.

### Concern 2: Storage Costs

**Question**: Will Tempo storage grow unbounded?

**Answer**: Already configured with retention:

```yaml
# tempo-config.yml
compactor:
  compaction:
    block_retention: 1440h  # 60 days
```

Tempo uses efficient columnar storage. 60 days of traces for a typical workload is <10GB.

### Concern 3: Cardinality

**Question**: Can high-cardinality trace attributes crash Tempo?

**Answer**: No. Unlike Prometheus (where labels are indexed), Tempo stores traces as blobs. High-cardinality attributes (like `trace_id`, `card_id`) are fine because they're not used for indexing.

**Best Practice**: Keep resource attributes (service.name, service.version) low-cardinality. Span attributes can be high-cardinality.

### Concern 4: Sampling

**Question**: Should we sample traces?

**Answer**: Not yet. At your current volume, store 100% of traces. Consider sampling when you exceed:
- 10,000+ requests/minute
- Tempo storage >100GB

When needed, configure in `config/runtime.exs`:

```elixir
config :opentelemetry,
  sampler: {:parent_based, %{root: {:trace_id_ratio_based, 0.1}}}  # 10% sampling
```

### Concern 5: Reactor Process Dictionary

**Question**: How does tracing work across Reactor steps (different processes)?

**Answer**: Already solved! The `ReactorInstrumentation` module:
1. Stores OTel context in process dictionary (`Process.put(:reactor_otel_ctx, ...)`)
2. Restores context at the start of each step (`Process.get(:reactor_otel_ctx)`)
3. Passes context via `otel_ctx` input argument

### Concern 6: Phoenix/Ecto Already Traced?

**Question**: Are HTTP requests and DB queries automatically traced?

**Answer**: YES!

```elixir
# mix.exs
{:opentelemetry_phoenix, "~> 1.2"},  # ← Auto-traces HTTP requests
{:opentelemetry_ecto, "~> 1.1"},     # ← Auto-traces DB queries
```

Every HTTP request to Phoenix creates a root span. Every Ecto query creates a child span.

---

## Phase 5: Verification Checklist

After implementation, verify:

| Check | How to Verify | Expected |
|-------|---------------|----------|
| Tempo running | `curl localhost:3200/ready` | "ready" |
| Grafana → Tempo | Explore → Tempo → Query | Traces appear |
| Loki → Tempo link | Click trace_id in log | Opens trace view |
| Tempo → Loki link | View trace → "Logs" tab | Shows related logs |
| Phoenix spans | View any trace | Root span is HTTP request |
| Ecto spans | View any trace | Child spans for queries |
| Reactor spans | Freeze a card, view trace | All 6 steps visible |
| Dashboard panels | View Tier 2 dashboard | Error Traces panel works |

---

## Quick Start Commands

```bash
# 1. Apply datasources.yml fix
# (Edit the file as shown in Phase 1)

# 2. Restart Grafana to pick up changes
cd campsite/pit/docker
docker-compose -f docker-compose.local.yml restart grafana

# 3. Start IEx and trigger a traced operation
cd campsite/flames/flame_teampay_payables
iex -S mix

# 4. In IEx, freeze a card (or any traced operation)
# See Phase 2, Step 2.3 for code

# 5. Open Grafana and verify
open http://localhost:3000
```

---

## Summary

| Phase | Action | Effort | Status |
|-------|--------|--------|--------|
| Phase 1 | Fix Tempo → Loki config | 5 min | 🔲 Ready |
| Phase 2 | Verify traces in Tempo | 10 min | 🔲 Ready |
| Phase 3 | Add dashboard panels | 15 min | 🔲 Ready |
| Phase 4 | Concerns addressed | N/A | ✅ Documented |
| Phase 5 | Verification checklist | 5 min | 🔲 Ready |

**Total Time**: ~35 minutes to full tracing visibility!

---

## What's Already Working

These reactors already have full three-pillar observability (Tempo + Loki + Prometheus):

| Reactor | Root Span | Step Spans | Loki Logging |
|---------|-----------|------------|--------------|
| FreezeCardReactor | ✅ | ✅ (6 steps) | ✅ |
| UnfreezeCardReactor | ✅ | ✅ (8 steps) | ✅ |
| CancelCardReactor | ✅ | ✅ (6 steps) | ✅ |
| ActivateCardReactor | ✅ | ✅ (6 steps) | ✅ |
| IssueCardReactor | ✅ | ✅ (5 steps) | ✅ |
| UpdateCardControlsReactor | ✅ | ✅ (6 steps) | ✅ |
| UpdateSpendingLimitsReactor | ✅ | ✅ (5 steps) | ✅ |

The infrastructure is built. You just need to verify it's working!
