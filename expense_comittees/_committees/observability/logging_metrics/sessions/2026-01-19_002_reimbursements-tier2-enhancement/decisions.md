# Session Decisions

> **Session ID**: 2026-01-19_002_reimbursements-tier2-enhancement  
> **Type**: Design → Implementation  
> **Date**: 2026-01-19

---

## Decision 1: User-Centric Dashboard Design Philosophy

**Proposed by**: Sarah Mitchell (Business Analyst)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Dashboard enhancements should be driven by the questions operators actually ask, not by what data sources are available.

**Vote**: Unanimous approval

**Result**: APPROVED

---

## Decision 2: Approved Enhancements

**Proposed by**: Dr. William Park  
**Approved by**: Human Director

**Description**: The following panels were approved for implementation:

| Panel | Data Source | Purpose |
|-------|-------------|---------|
| 🏢 Top Active Organizations (Table) | Loki | Show which orgs have payment activity |
| 👤 Active Users (Stat) | Loki | Count of unique users with activity |
| 🏢 Active Orgs (Stat) | Loki | Count of unique organizations |
| ⏳ Users Awaiting Payment (Stat) | Loki | Users stuck waiting for webhooks |
| 💳 Payments (24h) | Loki | Today's payment count |
| 📅 Payments (Yesterday) | Loki offset | Yesterday's count for comparison |
| 🔴 Errors (24h) | Loki | Today's error count |
| 📅 Errors (Yesterday) | Loki offset | Yesterday's errors for comparison |
| 🔥 Activity Heatmap | Prometheus | Payments by hour pattern |
| 🏢 Organization variable | Loki | Filter dashboard by org |

**Result**: APPROVED and IMPLEMENTED

---

## Decision 3: Rejected Enhancements

**Rejected by**: Human Director

**Description**: The following panels were NOT implemented per Human Director direction:

| Panel | Reason |
|-------|--------|
| 💰 Money at Risk | Not needed |
| ⏱️ Longest Wait Time | Not needed |
| ⏳ Average Time at Each Stage | Uncertain value |

**Result**: REJECTED

---

## Decision 4: Data Field Mapping

**Proposed by**: Dr. Kenji Tanaka (Research Librarian)

**Description**: Confirmed mapping of Loki labels to business concepts:

| Business Concept | Loki Field | Verified |
|------------------|------------|----------|
| Organization | `entity_id` | ✅ |
| User | `employee_id` | ✅ |
| Amount | `amount` (JSON body) | ✅ |

**Result**: VERIFIED and DOCUMENTED

---

## Decision 5: Dashboard Variable Addition

**Proposed by**: Dr. William Park

**Description**: Add `entity_id` variable to allow filtering the entire dashboard by organization.

**Result**: APPROVED and IMPLEMENTED

---

## Implementation Summary

### New Rows Added

1. **"🏢 Who Is Affected? — Organizations & Users"** (Row 2)
   - Top Active Organizations table
   - Active Users stat
   - Active Orgs stat
   - Users Awaiting Payment stat

2. **"📊 Is This Normal? — Today vs History"** (Row 3)
   - Payments (24h) vs Yesterday comparison
   - Errors (24h) vs Yesterday comparison
   - Activity Heatmap by hour

### New Variables Added

- `entity_id` — Organization filter

### Dashboard Statistics

| Metric | Before | After |
|--------|--------|-------|
| Rows | 6 | 8 |
| Panels | 15 | 24 |
| Data Sources | Loki, Prometheus | Loki, Prometheus (Tempo via links) |
| Variables | 1 (status) | 2 (status, entity_id) |
