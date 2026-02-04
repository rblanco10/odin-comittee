# Critical Fixes Implementation Plan - Action Items

> **Session**: 2026-01-20_007_critical-fixes-implementation-plan  
> **Date**: 2026-01-20

---

## Phase 1: Verification & Discovery

### AI-050: Verify Log Format in Loki

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Phase**: 1 - Verification  
**Estimated Time**: 15 minutes

**Task**: 
1. Open Grafana Explore → Select Loki
2. Run: `{domain="ember_payments"} | limit 10`
3. Document log format (JSON/Labels/Text/Mixed)
4. Create `VERIFICATION_RESULTS.md` with findings

**Status**: 🟠 Pending

---

### AI-051: Verify Tempo Datasource UID

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Phase**: 1 - Verification  
**Estimated Time**: 10 minutes

**Task**:
1. Check Grafana UI: Configuration → Data Sources → Tempo
2. Note actual UID
3. Check `datasources.yml` for UID setting
4. Document in `VERIFICATION_RESULTS.md`

**Status**: 🟠 Pending

---

### AI-052: Test Current Queries

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 1 - Verification  
**Estimated Time**: 15 minutes

**Task**: Test each affected panel query in Explore and document results

**Status**: 🟠 Pending

---

## Phase 2: Critical Fixes

### AI-053: Fix Tempo Datasource UID

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Phase**: 2 - Critical Fixes  
**Estimated Time**: 15 minutes  
**Depends on**: AI-051

**Task**:
1. Add `uid: tempo` to Tempo datasource in `datasources.yml`
2. Verify dashboard JSON uses `"uid": "tempo"`
3. Restart Grafana
4. Test panel loads correctly

**Status**: 🟠 Pending

---

### AI-054: Fix Rate Function Query

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Phase**: 2 - Critical Fixes  
**Estimated Time**: 15 minutes

**Task**:
1. Update "Error Rate by Domain" panel query
2. Replace `rate(...[$__range])` with `rate(...[5m])`
3. Test in Explore
4. Update dashboard JSON

**Status**: 🟠 Pending

---

### AI-055: Fix JSON Parsing Queries

**Assigned to**: Implementation Team  
**Priority**: 🔴 CRITICAL  
**Phase**: 2 - Critical Fixes  
**Estimated Time**: 30-45 minutes  
**Depends on**: AI-050

**Task**: Based on log format verification:
- If JSON: Keep queries, add documentation
- If Labels: Remove `| json`, use label selectors
- If Text: Use regex or label enrichment

**Affected Panels**:
- Tier 1: "Top Error Types (Loki)"
- Webhook Monitoring: "Processing Latency"
- Tier 2 Reimbursements: "Payment Latency"

**Status**: 🟠 Pending

---

## Phase 3: High-Priority Fixes

### AI-056: Fix Tempo Query Syntax

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 3 - High-Priority Fixes  
**Estimated Time**: 15 minutes

**Task**:
1. Change panel type from "table" to "traces"
2. Test query in Explore
3. Update dashboard JSON

**Status**: 🟠 Pending

---

### AI-057: Fix Unwrap Ordering

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 3 - High-Priority Fixes  
**Estimated Time**: 20 minutes

**Task**:
1. Fix unwrap ordering in Webhook Monitoring latency queries
2. Fix unwrap ordering in Tier 2 Reimbursements latency queries
3. Test each query in Explore
4. Update dashboard JSON

**Status**: 🟠 Pending

---

### AI-058: Add ERP Webhooks to Overall Health

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 3 - High-Priority Fixes  
**Estimated Time**: 15 minutes

**Task**:
1. Update "Overall Webhook Health" query to include ERP webhooks
2. Test query in Explore
3. Update dashboard JSON
4. Update panel description

**Status**: 🟠 Pending

---

## Phase 4: Testing & Validation

### AI-059: Individual Query Testing

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 4 - Testing  
**Estimated Time**: 20 minutes

**Task**: Test each fixed query in Grafana Explore

**Status**: 🟠 Pending

---

### AI-060: Dashboard Panel Testing

**Assigned to**: Implementation Team  
**Priority**: 🟠 HIGH  
**Phase**: 4 - Testing  
**Estimated Time**: 15 minutes

**Task**: Test each fixed panel in dashboards

**Status**: 🟠 Pending

---

### AI-061: Integration Testing

**Assigned to**: Implementation Team  
**Priority**: 🟡 MEDIUM  
**Phase**: 4 - Testing  
**Estimated Time**: 10 minutes

**Task**: Test dashboard refresh, time range changes, interactions

**Status**: 🟠 Pending

---

## Phase 5: Documentation

### AI-062: Update Documentation

**Assigned to**: Implementation Team  
**Priority**: 🟡 MEDIUM  
**Phase**: 5 - Documentation  
**Estimated Time**: 15 minutes

**Task**:
1. Update dashboard README
2. Create `VERIFICATION_RESULTS.md`
3. Update session findings

**Status**: 🟠 Pending

---

## Summary

| Phase | Action Items | Status |
|-------|--------------|--------|
| Phase 1: Verification | 3 | 🟠 Pending |
| Phase 2: Critical Fixes | 3 | 🟠 Pending |
| Phase 3: High-Priority | 3 | 🟠 Pending |
| Phase 4: Testing | 3 | 🟠 Pending |
| Phase 5: Documentation | 1 | 🟠 Pending |

**Total Action Items**: 13  
**Critical Priority**: 6  
**High Priority**: 6  
**Medium Priority**: 1

**Estimated Total Time**: 2-3 hours

---

*Action items created by Session Historian*
