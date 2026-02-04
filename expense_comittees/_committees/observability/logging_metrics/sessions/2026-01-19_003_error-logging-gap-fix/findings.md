# Session Findings

> **Session ID**: 2026-01-19_003_error-logging-gap-fix  
> **Author**: Dr. Michael Torres (SC01 Lead)  
> **Reviewed By**: Subcommittee Members  
> **Date**: 2026-01-19

---

## Executive Summary

The Tier 2 Card Operations dashboard was not displaying errors because **error end events were never being logged**. The `log_card_*_end()` functions were only called on success paths within the reactors, meaning provider-level failures never resulted in a Loki event with `status: "error"`.

---

## Root Cause Analysis

### Gap 1: Missing Error End Events

**Observation**: Dashboard Error Count query relies on:
```logql
sum(count_over_time({domain="ember_payments", event_type=~"ember_payments_card_.*_end", status=~"error|failure"}[$__range]))
```

**Problem**: The `log_card_*_end()` functions were only called inside the `create_db_record` step's success path. When a provider API call failed, the error propagated up the reactor but no "end" event was ever logged.

**Impact**: 100% of provider-level failures were invisible to the dashboard.

### Gap 2: Early Start Event Logging

**Observation**: Start events (`log_card_*_start()`) were logged in the `validate_actor` step, before the card was fetched.

**Problem**: At this point, card details (`provider`, `workspace_id`, `entity_id`, `card_last4`) were not yet available, resulting in `null` values in Loki labels.

**Impact**: Filtering by provider or workspace was unreliable for start events.

### Gap 3: Missing Error Reason

**Observation**: Error logs did not include the specific error reason from the provider.

**Problem**: Even if errors were logged, operators could not see *why* the operation failed without diving into application logs.

**Impact**: Debugging required leaving Grafana to investigate application logs.

---

## Affected Components

| Component | Status Before | Issue |
|-----------|---------------|-------|
| `CancelCardReactor` | ❌ Incomplete | No error end logging |
| `ActivateCardReactor` | ❌ Incomplete | No error end logging |
| `FreezeCardReactor` | ❌ Incomplete | No error end logging |
| `UnfreezeCardReactor` | ❌ Incomplete | No error end logging |
| `UpdateCardControlsReactor` | ❌ Incomplete | No error end logging |
| `UpdateSpendingLimitsReactor` | ❌ Incomplete | No error end logging |
| `IssueCardReactor` | ❌ Incomplete | No error end logging |
| `LokiLoggingService` | ⚠️ Partial | Missing error_reason, workspace_id, entity_id in some functions |

---

## Evidence

### Application Log (Error Visible)

```
[error] CancelCardReactor: Failed to cancel card at provider: :provider_timeout
```

### Loki Query (Error NOT Visible)

```logql
{domain="ember_payments", event_type="ember_payments_card_cancel_end", status="error"} 
# Result: No logs found
```

### Dashboard Panel (Zero Errors)

Error Count panel showed `0` despite actual failures occurring.

---

## Technical Details

### Reactor Flow Before Fix

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ validate_actor  │────▶│   fetch_card    │────▶│  call_provider  │────▶│ update_db_state │
│                 │     │                 │     │                 │     │                 │
│ log_start()     │     │                 │     │                 │     │ log_end()       │
│ (too early!)    │     │                 │     │ ❌ No error     │     │ (success only!) │
└─────────────────┘     └─────────────────┘     │    logging!     │     └─────────────────┘
                                                └─────────────────┘
```

### Reactor Flow After Fix

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ validate_actor  │────▶│   fetch_card    │────▶│  call_provider  │────▶│ update_db_state │
│                 │     │                 │     │                 │     │                 │
│ (no start log)  │     │                 │     │ log_start()     │     │ log_end()       │
│                 │     │                 │     │ (with details!) │     │ (success)       │
└─────────────────┘     └─────────────────┘     │                 │     └─────────────────┘
                                                │ On error:       │
                                                │ log_end(error)  │
                                                │ emit_metric     │
                                                │ mark_span_error │
                                                └─────────────────┘
```

---

## Recommendations Implemented

| Recommendation | Implementation | Status |
|----------------|----------------|--------|
| Log error end events on provider failure | Added `log_*_error()` helper functions in each reactor | ✅ Complete |
| Move start event logging to `call_provider` step | Relocated after card fetch | ✅ Complete |
| Add error_reason to end events | Updated `LokiLoggingService` data builders | ✅ Complete |
| Add workspace_id, entity_id to end events | Updated `LokiLoggingService` data builders | ✅ Complete |
| Emit Prometheus error metrics | Call `emit_card_*_error()` on failure | ✅ Complete |
| Mark Tempo spans as errors | Call `mark_span_error()` on failure | ✅ Complete |

---

## Verification

After implementation, the following LogQL query will return results when errors occur:

```logql
{domain="ember_payments", event_type=~"ember_payments_card_.*_end", status="error"} | json
```

Expected fields in error events:
- `status`: "error"
- `error_reason`: String describing the failure
- `workspace_id`: UUID of the workspace
- `entity_id`: UUID of the entity
- `provider`: "marqeta" | "wex"
- `duration_ms`: Time elapsed before failure

---

*"You cannot improve what you cannot see."*

