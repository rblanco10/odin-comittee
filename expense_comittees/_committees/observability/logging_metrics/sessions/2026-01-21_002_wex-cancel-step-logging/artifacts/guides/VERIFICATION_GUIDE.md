# Verification Guide: WEX Cancel Card Step-Level Logging

> **Session**: 2026-01-21_002_wex-cancel-step-logging  
> **Created**: 2026-01-21  
> **Author**: Observability Committee  
> **Status**: Ready for verification

---

## Overview

This guide documents how to verify the step-level logging implementation for the `CancelCardReactor`.

---

## Prerequisites

1. **Observability stack running**:
   ```bash
   cd campsite/pit/docker
   docker compose -f docker-compose.local.yml up -d
   ```

2. **Phoenix server running**:
   ```bash
   cd campsite/flames/flame_teampay_payables
   iex -S mix phx.server
   ```

3. **Test card available**: You need an active or frozen WEX card to test with.

---

## Verification Steps

### Step 1: Find a Test Card

In IEx, find an active or frozen WEX card:

```elixir
require Ash.Query
alias FlameTeampayPayables.EmberPayments.Resources.Card.CardIssuance

# Find an active WEX card
CardIssuance
|> Ash.Query.filter(provider == :wex_fleet and state in [:active, :frozen])
|> Ash.Query.limit(5)
|> Ash.read!(authorize?: false)
|> Enum.map(fn c -> %{id: c.id, state: c.state, last_four: c.last_four} end)
```

Note a card ID for testing.

---

### Step 2: Run Cancel Operation

```elixir
alias FlameTeampayPayables.EmberPayments.Reactors.Card.CancelCardReactor

actor = %{id: Ecto.UUID.generate(), type: :system}
card_id = "YOUR_CARD_ID_HERE"

IO.puts("Testing cancel for card: #{card_id}")

Reactor.run(CancelCardReactor, %{
  card_id: card_id,
  use_platform_model: true,
  actor: actor,
  otel_ctx: nil
})
```

---

### Step 3: Verify Events in Grafana Loki

Open Grafana at http://localhost:3000 and navigate to Explore → Loki.

#### Query 1: All Cancel Step Events

```logql
{domain="ember_payments", event_type=~"ember_payments_card_cancel_step.*"}
```

**Expected**: 6 step events should appear.

#### Query 2: Formatted Step Summary

```logql
{domain="ember_payments", event_type=~"ember_payments_card_cancel_step.*"} 
  | json 
  | line_format "{{.step_name}}: {{.step_status}} ({{.step_duration_ms}}ms)"
```

**Expected Output** (happy path):
```
validate_actor: success (0ms)
fetch_card: success (2ms)
get_connection: success (0ms)
validate_state: success (0ms)
call_provider: success (1523ms)
update_db: success (5ms)
```

#### Query 3: Check for Errors

```logql
{domain="ember_payments", event_type=~"ember_payments_card_cancel_step.*", step_status="error"}
```

**Expected**: No results for a successful cancel.

---

### Step 4: Verify Complete Event Flow

Run this query to see the full cancel operation:

```logql
{domain="ember_payments", event_type=~"ember_payments_card_cancel.*"} | json
```

**Expected Events** (in order):
1. `ember_payments_card_cancel_step_validate_actor`
2. `ember_payments_card_cancel_step_fetch_card`
3. `ember_payments_card_cancel_step_get_connection`
4. `ember_payments_card_cancel_step_validate_state`
5. `ember_payments_card_cancel_start`
6. `ember_payments_card_cancel_step_call_provider`
7. `ember_payments_card_cancel_step_update_db`
8. `ember_payments_card_cancel_end`

---

## Test Scenarios

### Scenario A: Happy Path (Active Card → Cancelled)

1. Use an active WEX card
2. Run cancel operation
3. Verify all 6 steps show `step_status="success"`
4. Verify reactor end shows `status="success"`

### Scenario B: Idempotent Case (Already Cancelled Card)

1. Use the same card from Scenario A (now cancelled)
2. Run cancel operation again
3. Verify:
   - `validate_state` shows `step_status="success"` (card is already cancelled)
   - `call_provider` shows `skipped=true`
   - `update_db` shows `skipped=true`
   - Total operation time should be ~10-50ms (no provider call)

### Scenario C: Error Case (Invalid State)

1. Use a card in an invalid state (if available)
2. Run cancel operation
3. Verify `validate_state` shows `step_status="error"`
4. Verify subsequent steps do not execute

---

## Dashboard Verification

### Tier 2 Card Operations Dashboard

1. Navigate to: http://localhost:3000/d/tier2-card-ops
2. Set time range to include your test
3. Set Operation filter to "Cancel" (if available)
4. Verify:
   - Cancel operations appear in Total Ops
   - Success Rate reflects your test
   - Latency shows reasonable P50/P95/P99

---

## Verification Checklist

| Check | Expected | Actual |
|-------|----------|--------|
| Step events appear in Loki | 6 events | ☐ |
| All steps show step_status | "success" or "error" | ☐ |
| All steps show step_duration_ms | Integer ≥ 0 | ☐ |
| Idempotent case shows skipped=true | true for call_provider, update_db | ☐ |
| Error case shows error_reason | String with error details | ☐ |
| Dashboard displays cancel data | Visible in Tier 2 | ☐ |

---

## Troubleshooting

### No Events in Loki

1. Check Loki is running: `docker ps | grep loki`
2. Check time range in Grafana (events are recent)
3. Verify Phoenix server is connected to Loki

### Missing Step Events

1. Check the specific step for errors in server logs
2. Verify the step executed (check reactor result)
3. Check for compilation warnings in step logging code

### Wrong Event Data

1. Verify card ID is correct in events
2. Check trace_id/span_id are populated
3. Verify step_duration_ms is reasonable

---

## Summary

When all verification steps pass:
1. ✅ 6 step events appear in Loki
2. ✅ Each event has step_status, step_duration_ms
3. ✅ Idempotent case shows skipped=true
4. ✅ Error cases show error_reason
5. ✅ Dashboard displays cancel operations

The implementation is verified complete.

---

*Verification guide created by Observability Committee, session 2026-01-21_002*
