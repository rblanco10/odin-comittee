# Action Items

> **Session**: 2026-01-20_005_gap-fixes-implementation  
> **Type**: Implementation  
> **Date**: 2026-01-20

---

## Implementation Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| IMPL-001 | AI-045: Fix Tier 1 dashboard [5m] → [$__range] | ✅ Done | 6 panels updated |
| IMPL-002 | AI-044: Fix IssueCardReactor correlation IDs | ✅ Done | input() pattern applied |
| IMPL-003 | Restart Grafana and verify dashboard | ⏳ Manual | To be verified by Human Director |
| IMPL-004 | Test error logging with IEx verification | ⏳ Manual | To be verified by Human Director |

## Verification Instructions (For Human Director)

### AI-045 Verification
```bash
cd campsite/pit/docker
docker compose -f docker-compose.local.yml restart grafana
```
Then open http://localhost:3000/d/tier1-business-overview and test with "Last 1h" and "Last 24h".

### AI-044 Verification
```elixir
# In iex -S mix phx.server:
alias FlameTeampayPayables.EmberPayments.Reactors.Card.IssueCardReactor

card_request_id = Ecto.UUID.generate()
IO.puts("Card Request ID: #{card_request_id}")

Reactor.run(IssueCardReactor, %{
  workspace_id: Ecto.UUID.generate(),
  entity_id: Ecto.UUID.generate(),
  provider: :wex_fleet,
  use_platform_model: true,
  actor: %{id: Ecto.UUID.generate(), type: :system},
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

# Then check Grafana Loki: {domain="ember_payments", status="error"} | json
# Verify card_request_id matches the generated UUID
```

---

## Files Modified

| File | Change |
|------|--------|
| `campsite/pit/docker/grafana/provisioning/dashboards/tier1-business-overview.json` | 6 Loki queries: `[5m]` → `[$__range]` |
| `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_payments/reactors/card/issue_card_reactor.ex` | Added card_request_id argument, updated log_issue_error/3 |

---

*Recorded by Session Clerk*
