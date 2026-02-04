# Action Items

> **Session**: 2026-01-19_004_wex-freeze-unfreeze-logging  
> **Date**: 2026-01-19

---

## Implementation Tasks

| ID | Task | File | Priority | Status |
|----|------|------|----------|--------|
| T1 | Remove `log_card_freeze_start` from `validate_actor` step (lines 111-116) | `freeze_card_reactor.ex` | P1 | ✅ Done |
| T2 | Add `log_card_freeze_start` with full context to `call_provider` step | `freeze_card_reactor.ex` | P1 | ✅ Done |
| T3 | Update `log_card_freeze_end` at lines 587-594 and 661-669 | `freeze_card_reactor.ex` | P1 | ✅ Done |
| T4 | Same pattern as T1-T3 for unfreeze reactor | `unfreeze_card_reactor.ex` | P1 | ✅ Done |
| T5 | Add `wex_api_request/response` to `freeze_card` function | `card_issuance.ex` | P2 | ✅ Done |
| T6 | Add `wex_api_request/response` to `unfreeze_card` function | `card_issuance.ex` | P2 | ✅ Done |
| T7 | Add LokiLoggingService alias to physical card adapter | `physical_card_issuance.ex` | P2 | ✅ Done |
| T8 | Rewrite `update_card` with `wex_api_request/response` logging | `physical_card_issuance.ex` | P2 | ✅ Done |
| T9 | Compile and verify no errors | - | P3 | ✅ Done |
| T10 | Test freeze/unfreeze and verify Loki logs | - | P3 | ⬜ Pending (manual verification) |

---

## Verification Queries

After implementation, run these LogQL queries:

```logql
# All WEX Freeze Events
{domain="ember_payments", event_type=~"ember_payments_card_freeze.*|wex_api.*", provider="wex"}

# Freeze API Latency
{domain="ember_payments", event_type="wex_api_response", provider="wex"} 
| json 
| operation=~"freeze_card|suspend_card"

# Freeze Success Rate
sum(count_over_time({domain="ember_payments", event_type="ember_payments_card_freeze_end", status="success"}[5m]))
/
sum(count_over_time({domain="ember_payments", event_type="ember_payments_card_freeze_end"}[5m]))
```

---

## Files to Modify

| File | Path |
|------|------|
| FreezeCardReactor | `lib/flame_teampay_payables/ember_payments/reactors/card/freeze_card_reactor.ex` |
| UnfreezeCardReactor | `lib/flame_teampay_payables/ember_payments/reactors/card/unfreeze_card_reactor.ex` |
| WEX Card Issuance | `lib/flame_teampay_payables/ember_payments/adapters/providers/wex_fleet/capabilities/card_issuance.ex` |
| WEX Physical Card | `lib/flame_teampay_payables/ember_payments/adapters/providers/wex_fleet/capabilities/physical_card_issuance.ex` |

---

## Acceptance Criteria

1. Freeze virtual card → 4 Loki events
2. Freeze physical card → 4 Loki events
3. Unfreeze virtual card → 4 Loki events
4. Unfreeze physical card → 4 Loki events
5. All events include `provider: "wex"` label
6. End events include `status`, `duration_ms`, `workspace_id`, `entity_id`, `card_type`
7. No compilation errors

---

*Assigned to: Engineering Subcommittee*
