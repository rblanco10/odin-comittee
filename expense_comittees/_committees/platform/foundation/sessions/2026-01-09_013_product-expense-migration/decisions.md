# Decisions

> **Session**: 2026-01-09_013_product-expense-migration  
> **Status**: ✅ APPROVED BY HUMAN DIRECTOR

---

## Decision 1: product_expense Structure

### Proposal

Create `product_expense` as a **single umbrella app** containing **five Ash domains** organized by business capability:

```
apps/product_expense/
├── lib/
│   └── product_expense/
│       ├── adapters/                    # Adapter pattern for lower tiers
│       │   ├── identity_adapter.ex      # → infra_identity
│       │   ├── payments_adapter.ex      # → infra_payments
│       │   ├── erp_adapter.ex           # → infra_erp
│       │   ├── communications_adapter.ex # → infra_communications
│       │   ├── documents_adapter.ex     # → infra_documents
│       │   ├── coding_adapter.ex        # → domain_coding
│       │   ├── approvals_adapter.ex     # → domain_approvals
│       │   ├── audit_adapter.ex         # → domain_audit
│       │   └── bulk_adapter.ex          # → domain_bulk
│       │
│       ├── cards/                       # Domain: Expense Cards (~114 files)
│       │   ├── domain.ex
│       │   ├── resources/
│       │   │   ├── card_holder.ex
│       │   │   ├── card_request.ex
│       │   │   ├── card_request_history.ex
│       │   │   ├── expense_card.ex
│       │   │   ├── expense_card_document.ex
│       │   │   ├── expense_card_transaction.ex
│       │   │   ├── limit_change_request.ex
│       │   │   ├── merchant_vendor_mapping.ex
│       │   │   └── transaction_split_line.ex
│       │   ├── integrations/            # Cross-domain integrations
│       │   ├── services/
│       │   ├── reactors/
│       │   ├── workers/
│       │   ├── queries/
│       │   └── observability/
│       │
│       ├── reimbursements/              # Domain: Reimbursements (~66 files)
│       │   ├── domain.ex
│       │   ├── resources/
│       │   │   ├── reimbursement_request.ex
│       │   │   ├── reimbursement_item.ex
│       │   │   ├── reimbursement_receipt.ex
│       │   │   └── reimbursement_payment.ex
│       │   ├── integrations/
│       │   ├── services/
│       │   ├── reactors/
│       │   ├── workers/
│       │   └── notifications/
│       │
│       ├── receipts/                    # Domain: Receipts (~10 files)
│       │   ├── domain.ex
│       │   ├── resources/
│       │   │   └── expense_receipt.ex
│       │   ├── services/
│       │   │   ├── match_computation_service.ex
│       │   │   └── receipt_service.ex
│       │   └── document_intake/         # Receipt classification/handling
│       │
│       ├── receipt_rules/               # Domain: Receipt Rules (~82 files)
│       │   ├── domain.ex
│       │   ├── resources/
│       │   │   ├── receipt_rule.ex
│       │   │   ├── rule_action.ex
│       │   │   ├── rule_condition.ex
│       │   │   ├── rule_evaluation_log.ex
│       │   │   ├── rule_execution.ex
│       │   │   ├── scheduled_notification.ex
│       │   │   └── user_block.ex
│       │   ├── services/
│       │   │   ├── rule_engine.ex
│       │   │   ├── rule_evaluator.ex
│       │   │   ├── blocking_service.ex
│       │   │   └── ... (12+ services)
│       │   ├── types/
│       │   ├── reactors/
│       │   └── workers/
│       │
│       └── budgets/                     # Domain: Budgets (~89 files)
│           ├── domain.ex
│           ├── resources/
│           │   ├── budget.ex
│           │   ├── budget_alert.ex
│           │   ├── budget_attachment.ex
│           │   ├── budget_dimension.ex
│           │   ├── budget_impact.ex
│           │   ├── budget_template.ex
│           │   └── budget_transaction.ex
│           ├── inference/               # AI budget suggestions
│           ├── integrations/            # expense_card, reimbursements
│           ├── services/
│           ├── reactors/
│           ├── queries/
│           └── workers/
├── mix.exs
└── test/
```

### Rationale

1. **Single App**: The expense domains are tightly integrated:
   - Budgets track both card spend and reimbursements
   - Receipt rules apply to both cards and reimbursements
   - Receipts match to both card transactions and reimbursements
   - Keeping them together reduces cross-app complexity

2. **Five Ash Domains**: Clear separation of concerns while sharing:
   - `ProductExpense.Cards` — Card lifecycle management
   - `ProductExpense.Reimbursements` — Reimbursement workflows
   - `ProductExpense.Receipts` — Receipt management
   - `ProductExpense.ReceiptRules` — Policy enforcement engine
   - `ProductExpense.Budgets` — Budget tracking and enforcement

3. **Adapter Pattern**: All lower-tier integrations via adapters for:
   - Testability (can stub adapters)
   - Clear dependency boundaries
   - Future flexibility

### Decision Status: ⏳ PENDING

---

## Decision 2: Dependency Graph

### Proposal

```
product_expense (Tier 4)
    │
    ├── domain_coding (Tier 3)
    │       └── core_data, infra_identity, infra_erp
    │
    ├── domain_approvals (Tier 3)
    │       └── core_data, infra_identity
    │
    ├── domain_audit (Tier 3)
    │       └── core_data, infra_identity
    │
    ├── domain_bulk (Tier 3)
    │       └── core_data, infra_identity
    │
    ├── infra_payments (Tier 2)
    │       └── core_data, infra_identity
    │
    ├── infra_erp (Tier 2)
    │       └── core_data, infra_identity, infra_payments
    │
    ├── infra_communications (Tier 2)
    │       └── core_data, infra_identity
    │
    ├── infra_documents (Tier 2)
    │       └── core_data, infra_identity
    │
    ├── infra_identity (Tier 2)
    │       └── core_data
    │
    └── core_data (Tier 1)
```

### mix.exs Dependencies

```elixir
defp deps do
  [
    # Tier 3 - Domain
    {:domain_coding, in_umbrella: true},
    {:domain_approvals, in_umbrella: true},
    {:domain_audit, in_umbrella: true},
    {:domain_bulk, in_umbrella: true},
    
    # Tier 2 - Infrastructure
    {:infra_identity, in_umbrella: true},
    {:infra_payments, in_umbrella: true},
    {:infra_erp, in_umbrella: true},
    {:infra_communications, in_umbrella: true},
    {:infra_documents, in_umbrella: true},
    
    # Tier 1 - Core
    {:core_data, in_umbrella: true},
    
    # External dependencies
    {:ash, "~> 3.0"},
    {:ash_postgres, "~> 2.0"},
    {:oban, "~> 2.15"},
    # ... other deps
  ]
end
```

### Verification

✅ All dependencies are downward (Tier 4 → Tier 3 → Tier 2 → Tier 1)
✅ No horizontal product dependencies
✅ No upward dependencies

### Decision Status: ⏳ PENDING

---

## Decision 3: Module Naming Convention

### Proposal

| Source Module | Target Module |
|---------------|---------------|
| `EmberExpenseCard.*` | `ProductExpense.Cards.*` |
| `EmberReimbursements.*` | `ProductExpense.Reimbursements.*` |
| `EmberExpenseReceipt.*` | `ProductExpense.Receipts.*` |
| `EmberReceiptRules.*` | `ProductExpense.ReceiptRules.*` |
| `EmberBudget.*` | `ProductExpense.Budgets.*` |
| `EmberFunding.*` | `ProductExpense.Cards.Funding.*` |

### Examples

```elixir
# Before
EmberExpenseCard.Resources.ExpenseCard
EmberExpenseCard.Services.ExpenseCardService
EmberReimbursements.Resources.ReimbursementRequest
EmberBudget.Resources.Budget

# After
ProductExpense.Cards.Resources.ExpenseCard
ProductExpense.Cards.Services.ExpenseCardService
ProductExpense.Reimbursements.Resources.ReimbursementRequest
ProductExpense.Budgets.Resources.Budget
```

### Decision Status: ⏳ PENDING

---

## Decision 4: Migration Order

### Proposal

Migrate domains in dependency order (least dependent first):

| Phase | Domain | Files | Dependencies |
|-------|--------|-------|--------------|
| 1 | Receipts | ~10 | documents |
| 2 | Receipt Rules | ~82 | receipts, communications |
| 3 | Cards | ~114 | receipts, receipt_rules, payments, coding, approvals |
| 4 | Reimbursements | ~66 | receipts, receipt_rules, payments, coding, approvals |
| 5 | Budgets | ~89 | cards, reimbursements, coding |

### Rationale

- Receipts is the smallest and has minimal internal dependencies
- Receipt Rules depends on Receipts
- Cards and Reimbursements both use Receipt Rules
- Budgets depends on Cards and Reimbursements for transaction tracking

### Decision Status: ⏳ PENDING

---

## Decision 5: Database Schema

### Proposal

All expense tables remain in the **same database** as infrastructure and domain apps, but with clear table prefixes:

| Domain | Table Prefix | Example Tables |
|--------|--------------|----------------|
| Cards | `expense_cards_` | `expense_cards_card_requests`, `expense_cards_cards`, `expense_cards_transactions` |
| Reimbursements | `expense_reimb_` | `expense_reimb_requests`, `expense_reimb_items`, `expense_reimb_payments` |
| Receipts | `expense_receipts_` | `expense_receipts_receipts` |
| Receipt Rules | `expense_rules_` | `expense_rules_rules`, `expense_rules_actions`, `expense_rules_blocks` |
| Budgets | `expense_budgets_` | `expense_budgets_budgets`, `expense_budgets_transactions` |

### Rationale

- Clear namespace prevents collisions
- Single database simplifies transactions across domains
- Table prefix makes debugging and analysis easier

### Decision Status: ⏳ PENDING

---

## Summary

| Decision | Status |
|----------|--------|
| 1. product_expense Structure (5 domains) | ✅ APPROVED |
| 2. Dependency Graph | ✅ APPROVED |
| 3. Module Naming Convention | ✅ APPROVED |
| 4. Migration Order (Receipts → Rules → Cards → Reimb → Budgets) | ✅ APPROVED |
| 5. Database Schema (prefixed tables) | ✅ APPROVED |

---

*Approved by Human Director on 2026-01-09. Proceeding with migration.*
