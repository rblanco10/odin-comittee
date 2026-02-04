# Action Items

> **Session ID**: 2026-01-17_001_current-state-discovery  
> **Type**: Discovery → Design → Implementation → Debug  
> **Status**: CLOSED (Final)

---

## Open Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-005 | WEX pilot: Test dashboard with live operations | Committee | 🔴 High | Pending | 2026-01-17 |
| AI-006 | Validate/adjust metric names after testing | Dr. William Park | 🟠 Medium | Pending | 2026-01-17 |
| AI-007 | Add `level` label to LokiLoggingService events | SC01 | 🟢 Low | Pending | 2026-01-17 |
| AI-008 | Instrument `log_provider_api_request/response` at adapter level (optional) | SC01 | 🟢 Low | Pending | 2026-01-17 |
| AI-014 | **BUG**: Fix `provider` label not being set in Loki logs | SC01 | 🔴 High | Pending | 2026-01-17 |
| AI-015 | Review `maybe_put_label/3` atom key vs string key handling | SC01 | 🔴 High | Pending | 2026-01-17 |
| AI-016 | Verify `rail` label is being set correctly | SC01 | 🟠 Medium | Pending | 2026-01-17 |
| AI-017 | Migrate remaining dashboard panels to Loki (Card Ops, AP Payments, ERP) | Dr. William Park | 🟠 Medium | Pending | 2026-01-17 |

---

## Contract Document Requirements

The `logging_contract.md` must include:

### Standard Log Labels
| Label | Type | Required | Example Values |
|-------|------|----------|----------------|
| provider | string | Yes | wex, marqeta, dwolla, checkbook |
| operation | string | Yes | card_issuance, card_txn, ach_payment |
| status | string | Yes | success, error, pending |
| domain | string | Yes | ember_payments, ember_reimbursements |
| trace_id | string | Yes | UUID |
| workspace_id | string | Yes | UUID |

### Standard Metric Names
- `ember_payments_card_issuance_{start,stop}_total{provider, status}`
- `ember_payments_card_transaction_{start,stop}_total{provider, status}`
- `ember_reimbursements_payout_{start,stop}_total{provider, status}`
- `ember_erp_sync_{start,stop}_total{erp_provider, entity_type, status}`

---

## Completed Items

| ID | Item | Owner | Completed | Notes |
|----|------|-------|-----------|-------|
| AI-000 | Document session proceedings | Session Clerk | 2026-01-17 | Full transcript maintained |
| AI-001 | Create observability contract document | Human Director + Team A | 2026-01-17 | `logging_standard.md` (528 lines) |
| AI-002 | Schedule sync meeting with Team A | Human Director | 2026-01-17 | Confirmed by Human Director |
| AI-003 | Build Tier 1 dashboard | Dr. William Park | 2026-01-17 | `tier1-business-overview.json` |
| AI-004 | Verify existing metrics/labels for Tier 1 | Dr. Kenji Tanaka | 2026-01-17 | `gap_analysis.md` |
| AI-009 | Add payout batch events to LokiLoggingService | SC01 | 2026-01-17 | 4 new functions added |
| AI-010 | Instrument PaymentService with LokiLoggingService | SC01 | 2026-01-17 | Full instrumentation |
| AI-011 | Update EVENT_TAXONOMY.md | SC18 | 2026-01-17 | New payout section added |
| AI-012 | Verify implementation against LOGGING_STANDARDS | SC01/SC18 | 2026-01-17 | 11/11 checks passed |
| AI-013 | Document Grafana access and queries | SC04 | 2026-01-17 | Quick reference provided |
| AI-018 | Verify ember_reimbursements domain visible in Loki | Dr. Kenji Tanaka | 2026-01-17 | ✅ 11 log streams confirmed |
| AI-019 | Update Reimbursements panel to use Loki | Dr. William Park | 2026-01-17 | Panel 2 → Loki LogQL |
| AI-020 | Update Dwolla (ACH) panel to use Loki | Dr. William Park | 2026-01-17 | Panel 12 → Loki LogQL (workaround) |
| AI-021 | Diagnose Tier 1 dashboard not populating | Committee | 2026-01-17 | Root cause: Prometheus vs Loki mismatch |

---

## Notes

**AI-007 (level label)**: The LOGGING_STANDARDS.md Section 4.1 requires a `level` label. Current implementation relies on Loki's log level detection. Adding explicit label would enable queries like `{domain="ember_reimbursements", level="error"}`.

**AI-008 (provider API logging)**: Functions exist but aren't called. Would provide visibility into individual Dwolla API calls. Current batch-level logging is sufficient for most debugging needs.

**AI-014/AI-015 (provider label bug)**: Critical issue discovered. The `LokiLoggingService.log_reimbursement_payment_end/1` function has code to add the `provider` label via `maybe_put_label(:provider, Keyword.get(opts, :provider))`, but the label is NOT appearing in Loki logs. Suspected causes:
1. `provider` value may be nil by the time it reaches the logging function
2. `maybe_put_label/3` uses atom keys (`:provider`) while other labels use string keys (`"domain"`, `"event_type"`) - potential key type mismatch
3. `LogBatchingGenServer` may not be converting atom keys to strings before sending to Loki

**Workaround Applied**: Dwolla panel query updated to not require `provider` label. This means the panel currently shows ALL reimbursement payments regardless of provider. Once the bug is fixed, the query should be restored to include `provider="dwolla"`.

**AI-017 (dashboard migration)**: The Tier 1 dashboard was built with Prometheus queries but the logging implementation sends to Loki. Two panels have been migrated (Reimbursements, Dwolla). Other panels (Card Operations, AP Payments, ERP Sync) still use Prometheus and will need similar migration if their domains also use Loki-based logging.

---

## Follow-Up Sessions Needed

| Session Type | Topic | Priority |
|--------------|-------|----------|
| Bug Fix | Provider label not appearing in Loki logs | 🔴 High |
| Testing | WEX pilot validation | 🔴 High |
| Review | Metric name verification | 🟠 Medium |
| Implementation | Migrate remaining dashboard panels to Loki | 🟠 Medium |
| Implementation | Tier 2 dashboards (Card Ops, AP Payments, ERP) | 🟡 Low |


