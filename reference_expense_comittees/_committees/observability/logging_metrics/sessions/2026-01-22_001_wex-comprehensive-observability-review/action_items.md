# Action Items

**Session ID**: 2026-01-22_001_wex-comprehensive-observability-review
**Date**: 2026-01-22

---

## Open Action Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-084 | Fix Tier 2 dashboard `$provider` variable: change "wex" to "wex_fleet" | SC04 Dashboard | 🔴 High | Pending | 2026-01-22 |
| AI-085 | Add step-level logging for `activate_card_reactor.ex` (5 steps) | SC01 Logging | 🟡 Medium | Pending | 2026-01-22 |
| AI-086 | Add step-level logging for `update_card_controls_reactor.ex` (estimate 4-5 steps) | SC01 Logging | 🟡 Medium | Pending | 2026-01-22 |
| AI-087 | Update Webhook Monitoring dashboard to include WEX card webhooks | SC04 Dashboard | 🟡 Medium | Pending | 2026-01-22 |
| AI-088 | Verify WEX data appears in Tier 2 dashboard after AI-084 fix | Human Director | 🟢 Low | Pending | 2026-01-22 |

---

## Implementation Priority

### Phase 1: Critical Dashboard Fix (AI-084)
**Why**: If the provider label doesn't match, NO WEX data is visible in Grafana.
**Effort**: 5 minutes
**Files**: `tier2-card-operations.json`

### Phase 2: Webhook Dashboard Update (AI-087)
**Why**: WEX webhook health is being logged but not displayed.
**Effort**: 30 minutes
**Files**: `webhook-monitoring.json`

### Phase 3: Step-Level Logging (AI-085, AI-086)
**Why**: Consistency with other reactors; enables step-level debugging.
**Effort**: 2-3 hours
**Files**: 
- `loki_logging_service.ex` (add ~10 new functions)
- `activate_card_reactor.ex` (instrument 5 steps)
- `update_card_controls_reactor.ex` (instrument 4-5 steps)

---

## WEX Observability Completeness After Fixes

Once all action items are complete:

| Area | Status |
|------|--------|
| Card Issuance | ✅ Complete (start/end + 4 steps) |
| Card Freeze | ✅ Complete (start/end + 6 steps) |
| Card Unfreeze | ✅ Complete (start/end + 8 steps) |
| Card Cancel | ✅ Complete (start/end + 6 steps) |
| Update Spending Limits | ✅ Complete (start/end + 5 steps) |
| Activate Card | ✅ Complete (start/end + 5 steps) |
| Update Card Controls | ✅ Complete (start/end + 4-5 steps) |
| Transaction Stream Webhook | ✅ Complete (received/processed/error) |
| Authorization Push Webhook | ✅ Complete (received/processed/error) |
| Tier 2 Dashboard | ✅ Shows WEX data |
| Webhook Dashboard | ✅ Shows WEX webhooks |

**Goal Achievement**: 100% WEX Observability ✅
