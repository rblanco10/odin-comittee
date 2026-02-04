# Committee Status

> **Last Updated**: 2026-01-19  
> **Updated By**: Dr. Alexandra Chen (Chair)  
> **Status**: `IDLE`

---

## Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMITTEE STATUS                              │
├─────────────────────────────────────────────────────────────────┤
│  State:           IDLE                                           │
│  Active Session:  None                                           │
│  Last Completed:  2026-01-19_005_actionable-drilldowns           │
│  Session Type:    Design → Implementation                        │
│  Members Active:  0 (session closed)                             │
│  Pending Items:   6 (carried forward)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Active Session

*No active session. Committee is idle and ready for new work.*

**Outstanding Work:**
- AI-014: Provider label bug (HIGH)
- AI-019: Verify Loki logs for blocked payment flow

---

## Last Session Summary

**Session**: 2026-01-19_005_actionable-drilldowns  
**Goal**: Transform Tier 2 dashboard from "just numbers" to actionable intelligence  
**Opened**: 2026-01-19  
**Closed**: 2026-01-19  
**Status**: CLOSED

**Session Outcomes**:
- Created `tier2-drilldown-details.json` with 6 detailed table views
- Added clickable data links to ALL stat panels in main Tier 2 dashboard
- Users can now click any number and see individual records
- Pipeline Flow: Submitted → Approved → In Transit → Completed (all clickable)
- Blocked Payments: Click to see WHO is blocked and WHY
- Payment Health: Click to see completed vs failed payments

**Key Decisions**:
1. Single unified drill-down dashboard (vs multiple separate dashboards)
2. Data links embedded in stat panel field configuration
3. `viewPanel` URL parameter for deep-linking to specific views

**Dashboards Created/Modified**:
- NEW: `tier2-drilldown-details.json` (UID: tier2-drilldown-details)
- UPDATED: `tier2-reimbursements.json` with data links

---

## Current Knowledge State

### What We Know

| Area | Status | Notes |
|------|--------|-------|
| Grafana Loki | ✅ Operational | docker-compose.local.yml |
| Logging Service | ✅ Documented | 23 event types in LokiLoggingService |
| Test Cases | ✅ Documented | 7 scenarios with UI steps |
| Blocked Payment Flow | ✅ Verified | IEx test successful |
| Loki Event Delivery | 🟠 Unverified | Events may not be reaching Loki |
| Tier 2 Dashboard | ✅ Actionable | Clickable drill-downs to all views |
| Drill-Down Dashboard | ✅ Complete | 6 detailed views with trace links |

### What's Been Decided

| Decision | Status | Outcome |
|----------|--------|---------|
| Dashboard redesign approach | ✅ Approved | 5 rows, 11 panels |
| Pipeline visualization | ✅ Approved | Stat Panel Flow |
| Collapsed Live Stream | ✅ Approved | Reduces cognitive load |
| Drill-down architecture | ✅ Approved | Single unified dashboard |
| Data link placement | ✅ Approved | Embedded in stat panels |

### What's Pending

| Item | Status | Next Step |
|------|--------|-----------|
| Verify Loki receives blocked events | 🟠 Pending | Query Loki directly |
| Test successful payment flow | 🟠 Pending | Need employee with bank account |
| Provider label bug fix | 🔴 High | Fix `maybe_put_label/3` |

---

## Open Action Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-014 | **BUG**: Fix `provider` label not being set in Loki logs | SC01 | 🔴 High | Pending | 2026-01-17 |
| AI-015 | Review `maybe_put_label/3` atom key vs string key handling | SC01 | 🔴 High | Pending | 2026-01-17 |
| AI-016 | Verify `rail` label is being set correctly | SC01 | 🟠 Medium | Pending | 2026-01-17 |
| AI-019 | Verify Loki logs appear for blocked payment flow | SC01 | 🟠 Medium | Pending | 2026-01-19 |
| AI-020 | Confirm `log_payment_blocked_no_bank` is called in reactor | SC01 | 🟠 Medium | Pending | 2026-01-19 |
| AI-022 | Test successful payment flow with employee WITH bank account | Human | 🟠 Medium | Pending | 2026-01-19 |

---

## Session History

| Session ID | Type | Status | Key Outcomes |
|------------|------|--------|--------------|
| 2026-01-19_005_actionable-drilldowns | Design → Implementation | ✅ CLOSED | Drill-down dashboard with 6 views; all stat panels clickable |
| 2026-01-19_004_tier2-dashboard-redesign | Design | ✅ CLOSED | Dashboard redesigned: 9→5 rows, 25→11 panels; Stat Panel Flow for pipeline |
| 2026-01-19_003_dwolla-reimbursements-logging-verification | Verification | ✅ CLOSED | 23 events documented; 7 test cases; blocked payment verified via IEx |
| 2026-01-19_002_reimbursements-tier2-enhancement | Design → Implementation | ✅ CLOSED | User-centric dashboard enhancements; "Who Is Affected" row |
| 2026-01-19_001_reimbursements-tier2-dashboard | Design → Implementation | ✅ CLOSED | Tier 2 Reimbursements Ops View dashboard |
| 2026-01-17_001_current-state-discovery | Discovery → Design → Implementation → Debug | ✅ CLOSED | Dashboard taxonomy; Tier 1 redesign; Provider label bug discovered |

---

## Quick Reference

### Start Observability Stack

```bash
cd campsite/pit/docker
docker compose -f docker-compose.local.yml up -d
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / admin |
| Loki | http://localhost:3100 | N/A |
| Prometheus | http://localhost:9090 | N/A |
| Tempo | http://localhost:3200 | N/A |

### Key Dashboards

| Dashboard | URL | Description |
|-----------|-----|-------------|
| Tier 2 Ops View | /d/tier2-reimbursements | Main operations dashboard |
| Drill-Down Details | /d/tier2-drilldown-details | Individual records by category |

### Key LogQL Queries

```logql
# All reimbursement events
{domain="ember_reimbursements"}

# Payment flow events
{event_type=~"ember_reimbursements_payment.*"}

# Blocked payments
{event_type=~".*payment_blocked.*"}

# Errors only
{domain="ember_reimbursements", status="error"}
```

---

## Update Protocol

This file is updated:
- When a session opens (Active Session section)
- When a session closes (Recent Decisions, Session History)
- When action items change status
- When knowledge base is updated
- When technical debt is discovered/resolved

**This is NOT a log.** It reflects current state only. Historical data lives in session folders.

---

*Status reflects reality; reality does not bend to status.*
