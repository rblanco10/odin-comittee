# Dashboard Implementation Review - Findings

> **Session**: 2026-01-20_006_dashboard-implementation-review  
> **Date**: 2026-01-20  
> **Status**: Complete

---

## Executive Summary

The committee reviewed three dashboard implementations and identified **3 critical issues**, **3 high-priority issues**, and several medium/low-priority improvements needed.

---

## Critical Issues (🔴 Must Fix Immediately)

### CRIT-001: Rate Function Misuse in Error Rate Panel

**Location**: Tier 1: Business Overview → "Error Rate by Domain" panel  
**Query**:
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [$__range]))
```

**Problem**: 
- `rate()` function requires a range vector like `[5m]`, not `[$__range]`
- `$__range` is a Grafana variable (duration), not a LogQL range vector
- This query will fail to execute

**Correct Query**:
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [5m]))
```

Or for time-range aware:
```logql
sum by (domain) (sum(count_over_time({domain=~"ember_.*", status="error"} | json [$__range])) / ($__range_s / 1))
```

**Severity**: 🔴 CRITICAL  
**Impact**: Panel will show error, no data displayed

---

### CRIT-002: Tempo Datasource UID Mismatch

**Location**: Tier 1: Business Overview → "Recent Problem Traces" panel  
**Configuration**: `"datasource": { "type": "tempo", "uid": "tempo" }`

**Problem**:
- Datasource is named "Tempo" (capitalized) in `datasources.yml`
- Dashboard uses `"uid": "tempo"` (lowercase)
- Grafana may auto-generate UIDs that don't match this
- Panel will fail to load if UID doesn't match

**Solution**:
- Check actual Tempo datasource UID in Grafana UI
- Update dashboard JSON to match actual UID
- Or add explicit `uid` to datasource configuration

**Severity**: 🔴 CRITICAL  
**Impact**: Tempo panel will fail to load

---

### CRIT-003: JSON Parsing Assumptions Without Fallbacks

**Location**: Multiple panels across all dashboards

**Affected Panels**:
1. Tier 1: "Top Error Types (Loki)" - uses `| json`
2. Tier 1: "Error Rate by Domain" - uses `| json`
3. Webhook Monitoring: "Processing Latency by Provider" - uses `| json | unwrap duration_ms`
4. Tier 2 Reimbursements: "Payment Latency by Provider" - uses `| json | unwrap duration_ms`

**Problem**:
- Queries assume logs are structured JSON
- If logs aren't JSON format, queries fail silently
- No fallback queries provided

**Solution**:
- Verify log format in Loki
- If JSON: queries are correct
- If not JSON: need to parse differently or add label extraction
- Consider adding label-based queries as fallback

**Severity**: 🔴 CRITICAL  
**Impact**: Panels show "No data" if logs aren't JSON format

---

## High Priority Issues (🟠 Fix Soon)

### HIGH-001: Tempo Query Syntax for Table Panel

**Location**: Tier 1: Business Overview → "Recent Problem Traces" panel  
**Query**: `{ status = error || duration > 1s }`

**Problem**:
- TraceQL syntax may not be correct for table panel type
- Table panels typically need different query structure than trace exploration
- May need to use different panel type or query format

**Solution**:
- Verify TraceQL syntax for table panels
- Consider using "Traces" panel type instead of "Table"
- Or use proper TraceQL query format for tables

**Severity**: 🟠 HIGH  
**Impact**: Panel may not display traces correctly

---

### HIGH-002: Unwrap Ordering in Latency Queries

**Location**: 
- Webhook Monitoring: "Processing Latency by Provider"
- Tier 2 Reimbursements: "Payment Latency by Provider"

**Query Pattern**:
```logql
quantile_over_time(0.50, {...} | json | duration_ms > 0 | unwrap duration_ms [$__range])
```

**Problem**:
- Filtering `duration_ms > 0` before unwrap may not work as expected
- Should unwrap first, then filter, or filter in JSON stage

**Correct Query**:
```logql
quantile_over_time(0.50, {...} | json | unwrap duration_ms | duration_ms > 0 [$__range])
```

Or:
```logql
quantile_over_time(0.50, {...} | json | duration_ms > 0 | unwrap duration_ms [$__range])
```
(Current may work, but order is unconventional)

**Severity**: 🟠 HIGH  
**Impact**: Latency calculations may be incorrect

---

### HIGH-003: Missing ERP Webhooks in Overall Health

**Location**: Webhook Monitoring → "Overall Webhook Health" panel

**Problem**:
- Query only includes `ember_payments` domain webhooks
- Excludes `ember_erp_webhook_processed` events
- Dashboard title says "all providers" but query is incomplete

**Current Query**:
```logql
sum(count_over_time({domain="ember_payments", event_type=~"..."}[$__range])) / sum(...)
```

**Correct Query**:
```logql
(sum(count_over_time({domain="ember_payments", event_type=~"..."}[$__range])) + sum(count_over_time({domain="ember_erp", event_type="ember_erp_webhook_processed"}[$__range]))) / (sum(...) + sum(...))
```

**Severity**: 🟠 HIGH  
**Impact**: Overall health metric is incomplete

---

## Medium Priority Issues (🟡 Nice to Fix)

### MED-001: Redundant Regex Patterns

**Location**: Multiple webhook queries

**Problem**:
- Pattern `ember_payments_.*webhook.*processed|ember_payments_check_webhook_processed` is redundant
- First part already matches checkbook webhooks
- Could simplify to `ember_payments_.*webhook.*processed`

**Severity**: 🟡 MEDIUM  
**Impact**: Minor performance impact, query readability

---

### MED-002: Empty String Filter Syntax

**Location**: Tier 1: "Top Error Types (Loki)" panel

**Query**: `error_type != ""`

**Problem**:
- May not work as expected in LogQL
- Better: `error_type=~".+"` or verify syntax

**Severity**: 🟡 MEDIUM  
**Impact**: May filter out valid error types

---

## Low Priority Issues (🟢 Optional Improvements)

### LOW-001: Query Duplication Across Dashboards

**Problem**: Similar query patterns repeated across dashboards  
**Solution**: Consider creating reusable query templates or variables

**Severity**: 🟢 LOW  
**Impact**: Maintenance overhead

---

### LOW-002: Domain Filter Specificity

**Problem**: Some queries use `domain=~"ember_.*"` which is correct but could be more specific  
**Solution**: Use explicit domain lists where possible

**Severity**: 🟢 LOW  
**Impact**: Minor performance improvement possible

---

## Summary by Dashboard

### Tier 1: Business Overview
- ✅ Structure: Good
- 🔴 Critical: Rate function misuse, Tempo UID, JSON assumptions
- 🟠 High: Tempo query syntax

### Webhook Monitoring
- ✅ Structure: Good
- 🔴 Critical: JSON assumptions
- 🟠 High: Missing ERP webhooks, unwrap ordering
- 🟡 Medium: Redundant regex

### Tier 2: Reimbursement Operations
- ✅ Structure: Good, follows pattern
- 🔴 Critical: JSON assumptions
- 🟠 High: Unwrap ordering

---

## Recommendations

1. **Immediate Actions**:
   - Fix rate function query
   - Verify and fix Tempo datasource UID
   - Verify log format (JSON vs labels) and adjust queries accordingly

2. **Short-term**:
   - Fix Tempo query syntax
   - Add ERP webhooks to overall health
   - Fix unwrap ordering

3. **Long-term**:
   - Create query templates
   - Add fallback queries for different log formats
   - Simplify regex patterns

---

*Review completed by SC04 Grafana & Visualization Subcommittee*
