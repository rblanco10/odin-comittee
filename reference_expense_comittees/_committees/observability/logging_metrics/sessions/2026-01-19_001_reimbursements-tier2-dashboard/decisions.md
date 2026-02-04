# Session Decisions

> **Session ID**: 2026-01-19_001_reimbursements-tier2-dashboard  
> **Status**: COMPLETE

---

## Decisions Made

### Decision 1: Dashboard Design Philosophy

**Proposed by**: Dr. William Park  
**Approved by**: Human Director

**Decision**: Adopt "Ops-First" design philosophy prioritizing:
1. Traffic lights for immediate status
2. Stuck payment detection
3. Recent failures with actionable context
4. Webhook health visibility

**Rationale**: Traditional metric-focused dashboards don't answer "what went wrong" intuitively.

---

### Decision 2: Three-Pillar Integration Strategy

**Proposed by**: Dr. William Park  
**Approved by**: Committee

**Decision**: Use each technology for its native strength:

| Pillar | Use For |
|--------|---------|
| **Loki** | Event counts, status distributions, error details, log stream |
| **Prometheus** | Aggregated rates, latency percentiles, throughput |
| **Tempo** | Trace links for debugging (via data links, not embedded) |

**Rationale**: Each technology excels at different observability needs.

---

### Decision 3: Tempo Integration via Links

**Proposed by**: Dr. Amanda Foster  
**Approved by**: Committee

**Decision**: Use **data links to Tempo** rather than embedded trace panels.

**Rationale**: 
- Embedded Tempo panels require trace IDs which are high-cardinality
- Links allow ops to explore traces on demand
- Reduces dashboard complexity

---

### Decision 4: Provider Label Workaround

**Proposed by**: Elena Vasquez (Skeptic)  
**Approved by**: Committee

**Decision**: Use `payment_method` label (ach/check) as workaround until AI-014 bug is fixed.

**Rationale**: Provider label bug (AI-014) prevents direct provider filtering.

---

### Decision 5: Drill-Down Navigation

**Proposed by**: Human Director  
**Approved by**: Committee

**Decision**: Add data link on Tier 1 Reimbursements gauge that navigates to Tier 2 with preserved time range.

**Implementation**: Added `links` field to Panel ID 2 in tier1-business-overview.json.

---

## Pending Decisions

*None - all decisions implemented.*

---
