# WEX Observability Gap Analysis

**Session**: 2026-01-22_001_wex-comprehensive-observability-review  
**Date**: 2026-01-22  
**Author**: Observability Committee  
**Status**: Complete

---

## Executive Summary

This document provides a comprehensive analysis of WEX observability coverage, identifying what has been implemented and what gaps remain to achieve 100% WEX observability in Grafana dashboards.

**Current State**: ~85% Complete  
**Gaps Identified**: 4  
**Critical Issues**: 1 (Dashboard provider label mismatch)

---

## 1. WEX Card Action Flows

### 1.1 Complete Implementations ✅

| Card Action | Reactor File | Start/End Logging | Step-Level Logging | Steps |
|-------------|--------------|-------------------|--------------------|----|
| **Issue Card** | `issue_card_reactor.ex` | ✅ | ✅ | 4 steps: validate_actor, get_connection, call_provider, create_db_record |
| **Freeze Card** | `freeze_card_reactor.ex` | ✅ | ✅ | 6 steps: validate_actor, fetch_card, get_connection, validate_state, call_provider, update_db |
| **Unfreeze Card** | `unfreeze_card_reactor.ex` | ✅ | ✅ | 8 steps: validate_actor, fetch_card, get_connection, validate_state, extract_limits, call_provider, restore_limits, update_db |
| **Cancel Card** | `cancel_card_reactor.ex` | ✅ | ✅ | 6 steps: validate_actor, fetch_card, get_connection, validate_state, call_provider, update_db |
| **Update Spending Limits** | `update_spending_limits_reactor.ex` | ✅ | ✅ | 5 steps: fetch_card, get_connection, store_limits, call_provider, update_db |

### 1.2 Partial Implementations (GAPS)

| Card Action | Reactor File | Start/End Logging | Step-Level Logging | Gap ID |
|-------------|--------------|-------------------|--------------------|----|
| **Activate Card** | `activate_card_reactor.ex` | ✅ | ❌ **MISSING** | GAP-WEX-001 |
| **Update Card Controls** | `update_card_controls_reactor.ex` | ✅ | ❌ **MISSING** | GAP-WEX-002 |

---

## 2. WEX Webhook Handlers

### 2.1 Transaction Stream Webhook ✅

**Controller**: `WexTransactionWebhookController`  
**Endpoint**: `POST /webhooks/wex_fleet/:connection_id/transactions`

**Loki Logging**: Complete
- `log_card_webhook_received/1` ✅
- `log_card_webhook_processed/1` ✅
- `log_card_webhook_error/1` ✅

**Event Types Covered**:
| Event Type | Category | Status |
|------------|----------|--------|
| `transactions.card.auth_approved` | authorization | ✅ Logged |
| `transactions.card.auth_declined` | authorization | ✅ Logged |
| `transactions.card.auth_reversed` | authorization | ✅ Logged |
| `transactions.card.purchase` | transaction | ✅ Logged |
| `transactions.card.purchase.reversal` | transaction | ✅ Logged |
| `transactions.card.refund` | transaction | ✅ Logged |
| `transactions.card.refund.reversal` | transaction | ✅ Logged |
| `transactions.card.chargeback` | transaction | ✅ Logged |
| `transactions.card.chargeback.reversal` | transaction | ✅ Logged |

### 2.2 Authorization Push Webhook ✅

**Controller**: `WexAuthorizationController`  
**Endpoint**: `POST /webhooks/wex/CreateDetailedAuthorization`

**Loki Logging**: Complete
- `log_card_webhook_received/1` ✅
- `log_card_webhook_processed/1` ✅
- `log_card_webhook_error/1` ✅

**Fields Logged**:
- `provider`: "wex_fleet"
- `webhook_event_type`: "authorization_push"
- `webhook_category`: "authorization" or "authorization_declined"
- `webhook_event_id`: AuthorizationId
- `card_token`: AccountToken
- `duration_ms`: Processing time

---

## 3. Grafana Dashboard Coverage

### 3.1 Dashboard Inventory

| Dashboard | File | WEX Coverage | Status |
|-----------|------|--------------|--------|
| Tier 1: Business Overview | `tier1-business-overview.json` | ✅ Included | Working |
| Tier 2: Card Operations | `tier2-card-operations.json` | ⚠️ **BROKEN** | GAP-WEX-003 |
| Webhook Monitoring | `webhook-monitoring.json` | ❌ **MISSING** | GAP-WEX-004 |
| Marqeta Flow Analysis | `marqeta-flow-analysis.json` | N/A | Marqeta-only |

### 3.2 Dashboard-Specific Gaps

#### GAP-WEX-003: Tier 2 Provider Variable Mismatch (CRITICAL)

**Location**: `tier2-card-operations.json`, lines 694-713

**Issue**: The `$provider` template variable defines WEX with value `"wex"`:
```json
{ "selected": false, "text": "WEX", "value": "wex" }
```

But the actual Loki logs use `provider: :wex_fleet` which becomes `"wex_fleet"` in JSON.

**Impact**: When user selects "WEX" in the dashboard, the filter `provider=~"wex"` does NOT match logs with `provider="wex_fleet"`.

**Fix**: Change the value from `"wex"` to `"wex_fleet"`:
```json
{ "selected": false, "text": "WEX", "value": "wex_fleet" }
```

#### GAP-WEX-004: Webhook Monitoring Dashboard Missing WEX

**Location**: `webhook-monitoring.json`

**Issue**: Dashboard description explicitly states coverage for "Dwolla, Checkbook, ERP" but does not include WEX/Marqeta card webhooks.

**Current Queries**: Only match:
- `ember_payments_.*webhook.*processed`
- `ember_payments_check_webhook_processed`

**Missing**: `ember_payments_card_webhook_*` events with `provider="wex_fleet"` or `provider="marqeta"`

**Fix**: Add a new row/section for "Card Provider Webhooks" that queries:
```logql
{domain="ember_payments", event_type=~"ember_payments_card_webhook.*"}
```

---

## 4. Gap Details

### GAP-WEX-001: Activate Card Step-Level Logging

**Reactor**: `activate_card_reactor.ex`  
**Current State**: Has start/end logging via `log_card_activation_start/end`  
**Missing**: Step-level logging functions

**Steps to Instrument**:
1. `validate_actor` - Verify actor has permission
2. `fetch_card` - Load card from database
3. `get_connection` - Resolve payment connection
4. `call_provider` - Call WEX API to activate
5. `update_db` - Update card status in database

**Required Functions to Add**:
- `log_card_activation_step_validate_actor/1`
- `log_card_activation_step_fetch_card/1`
- `log_card_activation_step_get_connection/1`
- `log_card_activation_step_call_provider/1`
- `log_card_activation_step_update_db/1`

---

### GAP-WEX-002: Update Card Controls Step-Level Logging

**Reactor**: `update_card_controls_reactor.ex`  
**Current State**: Has start/end logging via `log_card_controls_update_start/end`  
**Missing**: Step-level logging functions

**Steps to Instrument** (estimated):
1. `fetch_card` - Load card from database
2. `get_connection` - Resolve payment connection
3. `call_provider` - Call WEX API to update controls
4. `update_db` - Update card controls in database

**Required Functions to Add**:
- `log_card_controls_update_step_fetch_card/1`
- `log_card_controls_update_step_get_connection/1`
- `log_card_controls_update_step_call_provider/1`
- `log_card_controls_update_step_update_db/1`

---

### GAP-WEX-003: Dashboard Provider Variable Mismatch

**File**: `tier2-card-operations.json`  
**Line**: 706  
**Current**: `"value": "wex"`  
**Required**: `"value": "wex_fleet"`

**Priority**: 🔴 CRITICAL - Blocks all WEX visibility in Tier 2 dashboard

---

### GAP-WEX-004: Webhook Dashboard Missing WEX Card Webhooks

**File**: `webhook-monitoring.json`  
**Issue**: No panels for `ember_payments_card_webhook_*` events

**Required Panels**:
1. Card Webhook Health (gauge) - success rate by provider
2. Card Webhooks Received (stat) - count by provider
3. Card Webhook Errors (table) - error details
4. Card Webhook Volume Over Time (time series) - by provider and category

---

## 5. LokiLoggingService Functions Summary

### Existing WEX-Related Functions ✅

| Function | Purpose | Used By |
|----------|---------|---------|
| `log_card_issuance_start/1` | Card issue start | IssueCardReactor |
| `log_card_issuance_end/1` | Card issue end | IssueCardReactor |
| `log_card_issuance_step_*/1` | Card issue steps (4) | IssueCardReactor |
| `log_card_freeze_start/1` | Card freeze start | FreezeCardReactor |
| `log_card_freeze_end/1` | Card freeze end | FreezeCardReactor |
| `log_card_freeze_step_*/1` | Card freeze steps (6) | FreezeCardReactor |
| `log_card_unfreeze_start/1` | Card unfreeze start | UnfreezeCardReactor |
| `log_card_unfreeze_end/1` | Card unfreeze end | UnfreezeCardReactor |
| `log_card_unfreeze_step_*/1` | Card unfreeze steps (8) | UnfreezeCardReactor |
| `log_card_cancel_start/1` | Card cancel start | CancelCardReactor |
| `log_card_cancel_end/1` | Card cancel end | CancelCardReactor |
| `log_card_cancel_step_*/1` | Card cancel steps (6) | CancelCardReactor |
| `log_card_limits_update_start/1` | Limits update start | UpdateSpendingLimitsReactor |
| `log_card_limits_update_end/1` | Limits update end | UpdateSpendingLimitsReactor |
| `log_card_limits_update_step_*/1` | Limits update steps (5) | UpdateSpendingLimitsReactor |
| `log_card_activation_start/1` | Card activation start | ActivateCardReactor |
| `log_card_activation_end/1` | Card activation end | ActivateCardReactor |
| `log_card_controls_update_start/1` | Controls update start | UpdateCardControlsReactor |
| `log_card_controls_update_end/1` | Controls update end | UpdateCardControlsReactor |
| `log_card_webhook_received/1` | Webhook received | Both WEX controllers |
| `log_card_webhook_processed/1` | Webhook processed | Both WEX controllers |
| `log_card_webhook_error/1` | Webhook error | Both WEX controllers |

### Missing Functions (To Be Added)

| Function | Purpose | For |
|----------|---------|-----|
| `log_card_activation_step_validate_actor/1` | Activation step | ActivateCardReactor |
| `log_card_activation_step_fetch_card/1` | Activation step | ActivateCardReactor |
| `log_card_activation_step_get_connection/1` | Activation step | ActivateCardReactor |
| `log_card_activation_step_call_provider/1` | Activation step | ActivateCardReactor |
| `log_card_activation_step_update_db/1` | Activation step | ActivateCardReactor |
| `log_card_controls_update_step_fetch_card/1` | Controls step | UpdateCardControlsReactor |
| `log_card_controls_update_step_get_connection/1` | Controls step | UpdateCardControlsReactor |
| `log_card_controls_update_step_call_provider/1` | Controls step | UpdateCardControlsReactor |
| `log_card_controls_update_step_update_db/1` | Controls step | UpdateCardControlsReactor |

---

## 6. Action Items

| ID | Task | Priority | Effort |
|----|------|----------|--------|
| AI-084 | Fix Tier 2 dashboard provider variable (`wex` → `wex_fleet`) | 🔴 High | 5 min |
| AI-085 | Add step-level logging for activate_card_reactor.ex | 🟡 Medium | 1-2 hrs |
| AI-086 | Add step-level logging for update_card_controls_reactor.ex | 🟡 Medium | 1-2 hrs |
| AI-087 | Update Webhook Monitoring dashboard to include WEX | 🟡 Medium | 30 min |
| AI-088 | Verify WEX data appears after fixes | 🟢 Low | 15 min |

---

## 7. Verification Queries

After implementing fixes, use these LogQL queries to verify:

### Card Operations (Tier 2)
```logql
# All WEX card operation events
{domain="ember_payments", provider="wex_fleet"} | json | event_type=~"ember_payments_card_.*"

# WEX freeze operations with steps
{domain="ember_payments", provider="wex_fleet"} | json | event_type=~"ember_payments_card_freeze.*"

# WEX errors by operation type
{domain="ember_payments", provider="wex_fleet", status="error"} | json
```

### Webhooks
```logql
# All WEX webhook events
{domain="ember_payments", provider="wex_fleet"} | json | event_type=~"ember_payments_card_webhook.*"

# WEX webhook success rate
sum(count_over_time({domain="ember_payments", provider="wex_fleet", event_type="ember_payments_card_webhook_processed", status="success"}[24h])) / sum(count_over_time({domain="ember_payments", provider="wex_fleet", event_type="ember_payments_card_webhook_processed"}[24h]))

# WEX webhook errors
{domain="ember_payments", provider="wex_fleet", event_type="ember_payments_card_webhook_error"}
```

---

## 8. Conclusion

WEX observability is approximately 85% complete. The main barriers to 100% coverage are:

1. **Critical Dashboard Fix** (AI-084) - Prevents WEX data from appearing
2. **Step-Level Logging** (AI-085, AI-086) - Nice-to-have for debugging
3. **Webhook Dashboard** (AI-087) - Visibility gap for operations

Once AI-084 is implemented, WEX data will be visible in the Tier 2 Card Operations dashboard. The remaining items enhance debugging capability and operational visibility.

---

*Document generated by Observability Committee Session 2026-01-22_001*
