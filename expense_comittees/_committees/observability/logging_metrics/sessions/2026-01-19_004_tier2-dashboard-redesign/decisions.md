# Decisions

> **Session**: 2026-01-19_004_tier2-dashboard-redesign

---

## Decision 1: Dashboard Structure Reduction

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Alexandra Chen (Chair)

**Description**: Reduce dashboard from 9 rows / ~25 panels to 5 rows / 11 panels.

**Discussion Summary**:
- Current dashboard has too much visual clutter
- Many panels show redundant information
- Operations analysts need actionable data, not exhaustive metrics

**Challenges Raised**:
- Complexity Auditor: "Are we cutting too much?" → Resolved: Tier 1 covers provider details
- Simplicity Zealot: "Could we go to 3 rows?" → Resolved: Live Event Stream valuable but collapsed

**Vote**: Unanimous approval

**Result**: APPROVED

---

## Decision 2: Pipeline Visualization Method

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Human Director

**Description**: Replace horizontal bar chart with Stat Panel Flow (4 sequential stat panels).

**Options Considered**:
1. **Stat Panel Flow** — 4 stat panels showing ①②③④ stages (SELECTED)
2. Table with Drop-off Analysis — Compact but less visual
3. Stacked Time Series — Good for trends but hard to read exact numbers
4. Bar Gauge — Compact but doesn't convey "flow"

**Discussion Summary**:
- Human Director expressed confusion with bar chart
- Pipeline concept is valuable; execution was poor
- Stat Panel Flow provides intuitive left-to-right progression
- Color coding (blue→purple→orange→green) reinforces stage progression

**Vote**: Human Director selected Option 1

**Result**: APPROVED

---

## Decision 3: Removed Panels

**Proposed by**: Elena Vasquez (Complexity Auditor)  
**Seconded by**: Simon Zhang (Simplicity Zealot)

**Description**: Remove the following panels/rows as redundant or low-value:

| Removed | Reason |
|---------|--------|
| System Status (5 provider boxes) | Redundant with Tier 1; rarely actionable at Tier 2 |
| Who Is Affected (4 panels) | Nice-to-know, not need-to-know |
| Payment Pipeline bar chart | Replaced with Stat Panel Flow |
| Activity Over Time | Redundant with Sent vs Completed |
| Webhook Health row | Merged into Sent vs Completed |
| Is This Normal row | Consolidated into summary stat |
| Text explanation panels | Dashboard should be self-evident |

**Vote**: Unanimous approval

**Result**: APPROVED

---

## Decision 4: Live Event Stream Collapsed by Default

**Proposed by**: Simon Zhang (Simplicity Zealot)  
**Seconded by**: Dr. Alexandra Chen (Chair)

**Description**: Keep Live Event Stream but collapse the row by default to reduce cognitive load.

**Discussion Summary**:
- Stream is valuable for real-time debugging
- Not needed for routine monitoring glances
- Collapsed state preserves functionality while reducing initial visual load

**Vote**: Unanimous approval

**Result**: APPROVED
