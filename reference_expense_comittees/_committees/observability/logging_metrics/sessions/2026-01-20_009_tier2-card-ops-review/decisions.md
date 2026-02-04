# Decisions

> **Session ID**: 2026-01-20_009_tier2-card-ops-review  
> **Date**: 2026-01-20

---

## DEC-020: Remove Activation Gauge Panel

**Proposed by**: Thomas Wright (Dashboard Clutter Critic)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Remove the Activation gauge panel from the Executive Summary row because it consistently shows "No Data" — the activation operation is not currently used in the card workflow.

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel removed from `tier2-card-operations.json`

---

## DEC-021: Remove Provider Health Comparison Bar Chart

**Proposed by**: Thomas Wright (Dashboard Clutter Critic)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Remove the Provider Health Comparison horizontal bar chart because:
1. Horizontal bar for a single provider is confusing visualization
2. Time-series better communicates health trends
3. Replaced by Success Rate Over Time panel

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel removed from `tier2-card-operations.json`

---

## DEC-022: Remove Operations by Provider Bar Chart

**Proposed by**: Thomas Wright (Dashboard Clutter Critic)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Description**: Remove the Operations by Provider stacked bar chart because it is redundant with the Operations Over Time time-series panel in the Trends section.

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel removed from `tier2-card-operations.json`

---

## DEC-023: Rebuild Error Count Panel with Instant Query

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Rebuild the Error Count stat panel from scratch to fix the caching/display bug showing 229 errors instead of 1. Key changes:
- New panel ID (60) to avoid cached state
- Added `"instant": true` to force instant query
- Added `or vector(0)` to return 0 when no errors
- Added `"noValue": "0"` for proper null handling

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: New panel created in `tier2-card-operations.json`  
**Verification**: Dashboard now correctly shows 1 error

---

## DEC-024: Add Total Ops Stat Panel

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Description**: Add a Total Ops stat panel to the Executive Summary row to provide volume context alongside percentages. This helps operators understand that "50% cancel failure" means "1 of 2" not "500 of 1000".

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel added at position x:20 in `tier2-card-operations.json`

---

## DEC-025: Add Success Rate Over Time Panel

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Michael Torres (SC01 Lead)

**Description**: Add a Success Rate Over Time time-series panel to replace the Provider Health Comparison bar chart. This shows trends over time rather than a point-in-time snapshot, following the pattern from the Payment Operations dashboard.

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel added in Health Trends row

---

## DEC-026: Add Error Rate Over Time Panel

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Michael Torres (SC01 Lead)

**Description**: Add an Error Rate Over Time time-series panel (displayed as bars) to show error rate trends. This complements the Success Rate panel and helps identify when problems are occurring.

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel added in Health Trends row

---

## DEC-027: Update Latency Panel to P50/P95/P99

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Description**: Update the Latency Analysis panel to show P50/P95/P99 percentiles instead of just average, following the pattern from the Payment Operations dashboard. This provides better insight into latency distribution.

**Vote**: Unanimous approval  
**Result**: ✅ APPROVED  
**Implementation**: Panel updated with three queries in `tier2-card-operations.json`

---

## DEC-028: Keep Cancel Gauge As-Is

**Proposed by**: Human Director  
**Override**: Human Director decision

**Description**: The Cancel gauge panel was proposed for modification (to add count context) but Human Director decided to keep it as-is.

**Result**: ✅ APPROVED (per Human Director)

---

## Decision Summary

| ID | Decision | Status |
|----|----------|--------|
| DEC-020 | Remove Activation gauge | ✅ Implemented |
| DEC-021 | Remove Provider Health Comparison | ✅ Implemented |
| DEC-022 | Remove Operations by Provider | ✅ Implemented |
| DEC-023 | Rebuild Error Count panel | ✅ Implemented |
| DEC-024 | Add Total Ops stat | ✅ Implemented |
| DEC-025 | Add Success Rate Over Time | ✅ Implemented |
| DEC-026 | Add Error Rate Over Time | ✅ Implemented |
| DEC-027 | Update Latency to P50/P95/P99 | ✅ Implemented |
| DEC-028 | Keep Cancel gauge as-is | ✅ Confirmed |

---

*"Good decisions, well-documented, enable future improvement."*
