# Session Goal

> **Session ID**: 2026-01-09_013_product-expense-migration  
> **Type**: Migration Planning  
> **Status**: ACTIVE

---

## Objective

Design and execute the migration of **product_expense** — the first Tier 4 (Product) application in the Ember Platform umbrella.

## Scope

Migrate the following expense-specific embers from `flame_teampay_payables` to the new `product_expense` umbrella app:

| Source Ember | Files | Focus |
|--------------|-------|-------|
| `ember_expense_card` | ~114 | Card requests, expense cards, transactions |
| `ember_reimbursements` | ~66 | Reimbursement workflows and payments |
| `ember_receipt_rules` | ~82 | Receipt policy engine |
| `ember_budget` | ~89 | Budget tracking and enforcement |
| `ember_expense_receipt` | ~10 | Receipt management |
| `ember_funding` | ~15 | Card funding operations |
| **Total** | **~376 files** | |

## Dependencies

`product_expense` will depend on:
- **Tier 1**: `core_data`
- **Tier 2**: `infra_identity`, `infra_payments`, `infra_erp`, `infra_communications`, `infra_documents`
- **Tier 3**: `domain_coding`, `domain_approvals`, `domain_audit`, `domain_bulk`

## Success Criteria

1. [ ] Architectural proposal approved by committee
2. [ ] `product_expense` app created with correct tier structure
3. [ ] All ~376 files migrated with updated module names
4. [ ] Dependencies properly declared (downward only)
5. [ ] `mix compile` succeeds
6. [ ] Adapter pattern established for lower-tier integrations

---

*This session marks the beginning of Tier 4 (Product) migration.*
