# Dashboard Inventory

> **Last Updated**: 2026-01-19  
> **Updated By**: Session 2026-01-19_001_reimbursements-tier2-dashboard

---

## Dashboard Taxonomy

The observability dashboards follow a **Two-Tier + Drill-Down** structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1: Business Overview                                       │
│  "Can employees spend? Can we pay vendors? Are ERPs in sync?"    │
│                                                                  │
│  └── Click any gauge to drill down to Tier 2                     │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2: Domain Drill-Downs                                      │
│  "What's broken? Where? Why?"                                    │
│                                                                  │
│  • Reimbursements Ops View  ✅ IMPLEMENTED                       │
│  • Cards Ops View           🔲 TODO                              │
│  • AP Payments Ops View     🔲 TODO                              │
│  • ERP Sync Ops View        🔲 TODO                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Inventory

### Tier 1 Dashboards

| Dashboard | UID | File | Status |
|-----------|-----|------|--------|
| Business Overview | `tier1-business-overview` | `tier1-business-overview.json` | ✅ Active |

### Tier 2 Dashboards

| Dashboard | UID | File | Status | Drill-Down From |
|-----------|-----|------|--------|-----------------|
| Reimbursements Ops View | `tier2-reimbursements` | `tier2-reimbursements.json` | ✅ Active | Tier 1 → 💰 Reimbursements |
| Cards Ops View | — | — | 🔲 TODO | Tier 1 → 💳 Card Operations |
| AP Payments Ops View | — | — | 🔲 TODO | Tier 1 → 🏦 AP Payments |
| ERP Sync Ops View | — | — | 🔲 TODO | Tier 1 → 🔄 ERP Sync |

### Supporting Dashboards

| Dashboard | UID | File | Status |
|-----------|-----|------|--------|
| System Overview | `system-overview` | `system-overview.json` | ✅ Legacy |
| Payment Operations | `payment-operations` | `payment-operations.json` | ✅ Legacy |
| ERP Integration Health | `erp-integration-health` | `erp-integration-health.json` | ✅ Legacy |
| Oban Jobs | `oban-jobs` | `oban-jobs.json` | ✅ Active |

---

## File Location

All dashboard JSON files are provisioned from:

```
campsite/pit/docker/grafana/provisioning/dashboards/
├── dashboards.yml                    # Provisioning config
├── tier1-business-overview.json      # Tier 1
├── tier2-reimbursements.json         # Tier 2 - Reimbursements
├── system-overview.json              # Legacy
├── payment-operations.json           # Legacy
├── erp-integration-health.json       # Legacy
├── oban-jobs.json                    # Oban monitoring
└── README.md                         # Documentation
```

---

## Tier 2 Dashboard Pattern

All Tier 2 dashboards follow the "Ops-First" design pattern:

### Row Structure

1. **What's Broken Right Now?** - Traffic lights, stuck items, error counts
2. **Flow Pipeline** - Visual representation of items at each stage
3. **Recent Failures** - Error table with trace links
4. **Health Metrics** - Success rates, comparisons
5. **Throughput** - Prometheus rate/latency graphs
6. **Live Stream** - Loki log panel

### Three-Pillar Integration

| Pillar | Use For |
|--------|---------|
| Loki | Event counts, status distributions, error details, log stream |
| Prometheus | Aggregated rates, latency percentiles |
| Tempo | Trace links for debugging |

### Navigation

- Each Tier 2 dashboard has "← Back to Tier 1" link
- Each Tier 2 dashboard has "Explore in Tempo →" link
- Error tables have trace_id links to Tempo

---

## Access

### Local Development

```bash
cd campsite/pit/docker
docker compose -f docker-compose.local.yml up -d
```

| Service | URL |
|---------|-----|
| Grafana | http://localhost:3000 |
| Tier 1 | http://localhost:3000/d/tier1-business-overview |
| Tier 2 Reimbursements | http://localhost:3000/d/tier2-reimbursements |

---

## Creating New Tier 2 Dashboards

To create a new Tier 2 dashboard (e.g., Cards):

1. Copy `tier2-reimbursements.json` as template
2. Update dashboard metadata (title, uid, tags)
3. Update panel queries for the domain
4. Add drill-down link to Tier 1 panel
5. Save to `provisioning/dashboards/`

See session `2026-01-19_001_reimbursements-tier2-dashboard` for reference.

---

*"What you cannot observe, you cannot improve."*
