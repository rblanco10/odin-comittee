# Session Decisions

> **Session ID**: 2026-01-19_002_tier2-card-ops-design  
> **Type**: Design → Implementation  
> **Status**: CLOSED

---

## Decisions Made

### Decision 1: Question-Driven Dashboard Layout

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Sarah Kim (Developer Experience)

**Description**: Design the dashboard to answer questions in order of urgency:
1. "Is anything broken RIGHT NOW?" → Executive Summary (Row 1)
2. "Which provider is the problem?" → Provider Comparison (Row 2)
3. "Getting better or worse?" → Trends (Row 3)
4. "How fast are operations?" → Latency Analysis (Row 4, collapsed)
5. "What specific operations are failing?" → Error Spotlight (Row 5, collapsed)
6. "What happened to card X?" → Investigation Log (Row 6, collapsed)

**Rationale**:
- Operators need to triage quickly (2-second glance at Row 1)
- Progressive disclosure (expand rows for deeper investigation)
- Each row answers a specific question

**Status**: APPROVED AND IMPLEMENTED

---

### Decision 2: Six Panel Executive Summary

**Proposed by**: Dr. William Park (Dashboard Architect)

**Description**: Row 1 contains 6 panels:
- Overall Health (all operations combined)
- Issuance Success Rate
- Activation Success Rate
- Freeze Success Rate
- Cancel Success Rate
- Error Count

**Rationale**:
- Glanceable at a glance
- Color-coded thresholds (red < 95%, yellow < 99%, green ≥ 99%)
- Error count highlighted when non-zero

**Status**: APPROVED AND IMPLEMENTED

---

### Decision 3: Provider Variable Filter

**Proposed by**: Dr. William Park (Dashboard Architect)

**Description**: Include `$provider` variable with options:
- All (regex: `.*`)
- WEX (`wex`)
- Marqeta (`marqeta`)

**Rationale**:
- Allows filtering entire dashboard by provider
- Enables provider-specific investigation
- Follows Tier 2 variable-driven design pattern

**Status**: APPROVED AND IMPLEMENTED

---

### Decision 4: Collapsible Rows for Advanced Analysis

**Proposed by**: Elena Vasquez (Complexity Auditor)

**Description**: Rows 4-6 (Latency, Error Spotlight, Investigation Log) are collapsed by default.

**Rationale**:
- Reduces initial visual overwhelm
- Most operators only need Rows 1-3 for triage
- Expand for deeper investigation when needed

**Challenge Addressed**: Skeptic concern about 15 panels being overwhelming

**Status**: APPROVED AND IMPLEMENTED

---

### Decision 5: Loki-First Query Approach

**Proposed by**: Dr. Kenji Tanaka (Research Librarian)

**Description**: All dashboard panels use Loki (LogQL) queries, not Prometheus.

**Rationale**:
- EmberPayments logging goes to Loki via LokiLoggingService
- Prometheus metrics not emitted for card operations
- Consistent with Tier 1 migration decision

**Status**: APPROVED AND IMPLEMENTED

---

## Skeptic Challenges

### Challenge 1: Panel Count (Elena Vasquez)

**Challenge**: "15 panels may be overwhelming. Is every panel necessary?"

**Resolution**: Rows 4-6 collapsed by default. First-time users see Rows 1-3 only.

### Challenge 2: LogQL Limitations (Elena Vasquez)

**Challenge**: "Loki's LogQL has limited aggregation. Verify queries work."

**Resolution**: Used verified patterns from Tier 1 dashboard. Avoided unsupported functions.

### Challenge 3: User Validation (Dr. Richard Thornton)

**Challenge**: "Are we building what operators actually need?"

**Resolution**: Documented as future improvement. Recommend user feedback after deployment.

---

## Pending Decisions

*None. All decisions implemented.*


