# Session Decisions

> **Session**: 2026-01-19_007_checkbook-observability-planning  
> **Status**: IMPLEMENTED

---

## DEC-018: Checkbook Observability Implementation Pattern

**Decision**: Implement Checkbook.io observability following the established provider pattern.

**Rationale**: Checkbook is a payout provider (like Dwolla), so it should follow the same observability pattern - Tier 1 dashboard panel only, no Tier 2 dashboard needed.

**Implementation**:
1. Add `LokiLoggingService` functions for Checkbook operations
2. Instrument `payout_disbursement.ex` with structured logging
3. Instrument webhook processing with structured logging
4. Update Tier 1 dashboard to use Loki instead of Prometheus
5. Document events in EVENT_TAXONOMY.md

---

## DEC-019: Tier 2 Dashboard Not Required for Checkbook

**Decision**: Checkbook does NOT need a Tier 2 dashboard.

**Rationale**: 
- Tier 2: Card Operations is specifically for card providers (WEX, Marqeta)
- Dwolla (another payout provider) only has Tier 1 representation
- Checkbook should follow the same pattern as Dwolla

**If needed later**: A "Tier 2: Payout Operations" dashboard covering both Dwolla and Checkbook could be created, but this is out of scope for this session.

---

## DEC-020: Checkbook Event Naming Convention

**Decision**: Use `ember_payments_check_*` prefix for Checkbook-specific events.

**Event Types**:
| Event | Description |
|-------|-------------|
| `ember_payments_check_payout_start` | Check payout creation started |
| `ember_payments_check_payout_end` | Check payout creation completed |
| `ember_payments_check_status_start` | Check status query started |
| `ember_payments_check_status_end` | Check status query completed |
| `ember_payments_check_cancel_start` | Check cancellation started |
| `ember_payments_check_cancel_end` | Check cancellation completed |
| `ember_payments_checkbook_api_request` | Outbound Checkbook API call |
| `ember_payments_checkbook_api_response_success` | Checkbook API success |
| `ember_payments_checkbook_api_response_error` | Checkbook API error |
| `ember_payments_check_webhook_received` | Webhook received |
| `ember_payments_check_webhook_processed` | Webhook processed |
| `ember_payments_check_webhook_error` | Webhook error |

---

## Files Modified

1. **LokiLoggingService** (`ember_payments/observability/services/loki_logging_service.ex`)
   - Added 12 new Checkbook-specific logging functions

2. **PayoutDisbursement** (`adapters/providers/checkbook/capabilities/payout_disbursement.ex`)
   - Instrumented `create_payout`, `get_payout_status`, `cancel_payout`
   - Added timing and structured logging

3. **Checkbook Adapter** (`adapters/providers/checkbook/adapter.ex`)
   - Instrumented `process_webhook_event`
   - Added webhook received/processed/error logging

4. **Tier 1 Dashboard** (`tier1-business-overview.json`)
   - Changed Checkbook panel from Prometheus to Loki datasource
   - Updated query to use `ember_payments_check_payout_end` event

5. **EVENT_TAXONOMY.md**
   - Added Checkbook Check Operations section
   - Added Checkbook API Operations section
   - Added Checkbook Webhook Operations section
