# Gap Analysis: Logging Standard vs. Current Implementation

> **Session**: 2026-01-17_001_current-state-discovery  
> **Author**: Dr. Kenji Tanaka (Research Librarian)  
> **Date**: 2026-01-17  
> **Status**: COMPLETE

---

## Executive Summary

**Overall Assessment**: 🟢 **MATURE INFRASTRUCTURE** with targeted gaps for Tier 1

The logging infrastructure is **significantly more mature** than anticipated:
- **42 domain-specific LokiLoggingService modules** exist
- **746 usages** across 129 files
- Consistent patterns across domains
- Key labels (`domain`, `event_type`, `provider`, `status`) are in place

**Primary Gap**: Current Tier 1 dashboard is **domain-centric**, not **business-centric** as decided.

---

## 1. Logging Service Coverage

### 1.1 Domain LokiLoggingService Inventory

| Domain | Module | Lines | Key Events | Status |
|--------|--------|-------|------------|--------|
| `ember_payments` | `EmberPayments.Observability.Services.LokiLoggingService` | 856 | payment_initiation, card_issuance, card_activation, freeze, cancel, KYB | 🟢 Complete |
| `ember_erp` | `EmberErp.Observability.Services.LokiLoggingService` | 574 | push, sync, webhook, health_check, confidence_score | 🟢 Complete |
| `ember_reimbursements` | `EmberReimbursements.Observability.Services.LokiLoggingService` | 331 | submission, payment, approval, rejection, receipt_matching | 🟢 Complete |
| `ember_document_intake` | `EmberDocumentIntake.Observability.Services.LokiLoggingService` | ~200 | document_processing, webhook_processing | 🟢 Complete |
| `ember_communications` | `EmberCommunications.Observability.Services.LokiLoggingService` | ~150 | message_creation, message_delivery | 🟢 Complete |
| `ember_coding` | `EmberCoding.Rules.Services.LokiLoggingService` | ~200 | evaluation_start/end, rule_match | 🟢 Complete |
| `ember_approvals` | `EmberApprovals.Observability.Services.LokiLoggingService` | ~150 | decision_processing | 🟢 Complete |
| + 34 more | Various | ~100 each | Domain-specific events | 🟢 Present |

**Total**: 42 domain LokiLoggingService modules

### 1.2 Label Compliance

| Required Label (per standard) | Current Usage | Status |
|-------------------------------|---------------|--------|
| `domain` | ✅ All services set this | 🟢 Compliant |
| `event_type` | ✅ All services set this | 🟢 Compliant |
| `level` | ⚠️ Some services default to "info" | 🟡 Partial |
| `status` | ✅ Present in `_end` events | 🟢 Compliant |
| `provider` | ✅ Present when applicable | 🟢 Compliant |

### 1.3 Field Compliance

| Required Field (per standard) | Current Usage | Status |
|-------------------------------|---------------|--------|
| `message` | ✅ All events have message | 🟢 Compliant |
| `workspace_id` | ✅ Most events include this | 🟢 Compliant |
| `duration_ms` | ✅ Present in `_end` events | 🟢 Compliant |
| `trace_id` | ✅ When available | 🟢 Compliant |
| `error_type` | ✅ In error events | 🟢 Compliant |

---

## 2. Provider Coverage

### 2.1 Identified Providers

| Provider | Domain | Type | Logging Status |
|----------|--------|------|----------------|
| `dwolla` | ember_payments | ACH/Wire | 🟢 Full coverage |
| `checkbook` | ember_payments | Check | 🟢 Full coverage |
| `marqeta` | ember_payments | Card issuing | 🟢 Full coverage |
| `wex_fleet` | ember_payments | Fleet cards | 🟢 Full coverage |
| `netsuite` | ember_erp | ERP | 🟢 Full coverage |
| `quickbooks` | ember_erp | ERP | 🟢 Full coverage |
| `sendgrid` | ember_communications | Email | 🟢 Full coverage |

### 2.2 Provider Label Usage

The `provider` label is correctly used as a **low-cardinality label** (good!) with values:
- Payment providers: `dwolla`, `checkbook`, `marqeta`, `wex`, `wex_fleet`
- ERP providers: `netsuite`, `quickbooks`, `xero`, `sage`
- Integration providers: `sendgrid`, `plaid`, `finch`

---

## 3. Current Tier 1 Dashboard Analysis

### 3.1 Current Panels (system-overview.json)

| Panel | Type | Query Source | Business Question Answered |
|-------|------|--------------|---------------------------|
| Request Rate by Domain | timeseries | Prometheus | ❌ Technical metric only |
| Error Rate by Domain | timeseries | Prometheus | ❌ Technical metric only |
| Payment Latency Percentiles | timeseries | Prometheus | ❌ Technical metric only |
| ERP Push Latency Percentiles | timeseries | Prometheus | ❌ Technical metric only |
| Phoenix Endpoint P95 Latency | gauge | Prometheus | ❌ Infrastructure only |
| Database Query P95 Latency | gauge | Prometheus | ❌ Infrastructure only |
| Payment Success Rate | gauge | Prometheus | 🟡 Partial (no provider breakdown) |
| VM Memory Usage | gauge | Prometheus | ❌ Infrastructure only |
| VM Run Queue Lengths | timeseries | Prometheus | ❌ Infrastructure only |
| Database Query Breakdown | timeseries | Prometheus | ❌ Infrastructure only |

### 3.2 Tier 1 Gaps vs. Business-Centric Design

**Required (per committee decision)** vs **Current State**:

| Business Question | Required Panel | Current State |
|-------------------|----------------|---------------|
| **Can employees spend money?** | Card Operations Health Gauge | ❌ MISSING |
| **Can employees get reimbursed?** | Reimbursements Health Gauge | ❌ MISSING |
| **Can we pay vendors?** | AP Payments Health Gauge | ❌ MISSING |
| **Are customer ERPs in sync?** | ERP Health Gauge | ❌ MISSING |
| **Which provider is broken?** | Provider Status Grid | ❌ MISSING |
| **What's failing right now?** | Error Spotlight (top offenders) | ❌ MISSING |
| Drill-down to Tier 2 | Links to capability dashboards | ❌ MISSING |

---

## 4. Data Source Gap

### 4.1 Prometheus vs. Loki

**Current Tier 1**: Uses **Prometheus metrics** exclusively

**Observation**: The logging_standard.md defines **Loki log events**, but the current dashboard uses **Prometheus metrics**.

**Question for Committee**: Should Tier 1 use:
- A) Loki LogQL queries (based on logs)
- B) Prometheus PromQL queries (based on telemetry metrics)
- C) Hybrid approach

**Recommendation**: Use **Prometheus for RED metrics** (rate, errors, duration) because:
1. Prometheus is optimized for time-series aggregation
2. `:telemetry` events already emit Prometheus metrics via `TelemetryMetricsPrometheus`
3. Loki queries are better for drill-down and log analysis

### 4.2 Required Prometheus Metrics for Business-Centric Tier 1

To answer the 5 business questions, we need these metrics:

| Question | Required Metric | Current Status |
|----------|-----------------|----------------|
| Can employees spend? | `ember_payments_card_issuance_stop_total{status}` | 🟢 Available |
| Can employees get reimbursed? | `ember_reimbursements_payment_stop_total{status}` | 🔴 Needs verification |
| Can we pay vendors? | `ember_payments_payment_initiation_stop_total{status, provider}` | 🟢 Available |
| ERPs in sync? | `ember_erp_sync_end_total{status, provider}` | 🟢 Available |
| Provider broken? | `*_stop_total{provider, status="error"}` | 🟢 Derivable |

---

## 5. Findings Summary

### 5.1 What's Working Well ✅

1. **Comprehensive logging infrastructure** across 42 domains
2. **Consistent labeling** (`domain`, `event_type`, `provider`, `status`)
3. **Start/end pattern** followed everywhere
4. **Provider tracking** enabled for all payment/ERP operations
5. **Error classification** with `error_type` labels

### 5.2 What Needs Work 🟡

1. **Tier 1 Dashboard**: Needs complete redesign from domain-centric to business-centric
2. **Provider Status Grid**: New panel type needed
3. **Health Gauges**: Need aggregated success rate per business capability
4. **Drill-down Links**: Need to add links to Tier 2 dashboards
5. **Error Spotlight**: Need top-N errors by type/provider panel

### 5.3 No Major Gaps 🟢

The **logging standard is already implemented**. No gaps between standard and reality for the logging itself.

---

## 6. Recommendations

### Immediate (This Session)

1. **Create new Tier 1 dashboard** based on business-centric design
2. Use **existing Prometheus metrics** (they exist!)
3. Add **Provider Status Grid** using `provider` label
4. Add **Health Gauges** per business capability
5. Add **Error Spotlight** panel

### Near-Term (Post-Session)

1. Verify all business-critical paths emit start/end events
2. Add dashboard links between Tier 1 → Tier 2
3. Create WEX pilot dashboard for Tier 2

---

## Appendix A: Existing Prometheus Metrics (Sample)

Based on dashboard queries, these metrics are available:

```promql
# Payment operations
ember_payments_payment_initiation_start_total
ember_payments_payment_initiation_stop_total{status}
ember_payments_payment_initiation_stop_bucket (histogram)
ember_payments_payment_initiation_exception_total

# ERP operations  
ember_erp_push_operation_start_total
ember_erp_push_operation_stop_total{status}
ember_erp_push_operation_stop_bucket (histogram)
ember_erp_push_operation_exception_total

# Card operations
ember_payments_card_issuance_start_total
ember_payments_card_issuance_stop_total{status, provider}

# Infrastructure
phoenix_router_dispatch_stop_duration_bucket
flame_teampay_payables_repo_query_total_time_bucket
vm_memory_total
vm_total_run_queue_lengths_*
```

---

## Appendix B: Files Examined

```
# LokiLoggingService implementations
lib/flame_teampay_payables/ember_payments/observability/services/loki_logging_service.ex (856 lines)
lib/flame_teampay_payables/ember_erp/observability/services/loki_logging_service.ex (574 lines)
lib/flame_teampay_payables/ember_reimbursements/observability/services/loki_logging_service.ex (331 lines)
+ 39 more domain services

# Existing dashboards
campsite/pit/docker/grafana/provisioning/dashboards/system-overview.json (973 lines)
campsite/pit/docker/grafana/provisioning/dashboards/payment-operations.json
campsite/pit/docker/grafana/provisioning/dashboards/erp-integration-health.json
campsite/pit/docker/grafana/provisioning/dashboards/oban-jobs.json
```

---

*Gap analysis complete. Ready for Stream 2: Dashboard Design.*
