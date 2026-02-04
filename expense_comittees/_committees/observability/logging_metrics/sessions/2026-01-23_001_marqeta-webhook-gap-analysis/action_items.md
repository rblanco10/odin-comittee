# Session Action Items

> **Session**: 2026-01-23_001_marqeta-webhook-gap-analysis  
> **Total Items**: 5

---

## Action Item Summary

| ID | Item | Owner | Due | Priority | Status |
|----|------|-------|-----|----------|--------|
| TEAM-001 | Select dashboard approach (current vs Idea A) | Engineering Team | TBD | 🔴 High | ⏳ Pending |
| AI-089 | Add 3 handler logging functions to LokiLoggingService | SC01 Logging | 2026-01-23 | 🟡 Medium | ✅ Complete |
| AI-090 | Instrument CardIssuance process_webhook_event/2 | SC05 Elixir/Ash | 2026-01-23 | 🟡 Medium | ✅ Complete |
| AI-091 | Update EVENT_TAXONOMY.md with handler events | Artifact Archivist | 2026-01-23 | 🟢 Low | ✅ Complete |
| CLEANUP-001 | Delete Idea D dashboard files | SC04 Dashboard | 2026-01-23 | 🟢 Low | ✅ Complete |

---

## Pending (Team Decision)

### TEAM-001: Select Dashboard Approach

**Description**: Engineering team must choose between current production dashboard (`webhook-monitoring.json`) and the new comprehensive dashboard (`webhook-monitoring-idea-a.json`).

**Owner**: Engineering Team

**Due**: To be determined by team schedule

**Dependencies**: None (both dashboards available for comparison)

**Acceptance Criteria**:
- [ ] Team reviews both dashboards in local Grafana
- [ ] Team decides on approach
- [ ] If Idea A selected, replace webhook-monitoring.json
- [ ] If current selected, delete Idea A file

**Notes**: Human Director deferred this decision to get team input before finalizing.

---

## Completed Items

| ID | Item | Completed | By |
|----|------|-----------|-----|
| AI-089 | Add 3 handler logging functions to LokiLoggingService | 2026-01-23 | Session implementation |
| AI-090 | Instrument CardIssuance process_webhook_event/2 | 2026-01-23 | Session implementation |
| AI-091 | Update EVENT_TAXONOMY.md with handler events | 2026-01-23 | Session implementation |
| CLEANUP-001 | Delete Idea D dashboard files | 2026-01-23 | Session implementation |

---

### AI-089: Add Handler Logging Functions (COMPLETED)

**Description**: Add 3 new functions to LokiLoggingService for handler-level webhook logging:
- `log_card_webhook_handler_start/1`
- `log_card_webhook_handler_end/1`
- `log_card_webhook_handler_error/1`

**Owner**: SC01 Logging Architecture

**Completed**: 2026-01-23

**Acceptance Criteria**:
- [x] Functions follow LOGGING_STANDARDS.md §7.1 (Start/End Pattern)
- [x] Labels are low cardinality (domain, event_type, provider, status)
- [x] Fields include handler_duration_ms (not duration_ms)
- [x] @doc annotations present with label/field documentation
- [x] No linter errors

**Files Modified**:
- `loki_logging_service.ex` (lines 2720-2866)

---

### AI-090: Instrument CardIssuance (COMPLETED)

**Description**: Wrap `process_webhook_event/2` with handler start/end logging.

**Owner**: SC05 Elixir/Ash Integration

**Completed**: 2026-01-23

**Acceptance Criteria**:
- [x] Handler start logged at function entry
- [x] Handler end logged on success with duration
- [x] Handler error logged on failure with duration
- [x] Result returned unchanged (no side effects)
- [x] Comments reference LOGGING_STANDARDS.md sections

**Files Modified**:
- `card_issuance.ex` (lines 1771-1853)

---

### AI-091: Update EVENT_TAXONOMY.md (COMPLETED)

**Description**: Document new handler events in knowledge base.

**Owner**: Artifact Archivist

**Completed**: 2026-01-23

**Acceptance Criteria**:
- [x] Event table with types and phases
- [x] Labels table with values
- [x] Fields table with types and required flags
- [x] Flow diagram showing webhook visibility
- [x] Grafana query examples

**Files Modified**:
- `EVENT_TAXONOMY.md` (lines 375-459)

---

### CLEANUP-001: Delete Idea D Dashboards (COMPLETED)

**Description**: Remove orphaned Idea D dashboard files per Human Director decision.

**Owner**: SC04 Dashboard Architecture

**Completed**: 2026-01-23

**Files Deleted**:
- `webhook-monitoring-idea-d-overview.json`
- `webhook-provider-detail-idea-d.json`

---

*"Action items are promises; keep them."*

