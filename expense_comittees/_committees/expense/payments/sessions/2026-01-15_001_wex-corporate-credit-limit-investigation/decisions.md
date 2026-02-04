# Decisions

> **Session ID**: 2026-01-15_001_wex-corporate-credit-limit-investigation  
> **Date**: 2026-01-15

---

## No Architectural Decisions Made

This was an investigation session. The root cause was identified as invalid SOAP API credentials, which is an operational/configuration issue rather than a code issue.

---

## Observations for Future Consideration

### Observation 1: Misleading Fallback Behavior

**Issue**: When the WEX API fails, the system displays the sum of card limits as "Credit Limit", which is misleading.

**Recommendation**: Consider either:
1. Displaying an error state when API fails instead of a fallback value
2. Clearly labeling the fallback as "Card Limits Issued" not "Credit Limit"
3. Caching the last known good credit limit value

**Status**: Not addressed in this session — requires separate discussion.

### Observation 2: Hardcoded Account Name

**Issue**: The primary account name `WB Paystand 81134671` is hardcoded in `wex_funding_service.ex:127`.

**Recommendation**: Consider making this configurable via environment variable.

**Status**: Not addressed in this session — requires separate discussion.
