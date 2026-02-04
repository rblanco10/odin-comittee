# Action Items

> **Session ID**: 2026-01-19_001_reimbursements-tier2-dashboard  
> **Status**: COMPLETE

---

## Completed Items

| ID | Item | Owner | Status | Completed |
|----|------|-------|--------|-----------|
| AI-018 | Create Tier 2 Reimbursements dashboard JSON | Dr. William Park | ✅ Complete | 2026-01-19 |
| AI-019 | Add drill-down link from Tier 1 to Tier 2 | Dr. William Park | ✅ Complete | 2026-01-19 |
| AI-020 | Implement provider traffic lights | Dr. William Park | ✅ Complete | 2026-01-19 |
| AI-021 | Implement stuck payment detection panel | Dr. William Park | ✅ Complete | 2026-01-19 |
| AI-022 | Implement webhook health visualization | Dr. William Park | ✅ Complete | 2026-01-19 |
| AI-023 | Add Tempo trace links to error table | Dr. William Park | ✅ Complete | 2026-01-19 |

---

## Open Items (Carried Forward)

| ID | Item | Owner | Priority | Status | Notes |
|----|------|-------|----------|--------|-------|
| AI-014 | Fix `provider` label not being set | SC01 | 🔴 High | Pending | From session 001 |
| AI-015 | Review `maybe_put_label/3` atom vs string | SC01 | 🔴 High | Pending | From session 001 |
| AI-016 | Verify `rail` label is being set | SC01 | 🟠 Medium | Pending | From session 001 |

---

## Recommended Follow-Up

| Item | Priority | Recommendation |
|------|----------|----------------|
| Fix AI-014 | 🔴 High | Will enable provider-specific filtering in Tier 2 |
| Add TempoTracingService | 🟡 Medium | Would add custom spans for reimbursement flows |
| Webhook structured logging | 🟡 Medium | Replace bare Logger with LokiLoggingService in webhook handlers |

---
