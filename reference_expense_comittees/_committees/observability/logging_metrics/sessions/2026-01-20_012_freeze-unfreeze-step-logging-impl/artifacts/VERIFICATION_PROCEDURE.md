# Verification Procedure: Step-Level Freeze/Unfreeze Logging

> **Session**: 2026-01-20_012_freeze-unfreeze-step-logging-impl  
> **Created**: 2026-01-20  
> **Status**: Ready for Verification

---

## Prerequisites

1. Local dev environment running (`iex -S mix phx.server`)
2. Docker observability stack running:
   ```bash
   cd campsite/pit/docker
   docker compose -f docker-compose.local.yml up -d
   ```
3. Grafana accessible at http://localhost:3000

---

## Verification Procedure

### Step 1: Find an Active WEX Card

In your IEx session:

```elixir
alias FlameTeampayPayables.EmberPayments.Resources.Card.CardIssuance
require Ash.Query

# Find an active WEX card
card = CardIssuance
|> Ash.Query.filter(provider == :wex_fleet and state == :active)
|> Ash.read!(authorize?: false)
|> List.first()

IO.puts("Testing card: #{card.id}")
```

### Step 2: Execute Freeze Operation

```elixir
actor = %{id: Ecto.UUID.generate(), type: :system}

{:ok, frozen_card} = CardIssuance.freeze_card(
  card.id,
  "Test freeze for observability verification",
  actor: actor,
  authorize?: false
)

IO.puts("Card frozen: #{frozen_card.id}, state: #{frozen_card.state}")
```

### Step 3: Verify Freeze Events in Loki

Open Grafana at http://localhost:3000 and run these LogQL queries:

**All freeze step events (should see 6):**
```logql
{domain="ember_payments", event_type=~"ember_payments_card_freeze_step.*"} | json
```

**Expected Events:**
1. `ember_payments_card_freeze_step_validate_actor`
2. `ember_payments_card_freeze_step_fetch_card`
3. `ember_payments_card_freeze_step_get_connection`
4. `ember_payments_card_freeze_step_validate_state`
5. `ember_payments_card_freeze_step_call_provider`
6. `ember_payments_card_freeze_step_update_db`

**Verify step timing:**
```logql
{domain="ember_payments", event_type=~"ember_payments_card_freeze_step.*"} | json | line_format "{{.step_name}}: {{.step_duration_ms}}ms"
```

### Step 4: Execute Unfreeze Operation

```elixir
{:ok, unfrozen_card} = CardIssuance.unfreeze_card(
  frozen_card.id,
  actor: actor,
  authorize?: false
)

IO.puts("Card unfrozen: #{unfrozen_card.id}, state: #{unfrozen_card.state}")
```

### Step 5: Verify Unfreeze Events in Loki

**All unfreeze step events (should see 8):**
```logql
{domain="ember_payments", event_type=~"ember_payments_card_unfreeze_step.*"} | json
```

**Expected Events:**
1. `ember_payments_card_unfreeze_step_validate_actor`
2. `ember_payments_card_unfreeze_step_fetch_card`
3. `ember_payments_card_unfreeze_step_get_connection`
4. `ember_payments_card_unfreeze_step_validate_state`
5. `ember_payments_card_unfreeze_step_extract_limits`
6. `ember_payments_card_unfreeze_step_call_provider`
7. `ember_payments_card_unfreeze_step_restore_limits`
8. `ember_payments_card_unfreeze_step_update_db`

**Verify step timing:**
```logql
{domain="ember_payments", event_type=~"ember_payments_card_unfreeze_step.*"} | json | line_format "{{.step_name}}: {{.step_duration_ms}}ms"
```

---

## Complete Event Sequence

### Freeze Operation (Total: 8 events)
| Order | Event Type | Description |
|-------|------------|-------------|
| 1 | `ember_payments_card_freeze_step_validate_actor` | Actor validation |
| 2 | `ember_payments_card_freeze_step_fetch_card` | Card fetch from DB |
| 3 | `ember_payments_card_freeze_step_get_connection` | Connection resolution |
| 4 | `ember_payments_card_freeze_step_validate_state` | State validation |
| 5 | `ember_payments_card_freeze_start` | Operation start (enriched) |
| 6 | `ember_payments_card_freeze_step_call_provider` | Provider API call |
| 7 | `ember_payments_card_freeze_step_update_db` | DB update |
| 8 | `ember_payments_card_freeze_end` | Operation end |

### Unfreeze Operation (Total: 10 events)
| Order | Event Type | Description |
|-------|------------|-------------|
| 1 | `ember_payments_card_unfreeze_step_validate_actor` | Actor validation |
| 2 | `ember_payments_card_unfreeze_step_fetch_card` | Card fetch from DB |
| 3 | `ember_payments_card_unfreeze_step_get_connection` | Connection resolution |
| 4 | `ember_payments_card_unfreeze_step_validate_state` | State validation |
| 5 | `ember_payments_card_unfreeze_step_extract_limits` | Limits extraction |
| 6 | `ember_payments_card_unfreeze_start` | Operation start (enriched) |
| 7 | `ember_payments_card_unfreeze_step_call_provider` | Provider API call |
| 8 | `ember_payments_card_unfreeze_step_restore_limits` | Limits restoration |
| 9 | `ember_payments_card_unfreeze_step_update_db` | DB update |
| 10 | `ember_payments_card_unfreeze_end` | Operation end |

---

## Success Criteria

- [ ] All 6 freeze step events appear in Loki
- [ ] All 8 unfreeze step events appear in Loki
- [ ] Each event has `step_duration_ms` field
- [ ] Each event has `trace_id` and `span_id` for correlation
- [ ] Each event has `step_status` field ("success" or "error")
- [ ] Error cases show `error_reason` field

---

## Troubleshooting

### No Events in Loki

1. Check Loki is running: `curl http://localhost:3100/ready`
2. Check LogBatchingGenServer is running in IEx:
   ```elixir
   GenServer.whereis(FlameTeampayPayables.Observability.LogBatchingGenServer)
   ```
3. Wait 5-10 seconds for batch to flush

### Events Missing Fields

Check the LokiLoggingService log_*_step functions are using `remove_nil_values/1` to clean the data map.

### Step Timing is 0ms

Verify `step_start_time = System.monotonic_time(:millisecond)` is captured at the start of each step's `run fn`.

---

*Verification procedure created by SC01 and SC05 leads.*
