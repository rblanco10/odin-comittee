# Session Decisions

**Session**: 2026-01-20_010_marqeta-webhook-observability
**Status**: ✅ CLOSED

---

## Decision 1: Unified Event Naming for Card Providers

**Status**: ✅ APPROVED
**Date**: 2026-01-20

### Context
Marqeta and WEX both serve the "card" domain. We need a naming strategy that works for both.

### Decision
Use generic `ember_payments_card_webhook_*` event names with a `provider` label:
- `ember_payments_card_webhook_received`
- `ember_payments_card_webhook_processed`
- `ember_payments_card_webhook_error`

### Rationale
- Single query pattern works for all card providers
- Easy to filter by provider using labels
- Future-proof for WEX integration
- Consistent with existing Dwolla/Checkbook patterns

---

## Decision 2: Webhook Category Extraction

**Status**: ✅ APPROVED
**Date**: 2026-01-20

### Context
Marqeta sends many event types (`transaction.created`, `authorization.clearing`, etc.). We need a way to group them meaningfully.

### Decision
Implement `extract_webhook_category/1` function that maps event type prefixes to categories:

| Category | Event Prefixes |
|----------|----------------|
| `transaction` | `transaction.*` |
| `authorization` | `authorization.*` |
| `card` | `card.*`, `state.*` |
| `kyc` | `kyc.*` |
| `user` | `user.*` |
| `business` | `business.*` |
| `funding` | `fundingsource.*` |
| `digitalwallet` | `digitalwallet.*` |
| `chargeback` | `chargeback.*` |
| `directdeposit` | `directdeposit.*` |
| `transfer` | `programtransfer.*`, `peertransfer.*`, `pushtocard.*` |
| `threeds` | `threeds.*` |
| `ping` | `ping` |
| `other` | (fallback) |

### Rationale
- Low-cardinality label suitable for indexing (~15 values)
- Enables filtering by category in dashboards
- Maps to business domains (transactions, cards, compliance)

---

## Decision 3: Label vs Field Strategy

**Status**: ✅ APPROVED
**Date**: 2026-01-20

### Labels (Low Cardinality, Indexed)
| Label | Values | Purpose |
|-------|--------|---------|
| `domain` | `ember_payments` | Domain filter |
| `event_type` | `ember_payments_card_webhook_*` | Event classification |
| `provider` | `marqeta`, `wex` | Provider filter |
| `webhook_category` | ~15 values | Category filter |
| `status` | `success`, `ignored`, `retry`, `error` | Outcome filter |

### Fields (High Cardinality, JSON)
| Field | Type | Purpose |
|-------|------|---------|
| `webhook_event_type` | string | Full event type from provider |
| `webhook_event_id` | string | Provider's event ID |
| `card_token` | string | Provider's card token |
| `transaction_token` | string | Provider's transaction token |
| `authorization_token` | string | Provider's auth token |
| `connection_id` | UUID | PaymentConnection ID |
| `workspace_id` | UUID | Workspace ID |
| `duration_ms` | integer | Processing latency |
| `processing_result` | string | `processed`, `ignored`, `retry_later` |
| `error_type` | string | Error classification |
| `error_message` | string | Error details |

### Rationale
- Labels are efficient for filtering in queries (indexed)
- Fields provide full context without bloating index
- Follows cost management guidelines in LOGGING_STANDARDS.md

---

## Decision 4: Dashboard Implementation Approach

**Status**: 🔶 PENDING USER SELECTION
**Date**: 2026-01-20

### Context
Two dashboard approaches were implemented for comparison.

### Options

#### Idea A: Single Dashboard with Collapsible Rows
**File**: `webhook-monitoring-idea-a.json`
- Single URL, single dashboard
- 4 provider health gauges always visible
- Collapsible detail sections filtered by `$provider` variable
- Click gauge → sets provider variable

#### Idea D: Two-Level Dashboard Set
**Files**: 
- `webhook-monitoring-idea-d-overview.json`
- `webhook-provider-detail-idea-d.json`
- Clean separation: lightweight overview, detailed drill-down
- Back button navigation
- Overview loads fast (fewer queries)

### User Action Required
Test both in Grafana and delete unused files.

---

## Important Findings

### Finding 1: Marqeta Webhook Logging Was Non-Existent
Prior to this session, Marqeta webhooks used only bare `Logger.info` calls with no structured data. This made:
- Dashboard integration impossible
- Debugging difficult
- No duration/latency tracking
- No error classification

**Resolution**: Implemented full structured logging with start/end pattern.

### Finding 2: Event Type Normalization Required
Marqeta uses `state.activated` format for card state transitions, which needed normalization to `card.state_transition` for consistent category mapping.

**Resolution**: Added normalization in adapter before handler delegation.

### Finding 3: Existing Webhook Dashboard Excluded Marqeta
The existing `webhook-monitoring.json` explicitly excluded Marqeta with queries like:
```
provider!="marqeta"
```

**Resolution**: New dashboards include all 4 providers (Marqeta, WEX, Dwolla, Checkbook).

### Finding 4: WEX Integration Ready
The logging infrastructure is now ready for WEX webhooks. When WEX adapter is implemented:
- Use same `log_card_webhook_*` functions with `provider: :wex`
- No dashboard changes needed (already supports WEX)

---

## Files Modified

| File | Change |
|------|--------|
| `loki_logging_service.ex` | Added 4 new functions for card webhooks |
| `adapter.ex` (Marqeta) | Integrated structured logging |
| `EVENT_TAXONOMY.md` | Added card provider webhook documentation |
| `webhook-monitoring-idea-a.json` | Created (Idea A) |
| `webhook-monitoring-idea-d-overview.json` | Created (Idea D) |
| `webhook-provider-detail-idea-d.json` | Created (Idea D) |

---

## Session Closure

This session is **CLOSED**. All implementation work is complete.

**Remaining Action**: User must test both dashboard versions and select one. Delete unused dashboard files afterward.
