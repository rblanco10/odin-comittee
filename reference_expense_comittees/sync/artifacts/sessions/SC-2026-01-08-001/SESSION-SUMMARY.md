# SC-2026-01-08-001: Auto-Coding Rules for Reimbursements

> **Session ID:** SC-2026-01-08-001  
> **Date:** Thursday, January 8, 2026  
> **Status:** ✅ COMPLETE  
> **Topic:** Vendor-based auto-coding for reimbursement items

---

## Executive Summary

Implemented automatic coding rule evaluation for reimbursement items based on vendor/merchant name. When users create or update reimbursement items with a merchant name (e.g., "Starbucks", "Office Depot"), the system automatically assigns GL accounts, departments, and other coding dimensions based on configured coding rules.

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Name-based matching** (not vendor_id) | Uses existing `merchant` field; no schema change required; more flexible pattern matching |
| 2 | **Option B update behavior** | Only apply rules on create, or on update if no existing coding assignments (preserves manual edits) |
| 3 | **Domain-specific rule filtering** | Added `applies_to` filter: `:expense` for reimbursements, `:card` for transactions |
| 4 | **Synchronous evaluation** | Use `after_action` hook for immediate feedback (reimbursements are user-initiated, not high-volume) |

---

## Files Changed

| File | Change |
|------|--------|
| `ember_reimbursements/resources/item/changes/apply_coding_rules.ex` | Complete implementation with after_action hook, Option B behavior |
| `ember_reimbursements/integrations/coding/dimension_integration.ex` | Fixed context mapping (use `transaction:` not `record:`), added `applies_to: :expense` |
| `ember_coding/rules/resources/coding_rule.ex` | Added `applies_to` argument to `active_rules_for_evaluation` action |
| `ember_coding/rules/evaluation_engine.ex` | Pass `applies_to` filter when loading rules |
| `ember_expense_card/integrations/coding/dimension_integration.ex` | Added `applies_to: :card` for consistency |
| `expense_v2/requests_live.ex` | Added `applies_to: :expense` to 2 `EvaluationEngine.evaluate/2` calls |
| `priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs` | **NEW** - 90+ expense-specific coding rules |

---

## Implementation Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     REIMBURSEMENT AUTO-CODING                        │
└─────────────────────────────────────────────────────────────────────┘

User fills reimbursement form (requests_live.ex)
         │
         ├─── On mount: evaluate_coding_rules_for_form()
         │    └─ Get default coding from user context
         │
         ├─── On merchant change: evaluate_coding_rules_for_merchant()
         │    ├─ EvaluationEngine.evaluate(..., applies_to: :expense)
         │    ├─ Match rules by merchant name
         │    └─ Return suggested GL, department, etc.
         │
         └─── On form submit: apply_merchant_suggestions_to_card_form()
              └─ Pre-fill dropdowns with rule suggestions

User submits form → ReimbursementItem.create
         │
         ▼
ApplyCodingRules (after_action hook)
         │
         ├─ Check action type (create vs update)
         ├─ If update: check for existing CodingAssignment records
         │   └─ If exists: SKIP (Option B - preserve manual edits)
         │
         ▼
DimensionIntegration.auto_assign_via_rules()
         │
         ├─ Build context: {merchant, amount, category, description}
         ├─ Call EvaluationEngine.evaluate(..., applies_to: :expense)
         ├─ Filter rules to :expense OR :all only
         │
         ▼
EvaluationEngine
         │
         ├─ Load active_rules_for_evaluation(applies_to: :expense)
         ├─ Evaluate conditions: transaction.merchant contains "Starbucks"
         ├─ Apply actions: set gl_account = "Meals"
         │
         ▼
CodingAssignment records created
         │
         └─ record_type: "reimbursement_item"
            dimension_type: GL Account
            dimension_value: Meals
```

---

## Rule Configuration

### applies_to Values

| Value | Usage |
|-------|-------|
| `:expense` | Reimbursement items only |
| `:card` | Card transactions only |
| `:bill` | AP Invoices only |
| `:all` | Universal (all domains) |

### Example Rule

```elixir
%{
  name: "EXP-Starbucks → Meals",
  applies_to: :expense,
  priority: 100,
  active: true,
  conditions: [
    %{field: "transaction.merchant", operator: :contains, value: "Starbucks"}
  ],
  actions: [
    %{action_type: :set_value, action_config: %{field: "gl_account", value: "Meals"}}
  ]
}
```

---

## Seed Data

**File:** `priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs`

**Run:** `mix run priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs`

**Categories:**
- 📦 Office Supplies (5 rules)
- ✈️ Travel & Transportation (25+ rules)
- 🍽️ Meals & Entertainment (13 rules)
- 💻 Software & Subscriptions (19 rules)
- 👔 Professional Services (4 rules)
- 🅿️ Parking & Tolls (6 rules)
- ⛽ Gas & Fuel (7 rules)
- 📢 Marketing & Advertising (8 rules)
- 📚 Training & Education (7 rules)

---

## Testing

### Manual Test Steps

1. Run seed: `mix run priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs`
2. Navigate to Expense → New Request
3. Add reimbursement item with merchant = "Starbucks"
4. Verify GL Account auto-fills to "Meals"
5. Edit item to change merchant to "Office Depot"
6. Verify GL Account updates to "Office Supplies"
7. Manually change GL Account to something else
8. Edit merchant again → verify coding is NOT overwritten (Option B)

---

## Committee Participants

| Role | Member |
|------|--------|
| Chair | Dr. Elena Vasquez |
| Scribe | Emily Watson |
| Intake Coordinator | (Turn 1) |
| Sync Architect | Dr. Sarah Mitchell |
| Data Mapping Expert | Dr. Marcus Chen |
| Precedent Keeper | Dr. James Okonkwo |
| Code Fidelity Reviewer | Dr. Alexandra Reyes |
| Edge Case Specialist | Dr. Yuki Tanaka |

---

## References

- **Transaction Coding Integration:** `docs/agents/architecture/lifecycles/transaction_lifecycle/integration_points/coding_rules.md`
- **CodingRule Resource:** `ember_coding/rules/resources/coding_rule.ex`
- **EvaluationEngine:** `ember_coding/rules/evaluation_engine.ex`
- **EvaluationContext:** `ember_coding/rules/types/evaluation_context.ex`

---

*Session artifacts created by Scribe Emily Watson*  
*Session concluded: January 8, 2026*
