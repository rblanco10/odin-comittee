# Decisions

> **Session**: 2026-01-20_004_gap-fixes-implementation-plan  
> **Type**: Investigation → Design  
> **Date**: 2026-01-20

---

## Decisions Made

### DEC-022: Use $__range for Tier 1 Dashboard Queries

**Proposed by**: Dr. William Park (SC04 Lead)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Description**: Replace hardcoded `[5m]` windows with `[$__range]` in all Tier 1 gauge and stat panels to respect the dashboard time picker selection.

**Vote**: Unanimous approval

**Implementation Notes**:
- Affects 12 Loki query instances in tier1-business-overview.json
- Time series panels should keep `[5m]` for rolling window visualization

---

### DEC-023: Use Reactor input() References for Correlation IDs

**Proposed by**: Dr. Janet Liu (SC05 Lead)  
**Seconded by**: Thomas Hartwell (Performance Paranoid)

**Description**: Use Reactor's native `input()` reference pattern to pass `card_request_id` through the step argument flow, instead of relying on Process dictionary which may not persist reliably across steps.

**Vote**: Unanimous approval

**Implementation Notes**:
- Add `argument :card_request_id, input(:card_request_id)` to `:get_connection`, `:call_provider`, and `:create_db_record` steps
- Update `log_issue_error/2` to accept obs_ctx parameter
- Apply same pattern to all 7 card reactors

---

*Recorded by Session Clerk*
