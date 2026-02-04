# SC-2026-01-08-001: Committee Decisions

> **Session:** SC-2026-01-08-001  
> **Date:** January 8, 2026

---

## Decision 1: Name-Based Matching (Not Vendor ID)

**Question:** Should reimbursement auto-coding use vendor_id (foreign key) or merchant name (string)?

**Decision:** ✅ **Name-based matching using existing `merchant` field**

**Rationale:**
- No schema change required — `ReimbursementItem.merchant` already exists
- Consistent with transaction coding precedent — `CardTransaction` uses `merchant_name`
- More flexible — pattern matching handles OCR variance ("AMAZON.COM", "Amazon", "Amazon Inc.")
- Rules portable across workspaces — no dependency on workspace-specific vendor UUIDs
- Simpler user experience — no vendor dropdown required

**Alternatives Considered:**
| Option | Pros | Cons |
|--------|------|------|
| Add `vendor_id` FK | Exact match | Schema change, migration required |
| Use merchant string | Flexible patterns | May have false positives |
| Both (hybrid) | Maximum flexibility | Complexity, dual systems |

---

## Decision 2: Update Behavior (Option B)

**Question:** When a reimbursement item is updated, should coding rules be re-applied?

**Decision:** ✅ **Option B — Only apply if no existing coding assignments**

**Options Evaluated:**
| Option | Behavior | Pros | Cons |
|--------|----------|------|------|
| A | Always re-apply | Consistent auto-coding | Overwrites manual edits |
| B | Only if no existing | Preserves manual work | May have stale coding |
| C | Only if merchant changed | Smart update | Complex logic |

**Rationale:**
- Users who manually code items expect their edits to persist
- Finance teams may override auto-coding for exceptions
- Simpler implementation than tracking "which fields changed"
- Matches user expectation: "I coded it, leave it alone"

---

## Decision 3: Domain-Specific Rule Filtering

**Question:** Should all coding rules apply to all record types, or should they be filtered?

**Decision:** ✅ **Add `applies_to` filter to rule evaluation**

**Implementation:**
```elixir
# Reimbursements
EvaluationEngine.evaluate(context, applies_to: :expense)

# Card Transactions
EvaluationEngine.evaluate(context, applies_to: :card)
```

**Rule Matching Logic:**
```elixir
(applies_to == :all) or (applies_to == arg_applies_to)
```

**Rationale:**
- Card-specific rules (MCC codes) shouldn't apply to reimbursements
- Expense-specific rules shouldn't clutter transaction evaluation
- `:all` allows universal rules when needed
- Clean separation of concerns

---

## Decision 4: Synchronous vs Async Evaluation

**Question:** Should coding rules be evaluated synchronously or via background worker?

**Decision:** ✅ **Synchronous evaluation via `after_action` hook**

**Rationale:**
- Reimbursements are user-initiated (not high-volume webhooks)
- Immediate feedback — user sees coding applied instantly
- Simpler implementation — no Oban worker needed
- Rule evaluation is fast (<100ms typically)

**When to Reconsider:**
- If bulk import of reimbursements is added
- If rule complexity significantly increases evaluation time

---

## Decision 5: Context Mapping

**Question:** How should reimbursement item data map to EvaluationContext?

**Decision:** ✅ **Use `transaction` context (not `record`)**

**Rationale:**
- `EvaluationContext.get_field/2` checks `transaction` first for simple field names
- Rules use `transaction.merchant` pattern (established convention)
- Ensures rules written for transactions work for reimbursements
- Consistent field access: `"merchant"` → `context.transaction.merchant`

**Mapping:**
```elixir
EvaluationContext.new(%{
  transaction: %{
    merchant: item.merchant,
    amount: item.amount,
    category: item.category,
    description: item.description,
    expense_date: item.expense_date
  }
})
```

---

## Decision 6: Seed Data Strategy

**Question:** Should existing card rules be modified, or should new expense rules be created?

**Decision:** ✅ **Create separate expense rules with `applies_to: :expense`**

**Rationale:**
- Existing card rules may have card-specific logic (MCC codes)
- Separate rules allow fine-tuning for expense-specific scenarios
- No risk of breaking existing transaction auto-coding
- Clear audit trail of expense-specific rules

**Seed File:** `priv/repo/seeds/dev/demo/08c_expense_coding_rules.exs`

---

## Summary

| # | Decision | Impact |
|---|----------|--------|
| 1 | Name-based matching | No schema change |
| 2 | Option B update behavior | Preserves manual edits |
| 3 | Domain-specific filtering | Clean rule separation |
| 4 | Synchronous evaluation | Immediate UI feedback |
| 5 | Use `transaction` context | Consistent field access |
| 6 | Separate expense rules | No breaking changes |

---

*Decisions recorded by Scribe Emily Watson*  
*Approved by Chair Dr. Elena Vasquez*
