# Action Items

> **Session ID**: 2026-01-19_002_tier2-card-ops-design  
> **Type**: Design → Implementation  
> **Status**: CLOSED

---

## Completed This Session

| ID | Item | Owner | Status | Completed |
|----|------|-------|--------|-----------|
| AI-024 | Design Tier 2 Card Operations dashboard | Dr. William Park | ✅ Done | 2026-01-19 |
| AI-025 | Implement `tier2-card-operations.json` | Committee | ✅ Done | 2026-01-19 |
| AI-026 | Document dashboard design decisions | Session Clerk | ✅ Done | 2026-01-19 |

---

## New Action Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-027 | Restart Grafana to load new dashboard | Human Director | 🔴 High | ✅ Done | 2026-01-19 |
| AI-028 | Verify dashboard displays correctly | Human Director | 🔴 High | ✅ Done | 2026-01-19 |
| AI-029 | Generate test card operation for data | Human Director | 🟠 Medium | ✅ Done | 2026-01-19 |
| AI-030 | Collect user feedback on dashboard usefulness | Committee | 🟢 Low | In Progress | 2026-01-19 |
| AI-031 | Add drill-down link from Tier 1 to Tier 2 | SC04 | 🟠 Medium | Pending | 2026-01-19 |
| AI-032 | Pass card_last4 to logging function calls | Dev Team | 🟠 Medium | ✅ Done | 2026-01-19 |

---

## Enhancements Implemented (Review Session 2026-01-19)

| ID | Item | Status | Completed |
|----|------|--------|-----------|
| ENH-001 | Add `card_last4` field to all card operation log functions | ✅ Done | 2026-01-19 |
| ENH-002 | Add Operation type filter to dashboard | ✅ Done | 2026-01-19 |
| ENH-003 | Add Search textbox for log filtering | ✅ Done | 2026-01-19 |
| ENH-004 | Fix dropdown variable configuration | ✅ Done | 2026-01-19 |
| ENH-005 | Pass `card_last4` from all 7 card reactors | ✅ Done | 2026-01-19 |
| ENH-006 | Add `$status` filter to Investigation Log query | ✅ Done | 2026-01-19 |

---

## Verification Steps

To verify the implementation:

1. **Restart Grafana**:
   ```bash
   cd campsite/pit/docker
   docker compose -f docker-compose.local.yml restart grafana
   ```

2. **Access Dashboard**:
   - Open http://localhost:3000
   - Look for "Tier 2: Card Operations" in dashboard list
   - Or navigate directly to: `/d/tier2-card-ops/tier-2-card-operations`

3. **Verify Panels**:
   - Row 1: 6 gauges/stats visible
   - Row 2: 2 bar charts visible
   - Row 3: 2 time series visible
   - Rows 4-6: Collapsed (click to expand)

4. **Test Filters**:
   - Change Provider dropdown to "WEX" or "Marqeta"
   - Verify all panels update

5. **Test with Data**:
   - Trigger a card issuance in the application
   - Verify logs appear in Investigation Log panel
   - Verify gauges update with new data

---

## Future Enhancements

| Item | Priority | Notes |
|------|----------|-------|
| Add alert rules for card operations | Medium | Define thresholds and notification channels |
| Add Tempo trace links | Low | Link from logs to traces when trace_id present |
| Add card ID search | Medium | Allow lookup of specific card operations |
| Create Tier 2 for other domains | Medium | Reimbursements, AP Payments, ERP Sync |


