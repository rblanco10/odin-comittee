# Action Items

> **Session ID**: 2026-01-20_001_wex-update-limits-logging  
> **Date**: 2026-01-20

---

## Implementation Actions

| ID | Action | Owner | Priority | Status |
|----|--------|-------|----------|--------|
| AI-043 | Implement WEX update_limits logging in card_issuance.ex | Engineering Subcommittee | 🔴 High | ✅ Done |
| AI-044 | Implement WEX update_limits logging in physical_card_issuance.ex | Engineering Subcommittee | 🔴 High | ✅ Done |
| AI-045 | Verify logs in Grafana after implementation | Human Director | 🟠 Medium | ✅ Done |

---

## Detailed Specifications

### AI-043: Virtual Card Logging

**File**: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_payments/adapters/providers/wex_fleet/capabilities/card_issuance.ex`

**Location**: Lines 1191-1214 (the `else` branch)

**Add**:
1. `start_time` and `endpoint` variables before API call
2. `wex_api_request` logging before `Client.put`
3. `wex_api_response` logging with `status: "success"` in ok branch
4. `wex_api_response` logging with `status: "error"` in error branch

### AI-044: Physical Card Logging

**File**: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_payments/adapters/providers/wex_fleet/capabilities/physical_card_issuance.ex`

**Location**: Lines 632-678

**Add**:
1. Timing and request logging before `update_card` call
2. Wrap `update_card` in case statement with response logging

### AI-045: Grafana Verification

**Queries to run**:
```logql
{domain="ember_payments", event_type=~"wex_api.*"} | json | operation="update_limits"
```

---

## Handoff

**From**: Observability Committee (Design Session)  
**To**: Engineering Subcommittee (Implementation)  
**Approved By**: Human Director  
**Date**: 2026-01-20
