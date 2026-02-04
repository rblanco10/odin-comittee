# Dashboard Implementation Review - Action Items

> **Session**: 2026-01-20_006_dashboard-implementation-review  
> **Date**: 2026-01-20

---

## Critical Priority Actions

### AI-042: Fix Rate Function in Error Rate Panel

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Dashboard**: Tier 1: Business Overview  
**Panel**: "Error Rate by Domain"

**Task**: Replace incorrect `rate()` usage with proper LogQL query

**Current Query** (INCORRECT):
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [$__range]))
```

**Fixed Query**:
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [5m]))
```

**Status**: 🟠 Pending

---

### AI-043: Fix Tempo Datasource UID

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Dashboard**: Tier 1: Business Overview  
**Panel**: "Recent Problem Traces"

**Task**: 
1. Check actual Tempo datasource UID in Grafana UI (Configuration → Data Sources → Tempo)
2. Update dashboard JSON to use correct UID
3. Or add explicit `uid` field to Tempo datasource configuration

**Status**: 🟠 Pending

---

### AI-044: Verify Log Format and Fix JSON Queries

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Dashboards**: All (Tier 1, Webhook Monitoring, Tier 2 Reimbursements)

**Task**:
1. Query Loki to verify log format: `{domain="ember_payments"} | limit 10`
2. If logs are JSON: keep current queries, add note to descriptions
3. If logs are not JSON: 
   - Use label-based queries instead
   - Or add label extraction: `| regexp "(?P<error_type>...)"`
   - Update all affected panels

**Affected Panels**:
- Tier 1: "Top Error Types (Loki)"
- Tier 1: "Error Rate by Domain"  
- Webhook Monitoring: "Processing Latency by Provider"
- Tier 2 Reimbursements: "Payment Latency by Provider"

**Status**: 🟠 Pending

---

## High Priority Actions

### AI-045: Fix Tempo Query Syntax

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Dashboard**: Tier 1: Business Overview  
**Panel**: "Recent Problem Traces"

**Task**: 
1. Verify TraceQL syntax for table panels
2. Consider changing panel type to "Traces" instead of "Table"
3. Or use correct TraceQL query format for table display

**Status**: 🟠 Pending

---

### AI-046: Fix Unwrap Ordering in Latency Queries

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Dashboards**: Webhook Monitoring, Tier 2 Reimbursements

**Task**: Fix unwrap ordering in latency calculation queries

**Current** (may work but unconventional):
```logql
quantile_over_time(0.50, {...} | json | duration_ms > 0 | unwrap duration_ms [$__range])
```

**Fixed**:
```logql
quantile_over_time(0.50, {...} | json | unwrap duration_ms | duration_ms > 0 [$__range])
```

**Status**: 🟠 Pending

---

### AI-047: Add ERP Webhooks to Overall Health

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Dashboard**: Webhook Monitoring  
**Panel**: "Overall Webhook Health"

**Task**: Update query to include ERP webhooks in overall health calculation

**Current Query** (incomplete):
```logql
sum(count_over_time({domain="ember_payments", event_type=~"..."}[$__range])) / sum(...)
```

**Fixed Query**:
```logql
(sum(count_over_time({domain="ember_payments", event_type=~"ember_payments_.*webhook.*processed|ember_payments_check_webhook_processed", status="success"}[$__range])) + sum(count_over_time({domain="ember_erp", event_type="ember_erp_webhook_processed", status="success"}[$__range]))) / (sum(count_over_time({domain="ember_payments", event_type=~"ember_payments_.*webhook.*processed|ember_payments_check_webhook_processed"}[$__range])) + sum(count_over_time({domain="ember_erp", event_type="ember_erp_webhook_processed"}[$__range])))
```

**Status**: 🟠 Pending

---

## Medium Priority Actions (Deferred)

### AI-048: Simplify Redundant Regex Patterns

**Assigned to**: Future optimization  
**Priority**: 🟡 MEDIUM  
**Status**: ⏸️ Deferred

---

### AI-049: Fix Empty String Filter Syntax

**Assigned to**: Future optimization  
**Priority**: 🟡 MEDIUM  
**Status**: ⏸️ Deferred

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | 🟠 Pending |
| 🟠 High | 3 | 🟠 Pending |
| 🟡 Medium | 2 | ⏸️ Deferred |

**Total Action Items**: 8  
**Immediate Actions Required**: 6

---

*Action items created by Session Historian*
