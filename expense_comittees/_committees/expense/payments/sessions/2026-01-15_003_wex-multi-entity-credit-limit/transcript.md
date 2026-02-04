# Session Transcript

> **Session**: 2026-01-15_003_wex-multi-entity-credit-limit  
> **Recording Clerk**: Emily Watson

---

## Opening

**[2026-01-15] CHAIR (Victoria Sterling)**:

This is Victoria Sterling, Chair. I call session 003 to order.

Session 002 regarding SOAP credentials has been closed at the Human Director's request (pending external verification with WEX). We are now opening session 003 to address the multi-entity credit limit gap.

**SESSION GOAL**: Design the solution for displaying the correct WEX credit limit per workspace/entity.

**ACTIVATED MEMBERS**:
- Michelle Park, WEX Fleet Specialist - WEX API expertise
- Derek Patterson, Multi-Tenancy Expert - Entity/workspace scoping
- Ryan Mitchell, API Integration Expert - Service design patterns
- Dr. William Chang, Capability Patterns Expert - Capability abstraction design
- Priya Sharma, Integration Pessimist - Cross-domain concerns
- Yuki Tanaka, Edge Case Hunter - Boundary conditions
- Samuel Reed, Debt Archaeologist - Technical debt context

**ASSIGNED CRITICS**:
- Primary: Priya Sharma - will challenge on cross-domain assumptions
- Secondary: Yuki Tanaka - will challenge on boundary conditions

Recording Clerk, please begin transcript. Michelle Park, please lead us off with the WEX analysis.

---

## Discussion

**[2026-01-15] Michelle Park (WEX Fleet Specialist)**:

I am Michelle Park, WEX Expert. Let me clarify the Human Director's questions about credit limits.

**Question 1: Virtual Cards vs Physical Cards — Is It The Same Credit Limit?**

Answer: YES, it's the same credit limit. The WEX `GetCorporateAvailable` API returns credit limits at the Corporate Account level, not the card level. This is the total credit line WEX extends to that account. Both virtual cards (Purchase Logs) and physical cards draw from the same pool.

**Question 2: How To Display The Correct Credit Limit Per Entity?**

The current problem is in `wex_funding_service.ex` line 127 where the account name is hardcoded:
```elixir
@primary_account_name "WB Paystand 81134671"
```

This means EVERY entity sees the same $200 credit limit regardless of their actual WEX account.

I yield to Derek Patterson to discuss the multi-tenancy solution.

---

**[2026-01-15] Derek Patterson (Multi-Tenancy Expert)**:

I am Derek Patterson, Multi-Tenancy Expert. Here's the key insight:

**Good News**: An entity-aware service already exists - `WexAccountBalanceService`. It has:
- `get_credit_limit(entity_id)` - looks up EntityProviderAccount
- `sync_balance(entity_id, workspace_id)` - syncs from WEX API
- Staleness checking via `is_balance_stale?/2`

The Card Funding page is simply using the WRONG service. It calls `WexFundingService` (hardcoded) instead of `WexAccountBalanceService` (entity-aware).

**Solution**: 
1. Modify `card_funding_live.ex` to use `WexAccountBalanceService.get_credit_limit/1`
2. Store `wex_account_name` in `EntityProviderAccount.provider_metadata`
3. Use the name to match the correct account from the WEX API response

I yield to Ryan Mitchell for the specific code changes.

---

**[2026-01-15] Ryan Mitchell (API Integration Expert)**:

I am Ryan Mitchell, API Integration Expert. I've drafted the specific code changes needed.

**Change 1**: Add alias and modify `fetch_wex_credit_limit` in card_funding_live.ex
**Change 2**: Add `find_matching_account/3` helper to wex_account_balance_service.ex
**Change 3**: Update `fetch_balance_from_wex/2` to use account matching

[Full code specifications provided in action_items.md]

I yield to Dr. William Chang for the sync strategy.

---

**[2026-01-15] Dr. William Chang (Capability Patterns Expert)**:

I am Dr. William Chang, Capability Patterns Expert. 

**Caching Strategy**:
- Layer 1: `EntityProviderAccount.provider_metadata` (persistent cache in database)
- Layer 2: WEX SOAP API (source of truth)

**When to Sync**:
- Cache is stale (>1 hour old)
- No cached value exists
- Explicit sync requested
- Before card limit validations

The existing `is_balance_stale?/2` function handles staleness checking with a configurable threshold (default 1 hour).

---

## Challenge Rounds

**[2026-01-15] CHAIR**:

We now enter a challenge round. Critics, please raise your concerns.

**[2026-01-15] Priya Sharma (Integration Pessimist)**:

I am Priya Sharma, Integration Pessimist. I have a critical question:

**How does an entity get mapped to a WEX corporate account in the first place?**

The WEX API returns 7 accounts. Which one belongs to which entity? This mapping must be established during entity onboarding/setup.

**[2026-01-15] Michelle Park (WEX Fleet Specialist)**:

Valid concern. The mapping must be set when creating the `EntityProviderAccount`. Options:
1. **Manual**: Admin configures which WEX account belongs to which entity
2. **Convention-based**: Match entity name to WEX account name
3. **Provided by WEX**: WEX tells you which account maps to which customer

For now, option 1 (manual via seed or admin UI) is the path forward. We store `wex_account_name` in `provider_metadata` during entity setup.

---

**[2026-01-15] Yuki Tanaka (Edge Case Hunter)**:

I am Yuki Tanaka, Edge Case Hunter. Here are the edge cases to handle:

| Edge Case | How To Handle |
|-----------|---------------|
| Entity has no EntityProviderAccount for WEX | Fall back to sum of card limits |
| provider_metadata has no credit_limit | Attempt sync, then fall back |
| WEX API fails during sync | Use cached value, log warning |
| Entity's WEX account not found in API response | Log error, use fallback |
| New entity setup | Must create EntityProviderAccount with correct mapping |

All have been addressed in the proposed solution.

**[2026-01-15] CHAIR**:

Challenges addressed. Do we have consensus to proceed?

All members: Aye.

---

## Decisions

**[2026-01-15] CHAIR**:

I now call for votes on the following decisions:

**Decision 1**: Use WexAccountBalanceService for entity-aware credit limits.
All in favor? Unanimous. APPROVED.

**Decision 2**: Store wex_account_name in EntityProviderAccount.provider_metadata.
All in favor? Unanimous. APPROVED.

**Decision 3**: Add account matching to fetch_balance_from_wex/2.
All in favor? Unanimous. APPROVED.

**Decision 4**: Use on-demand sync with 1-hour staleness threshold.
All in favor? Unanimous. APPROVED.

---

## Closing

**[2026-01-15] CHAIR**:

This session is now paused for documentation.

**Decisions Made**: 4
**Action Items**: 8
**Follow-up Sessions Needed**: Implementation PR review

The committee has provided comprehensive documentation including:
- Code change specifications
- Entity mapping strategy
- Sync/caching strategy
- Implementation checklist

Human Director has requested documentation for session handoff.

Session 003 status: PAUSED (awaiting implementation)

---

*End of Transcript*
