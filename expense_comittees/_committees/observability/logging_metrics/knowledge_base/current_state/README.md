# Current State

> **Purpose**: Document what observability exists today  
> **Status**: ✅ Assessed (Session 2026-01-24_001)  
> **Last Updated**: 2026-01-24

---

## Overview

This section documents the current state of observability in the expense management platform. Last comprehensive gap analysis completed on 2026-01-24.

---

## Executive Summary

| Component | Status | Maturity |
|-----------|--------|----------|
| **Grafana Loki** | ✅ Operational | 🟢 70% complete |
| **Prometheus** | ⚠️ Underutilized | 🟡 30% complete |
| **Tempo** | ⚠️ Partial | 🟡 40% complete |
| **Dashboards** | ✅ 15 dashboards | 🟢 Good coverage |
| **Alerting** | ❌ None | 🔴 Critical gap |
| **Documentation** | ⚠️ Partial | 🟡 Improving |

---

## Infrastructure

### Grafana Stack (Docker Compose)
- **Grafana**: http://localhost:3000 (admin/admin)
- **Loki**: http://localhost:3100 — Log aggregation
- **Prometheus**: http://localhost:9090 — Metrics collection
- **Tempo**: http://localhost:3200 — Distributed tracing

### Configuration Files
- `docker-compose.local.yml` — Local dev stack
- `provisioning/datasources/datasources.yml` — Data source configuration
- `provisioning/dashboards/dashboards.yml` — Dashboard provisioning

---

## Logging (Loki)

### Implementation
- **37 LokiLoggingService files** across domains
- **111+ logging functions** in ember_payments alone
- **LogBatchingGenServer** for async batching (100 logs or 100ms)
- **LokiLoggerBackend** for Logger integration
- **ObanLokiTelemetryHandler** for automatic job logging

### Domain Coverage

| Domain | LokiLoggingService | Maturity |
|--------|-------------------|----------|
| ember_payments | 111+ functions | 🟢 Excellent |
| ember_erp | Comprehensive | 🟢 Good |
| ember_reimbursements | Comprehensive | 🟢 Good |
| ember_approvals | Comprehensive | 🟢 Good |
| (33 other domains) | Present | 🟡 Varies |

### Technical Debt
- **21,755 bare Logger calls** across 1,621 files need migration

---

## Metrics (Prometheus)

### Implementation
- **35 PrometheusMetricsService files** exist
- **16 Telemetry.attach/execute calls** found — very low adoption
- Metrics infrastructure present but minimally used

### Gap
- Services defined but not actively emitting metrics
- Most dashboards query Loki for "metrics" (expensive)
- RED metrics not systematically collected

---

## Tracing (Tempo)

### Implementation
- **Tempo configured** in datasources.yml
- **Derived fields** link trace_id in Loki → Tempo
- **TempoTracingService** in ember_payments
- **OpenTelemetry integration** for some reactors

### Gap
- Low trace propagation across domains
- No cross-service tracing to external APIs
- No sampling strategy defined

---

## Dashboards

### Current Inventory (15 dashboards)

| Tier | Count | Purpose |
|------|-------|---------|
| Tier 1 | 1 | Executive overview |
| Tier 2 | 10 | Operational deep-dive |
| Tier 3 | 2 | Deep analysis |
| Infrastructure | 2 | System health |

See `provisioning/dashboards/README.md` for full catalog.

---

## Alerting

### Current State
**❌ NO ALERTING EXISTS**

- Zero alert rules defined
- No notification channels configured
- No runbooks created
- No SLOs defined

**This is the most critical gap in the system.**

---

## Identified Gaps (41 total)

| Severity | Count | Key Examples |
|----------|-------|--------------|
| 🔴 Critical | 5 | No alerting, no notification channels |
| 🔴 High | 8 | Prometheus underutilized, 21K bare Logger calls |
| 🟡 Medium | 17 | Dashboard organization, tracing adoption |
| 🟢 Low | 11 | Polish items, documentation |

Full gap analysis available in session 2026-01-24_001_comprehensive-gap-analysis.

---

## Recommended Priorities

1. **Implement basic alerting** — Define 5-10 critical alerts
2. **Enable RED metrics** — Rate, Errors, Duration via Prometheus
3. **Create migration guide** — Path for bare Logger to LokiLoggingService

---

*"What you cannot observe, you cannot improve."*

