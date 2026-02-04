# Session SC-2026-01-02-003: Flow-10/11 Implementation (Retry)

**Date:** 2026-01-02  
**Status:** 🔵 ACTIVE  
**Priority:** Critical  
**Predecessor:** SC-2026-01-02-002 (CLOSED - Handoff)

---

## Executive Summary

This session continues the work from SC-2026-01-02-002, which discovered a critical gap in Flow-10/11 (bi-directional ERP → Teampay sync) implementation but was unable to complete it due to complexity.

**User Mandate (verbatim):**
> "I'd like the committee to fully come up to speed and learn both what the status is, what the requirements are, what the current code state is, what the current test state is. The goal is to continue where the last team left off. They got really, really tired. Please evaluate all of their work. I'm deeply worried that they took shortcuts I really didn't see the forest through the trees, so I really need, in turn, solid subcommittees and members to really analyze and assess what's going on. And to bring this to completion, at the end of this it should be fully implementing the test as intended with no shortcuts. The tests should be passing and all ERP tests should be passing. You're not allowed to say that, 'Ooh, a test is failing, but it's not my problem.' All ERP tests should be passing."

---

## Critical Finding: Previous Team's Work Is Fundamentally Broken

### The Test Files Won't Even Compile

```
** (KeyError) key :department_id not found
    expanding struct: FlameTeampayPayables.EmberExpenseCard.Resources.ExpenseCardTransaction.__struct__/1
    test/.../flow_11_erp_closed_no_sync_test.exs:349
```

### Root Cause: Schema Misunderstanding

The previous team assumed ExpenseCardTransaction has direct coding fields:

```elixir
# WRONG - What the previous team wrote
transaction = %ExpenseCardTransaction{
  # ...
  department_id: department_id,  # THIS FIELD DOESN'T EXIST
  # ...
}
```

**Reality:** ExpenseCardTransaction does NOT have:
- `department_id`
- `location_id`
- `class_id`
- `project_id`
- `gl_account_id`

**Actual Pattern:** Coding is stored via the polymorphic `CodingAssignment` table:

```elixir
# CORRECT - How coding actually works
%CodingAssignment{
  record_type: "card_transaction",        # or "expense_card_transaction"
  record_id: transaction.id,               # links to the transaction
  dimension_type_id: department_category.id,
  dimension_value_id: sales_dept.id,       # the actual value
  workspace_id: workspace_id,
  entity_id: entity_id
}
```

### The BidirectionalSyncService Is Also Wrong

Lines 379-393 in `bidirectional_sync_service.ex`:

```elixir
# WRONG - This won't work
defp extract_product_coding(product_record) do
  coding =
    @coding_fields
    |> Enum.reduce(%{}, fn field, acc ->
      value = Map.get(product_record, field)  # <-- These fields don't exist!
      if value, do: Map.put(acc, field, value), else: acc
    end)
  {:ok, coding}
end
```

---

## What Must Be Fixed

### 1. BidirectionalSyncService (Complete Redesign)

The service must:
1. Query `CodingAssignment` to get current product coding
2. Compare with Bill mirror's dimension codes
3. Create/update `CodingAssignment` records to apply changes

### 2. Test Files (Rewrite Helpers)

Both test files must:
1. Remove `department_id` from ExpenseCardTransaction struct creation
2. Create coding via `CodingAssignment` after transaction creation
3. Verify coding changes by querying `CodingAssignment`

---

## Session Plan

### Phase 1: Investigation (Complete)
- ✅ Read previous session artifacts
- ✅ Read actual code (BidirectionalSyncService)
- ✅ Read test files
- ✅ Verify schema constraints
- ✅ Run tests to see actual failures

### Phase 2: Architecture Design
- [ ] Design correct CodingAssignment-based approach
- [ ] Document the coding lookup pattern
- [ ] Define the update strategy

### Phase 3: Implementation
- [ ] Fix BidirectionalSyncService
- [ ] Fix Flow-10 test file
- [ ] Fix Flow-11 test file

### Phase 4: Verification
- [ ] All new tests passing
- [ ] Full ERP test suite passing
- [ ] Subcommittee sign-off

---

## Session Files

- [SESSION-OVERVIEW.md](./SESSION-OVERVIEW.md) - This file
- [COMMITTEE-PROCEEDINGS.md](./COMMITTEE-PROCEEDINGS.md) - Detailed deliberations
- [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) - Technical plan

---

*Sync Committee Session SC-2026-01-02-003 - Active*

