# Session Goal

> **Session**: 2026-01-14_005_card-issuance-setup-understanding  
> **Opened**: 2026-01-14  
> **Resumed**: 2026-01-15  
> **Type**: Educational / Knowledge Documentation / Gap Analysis

---

## Primary Objective

Understand the complete WEX Card Issuance Setup flow, contrast it with Marqeta, identify integration points, and perform gap analysis between WEX capabilities and current implementation.

## Success Criteria

- [ ] Explain the WEX card issuance setup flow end-to-end
- [ ] Document the Paystand Compliance prerequisite and its role
- [ ] Map UI elements to backend code (LiveView → Resources → Adapters)
- [ ] Contrast WEX issuance flow with Marqeta issuance flow
- [ ] Identify all WEX integration points and when they're called
- [ ] Perform gap analysis: WEX API capabilities vs. implemented features
- [ ] Document UX considerations specific to WEX

## Scope

- **IN SCOPE**: 
  - WEX Card Issuance Setup page at `/ops/workspaces/:entity_id/partners/wex`
  - WEX adapter and service implementations
  - Comparison with Marqeta flow
  - Gap analysis
- **OUT OF SCOPE**: Dwolla, Checkbook implementations (unless for architectural comparison)

## Human Director Request

> "I'm interested in investigating the setup flow for WEX card issuance. There exists code to add up cards with the specific provider already existing in the database. I'm very interested in working on the UX portion of it. The way you issue WEX cards is different from how you would issue Marqeta cards. So I want to understand how the entire setup flow works, what WEX integrations are needed and at what points, and gaps in terms of what you know about WEX and what's already implemented in the system."

---

*Knowledge is the foundation of excellence.*
