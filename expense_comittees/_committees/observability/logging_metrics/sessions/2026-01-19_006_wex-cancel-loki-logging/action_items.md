# Action Items

> **Session**: 2026-01-19_006_wex-cancel-loki-logging  
> **Date**: 2026-01-19

---

## Pending

| ID | Item | Owner | Priority | Status |
|----|------|-------|----------|--------|
| - | *None* | - | - | - |

---

## Completed

| ID | Item | Status | Completed |
|----|------|--------|-----------|
| AI-027 | Add Loki logging to WEX card cancellation | ✅ Done | 2026-01-19 |

---

## Implementation Details

**File Modified**: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_payments/adapters/providers/wex_fleet/capabilities/card_issuance.ex`

**Function**: `cancel_card/2` (lines 1031-1103)

**Changes**:
- Added `wex_api_request` event before API call
- Added `wex_api_response` event after API call (success path)
- Added `wex_api_response` event after API call (error path)
- Includes timing (`duration_ms`), operation type, and card_id

**Verified**:
- Physical card cancel path already has logging via `update_card` function
- Reactor-level logging (`log_card_cancel_start/end`) already complete
