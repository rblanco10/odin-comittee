# Action Items

> **Session ID**: 2026-01-19_002_reimbursements-tier2-enhancement  
> **Type**: Design → Implementation  
> **Date**: 2026-01-19

---

## Completed This Session

| ID | Item | Owner | Status |
|----|------|-------|--------|
| AI-020 | Add "Who Is Affected" row with org/user panels | Dr. William Park | ✅ Complete |
| AI-021 | Add "Today vs Yesterday" comparison panels | Dr. William Park | ✅ Complete |
| AI-022 | Add Activity Heatmap panel | Dr. William Park | ✅ Complete |
| AI-023 | Add organization (entity_id) variable filter | Dr. William Park | ✅ Complete |
| AI-024 | Verify data availability (entity_id, employee_id) | Dr. Kenji Tanaka | ✅ Complete |

---

## Carried Forward (From Prior Sessions)

| ID | Item | Owner | Priority | Status |
|----|------|-------|----------|--------|
| AI-014 | **BUG**: Fix `provider` label not being set in Loki logs | SC01 | 🔴 High | Pending |
| AI-015 | Review `maybe_put_label/3` atom key vs string key handling | SC01 | 🔴 High | Pending |
| AI-005 | WEX pilot: Test dashboard with live operations | Committee | 🔴 High | Pending |
| AI-016 | Verify `rail` label is being set correctly | SC01 | 🟠 Medium | Pending |

---

## New Opportunities Identified

| Item | Description | Priority |
|------|-------------|----------|
| Organization name lookup | Currently shows UUID, could show friendly name | 🟢 Low |
| Provider breakdown by org | Add provider column to org table (blocked by AI-014) | 🟠 Medium |
| Tempo trace embedding | Embed trace viewer panel (Grafana 10+) | 🟢 Low |

---

## Testing Recommendations

1. **Start observability stack**: `cd campsite/pit/docker && docker compose -f docker-compose.local.yml up -d`
2. **Open Grafana**: http://localhost:3000 (admin/admin)
3. **Navigate to dashboard**: Dashboards → Tier 2 - Reimbursements Ops View
4. **Trigger test payment**: Generate reimbursement payment activity
5. **Verify new panels populate**: Check org table, user counts, comparison stats, heatmap
