# Action Items

> **Session**: 2026-01-09_013_product-expense-migration  
> **Status**: IN PROGRESS

---

## Completed ✅

### 1. Create product_expense App Scaffold
- [x] Created `mix.exs` with proper dependencies
- [x] Created `application.ex` with supervision tree
- [x] Created main `product_expense.ex` module
- [x] Created `pubsub.ex` for real-time events
- [x] Created 9 adapter modules for lower-tier integration:
  - `identity_adapter.ex`
  - `payments_adapter.ex`
  - `erp_adapter.ex`
  - `communications_adapter.ex`
  - `documents_adapter.ex`
  - `coding_adapter.ex`
  - `approvals_adapter.ex`
  - `audit_adapter.ex`
  - `bulk_adapter.ex`

### 2. Phase 1: Receipts Domain
- [x] Created `ProductExpense.Receipts` Ash domain
- [x] Created `ProductExpense.Receipts.Resources.ExpenseReceipt` resource
- [x] Created `ProductExpense.Receipts.Services.ReceiptService`
- [x] Updated `config/config.exs` with domain registration
- [x] Verified `mix compile` succeeds

---

## Pending 📋

### 3. Phase 2: Receipt Rules Domain (~82 files)
- [ ] Create `ProductExpense.ReceiptRules` domain
- [ ] Migrate resources: `receipt_rule`, `rule_action`, `rule_condition`, etc.
- [ ] Migrate services: `rule_engine`, `blocking_service`, etc.
- [ ] Migrate workers and reactors
- [ ] Update config with new domain

### 4. Phase 3: Cards Domain (~114 files)
- [ ] Create `ProductExpense.Cards` domain
- [ ] Migrate resources: `card_holder`, `card_request`, `expense_card`, etc.
- [ ] Migrate services
- [ ] Migrate integrations
- [ ] Migrate workers and reactors

### 5. Phase 4: Reimbursements Domain (~66 files)
- [ ] Create `ProductExpense.Reimbursements` domain
- [ ] Migrate resources
- [ ] Migrate services
- [ ] Migrate workers and reactors

### 6. Phase 5: Budgets Domain (~89 files)
- [ ] Create `ProductExpense.Budgets` domain
- [ ] Migrate resources
- [ ] Migrate services
- [ ] Migrate workers and reactors
- [ ] Migrate integrations with Cards and Reimbursements

### 7. Final Verification
- [ ] All ~376 files migrated
- [ ] `mix compile` clean (no errors)
- [ ] Integration tests pass
- [ ] Update STATUS.md with completion

---

## Files Created

| File | Status |
|------|--------|
| `apps/product_expense/mix.exs` | ✅ Created |
| `apps/product_expense/lib/product_expense.ex` | ✅ Created |
| `apps/product_expense/lib/product_expense/application.ex` | ✅ Created |
| `apps/product_expense/lib/product_expense/pubsub.ex` | ✅ Created |
| `apps/product_expense/lib/product_expense/adapters/*.ex` | ✅ 9 files created |
| `apps/product_expense/lib/product_expense/receipts.ex` | ✅ Created |
| `apps/product_expense/lib/product_expense/receipts/resources/expense_receipt.ex` | ✅ Created |
| `apps/product_expense/lib/product_expense/receipts/services/receipt_service.ex` | ✅ Created |
| `apps/product_expense/test/test_helper.exs` | ✅ Created |
| `apps/product_expense/.formatter.exs` | ✅ Created |
| `config/config.exs` (updated) | ✅ Modified |

---

## Notes

1. **Adapter Pattern**: The product_expense app uses adapters to interface with lower-tier apps, maintaining clean dependency boundaries.

2. **Resource Relationships**: Due to cross-app module references, we store foreign key IDs directly rather than defining `belongs_to` relationships. The adapters handle lookups.

3. **Compilation Warnings**: There are some deprecation warnings about domain-specific APIs. These are non-blocking and can be addressed in future cleanup.

4. **Migration Strategy**: Each phase builds on the previous, with dependencies resolved before dependents are migrated.

---

*Progress: Phase 1 of 5 complete. Scaffold + Receipts domain migrated.*
