# Action Items

**Session**: 2026-01-21_007_wex-webhook-observability
**Status**: Implementation Plan Created - Ready for Engineering

---

## Action Items

| ID | Task | Owner | Priority | Status |
|----|------|-------|----------|--------|
| AI-080 | Add Loki logging to `WexTransactionWebhookController` | Engineering | 🔴 High | ⏳ Pending |
| AI-081 | Add Loki logging to `WexAuthorizationController` | Engineering | 🔴 High | ⏳ Pending |
| AI-082 | Verify WEX webhooks appear in Grafana dashboard | Engineering | 🟡 Medium | ⏳ Pending |

---

## Detailed Tasks

### AI-080: Add Loki Logging to WexTransactionWebhookController

**File**: `lib/flame_teampay_payables_web/controllers/wex_transaction_webhook_controller.ex`

**Changes Required**:
1. Add alias for `LokiLoggingService`
2. Add `extract_wex_webhook_category/1` helper function
3. Add `start_time` capture at function entry
4. Add `log_card_webhook_received` after payload extraction
5. Add `log_card_webhook_processed` on success paths
6. Add `log_card_webhook_error` on error paths

**Reference**: See `IMPLEMENTATION_PLAN.md` for complete code

---

### AI-081: Add Loki Logging to WexAuthorizationController

**File**: `lib/flame_teampay_payables_web/controllers/wex_authorization_controller.ex`

**Changes Required**:
1. Add alias for `LokiLoggingService`
2. Add `extract_wex_auth_category/1` helper function
3. Add `start_time` capture at function entry
4. Add `log_card_webhook_received` after payload extraction
5. Add `log_card_webhook_processed` on success
6. Add `log_card_webhook_error` on error

**Reference**: See `IMPLEMENTATION_PLAN.md` for complete code

---

### AI-082: Verify WEX Webhooks in Grafana

**Steps**:
1. Start observability stack: `docker compose -f docker-compose.local.yml up -d`
2. Trigger a WEX webhook (live or simulated)
3. Open http://localhost:3000/d/webhook-monitoring
4. Verify "wex_fleet" appears in provider breakdown
5. Run Loki query: `{domain="ember_payments", provider="wex_fleet"} | json`

---

## Implementation Artifact

**Location**: `_committees/observability/logging_metrics/sessions/2026-01-21_007_wex-webhook-observability/artifacts/guides/IMPLEMENTATION_PLAN.md`

This document contains:
- Complete code for both controllers
- Step-by-step implementation instructions
- Verification steps with curl commands
- Expected Loki events
- Rollback plan
