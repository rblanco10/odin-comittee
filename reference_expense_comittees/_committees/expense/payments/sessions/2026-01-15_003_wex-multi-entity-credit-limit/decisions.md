# Session Decisions

> **Session**: 2026-01-15_003_wex-multi-entity-credit-limit

---

## Decision 1: Use WexAccountBalanceService for Entity-Aware Credit Limits

**Proposed by**: Derek Patterson (Multi-Tenancy Expert)  
**Seconded by**: Ryan Mitchell (API Integration Expert)

**Description**:
Replace the hardcoded `WexFundingService.get_corporate_credit_limits/0` call in `card_funding_live.ex` with the entity-aware `WexAccountBalanceService.get_credit_limit/1` function that already exists in the codebase.

**Rationale**:
- `WexAccountBalanceService` already has entity-aware lookup via `EntityProviderAccount`
- Avoids duplicating entity-lookup logic
- Leverages existing caching/sync infrastructure
- Follows the established pattern for provider account management

**Vote**:
- In Favor: 8 (unanimous among active members)
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

---

## Decision 2: Store WEX Account Name in EntityProviderAccount.provider_metadata

**Proposed by**: Michelle Park (WEX Fleet Specialist)  
**Seconded by**: Derek Patterson (Multi-Tenancy Expert)

**Description**:
Add `wex_account_name` and optionally `wex_account_number` fields to `EntityProviderAccount.provider_metadata` to establish the mapping between an entity and its corresponding WEX corporate account.

**Rationale**:
- WEX returns 7 corporate accounts in the GetCorporateAvailable response
- Each entity must be mapped to exactly one WEX corporate account
- Account name is always present in WEX response (account_number may be nil)
- This mapping is set during entity onboarding/configuration

**Vote**:
- In Favor: 8 (unanimous among active members)
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

---

## Decision 3: Add Account Matching to WexAccountBalanceService.fetch_balance_from_wex/2

**Proposed by**: Ryan Mitchell (API Integration Expert)  
**Seconded by**: Dr. William Chang (Capability Patterns Expert)

**Description**:
Enhance `WexAccountBalanceService.fetch_balance_from_wex/2` to match the WEX API response to the entity's specific corporate account using the `wex_account_name` or `wex_account_number` from `provider_metadata`.

**Rationale**:
- Currently the function doesn't filter the response to match a specific account
- Without filtering, it would return aggregate or first-account data
- The matching logic should prefer `account_number` (more reliable) with fallback to `account_name`

**Vote**:
- In Favor: 8 (unanimous among active members)
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

---

## Decision 4: Use On-Demand Sync with 1-Hour Staleness Threshold

**Proposed by**: Dr. William Chang (Capability Patterns Expert)  
**Seconded by**: Michelle Park (WEX Fleet Specialist)

**Description**:
Use the existing staleness-checking mechanism in `WexAccountBalanceService` with a 1-hour threshold. Sync balance from WEX API on-demand when:
- No cached value exists
- Cached value is stale (>1 hour old)
- Explicit sync is requested

**Rationale**:
- Balances API call frequency with data freshness
- Avoids unnecessary API calls on every page load
- Leverages existing `is_balance_stale?/2` function
- Provides fallback to cached values when API fails

**Vote**:
- In Favor: 8 (unanimous among active members)
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

---

## Summary

| # | Decision | Result | Notes |
|---|----------|--------|-------|
| 1 | Use WexAccountBalanceService for entity-aware credit limits | APPROVED | Replace WexFundingService call |
| 2 | Store wex_account_name in EntityProviderAccount.provider_metadata | APPROVED | Entity → WEX account mapping |
| 3 | Add account matching to fetch_balance_from_wex/2 | APPROVED | Filter API response by account |
| 4 | Use on-demand sync with 1-hour staleness | APPROVED | Balance freshness vs API calls |
