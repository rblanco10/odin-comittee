# Session Decisions

**Session ID**: 2026-01-22_007_update-card-controls-step-logging

---

## DEC-058: Add 6 Step-Level Logging Functions

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. Janet Liu (SC05 Lead)

**Description**: Add 6 step-level logging functions to LokiLoggingService following the established pattern from ActivateCardReactor:
- `log_card_controls_update_step_validate_actor/1`
- `log_card_controls_update_step_fetch_card/1`
- `log_card_controls_update_step_get_connection/1`
- `log_card_controls_update_step_store_controls/1`
- `log_card_controls_update_step_call_provider/1`
- `log_card_controls_update_step_update_db/1`

**Vote**: Unanimous  
**Result**: APPROVED

---

## DEC-059: Add `failed_at_step` Field to End Event

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. Janet Liu (SC05 Lead)

**Description**: Add `failed_at_step` field to `log_card_controls_update_end/1` function per Section 7.6 of LOGGING_STANDARDS.md, enabling Tier 2 dashboard to show which step caused failures.

**Vote**: Unanimous  
**Result**: APPROVED

---

## DEC-060: Add `log_operation_end_on_step_error/3` Helper

**Proposed by**: Dr. Janet Liu (SC05 Lead)  
**Seconded by**: Dr. Michael Torres (SC01 Lead)

**Description**: Add private helper function `log_operation_end_on_step_error/3` to UpdateCardControlsReactor to ensure all early step failures emit operation-end events, making them visible in Tier 2 dashboards.

**Vote**: Unanimous  
**Result**: APPROVED

---

## DEC-061: Include `store_current_controls` as Step 4

**Proposed by**: Dr. Janet Liu (SC05 Lead)  
**Seconded by**: Dr. Michael Torres (SC01 Lead)

**Description**: Include `store_current_controls` step in instrumentation as step 4. This step is unique to UpdateCardControlsReactor (stores original values for compensation) and should be logged for complete flow visibility.

**Challenge by Elena Vasquez (SK002)**: "Is this step necessary to log? It never fails."

**Response**: While it rarely fails, logging provides complete flow visibility and step timing data useful for performance analysis. The overhead is negligible (~100μs).

**Vote**: Unanimous  
**Result**: APPROVED
