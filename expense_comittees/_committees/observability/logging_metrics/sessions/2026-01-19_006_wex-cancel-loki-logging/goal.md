# Session Goal

> **Session**: 2026-01-19_006_wex-cancel-loki-logging  
> **Type**: Implementation  
> **Priority**: Low (AI-027)  
> **Date**: 2026-01-19

---

## Primary Objective

Add Loki logging to WEX card cancellation operations, ensuring parity with freeze/unfreeze logging implemented in session 2026-01-19_004.

---

## Success Criteria

- [ ] WEX virtual card cancel (`cancel_card` in card_issuance.ex) has `wex_api_request` and `wex_api_response` logging
- [ ] Logging follows the pattern established in freeze/unfreeze (DEC-004)
- [ ] Physical card cancel path verified to already have logging via shared `update_card` function
- [ ] Dashboard queries already capture cancel operations (verified in session 005)
- [ ] Implementation reviewed by committee

---

## Scope Boundaries

### IN SCOPE
- Adding Loki logging to `cancel_card` function in `card_issuance.ex`
- Verifying physical card cancel path has logging
- Following established patterns from session 004

### OUT OF SCOPE
- Modifying reactor-level logging (already complete per session 003)
- Dashboard changes (already complete per session 005)
- Other card operations (freeze/unfreeze already done)

---

## Expected Outputs

- [ ] Implementation plan with specific code changes
- [ ] Code changes to `card_issuance.ex`
- [ ] Verification that physical card path is covered
- [ ] Updated action item AI-027 to completed

---

## Context

### Research Findings

1. **Virtual Card Cancel** (`card_issuance.ex:1032-1046`):
   - Currently has NO Loki logging
   - Just calls WEX API and returns result
   - Need to add `wex_api_request` and `wex_api_response` events

2. **Physical Card Cancel** (`physical_card_issuance.ex:474-483`):
   - Calls shared `update_card` function
   - `update_card` already has Loki logging (added in session 004)
   - Already logs operation as "close_card_permanently"
   - ✅ NO CHANGES NEEDED

3. **Reactor-Level Logging** (`cancel_card_reactor.ex`):
   - Already has `log_card_cancel_start` and `log_card_cancel_end`
   - Error logging already implemented per session 003
   - ✅ NO CHANGES NEEDED

### Pattern Reference (from freeze/unfreeze)

```elixir
# Before API call
start_time = System.monotonic_time(:millisecond)

LokiLoggingService.log_event("wex_api_request", %{
  message: "WEX Merchant Log API cancel request",
  provider: "wex",
  api: "merchant_log",
  endpoint: "/merchant-logs/v1/#{card_id}",
  operation: "cancel_card",
  card_id: card_id
}, %{
  "event_type" => "wex_api_request",
  "domain" => "ember_payments",
  "provider" => "wex"
})

# After API call (success)
duration_ms = System.monotonic_time(:millisecond) - start_time

LokiLoggingService.log_event("wex_api_response", %{
  message: "WEX Merchant Log API cancel success",
  provider: "wex",
  api: "merchant_log",
  endpoint: "/merchant-logs/v1/#{card_id}",
  operation: "cancel_card",
  duration_ms: duration_ms,
  success: true,
  card_id: card_id
}, %{
  "event_type" => "wex_api_response",
  "domain" => "ember_payments",
  "provider" => "wex",
  "status" => "success"
})

# After API call (error)
LokiLoggingService.log_event("wex_api_response", %{
  message: "WEX Merchant Log API cancel failed",
  provider: "wex",
  api: "merchant_log",
  endpoint: "/merchant-logs/v1/#{card_id}",
  operation: "cancel_card",
  duration_ms: duration_ms,
  success: false,
  error: inspect(error),
  card_id: card_id
}, %{
  "event_type" => "wex_api_response",
  "domain" => "ember_payments",
  "provider" => "wex",
  "status" => "error"
})
```

---

*Session created by Human Director request*
