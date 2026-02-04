# Session Goal: WEX Activate Card Logging Verification

> **Session ID**: 2026-01-22_006_wex-activate-card-verification
> **Type**: Verification
> **Opened**: 2026-01-22

---

## Primary Objective

Verify that the step-level logging implementation for WEX ActivateCardReactor (AI-085, implemented in Session 005) is working correctly and producing the expected Loki events.

---

## Success Criteria

- [x] All 6 step-level events appear in Loki (validate_actor, fetch_card, get_connection, validate_state, call_provider, update_db) ✅
- [x] Operation start event appears: `ember_payments_card_activation_start` ✅
- [x] Operation end event appears: `ember_payments_card_activation_end` ✅
- [x] All events contain correct labels: `provider=wex_fleet`, `domain=ember_payments` ✅
- [x] Step timing (`step_duration_ms`) is populated for all step events ✅
- [x] Trace correlation (`trace_id`, `span_id`) is propagated across steps ✅
- [x] Dashboard (Tier 2 Card Operations) shows WEX activation data ✅

---

## Scope

**IN SCOPE**:
- IEx-based testing of WEX card activation
- Loki log verification via Grafana
- Tier 2 dashboard WEX provider filter verification

**OUT OF SCOPE**:
- Testing error paths (future session)
- UI testing (may be discussed but not required)
- Other providers (Marqeta, Stripe)

---

## Expected Outputs

- [x] Verified IEx test procedure documented ✅
- [x] Loki query examples for verification ✅
- [x] Screenshot/evidence of events in Grafana ✅
- [x] AI-085 marked as fully verified ✅

