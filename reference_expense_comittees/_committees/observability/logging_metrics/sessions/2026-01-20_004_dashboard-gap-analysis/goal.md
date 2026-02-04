# Session Goal: Dashboard Gap Analysis

> **Session**: 2026-01-20_004_dashboard-gap-analysis  
> **Type**: Discovery  
> **Opened**: 2026-01-20  
> **Chair**: Dr. Alexandra Chen

---

## Primary Objective

Conduct a comprehensive gap analysis of all Grafana dashboards to identify missing panels, incomplete coverage, and areas needing improvement. This will inform prioritization of next observability work.

---

## Success Criteria

- [ ] Complete inventory of all existing dashboards
- [ ] Review of each dashboard for completeness
- [ ] Identification of missing panels/metrics
- [ ] Comparison against available logging/metrics data
- [ ] Prioritized list of gaps with recommendations
- [ ] Actionable recommendations for next work

---

## Scope

### In Scope
- All Grafana dashboards in `campsite/pit/docker/grafana/provisioning/dashboards/`
- Panel completeness and coverage
- Query effectiveness
- Missing visualizations
- Comparison with available data sources (Loki, Prometheus, Tempo)
- Cross-dashboard consistency

### Out of Scope
- Implementation of fixes (discovery only)
- Alert configuration gaps (separate session)
- Infrastructure gaps (separate session)

---

## Expected Outputs

- [ ] Complete dashboard inventory
- [ ] Gap analysis document
- [ ] Prioritized gap list
- [ ] Recommendations for next work
- [ ] Action items (if any)

---

## Activated Members

| Member | Role | Reason |
|--------|------|--------|
| Dr. Alexandra Chen | Chair | Session management |
| Dr. Kenji Tanaka | Research Librarian | Inventory all dashboards |
| Dr. William Park | Dashboard Architect (SC04 Lead) | Review dashboard design and completeness |
| Dr. Robert Fleming | Dashboard Clutter Critic (SC04) | Assess panel utility and gaps |
| Emily Watson | Loki Query Master (SC04) | Review LogQL queries and coverage |
| Carlos Mendez | PromQL Wizard (SC04) | Review PromQL queries and coverage |
| Dr. Eleanor Blackwood | Session Historian | Provide context from past sessions |
| Sofia Rodriguez | Artifact Archivist | Document findings |
| Elena Vasquez | Complexity Auditor (Skeptic) | Challenge necessity of additions |
| Dr. Richard Thornton | Devil's Advocate General (Skeptic) | Challenge assumptions |

---

## Assigned Skeptics

| Skeptic | Focus |
|---------|-------|
| Elena Vasquez (Complexity Auditor) | Are proposed additions necessary? |
| Dr. Richard Thornton (Devil's Advocate) | Challenge assumptions about what's needed |

---

## Context

From STATUS.md:
- 6 active dashboards: Tier 1, Tier 2 Card Ops, Payment Operations, ERP Integration Health, Oban Jobs, System Overview
- Recent work: Checkbook dashboard verified, card issuance detailed logging added
- Need to identify what's missing to prioritize next work

---

## Related Sessions

- 2026-01-20_003_checkbook-dashboard-review - Recent dashboard review
- 2026-01-17_001_current-state-discovery - Initial state assessment
- 2026-01-19_002_tier2-card-ops-design - Tier 2 dashboard design

---

*"You cannot improve what you cannot see. Let's see what we're missing."*
