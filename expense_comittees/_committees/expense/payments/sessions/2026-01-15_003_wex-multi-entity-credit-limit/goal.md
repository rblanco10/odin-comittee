# Session Goal

> **Session**: 2026-01-15_003_wex-multi-entity-credit-limit  
> **Opened**: 2026-01-15  
> **Chair**: Victoria Sterling

---

## Primary Objective

Design and document the solution for displaying the correct WEX credit limit per workspace/entity, resolving the multi-entity gap where all entities currently see the same hardcoded credit limit.

---

## Success Criteria

- [x] Understand why all entities see the same credit limit
- [x] Identify the entity-aware service that already exists
- [x] Design the solution architecture
- [x] Document specific code changes needed
- [x] Document entity → WEX account mapping strategy
- [x] Document sync/caching strategy
- [ ] Implementation (separate session/PR)

---

## Scope

### In Scope
- WEX GetCorporateAvailable API response analysis
- Entity-aware credit limit lookup design
- `EntityProviderAccount.provider_metadata` mapping strategy
- `WexAccountBalanceService` integration with Card Funding page
- Sync and caching strategy documentation

### Out of Scope
- Actual code implementation (follow-up session)
- SOAP credential issues (session 002)
- Other WEX operations (MCC, card issuance)
- Production deployment

---

## Expected Outputs

- [x] Technical analysis of the multi-entity gap
- [x] Code change specifications for `card_funding_live.ex`
- [x] Code change specifications for `wex_account_balance_service.ex`
- [x] Entity mapping strategy documentation
- [x] Sync/caching strategy documentation
- [x] Implementation checklist

---

## Activated Members

| Member | Role | Reason |
|--------|------|--------|
| Victoria Sterling | Chair | Session orchestration |
| Michelle Park | WEX Fleet Specialist | WEX API expertise |
| Derek Patterson | Multi-Tenancy Expert | Entity/workspace scoping |
| Ryan Mitchell | API Integration Expert | Service design patterns |
| Dr. William Chang | Capability Patterns Expert | Capability abstraction design |
| Priya Sharma | Integration Pessimist | Cross-domain concerns |
| Yuki Tanaka | Edge Case Hunter | Boundary conditions |
| Samuel Reed | Debt Archaeologist | Technical debt context |
| Emily Watson | Recording Clerk | Session transcription |
| Carlos Mendez | Research Clerk | Codebase research |

---

## Assigned Critics

- **Primary**: Priya Sharma (Integration Pessimist) - will challenge on cross-domain assumptions
- **Secondary**: Yuki Tanaka (Edge Case Hunter) - will challenge on boundary conditions
