# Engineering Plan: Flow-08 Implementation

**Session:** SC-2026-01-01-005  
**Author:** Engineering Team Lead  
**Date:** 2026-01-01

---

## Pre-Implementation Verification

Before writing code, we verified:

1. ✅ Flow-07 test file exists and passes (5/5 tests)
2. ✅ All 294 ERP tests currently pass
3. ✅ Committee confirmed reactor has NO vendor logic (grep returned 0 matches)

---

## Implementation Plan

### Step 1: Create Test File Structure

Create `expense_report_flow_08_lifecycle_test.exs` with:
- Module doc explaining Flow-08 invariant
- Same imports and aliases as Flow-07
- Unique module tags: `flow: :flow_08`

### Step 2: Setup Block

```elixir
setup %{ctx: ctx} do
  # Create open accounting period (same as Flow-07)
  # Create accounting employee (same as Flow-07)
  # NO vendor mirror - the vendor is NEW
  %{
    open_period: open_period,
    accounting_employee: accounting_employee,
    employee_id: accounting_employee.id,
    employee_external_id: accounting_employee.external_id
  }
end
```

### Step 3: Test Cases (4 total)

| # | Test Name | Purpose |
|---|-----------|---------|
| 1 | Complete lifecycle with new vendor | Full Push → Sync → Bridge |
| 2 | NO vendor PushEntityRecord created | **CRITICAL INVARIANT** |
| 3 | Push handles status transitions | Same as Flow-07 |
| 4 | Employee verification | Payment to employee |

### Step 4: Helper Functions

All helpers use `flow08` prefix:
- `execute_flow08_push/2`
- `create_flow08_push_request/2`
- `get_flow08_push_entity_record/2`
- `get_all_flow08_push_entity_records/1` — NEW for invariant check
- `seed_flow08_sync_responses/4`
- `configure_flow08_sync_response/4`

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Tests too similar to Flow-07 | Focus on unique invariant (no vendor record) |
| Missing edge cases | Include merchant attribution verification |
| Breaking existing tests | Run full ERP suite after implementation |

---

## Execution Order

1. Create test file with module structure
2. Implement setup (copy from Flow-07, remove vendor)
3. Implement lifecycle test with NO vendor assertion
4. Implement remaining tests
5. Run Flow-08 tests only → verify pass
6. Run ALL ERP tests → verify 0 failures

---

*Engineering Team Lead*  
*Session: SC-2026-01-01-005*

