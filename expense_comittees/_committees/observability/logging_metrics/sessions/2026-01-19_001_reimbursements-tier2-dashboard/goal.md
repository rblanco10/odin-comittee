# Session Goal

> **Session ID**: 2026-01-19_001_reimbursements-tier2-dashboard  
> **Type**: Design → Implementation  
> **Created**: 2026-01-19

---

## Primary Objective

Design and implement a comprehensive **Tier 2 Reimbursements Drill-Down Dashboard** that leverages all three observability pillars:
- **Grafana Loki** (Logs) — Event-based observability
- **Prometheus** (Metrics) — Quantitative measurements and alerting
- **Grafana Tempo** (Traces) — Distributed tracing and request flow visualization

---

## Success Criteria

- [ ] Dashboard provides complete visibility into reimbursement lifecycle
- [ ] All reimbursement flows are observable (Submission → Approval → Payment)
- [ ] Prometheus metrics used natively for rate/duration/count visualizations
- [ ] Tempo integration for trace exploration and latency breakdown
- [ ] Loki used for event logs, error details, and status distributions
- [ ] Three pillars are correlated (trace_id linkage between logs/traces)
- [ ] Dashboard is drill-down ready from Tier 1 Business Overview
- [ ] Dashboard follows approved logging standards

---

## Scope Boundaries

### IN SCOPE
- Tier 2 Reimbursements dashboard design
- Native Prometheus metrics visualization
- Native Tempo trace panels/links
- Loki log panels and status queries
- Provider-level breakdown (Dwolla, Checkbook, Moov)
- Payment rail breakdown (ACH, Check)
- Approval workflow visibility
- Error analysis panels

### OUT OF SCOPE
- Tier 1 dashboard modifications (done in prior session)
- New instrumentation beyond what exists (flag as gaps)
- Alerting rule definition (separate session)
- Tempo tracing instrumentation (if not exists, flag as gap)

---

## Expected Outputs

1. **Dashboard Design Document** — Panel layout and query specifications
2. **Dashboard JSON** — `tier2-reimbursements.json` provisioning file
3. **Gap Analysis** — Any missing instrumentation for full observability
4. **PromQL/LogQL/TraceQL Reference** — Query patterns for each panel

---

## Related Prior Work

- Session 2026-01-17_001: Logging standard approved, Tier 1 redesigned
- `logging_standard.md`: 528-line comprehensive standard
- `PrometheusMetricsService`: Existing telemetry events
- `LokiLoggingService`: Existing Loki logging events
