# Session Goal

> **Session ID**: 2026-01-19_005_actionable-drilldowns
> **Date**: 2026-01-19
> **Type**: Design → Implementation

---

## Primary Objective

Transform the Tier 2 Reimbursements Ops View from "just numbers" to **actionable intelligence** by adding clickable drill-down capabilities to every stat panel.

---

## Success Criteria

- [ ] Each stat panel in Pipeline Flow is clickable
- [ ] Clicking opens a detailed view of individual items
- [ ] Blocked Payments section shows actionable details with one-click access
- [ ] Payment Health shows breakdown of what's healthy vs what's failing
- [ ] Drill-downs provide enough context for ops to take action WITHOUT leaving Grafana

---

## Scope Boundaries

**IN SCOPE:**
- Data links on existing stat panels
- New drill-down dashboards for each pipeline stage
- Enhanced blocked payments detail view
- LogQL queries for each drill-down

**OUT OF SCOPE:**
- Changes to logging implementation
- New metrics collection
- Tempo trace integration (existing links sufficient)

---

## Expected Outputs

1. **Updated tier2-reimbursements.json** with data links on all stat panels
2. **tier2-drilldown-details.json** - Single drill-down dashboard with variable-based views
3. Updated STATUS.md
4. Decision record for architecture approach

---

## User Need

> "It's just like at a glance, like telling me numbers and shit. I need to be able to click into every single one of these dashboards within the pipeline flow, payment health, blocked payments, and kind of get an insight of what's going on."

The user wants to go from WHAT (numbers) to WHO/WHY (individual records with context).
