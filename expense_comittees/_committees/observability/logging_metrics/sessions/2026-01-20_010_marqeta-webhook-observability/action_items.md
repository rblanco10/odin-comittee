# Action Items

**Session**: 2026-01-20_010_marqeta-webhook-observability
**Status**: ✅ CLOSED

---

## Completed ✅

### AI-001: Implement LokiLoggingService Card Webhook Functions
**Status**: ✅ COMPLETE
**File**: `lib/flame_teampay_payables/ember_payments/observability/services/loki_logging_service.ex`

Added:
- `log_card_webhook_received/1`
- `log_card_webhook_processed/1`
- `log_card_webhook_error/1`
- `extract_webhook_category/1`

---

### AI-002: Update Marqeta Adapter with Structured Logging
**Status**: ✅ COMPLETE
**File**: `lib/flame_teampay_payables/ember_payments/adapters/providers/marqeta/adapter.ex`

Changes:
- Added `LokiLoggingService` alias
- Implemented start/end logging pattern in `process_webhook_event/2`
- Added duration tracking with `System.monotonic_time/1`
- Logs received → processed/error flow

---

### AI-003: Update EVENT_TAXONOMY.md
**Status**: ✅ COMPLETE
**File**: `_committees/observability/logging_metrics/knowledge_base/patterns/EVENT_TAXONOMY.md`

Added:
- "Card Provider Webhook Operations (Marqeta/WEX)" section
- Webhook categories table with 15 categories
- Labels (low cardinality) documentation
- Fields (high cardinality) documentation

---

### AI-004: Create Idea A Dashboard
**Status**: ✅ COMPLETE
**File**: `campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-a.json`

Single dashboard with:
- 4 provider health gauges (Marqeta, WEX, Dwolla, Checkbook)
- Collapsible detail rows filtered by $provider variable
- Performance, errors, and event stream sections

---

### AI-005: Create Idea D Dashboard Set
**Status**: ✅ COMPLETE
**Files**:
- `webhook-monitoring-idea-d-overview.json`
- `webhook-provider-detail-idea-d.json`

Two-level approach:
- Overview shows all 4 providers with aggregate metrics
- Clicking provider drills into dedicated detail dashboard

---

## Post-Session Action ⚠️

### HUMAN-001: Test and Select Dashboard Approach
**Status**: ⏳ PENDING
**Assignee**: Human Director
**Priority**: HIGH

**Instructions**:
1. Start Grafana: `docker-compose up grafana`
2. Navigate to Idea A: `http://localhost:3000/d/webhook-monitoring-idea-a`
3. Navigate to Idea D: `http://localhost:3000/d/webhook-monitoring-idea-d`
4. Test clicking provider gauges in each
5. Decide which approach to adopt

**Questions to consider**:
- Which feels more intuitive?
- Do you prefer one URL or two-dashboard approach?
- Which is easier to navigate?

---

### CLEANUP-001: Delete Unused Dashboard Files
**Status**: ⏳ BLOCKED (waiting on HUMAN-001)
**Assignee**: Human Director or AI
**Priority**: HIGH

⚠️ **AFTER selecting a dashboard approach, DELETE the unused files:**

**If Idea A selected:**
```bash
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-d-overview.json
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail-idea-d.json
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-a.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring.json
```

**If Idea D selected:**
```bash
rm campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-a.json
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring-idea-d-overview.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-monitoring.json
mv campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail-idea-d.json \
   campsite/pit/docker/grafana/provisioning/dashboards/webhook-provider-detail.json
```

---

## Future Work ⏸️

### FUTURE-001: Implement WEX Webhook Logging
**Status**: ⏸️ DEFERRED
**Trigger**: When WEX integration is ready

When WEX adapter is implemented:
- Use same `log_card_webhook_*` functions with `provider: :wex`
- No dashboard changes needed (already supports WEX provider)
- Pattern is established, just follow Marqeta implementation

---

### FUTURE-002: Add Alerting Rules
**Status**: ⏸️ DEFERRED

Consider adding Grafana alerting for:
- Webhook processing failures > threshold
- Latency P99 > 1 second
- Provider health < 95%

---

## Summary Table

| ID | Description | Status | Assignee |
|----|-------------|--------|----------|
| AI-001 | LokiLoggingService functions | ✅ COMPLETE | AI |
| AI-002 | Marqeta adapter logging | ✅ COMPLETE | AI |
| AI-003 | EVENT_TAXONOMY.md update | ✅ COMPLETE | AI |
| AI-004 | Idea A dashboard | ✅ COMPLETE | AI |
| AI-005 | Idea D dashboard set | ✅ COMPLETE | AI |
| HUMAN-001 | Test & select dashboard | ⏳ PENDING | Human |
| CLEANUP-001 | Delete unused dashboard | ⏳ BLOCKED | Human/AI |
| FUTURE-001 | WEX webhook logging | ⏸️ DEFERRED | - |
| FUTURE-002 | Add alerting rules | ⏸️ DEFERRED | - |

---

## Session Closed

All implementation work is complete. The only remaining action is for the Human Director to test both dashboards and select one, then delete the unused files.
