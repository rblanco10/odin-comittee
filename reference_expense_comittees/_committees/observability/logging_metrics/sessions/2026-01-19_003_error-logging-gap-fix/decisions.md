# Session Decisions

> **Session ID**: 2026-01-19_003_error-logging-gap-fix  
> **Chair**: Dr. Alexandra Chen  
> **Date**: 2026-01-19

---

## DEC-012: Consistent Error Logging Pattern

**Status**: ✅ Approved and Implemented

**Decision**: All card operation reactors must call `log_card_*_end()` with `status: "error"` when the provider API call fails.

**Rationale**: The dashboard Error Count panel relies on Loki events with `status=~"error|failure"`. Without these events, errors are invisible.

**Implementation Pattern**:
```elixir
# In call_provider step, after provider result check:
case result do
  {:error, reason} ->
    log_*_error(card, reason)  # Helper function
    result
  _ ->
    result
end
```

**Voted**: Unanimous approval

---

## DEC-013: Error Helper Function Standard

**Status**: ✅ Approved and Implemented

**Decision**: Each reactor shall have a private `log_*_error/2` helper function that encapsulates:
1. Loki error end event logging
2. Prometheus error metric emission
3. Tempo span error marking and closure

**Rationale**: Centralizing error handling in a helper function:
- Ensures all three observability pillars (logs, metrics, traces) are updated
- Reduces code duplication
- Prevents partial error logging

**Standard Signature**:
```elixir
defp log_*_error(card, reason) do
  # 1. Log to Loki
  LokiLoggingService.log_card_*_end(
    status: "error",
    error_reason: stringify_error(reason),
    ...
  )
  
  # 2. Emit Prometheus metric
  PrometheusMetricsService.emit_card_*_error(...)
  
  # 3. Mark Tempo span
  TempoTracingService.mark_span_error(...)
  TempoTracingService.end_card_*_span(:error)
end
```

**Voted**: Unanimous approval

---

## DEC-014: Enriched LokiLoggingService Data Builders

**Status**: ✅ Approved and Implemented

**Decision**: All `build_card_*_end_data/1` functions in `LokiLoggingService` must include:
- `error_reason`: String (null on success)
- `workspace_id`: UUID
- `entity_id`: UUID
- Dynamic `message` based on status

**Rationale**: 
- `error_reason` enables debugging without leaving Grafana
- `workspace_id` and `entity_id` enable filtering by tenant
- Dynamic message improves log readability

**Affected Functions**:
- `build_card_issuance_end_data/1`
- `build_card_activation_end_data/1` (implicit in `log_card_activation_end`)
- `build_card_freeze_end_data/1` (implicit)
- `build_card_unfreeze_end_data/1` (implicit)
- `build_card_cancel_end_data/1` (implicit)
- `build_card_controls_update_end_data/1` (implicit)
- `build_card_limits_update_end_data/1` (implicit)

**Voted**: Unanimous approval

---

## DEC-015: Start Event Relocation

**Status**: ✅ Approved and Implemented

**Decision**: Start events (`log_card_*_start()`) should be logged in the `call_provider` step, after the card is fetched, rather than in `validate_actor`.

**Rationale**: Logging start events before card fetch results in null values for `provider`, `workspace_id`, `entity_id`, and `card_last4`, making filtering unreliable.

**Exception**: `IssueCardReactor` may log start in `validate_actor` since card details come from inputs, not a database fetch.

**Voted**: Unanimous approval (with IssueCardReactor exception noted)

---

## Decision Summary

| ID | Decision | Status |
|----|----------|--------|
| DEC-012 | Consistent Error Logging Pattern | ✅ Implemented |
| DEC-013 | Error Helper Function Standard | ✅ Implemented |
| DEC-014 | Enriched LokiLoggingService Data Builders | ✅ Implemented |
| DEC-015 | Start Event Relocation | ✅ Implemented |

---

*"A decision without implementation is merely a wish."*

