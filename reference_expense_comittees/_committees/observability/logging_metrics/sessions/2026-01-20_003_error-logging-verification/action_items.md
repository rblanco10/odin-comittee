# Action Items

> **Session**: 2026-01-20_003_error-logging-verification  
> **Date**: 2026-01-20

---

## New Action Items

| ID | Item | Owner | Priority | Status | Notes |
|----|------|-------|----------|--------|-------|
| AI-044 | Fix card_request_id/trace_id not appearing in error events | SC01 | 🔴 High | Pending | Process dictionary values from validate_actor step not visible in call_provider step |
| AI-045 | Fix Tier 1 Card Operations query to use $__range instead of [5m] | SC04 | 🟠 Medium | Pending | Current fixed window causes "No Data" when dashboard time picker is beyond 5 minutes |
| AI-046 | Verify Provider filter behavior on Tier 2 dashboard | Human Director | 🟢 Low | Pending | Check if provider filter is causing 100% health despite errors |

---

## Completed This Session

| ID | Item | Status | Notes |
|----|------|--------|-------|
| AI-042 | Verify error logging with production failure | ✅ Done | Verified via IEx simulation - errors appear in Loki with status="error" and error_reason |

---

## Verification Procedure (for future reference)

```elixir
# 1. Start observability stack
# cd campsite/pit/docker && docker compose -f docker-compose.local.yml up -d

# 2. In iex -S mix phx.server:
alias FlameTeampayPayables.EmberPayments.Reactors.Card.IssueCardReactor

actor = %{id: Ecto.UUID.generate(), type: :system}
card_request_id = Ecto.UUID.generate()
IO.puts("Card Request ID: #{card_request_id}")

# Trigger error with fake entity
Reactor.run(IssueCardReactor, %{
  workspace_id: Ecto.UUID.generate(),
  entity_id: Ecto.UUID.generate(),
  provider: :wex_fleet,
  use_platform_model: true,
  actor: actor,
  cardholder_name: "Error Test User",
  card_type: :virtual,
  spending_limits: %{daily_limit: Money.new(10000, :USD)},
  card_product_token: "TEST",
  user_token: "TEST",
  usage_type: :single_use,
  card_request_id: card_request_id,
  otel_ctx: nil,
  trace_context: nil,
  shipping_address: nil,
  delivery_speed: nil
})

# 3. Verify in Grafana:
# {domain="ember_payments", status="error"} | json
```

---

*Recorded by Artifact Archivist*
