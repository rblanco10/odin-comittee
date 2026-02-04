# Action Items

> **Session ID**: 2026-01-20_011_wex-freeze-unfreeze-observability
> **Type**: Discovery → Design
> **Opened**: 2026-01-20

---

## Action Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-062 | Add 14 step-level logging functions to LokiLoggingService | Engineering | 🔴 High | Pending | 2026-01-20 |
| AI-063 | Modify FreezeCardReactor to log 6 steps | Engineering | 🔴 High | Pending | 2026-01-20 |
| AI-064 | Modify UnfreezeCardReactor to log 8 steps | Engineering | 🔴 High | Pending | 2026-01-20 |
| AI-065 | Verify step-level events appear in Loki | Engineering | 🟠 Medium | Pending | 2026-01-20 |

---

## Implementation Details

### AI-062: Add LokiLoggingService Functions

**File**: `lib/flame_teampay_payables/ember_payments/observability/services/loki_logging_service.ex`

**Functions to Add**:
- `log_card_freeze_step_validate_actor/1`
- `log_card_freeze_step_fetch_card/1`
- `log_card_freeze_step_get_connection/1`
- `log_card_freeze_step_validate_state/1`
- `log_card_freeze_step_call_provider/1`
- `log_card_freeze_step_update_db/1`
- `log_card_unfreeze_step_validate_actor/1`
- `log_card_unfreeze_step_fetch_card/1`
- `log_card_unfreeze_step_get_connection/1`
- `log_card_unfreeze_step_validate_state/1`
- `log_card_unfreeze_step_extract_limits/1`
- `log_card_unfreeze_step_call_provider/1`
- `log_card_unfreeze_step_restore_limits/1`
- `log_card_unfreeze_step_update_db/1`

**Reference**: See `artifacts/IMPLEMENTATION_PLAN.md` for full code

---

### AI-063: Modify FreezeCardReactor

**File**: `lib/flame_teampay_payables/ember_payments/reactors/card/freeze_card_reactor.ex`

**Steps to Modify**:
1. `:validate_actor` - Add step timing and logging
2. `:fetch_card` - Add step timing and logging
3. `:get_connection` - Add step timing and logging
4. `:validate_state` - Add step timing and logging
5. `:call_provider` - Add step timing and logging
6. `:update_db_record` - Add step timing and logging

**Pattern**:
```elixir
step_start_time = System.monotonic_time(:millisecond)
# ... existing step logic ...
step_duration_ms = System.monotonic_time(:millisecond) - step_start_time
LokiLoggingService.log_card_freeze_step_<step_name>([...])
```

**Reference**: See `artifacts/IMPLEMENTATION_PLAN.md` for full code

---

### AI-064: Modify UnfreezeCardReactor

**File**: `lib/flame_teampay_payables/ember_payments/reactors/card/unfreeze_card_reactor.ex`

**Steps to Modify**:
1. `:validate_actor` - Add step timing and logging
2. `:fetch_card` - Add step timing and logging
3. `:get_connection` - Add step timing and logging
4. `:validate_state` - Add step timing and logging
5. `:extract_original_limits` - Add step timing and logging
6. `:call_provider` - Add step timing and logging
7. `:restore_original_limits` - Add step timing and logging
8. `:update_db_record` - Add step timing and logging

**Reference**: See `artifacts/IMPLEMENTATION_PLAN.md` for full code

---

### AI-065: Verification

**Procedure**:
1. Start local dev environment (`iex -S mix phx.server`)
2. Find an active WEX card
3. Execute freeze operation
4. Verify 8 events in Loki (start + 6 steps + end)
5. Execute unfreeze operation
6. Verify 10 events in Loki (start + 8 steps + end)

**LogQL Query**:
```logql
{domain="ember_payments", event_type=~"ember_payments_card_freeze_step.*|ember_payments_card_unfreeze_step.*"} | json
```

**Success Criteria**:
- All 14 step events appear in Loki
- Each event has `step_duration_ms`
- Each event has `trace_id` and `span_id`
- Error cases show `step_status="error"` with `error_reason`

---

## Artifacts

| Artifact | Location |
|----------|----------|
| Implementation Plan | `artifacts/IMPLEMENTATION_PLAN.md` |

---
