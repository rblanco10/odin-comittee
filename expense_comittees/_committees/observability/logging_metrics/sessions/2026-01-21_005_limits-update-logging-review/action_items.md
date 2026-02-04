# Action Items

> **Session ID**: 2026-01-21_005_limits-update-logging-review  
> **Date**: 2026-01-21

---

## Open Action Items

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-076 | Fix GAP-LIMITS-005: Add workspace_id/entity_id to success path end event | Engineering | 🔴 High | Pending | 2026-01-21 |
| AI-077 | Implement GAP-LIMITS-006: Add 5 step-level logging functions to LokiLoggingService | Engineering | 🟠 Medium | Pending | 2026-01-21 |
| AI-078 | Modify UpdateSpendingLimitsReactor to log all 5 steps | Engineering | 🟠 Medium | Pending | 2026-01-21 |
| AI-079 | Verify step-level events appear in Loki with live WEX test | Engineering | 🟠 Medium | Pending | 2026-01-21 |

---

## Action Item Details

### AI-076: Fix GAP-LIMITS-005

**File**: `ember_payments/reactors/card/update_spending_limits_reactor.ex`  
**Lines**: 498-501

**Current Code**:
```elixir
LokiLoggingService.log_card_limits_update_end([
  card_id: updated_card.id, card_last4: updated_card.last_four, status: "success",
  duration_ms: duration_ms, provider: updated_card.provider, trace_id: trace_id, span_id: span_id
])
```

**Fix**: Add `workspace_id` and `entity_id`:
```elixir
LokiLoggingService.log_card_limits_update_end([
  card_id: updated_card.id,
  card_last4: updated_card.last_four,
  status: "success",
  duration_ms: duration_ms,
  provider: updated_card.provider,
  workspace_id: updated_card.workspace_id,  # ADD
  entity_id: updated_card.entity_id,        # ADD
  trace_id: trace_id,
  span_id: span_id
])
```

---

### AI-077: Add LokiLoggingService Functions

See `artifacts/guides/IMPLEMENTATION_PLAN.md` Phase 1.

---

### AI-078: Modify UpdateSpendingLimitsReactor

See `artifacts/guides/IMPLEMENTATION_PLAN.md` Phase 2.

---

### AI-079: Verification

See `artifacts/guides/IMPLEMENTATION_PLAN.md` Phase 3.
