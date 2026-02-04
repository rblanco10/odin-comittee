# Session Goal

> **Session**: 2026-01-20_004_gap-fixes-implementation-plan  
> **Type**: Investigation → Design  
> **Date**: 2026-01-20

---

## Primary Objective

Investigate AI-044 and AI-045, analyze root causes, and produce implementation plans for engineering handoff.

## Success Criteria

- [x] Root cause identified for GAP-ERR-LOG-001 (missing correlation IDs)
- [x] Root cause confirmed for GAP-DASH-002 ([5m] fixed window)
- [x] Implementation plan for AI-044 with specific code changes
- [x] Implementation plan for AI-045 with specific dashboard changes
- [x] Plans ready for engineering handoff

## Scope Boundaries

**IN SCOPE:**
- AI-044: Fix card_request_id/trace_id missing in error events
- AI-045: Fix Tier 1 Card Ops query to use $__range instead of [5m]
- Root cause investigation
- Implementation plan creation

**OUT OF SCOPE:**
- Actual implementation (handoff to engineering)
- Other dashboard improvements
- New logging patterns

## Expected Outputs

- [ ] Root cause analysis for both gaps
- [ ] Implementation plan documents
- [ ] Specific code/config changes identified
- [ ] Testing/verification strategy

---

*Created by Session Clerk*
