# Dashboard Gap Analysis Findings

> **Session**: 2026-01-20_004_dashboard-gap-analysis  
> **Date**: 2026-01-20  
> **Status**: In Progress

---

## Executive Summary

This document identifies gaps across all Grafana dashboards by comparing what exists against available logging/metrics data and ideal observability coverage.

---

## Dashboard Inventory

| Dashboard | File | Panels | Primary Data Source | Status |
|-----------|------|--------|-------------------|--------|
| Tier 1: Business Overview | `tier1-business-overview.json` | ~15+ | Loki + Prometheus | ✅ Active |
| Tier 2: Card Operations | `tier2-card-operations.json` | ~20+ | Loki | ✅ Active |
| Payment Operations | `payment-operations.json` | ~15+ | Prometheus + Loki | ✅ Active |
| ERP Integration Health | `erp-integration-health.json` | ~12+ | Prometheus | ✅ Active |
| Oban Jobs | `oban-jobs.json` | ~8+ | Loki | ✅ Active |
| System Overview | `system-overview.json` | ~20+ | Prometheus + Loki | ✅ Active |

**Total**: 6 dashboards, ~90+ panels

---

## Identified Gaps

### GAP-DASH-001: Missing Tier 2 Dashboard for Reimbursements

**Severity**: 🟠 HIGH  
**Dashboard**: N/A (missing)  
**Current State**: Reimbursements only have Tier 1 panel (gauge showing success rate)  
**Available Data**: Comprehensive logging in `ember_reimbursements` domain  
**Gap**: No deep-dive dashboard for reimbursement operations

**Available Events** (from EVENT_TAXONOMY.md):
- `ember_reimbursements_submission_start/end`
- `ember_reimbursements_approval_start/end`
- `ember_reimbursements_rejection_start/end`
- `ember_reimbursements_payment_start/end`
- `ember_reimbursements_payout_batch_submit_start/end`
- `ember_reimbursements_payment_status_changed`
- `ember_reimbursements_payment_completed/failed`
- Payment blocker events

**Recommendation**: Create Tier 2: Reimbursement Operations dashboard similar to Tier 2: Card Operations

---

### GAP-DASH-002: Missing Tier 2 Dashboard for Payout Operations

**Severity**: 🟡 MEDIUM  
**Dashboard**: N/A (missing)  
**Current State**: Checkbook and Dwolla only have Tier 1 panels (success rate stats)  
**Available Data**: Comprehensive logging for both providers  
**Gap**: No unified payout operations dashboard

**Available Events**:
- Checkbook: `ember_payments_check_*` events (12 event types)
- Dwolla: `ember_reimbursements_payment_*` events
- Webhook events for both

**Recommendation**: Create Tier 2: Payout Operations dashboard covering both Checkbook and Dwolla

---

### GAP-DASH-003: Tempo (Tracing) Not Used in Any Dashboard

**Severity**: 🟠 HIGH  
**Dashboard**: All dashboards  
**Current State**: No Tempo queries in any dashboard  
**Available Data**: OpenTelemetry traces stored in Tempo  
**Gap**: No trace visualization or trace-to-log correlation

**Impact**: Cannot correlate logs with traces, cannot visualize request flows

**Recommendation**: 
- Add trace panels to relevant dashboards
- Add trace-to-log correlation links
- Create dedicated Tracing dashboard

---

### GAP-DASH-004: Tier 1 Missing Volume Metrics

**Severity**: 🟡 MEDIUM  
**Dashboard**: Tier 1 Business Overview  
**Current State**: Only success rates shown (gauges)  
**Gap**: No volume indicators (how many operations per time period)

**Available Data**: Can calculate from `count_over_time()` queries

**Recommendation**: Add volume stat panels alongside success rate gauges

---

### GAP-DASH-005: Payment Operations Dashboard Mixes Prometheus and Loki

**Severity**: 🟡 MEDIUM  
**Dashboard**: Payment Operations  
**Current State**: Some panels use Prometheus, some use Loki  
**Gap**: Inconsistent data source usage

**Impact**: Harder to maintain, potential data inconsistency

**Recommendation**: Migrate all panels to Loki (per DEC-018 pattern) or document rationale for Prometheus usage

---

### GAP-DASH-006: Missing Error Breakdown Panels

**Severity**: 🟠 HIGH  
**Dashboard**: Multiple (Tier 1, Payment Operations)  
**Current State**: Success rates shown, but error types not broken down  
**Available Data**: Error events with `error_type` and `error_message` fields  
**Gap**: Cannot see what types of errors are occurring

**Recommendation**: Add error breakdown panels showing:
- Error types (ValidationError, ProviderError, etc.)
- Error rates by type
- Top error messages

---

### GAP-DASH-007: Missing Latency Panels for Reimbursements

**Severity**: 🟡 MEDIUM  
**Dashboard**: Tier 1, Payment Operations  
**Current State**: No latency metrics for reimbursement operations  
**Available Data**: `duration_ms` field in reimbursement events  
**Gap**: Cannot see reimbursement operation performance

**Recommendation**: Add latency panels (P50, P95, P99) for reimbursement operations

---

### GAP-DASH-008: Missing Checkbook Operation Breakdown

**Severity**: 🟡 MEDIUM  
**Dashboard**: Tier 1 (Checkbook panel only shows success rate)  
**Current State**: Single stat panel  
**Available Data**: 12 Checkbook event types (payout, status, cancel, API, webhooks)  
**Gap**: Cannot see breakdown by operation type or check type (digital vs physical)

**Recommendation**: Add panels for:
- Operation type breakdown (payout, status, cancel)
- Check type breakdown (digital vs physical)
- Webhook processing health

---

### GAP-DASH-009: Missing KYB Operations Dashboard

**Severity**: 🟡 MEDIUM  
**Dashboard**: N/A (missing)  
**Current State**: KYB mentioned in Payment Operations but no dedicated dashboard  
**Available Data**: KYB events in `ember_payments` domain  
**Gap**: No dedicated KYB monitoring

**Available Events**:
- `ember_payments_kyb_verification_start/end`
- `ember_payments_kyb_application_start/end`
- `ember_payments_kyb_document_upload_start/end`
- `ember_payments_beneficial_owner_add_start/end`

**Recommendation**: Create KYB Operations dashboard or add comprehensive KYB section to Payment Operations

---

### GAP-DASH-010: Missing Webhook Monitoring Dashboard

**Severity**: 🟠 HIGH  
**Dashboard**: N/A (missing)  
**Current State**: Webhooks mentioned in some dashboards but no dedicated monitoring  
**Available Data**: Webhook events for multiple providers (Dwolla, Checkbook, ERP)  
**Gap**: Cannot monitor webhook health across providers

**Available Events**:
- `ember_payments_webhook_received/processed/error`
- `ember_payments_check_webhook_received/processed/error`
- `ember_erp_webhook_received/processed`

**Recommendation**: Create Webhook Monitoring dashboard showing:
- Webhook volume by provider
- Processing latency
- Error rates
- Failed webhook details

---

### GAP-DASH-011: Missing Drill-Down Links

**Severity**: 🟢 LOW  
**Dashboard**: Tier 1  
**Current State**: Only has link to Tier 2 Card Operations  
**Gap**: No links to other Tier 2 dashboards (when created) or detailed views

**Recommendation**: Add drill-down links from Tier 1 panels to:
- Tier 2 Reimbursements (when created)
- Tier 2 Payout Operations (when created)
- Log query views
- Trace views

---

### GAP-DASH-012: Missing Provider API Health Panels

**Severity**: 🟡 MEDIUM  
**Dashboard**: Payment Operations, Tier 2 Card Operations  
**Current State**: Provider success rates shown, but API-level health not visible  
**Available Data**: Provider API request/response/error events  
**Gap**: Cannot see API-level issues (timeouts, rate limits, etc.)

**Available Events**:
- `ember_payments_checkbook_api_request/response_success/response_error`
- `ember_payments_dwolla_api_request/response_success/response_error`
- Provider API events for WEX, Marqeta

**Recommendation**: Add provider API health panels showing:
- API request rates
- API error rates
- API latency
- Rate limit hits

---

### GAP-DASH-013: Missing Time-to-Resolution Metrics

**Severity**: 🟢 LOW  
**Dashboard**: All dashboards  
**Current State**: Success rates and latency shown, but not time-to-resolution  
**Gap**: Cannot see how long it takes to resolve issues

**Recommendation**: Add panels showing time from error to resolution (if data available)

---

### GAP-DASH-014: Missing Business Metrics

**Severity**: 🟡 MEDIUM  
**Dashboard**: Tier 1  
**Current State**: Technical metrics (success rates, latency)  
**Gap**: No business-level metrics (dollar amounts, transaction volumes, etc.)

**Recommendation**: Add business metrics panels:
- Payment volume ($)
- Card issuance volume
- Reimbursement amounts
- Provider distribution by volume

---

## Gap Prioritization

### 🔴 Critical Priority (Must Fix)
- None identified

### 🟠 High Priority (Should Fix Soon)
1. **GAP-DASH-001**: Missing Tier 2 Dashboard for Reimbursements
2. **GAP-DASH-003**: Tempo (Tracing) Not Used
3. **GAP-DASH-006**: Missing Error Breakdown Panels
4. **GAP-DASH-010**: Missing Webhook Monitoring Dashboard

### 🟡 Medium Priority (Should Fix Eventually)
1. **GAP-DASH-002**: Missing Tier 2 Dashboard for Payout Operations
2. **GAP-DASH-004**: Tier 1 Missing Volume Metrics
3. **GAP-DASH-005**: Payment Operations Dashboard Mixes Data Sources
4. **GAP-DASH-007**: Missing Latency Panels for Reimbursements
5. **GAP-DASH-008**: Missing Checkbook Operation Breakdown
6. **GAP-DASH-009**: Missing KYB Operations Dashboard
7. **GAP-DASH-012**: Missing Provider API Health Panels
8. **GAP-DASH-014**: Missing Business Metrics

### 🟢 Low Priority (Nice to Have)
1. **GAP-DASH-011**: Missing Drill-Down Links
2. **GAP-DASH-013**: Missing Time-to-Resolution Metrics

---

## Recommendations for Next Work

### Immediate Next Steps (High Priority)
1. **Create Tier 2: Reimbursement Operations Dashboard**
   - Similar structure to Tier 2: Card Operations
   - Cover submission, approval, payment flows
   - Include error breakdown and latency

2. **Add Tempo Integration**
   - Add trace panels to existing dashboards
   - Create trace-to-log correlation
   - Add dedicated Tracing dashboard

3. **Add Error Breakdown Panels**
   - Error type distribution
   - Error rate trends
   - Top error messages

4. **Create Webhook Monitoring Dashboard**
   - Unified view of all webhook health
   - Provider-specific breakdowns
   - Processing latency and error rates

### Medium-Term Work
1. Create Tier 2: Payout Operations dashboard
2. Migrate Payment Operations to consistent data source
3. Add volume metrics to Tier 1
4. Add Checkbook operation breakdown
5. Add provider API health panels

### Long-Term Enhancements
1. Add business metrics
2. Add drill-down links
3. Add time-to-resolution metrics

---

*Analysis in progress - will be completed by committee review*
