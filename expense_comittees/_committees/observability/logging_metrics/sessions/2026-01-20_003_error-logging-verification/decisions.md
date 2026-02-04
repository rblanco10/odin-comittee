# Decisions

> **Session**: 2026-01-20_003_error-logging-verification  
> **Type**: Investigation → Verification  
> **Date**: 2026-01-20

---

## Decisions Made

### DEC-020: IEx Simulation as Verification Approach

**Proposed by**: Dr. Janet Liu (SC05 Lead)  
**Seconded by**: Dr. Michael Torres (SC01 Lead)

**Description**: Use IEx session simulation with deliberately invalid inputs (fake entity_id, invalid tokens) as the primary method for verifying error logging. This approach is fast, safe, and provides high coverage of error paths.

**Vote**: Unanimous approval

**Implementation Notes**:
- Use fake workspace_id/entity_id to trigger connection errors safely
- Use invalid card_product_token/user_token to trigger provider errors (with real WEX)
- Verify in Grafana using card_request_id correlation

---

### DEC-021: Payment Layer Error Logging is Sufficient

**Proposed by**: Human Director  
**Seconded by**: Committee

**Description**: The current Payment Layer error logging (ember_payments domain) is sufficient for operational visibility. Business Layer step-level error logging is deferred to a future session.

**Vote**: Approved by Human Director directive

---

## Verification Findings

### Confirmed Working

| Aspect | Status |
|--------|--------|
| Error events logged to Loki | ✅ Verified |
| `status: "error"` label present | ✅ Verified |
| `error_reason` field populated | ✅ Verified |
| Tier 2 Error Count panel | ✅ Verified |
| Errors Over Time graph | ✅ Verified |

### Gaps Identified

| Gap ID | Description | Severity |
|--------|-------------|----------|
| GAP-ERR-LOG-001 | card_request_id, trace_id, span_id are null in error events from call_provider step | High |
| GAP-DASH-002 | Tier 1 Card Operations uses [5m] fixed window instead of [$__range] | Medium |

---

## LogQL Queries for Verification

```logql
# Query by card_request_id
{card_request_id="<UUID>"}

# All error events
{domain="ember_payments", status="error"} | json

# Issuance errors specifically
{domain="ember_payments", event_type="ember_payments_card_issuance_end", status="error"} | json
```

---

*Recorded by Session Clerk*
