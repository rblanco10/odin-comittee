# Decisions

> **Session ID**: 2026-01-21_005_limits-update-logging-review  
> **Date**: 2026-01-21

---

## DEC-039: Fix Missing workspace_id/entity_id in Limits Update End Event

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. Janet Liu (SC05 Lead)

**Description**: The success path in `update_db_record` step is missing `workspace_id` and `entity_id` fields in the `log_card_limits_update_end` call. This is inconsistent with the error path and causes null values in Loki events.

**Discussion Summary**:
- User observed `workspace_id: null` and `entity_id: null` in production logs
- Error path (lines 427-438) correctly includes these fields
- Success path (lines 498-501) is missing them
- Same bug was fixed in CancelCardReactor (GAP-CANCEL-002)

**Challenges Raised**:
- None - straightforward bug fix

**Vote**: 
- In Favor: 4
- Opposed: 0

**Result**: APPROVED

---

## DEC-040: Add Step-Level Logging to UpdateSpendingLimitsReactor

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. Janet Liu (SC05 Lead)

**Description**: Add step-level logging to UpdateSpendingLimitsReactor for consistency with other card operation reactors (freeze, unfreeze, cancel, issue).

**Discussion Summary**:
- UpdateSpendingLimitsReactor has 6 steps (same as freeze/cancel)
- Prior session concluded step logging wasn't needed, but that was before freeze/unfreeze/cancel had step logging
- For consistency and debugging parity, limits update should have the same visibility

**Challenges Raised**:
- Elena Vasquez (Complexity Auditor): Challenged necessity, but revised assessment given consistency requirement
- Agreed on 5 step events (excluding validate_actor which only has Prometheus metric)

**Vote**: 
- In Favor: 4
- Opposed: 0

**Result**: APPROVED

---

## Summary

| Decision | Description | Status |
|----------|-------------|--------|
| DEC-039 | Fix missing workspace_id/entity_id in success path | ✅ Approved |
| DEC-040 | Add step-level logging (5 events) | ✅ Approved |
