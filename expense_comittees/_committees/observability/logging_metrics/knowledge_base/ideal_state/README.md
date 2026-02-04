# Ideal State

> **Purpose**: Document what world-class observability looks like  
> **Status**: Vision documents needed

---

## Overview

This section documents the ideal state of observability we're working toward. It should be informed by best practices and updated as our vision evolves.

---

## Documents

| Document | Status | Last Updated |
|----------|--------|--------------|
| logging_vision.md | 🔴 Not Created | — |
| metrics_vision.md | 🔴 Not Created | — |
| tracing_vision.md | 🔴 Not Created | — |
| dashboard_vision.md | 🔴 Not Created | — |
| alerting_vision.md | 🔴 Not Created | — |

---

## Vision Principles

### 1. Complete Observability
Every request, every operation, every error should be observable. No blind spots.

### 2. Correlated Data
Logs, metrics, and traces should be linkable via correlation IDs. One ID unlocks everything.

### 3. Structured Everything
All logs should be structured JSON. All metrics should follow naming conventions. All traces should follow span conventions.

### 4. Actionable Dashboards
Every dashboard should answer a question. Every panel should inform a decision.

### 5. Meaningful Alerts
Every alert should be actionable. Every alert should have a runbook. No alert fatigue.

### 6. Local Parity
Local development should have the same observability as production.

### 7. Automated Provisioning
Dashboards, alerts, and configurations should be provisioned as code.

### 8. Cost Awareness
Observability should provide value exceeding its cost. Sampling and retention should be optimized.

---

## Ideal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Logging   │  │   Metrics   │  │   Tracing   │              │
│  │  (Logger)   │  │ (Telemetry) │  │   (OTel)    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         │    ┌───────────┴───────────┐    │                      │
│         │    │   Correlation ID      │    │                      │
│         │    └───────────────────────┘    │                      │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │   Loki   │    │Prometheus│    │  Tempo   │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
                   ┌──────────┐
                   │ Grafana  │
                   │Dashboard │
                   │  Alerts  │
                   └──────────┘
```

---

## Key Capabilities

### Logging
- [ ] Structured JSON logging
- [ ] Correlation ID in every log
- [ ] Appropriate log levels
- [ ] Async with backpressure
- [ ] PII redaction
- [ ] Queryable in Loki

### Metrics
- [ ] RED metrics (Rate, Errors, Duration)
- [ ] Business metrics
- [ ] BEAM VM metrics
- [ ] Cardinality managed
- [ ] Prometheus scraping
- [ ] Recording rules

### Tracing
- [ ] OpenTelemetry integration
- [ ] Context propagation
- [ ] Span naming conventions
- [ ] Sampling strategy
- [ ] Tempo storage
- [ ] Exemplars

### Dashboards
- [ ] Service overview dashboards
- [ ] Domain dashboards
- [ ] SLO dashboards
- [ ] Provisioned as code
- [ ] Variables for filtering

### Alerts
- [ ] SLO-based alerts
- [ ] Runbooks for every alert
- [ ] Appropriate thresholds
- [ ] Alert correlation
- [ ] Escalation policies

---

*"The ideal state is not a destination; it's a direction."*

