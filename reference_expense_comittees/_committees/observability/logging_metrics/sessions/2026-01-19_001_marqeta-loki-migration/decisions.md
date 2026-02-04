# Session Decisions

> **Session**: 2026-01-19_001_marqeta-loki-migration  
> **Date**: 2026-01-19

---

## DEC-001: Migrate Card Operations from Prometheus to Loki

**Decision**: Migrate all Grafana dashboard panels for card operations from Prometheus metrics to Loki log queries.

**Rationale**: 
- Aligns with Dwolla/reimbursement logging pattern established in previous session
- Enables filtering by `status`, `provider`, and other labels directly in LogQL
- Provides consistent observability approach across all payment domains

**Impact**: Dashboard panels now query Loki instead of Prometheus for card issuance data.

**Status**: ✅ Implemented

---

## DEC-002: Event Naming Convention Enforcement

**Decision**: All event types must use the `{domain}_{entity}_{action}_{phase}` naming convention with the domain prefix.

**Before**:
```
card_issuance_start
card_issuance_end
payout_batch_start
```

**After**:
```
ember_payments_card_issuance_start
ember_payments_card_issuance_end
ember_payments_payout_batch_start
```

**Rationale**:
- Enables LogQL queries like `{event_type=~"ember_payments_.*"}`
- Prevents naming collisions across domains
- Aligns with LOGGING_STANDARDS.md Section 3.1

**Status**: ✅ Implemented

---

## DEC-003: `status` as a Loki Label

**Decision**: Add `status` as a Loki label (not just a JSON field) for all `_end` events.

**Rationale**:
- `status` has low cardinality (success, failure, error, timeout)
- Enables efficient filtering: `{status="success"}` vs JSON parsing
- Required for success rate calculations in dashboard panels

**Implementation**:
```elixir
|> maybe_put_label("status", Keyword.get(opts, :status))
```

**Status**: ✅ Implemented

---

## DEC-004: log_event First Argument Alignment

**Decision**: The first argument to `log_event/3` must match the `event_type` label value exactly.

**Before** (inconsistent):
```elixir
|> Map.put("event_type", "ember_reimbursements_payment_start")
log_event("reimbursement_payment_start", data, labels)  # Different!
```

**After** (aligned):
```elixir
|> Map.put("event_type", "ember_reimbursements_payment_start")
log_event("ember_reimbursements_payment_start", data, labels)  # Same!
```

**Rationale**:
- Reduces confusion during debugging
- Ensures consistency when searching logs
- Prevents subtle bugs where event type doesn't match

**Status**: ✅ Implemented

---

## DEC-005: Multi-line Pipe Chain Formatting

**Decision**: All label construction using pipe chains must use multi-line formatting.

**Before**:
```elixir
labels = extract_labels(opts) |> Map.put("event_type", "..") |> Map.put("domain", "..")
```

**After**:
```elixir
labels =
  extract_labels(opts)
  |> Map.put("event_type", "..")
  |> Map.put("domain", "..")
```

**Rationale**:
- Follows Elixir community style guidelines
- Improves code readability
- Easier to add/remove label operations

**Status**: ✅ Implemented

---

## DEC-006: String Keys for Labels

**Decision**: Use string keys (not atom keys) when calling `maybe_put_label/3` for top-level labels.

**Rationale**:
- Matches the label map structure (string keys)
- Avoids potential issues with atom-to-string conversion
- Provides consistency across the codebase

**Status**: ✅ Implemented

---

## Summary

| Decision | Description | Status |
|----------|-------------|--------|
| DEC-001 | Migrate to Loki queries | ✅ Done |
| DEC-002 | Domain prefix in event types | ✅ Done |
| DEC-003 | `status` as label | ✅ Done |
| DEC-004 | log_event alignment | ✅ Done |
| DEC-005 | Multi-line formatting | ✅ Done |
| DEC-006 | String keys for labels | ✅ Done |

---

*All decisions approved by Human Director*

