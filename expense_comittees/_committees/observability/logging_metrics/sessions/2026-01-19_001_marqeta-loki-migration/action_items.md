# Action Items

> **Session**: 2026-01-19_001_marqeta-loki-migration  
> **Date**: 2026-01-19

---

## Completed Items

### AI-016: Migrate Card Operations Dashboard to Loki

| Field | Value |
|-------|-------|
| **Priority** | HIGH |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Update Tier 1 Business Overview dashboard panels to use Loki queries instead of Prometheus metrics.

**Panels Updated**:
- 💳 Card Operations (ID: 1)
- WEX Fleet (ID: 10)
- Marqeta (ID: 11)
- Card Operations time series (ID: 30)

---

### AI-017: Fix EmberPayments Event Naming

| Field | Value |
|-------|-------|
| **Priority** | HIGH |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Update all event types in EmberPayments LokiLoggingService to use `ember_payments_` prefix.

**Functions Updated**:
- `log_card_issuance_start/end`
- `log_card_activation_start/end`
- `log_card_freeze_start/end`
- `log_card_unfreeze_start/end`
- `log_card_cancel_start/end`
- `log_card_controls_update_start/end`
- `log_card_limits_update_start/end`

---

### AI-018: Add `status` Label to End Events

| Field | Value |
|-------|-------|
| **Priority** | HIGH |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Add `status` as a Loki label (via `maybe_put_label`) to all `_end` events for efficient filtering.

---

### AI-020: Update Step-Level Event Names

| Field | Value |
|-------|-------|
| **Priority** | MEDIUM |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Update step-level event names with `ember_payments_` prefix.

**Functions Updated**:
- `log_card_connection_resolved`
- `log_card_provider_request`
- `log_card_provider_response`
- `log_card_database_record_created`
- `log_payout_batch_start/end`
- `log_kyb_verification_start/end`
- `log_error`

---

### AI-021: Align EmberReimbursements log_event

| Field | Value |
|-------|-------|
| **Priority** | MEDIUM |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Update EmberReimbursements LokiLoggingService to align `log_event` first argument with `event_type` label.

---

### AI-022: Multi-line Formatting

| Field | Value |
|-------|-------|
| **Priority** | LOW |
| **Assignee** | Implementation Team |
| **Status** | ✅ COMPLETED |
| **Completed** | 2026-01-19 |

**Description**: Update remaining functions to use multi-line pipe chain formatting.

---

## Open Items (Carry Forward)

### AI-014: Investigate `provider` Label Bug (From Previous Session)

| Field | Value |
|-------|-------|
| **Priority** | LOW |
| **Assignee** | SC01 |
| **Status** | ⏳ DEFERRED |
| **Due** | Next Session |

**Description**: The `provider` label may not be appearing correctly due to atom vs string key handling in `maybe_put_label`. This was worked around by migrating to Loki and ensuring string keys are used.

**Note**: The migration to Loki queries with proper string keys likely resolves this issue. Monitor in production.

---

### AI-023: Verify Marqeta Card Issuance in Dashboard

| Field | Value |
|-------|-------|
| **Priority** | HIGH |
| **Assignee** | Human Director |
| **Status** | 🔵 PENDING VERIFICATION |
| **Due** | Post-recompile |

**Description**: After recompiling the application, issue a Marqeta card and verify that logs appear on the Grafana dashboard.

**Verification Steps**:
1. Recompile the application
2. Issue a Marqeta card
3. Navigate to Tier 1 Business Overview dashboard
4. Verify "💳 Card Operations" and "Marqeta" panels show data

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Completed | 6 |
| ⏳ Deferred | 1 |
| 🔵 Pending Verification | 1 |

---

*Action items captured: 2026-01-19*

