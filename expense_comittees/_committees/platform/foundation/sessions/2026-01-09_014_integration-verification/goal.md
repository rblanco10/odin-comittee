# Session Goal

> **Session**: 2026-01-09_014_integration-verification  
> **Type**: Architecture Review / Integration Verification  
> **Priority**: CRITICAL

---

## Objective

Verify that Tiers 1-4 of the Ember Platform integrate correctly and achieve **functional parity** with the legacy `flame_teampay_payables` codebase.

## Scope

### In Scope
- **Tier 1 (Core)**: `core_data` — Shared Repo, Vault
- **Tier 2 (Infrastructure)**: `infra_identity`, `infra_payments`, `infra_erp`, `infra_communications`, `infra_documents`
- **Tier 3 (Domain)**: `domain_coding`, `domain_approvals`, `domain_audit`, `domain_bulk`, `domain_compliance`
- **Tier 4 (Product)**: `product_expense` (5 domains)

### Out of Scope
- `product_receivables`, `product_payables`, `product_treasury` (aspirational, deferred)
- Tier 5 Web applications (deferred)

## Key Questions

1. **Stubs**: What stub implementations exist? Where? Why?
2. **Dependencies**: Do all cross-tier dependencies resolve correctly?
3. **Functional Parity**: What legacy functionality is NOT yet implemented?
4. **Integration Points**: Do the apps actually communicate correctly?
5. **Path Forward**: What work remains to achieve a working system?

## Success Criteria

- [ ] Complete inventory of all stubs across Tiers 1-4
- [ ] Dependency graph verified (compiles, runtime tested)
- [ ] Gap analysis: legacy features vs. current implementation
- [ ] Prioritized remediation plan
- [ ] Clear path to functional system

## Human Director Guidance

> "Focus on product_expense as the primary product. Other products are aspirational. 
> Identify stubs, achieve functional parity, develop divide-and-conquer plan."

---

*Session opened by Dr. Marcus Blackwell, Chair*
