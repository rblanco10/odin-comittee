# Decisions

> **Session**: 2026-01-21_002_wex-cancel-step-logging  
> **Date**: 2026-01-21

---

## Pending Decisions

*None*

---

## Approved Decisions

| ID | Decision | Status |
|----|----------|--------|
| DEC-031 | Add 6 step-level logging functions to LokiLoggingService | ✅ Approved |
| DEC-032 | Modify CancelCardReactor to log all 6 steps | ✅ Approved |
| DEC-033 | Follow freeze/unfreeze pattern exactly | ✅ Approved |

---

## Decision Details

### DEC-031: Step-Level Logging Functions

**Proposed by**: Dr. Michael Torres (SC01 Lead)

**Description**: Add 6 step-level logging functions to LokiLoggingService:
1. `log_card_cancel_step_validate_actor/1`
2. `log_card_cancel_step_fetch_card/1`
3. `log_card_cancel_step_get_connection/1`
4. `log_card_cancel_step_validate_state/1`
5. `log_card_cancel_step_call_provider/1`
6. `log_card_cancel_step_update_db/1`

Plus private helper `log_cancel_step/2`.

**Event Type Pattern**: `ember_payments_card_cancel_step_{step_name}`

---

### DEC-032: CancelCardReactor Modifications

**Proposed by**: Dr. Janet Liu (SC05 Lead)

**Description**: Modify each step in CancelCardReactor to:
1. Record `step_start_time` at step entry
2. Calculate `step_duration_ms` at step completion
3. Determine `step_status` based on result (success/error)
4. Call corresponding `log_card_cancel_step_*` function

---

### DEC-033: Pattern Consistency

**Proposed by**: Dr. Alexandra Chen (Chair)

**Description**: Follow the exact pattern established in session 2026-01-20_012 for freeze/unfreeze to maintain consistency across all card operations.
