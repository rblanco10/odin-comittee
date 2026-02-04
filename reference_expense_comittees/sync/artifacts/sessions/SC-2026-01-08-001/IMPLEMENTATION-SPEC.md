# SC-2026-01-08-001: Implementation Specification

> **Session:** SC-2026-01-08-001  
> **Feature:** Auto-Coding Rules for Reimbursements

---

## 1. ApplyCodingRules Change

**File:** `lib/flame_teampay_payables/ember_reimbursements/resources/item/changes/apply_coding_rules.ex`

### Behavior

| Action | Behavior |
|--------|----------|
| `create` | Always apply coding rules |
| `update` | Only apply if NO existing CodingAssignment records (Option B) |

### Implementation Details

```elixir
# Uses after_action hook to ensure item is persisted before applying rules
Ash.Changeset.after_action(changeset, fn _changeset, item ->
  case action_type do
    :create -> apply_coding_rules(item, context)
    :update -> 
      if has_existing_coding?(item), do: :skip, else: apply_coding_rules(item, context)
  end
  {:ok, item}
end)
```

### Context Data Passed

| Field | Source |
|-------|--------|
| `merchant` | `item.merchant` |
| `amount` | `item.amount` |
| `category` | `item.category` |
| `description` | `item.description` |
| `expense_date` | `item.expense_date` |

---

## 2. DimensionIntegration Updates

**File:** `lib/flame_teampay_payables/ember_reimbursements/integrations/coding/dimension_integration.ex`

### Context Mapping Fix

**Before (broken):**
```elixir
context = EvaluationContext.new(%{
  record: build_record_context(item_id, item_data),  # ❌ Rules don't check 'record'
})
```

**After (fixed):**
```elixir
context = EvaluationContext.new(%{
  transaction: build_record_context(item_id, item_data),  # ✅ Rules check 'transaction'
})
```

### applies_to Filter

```elixir
# SC-2026-01-08-001: Filter to only :expense rules (or :all universal rules)
EvaluationEngine.evaluate(context, rule_type: :coding, applies_to: :expense, log: true)
```

---

## 3. CodingRule Resource Updates

**File:** `lib/flame_teampay_payables/ember_coding/rules/resources/coding_rule.ex`

### New Argument

```elixir
read :active_rules_for_evaluation do
  argument :applies_to, :atom, allow_nil?: true  # NEW
  
  filter expr(
    # ... existing filters ...
    # SC-2026-01-08-001: Filter by applies_to domain
    (is_nil(^arg(:applies_to)) or applies_to == :all or applies_to == ^arg(:applies_to))
  )
end
```

### Filter Logic

| `applies_to` arg | Rules returned |
|------------------|----------------|
| `nil` | Only `:all` (universal) |
| `:expense` | `:expense` OR `:all` |
| `:card` | `:card` OR `:all` |
| `:bill` | `:bill` OR `:all` |

---

## 4. EvaluationEngine Updates

**File:** `lib/flame_teampay_payables/ember_coding/rules/evaluation_engine.ex`

### load_rules/2 Change

```elixir
defp load_rules(context, opts) do
  rule_type = Keyword.get(opts, :rule_type)
  applies_to = Keyword.get(opts, :applies_to)  # NEW
  
  query = CodingRule
    |> Ash.Query.for_read(:active_rules_for_evaluation, %{
      workspace_id: context.workspace_id,
      entity_id: context.entity_id,
      rule_type: rule_type,
      applies_to: applies_to  # NEW
    })
end
```

---

## 5. requests_live.ex Updates

**File:** `lib/flame_teampay_payables_web/live/expense_v2/requests_live.ex`

### evaluate_coding_rules_for_form/4

```elixir
# Line ~665
EvaluationEngine.evaluate(context, rule_type: :coding, applies_to: :expense, log: false)
```

### evaluate_coding_rules_for_merchant/3

```elixir
# Line ~743
EvaluationEngine.evaluate(context, rule_type: :coding, applies_to: :expense, log: false)
```

---

## 6. Transaction DimensionIntegration Updates

**File:** `lib/flame_teampay_payables/ember_expense_card/integrations/coding/dimension_integration.ex`

### applies_to Filter

```elixir
# SC-2026-01-08-001: Filter to only :card rules (or :all universal rules)
EvaluationEngine.evaluate(context, rule_type: :coding, applies_to: :card, log: true, trace_context: trace_context)
```

---

## 7. Seed Data

**File:** `priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs`

### Rule Structure

```elixir
%{
  workspace_id: workspace_id,
  entity_id: entity_id,
  name: "EXP-Starbucks → Meals",
  description: "Auto-assign Meals GL for Starbucks reimbursements",
  priority: 100,
  active: true,
  applies_to: :expense,  # KEY
  conditions: [
    %{field: "transaction.merchant", operator: :contains, value: "Starbucks"}
  ],
  actions: [
    %{action_type: :set_value, action_config: %{field: "gl_account", value: "Meals"}}
  ]
}
```

### Categories Created

| Category | Count | Example Merchants |
|----------|-------|-------------------|
| Office Supplies | 5 | Office Depot, Staples, Best Buy |
| Travel | 25+ | United, Delta, Uber, Lyft, Hilton |
| Meals | 13 | Starbucks, Chipotle, DoorDash |
| Software | 19 | Adobe, Zoom, Slack, Figma |
| Professional Services | 4 | FedEx, UPS, DHL |
| Parking & Tolls | 6 | SpotHero, E-ZPass |
| Gas & Fuel | 7 | Shell, Chevron, BP |
| Marketing | 8 | Google Ads, Meta Ads |
| Training | 7 | Udemy, Coursera, Pluralsight |

---

## 8. Database Impact

### No Schema Changes Required

The implementation uses existing fields:
- `ReimbursementItem.merchant` (string) — for rule matching
- `CodingRule.applies_to` (atom) — already exists with `:expense` option
- `CodingAssignment` — already supports `record_type: "reimbursement_item"`

### Rule Query Filter

The `active_rules_for_evaluation` action now includes an additional filter clause for `applies_to`. This is a query-time filter, no migration required.

---

## 9. Error Handling

### Non-Blocking Pattern

All coding rule evaluation is non-blocking:

```elixir
case DimensionIntegration.auto_assign_via_rules(...) do
  {:ok, assignments} -> 
    Logger.info("Applied #{length(assignments)} assignments")
    :ok
  {:error, reason} -> 
    Logger.warning("Coding rule evaluation failed (non-blocking): #{inspect(reason)}")
    :ok  # Still return :ok - don't fail the item save
end
```

### Errors Logged But Not Raised

- Rule evaluation failures
- Dimension type resolution failures
- CodingAssignment creation failures (partial success allowed)

---

*Implementation specification by Scribe Emily Watson*
