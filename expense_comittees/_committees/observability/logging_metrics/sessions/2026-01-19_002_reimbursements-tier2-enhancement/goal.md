# Session Goal

> **Session ID**: 2026-01-19_002_reimbursements-tier2-enhancement  
> **Type**: Design → Implementation  
> **Created**: 2026-01-19

---

## Primary Objective

Enhance the Tier 2 Reimbursements Dashboard with **user-centric panels** that answer the questions operators actually ask, leveraging all three observability pillars (Loki, Prometheus, Tempo).

---

## Success Criteria

- [ ] Dashboard answers "Who is affected?" (organizations)
- [ ] Dashboard shows affected user count
- [ ] Dashboard enables "Today vs Yesterday" comparison
- [ ] Dashboard includes activity heatmap by hour
- [ ] All panels use appropriate data sources (Loki/Prometheus/Tempo)
- [ ] Dashboard remains performant and not cluttered

---

## Scope Boundaries

### IN SCOPE
- New "Who Is Affected" row with organization table
- Affected User Count stat panel
- Today vs Yesterday comparison panel
- Activity Heatmap by hour
- Integration of all three pillars

### OUT OF SCOPE (per Human Director)
- ❌ Money at Risk panel (rejected)
- ❌ Longest Wait Time panel (rejected)
- ❌ Average Time at Each Stage panel (rejected)

---

## Expected Outputs

1. **Updated Dashboard JSON** — `tier2-reimbursements.json` with new panels
2. **Session Transcript** — Full deliberation record
3. **Decisions** — Design decisions made

---

## Data Availability (Verified)

| Field | Location | Use |
|-------|----------|-----|
| `entity_id` | Loki label | Organization identifier |
| `employee_id` | Loki label | User identifier |
| `amount` | JSON body | Dollar amounts |
| `workspace_id` | Loki label | Workspace grouping |
