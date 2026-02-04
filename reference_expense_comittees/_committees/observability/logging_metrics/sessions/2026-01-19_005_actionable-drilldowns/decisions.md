# Decisions

> **Session**: 2026-01-19_005_actionable-drilldowns

---

## Decision 1: Drill-Down Architecture Approach

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Alexandra Chen (Chair)

**Description**: Implement drill-down functionality using a single unified dashboard with all views, rather than multiple separate dashboards.

**Options Considered**:
1. **Multiple separate dashboards** (one per stage) - Rejected due to maintenance overhead
2. **Single drill-down dashboard with all views** - SELECTED
3. **Data links to Explore mode** - Rejected as too advanced for typical ops users

**Discussion Summary**:
- Single dashboard easier to maintain (one set of queries)
- Grafana's `viewPanel` URL parameter enables deep-linking to specific sections
- Users can see related context by scrolling
- Time range settings persist across navigation

**Challenges Raised**:
- Complexity Auditor (Elena Vasquez): "Is a single long dashboard overwhelming?" 
  → Resolved: Panel organization with clear headers; users typically arrive via deep link

**Vote**: Unanimous approval

**Result**: APPROVED

**Implementation Notes**:
- Dashboard UID: `tier2-drilldown-details`
- Panel IDs assigned sequentially (1-6) for stable deep links
- All tables include Trace ID links to Tempo

---

## Decision 2: Data Link Placement

**Proposed by**: Sophie Laurent (Panel Layout Designer)  
**Seconded by**: Human Director (implicit approval)

**Description**: Add data links directly to stat panel field configuration, not as separate navigation elements.

**Rationale**:
- Clicking the number itself is most intuitive
- Hover hint in description guides users
- No additional UI elements needed

**Result**: APPROVED

**Implementation Notes**:
- Each stat panel description updated with "👆 CLICK to see..."
- Links use `viewPanel` parameter for direct navigation
- Time range preserved via Grafana's default behavior
