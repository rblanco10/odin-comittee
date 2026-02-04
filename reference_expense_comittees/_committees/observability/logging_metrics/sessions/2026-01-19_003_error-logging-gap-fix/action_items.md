# Action Items

> **Session ID**: 2026-01-19_003_error-logging-gap-fix  
> **Created**: 2026-01-19

---

## Completed This Session

| ID | Item | Owner | Status | Notes |
|----|------|-------|--------|-------|
| AI-032 | Investigate dashboard Error Count showing 0 | SC01 | ✅ Done | Root cause: no error end events logged |
| AI-033 | Add error logging to CancelCardReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-034 | Add error logging to ActivateCardReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-035 | Add error logging to FreezeCardReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-036 | Add error logging to UnfreezeCardReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-037 | Add error logging to UpdateCardControlsReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-038 | Add error logging to UpdateSpendingLimitsReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-039 | Add error logging to IssueCardReactor | Implementation | ✅ Done | GAP-OPSBAR-048 |
| AI-040 | Update LokiLoggingService card end data builders | SC01 | ✅ Done | Added error_reason, workspace_id, entity_id |
| AI-041 | Subcommittee review of implementation | SC01, SC04 | ✅ Done | Approved with IssueCardReactor finding |

---

## Pending Items

| ID | Item | Owner | Priority | Status | Notes |
|----|------|-------|----------|--------|-------|
| AI-005 | WEX pilot: Test dashboard with live operations | Committee | 🟠 Medium | Pending | Existing item |
| AI-031 | Add drill-down link from Tier 1 to Tier 2 | SC04 | 🟠 Medium | Pending | Existing item |
| AI-007 | Add `level` label to LokiLoggingService events | SC01 | 🟢 Low | Pending | Existing item |
| AI-042 | Verify error logging with production failure scenario | Human Director | 🔴 High | Pending | Trigger error to confirm dashboard visibility |

---

## Files Modified

| File | Changes |
|------|---------|
| `CancelCardReactor` | Added `log_cancel_error/2`, enriched start logging |
| `ActivateCardReactor` | Added `log_activate_error/2`, enriched start logging |
| `FreezeCardReactor` | Added `log_freeze_error/2`, enriched start logging |
| `UnfreezeCardReactor` | Added `log_unfreeze_error/2`, enriched start logging |
| `UpdateCardControlsReactor` | Added `log_controls_update_error/2`, enriched start logging |
| `UpdateSpendingLimitsReactor` | Added `log_limits_update_error/2`, enriched start logging |
| `IssueCardReactor` | Added `log_issue_error/2`, error logging in call_provider |
| `LokiLoggingService` | Updated 7 card end data builders with error_reason, workspace_id, entity_id |

---

## Verification Checklist

- [x] All 7 reactors have error logging
- [x] LokiLoggingService accepts error_reason
- [x] Subcommittee review passed
- [x] No linter errors
- [ ] Production verification (pending)

---

*"An action item without an owner is an orphan."*

