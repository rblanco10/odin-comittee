# Flow-10 & Flow-11 Engineering Handoff

**Session:** SC-2026-01-02-002  
**Date:** 2026-01-02  
**Status:** PHASE 1 COMPLETE - IMPLEMENTATION REQUIRED

---

## ⚠️ CRITICAL FINDING

**Phase 1 Investigation Result:** Bi-directional sync is NOT implemented.

The product requirement for Flow-10/11 describes ERP coding changes propagating to Teampay. This feature does not exist in the codebase. See `PHASE-1-INVESTIGATION-REPORT.md` for details.

**Implication:** Before writing tests, we must implement the `BidirectionalSyncService`.

---

## Executive Summary

This handoff covers implementation and testing of the bi-directional sync feature:

- **Flow-10:** ERP edits sync TO Teampay when period is OPEN
- **Flow-11:** ERP edits do NOT sync to Teampay when period is CLOSED

---

## Phase 1: Investigate Current Implementation

Before writing tests, the engineering team must verify if bi-directional sync is implemented.

### Step 1.1: Search for Bi-Directional Sync Logic

Look for code that:
1. Detects coding differences between ERP mirror and product domain
2. Propagates ERP changes to product domain (e.g., `ExpenseCardTransaction`, `ReimbursementItem`)
3. Checks period status before propagating

**Files to investigate:**

```
lib/flame_teampay_payables/ember_bridge/services/reconciliation/bill_reconciliation_service.ex
lib/flame_teampay_payables/ember_bridge/services/reconciliation/expense_report_reconciliation_service.ex
lib/flame_teampay_payables/ember_bridge/reactors/bridge_reactor.ex
```

**Search patterns:**

```bash
grep -r "propagate" lib/flame_teampay_payables/ember_bridge/
grep -r "bidirectional\|bi-directional\|bidi" lib/flame_teampay_payables/
grep -r "coding.*diff\|diff.*coding" lib/flame_teampay_payables/ember_bridge/
```

### Step 1.2: Check Product Domain Update Capability

Look for code that updates product domain resources based on ERP mirror data:

```bash
grep -r "update.*ExpenseCardTransaction\|ExpenseCardTransaction.*update" lib/
grep -r "update.*ReimbursementItem\|ReimbursementItem.*update" lib/
```

### Step 1.3: Document Findings

Create a brief report:
- Is bi-directional sync implemented? (YES/NO)
- If YES: Where is the code? How does it work?
- If NO: What would need to be built?

---

## Phase 2: Implementation (If Needed)

If bi-directional sync is NOT implemented, the following must be built:

### Flow-10: Bi-Directional Sync (Open Period)

**Location:** `BillReconciliationService` or new service

**Logic:**

```elixir
defp maybe_propagate_to_product_domain(bill_mirror, push_entity_record, workspace_id) do
  # 1. Find linked product domain record
  # 2. Check if period is OPEN
  # 3. Compare coding fields (department, location, class, project, gl_account)
  # 4. If differences found AND period is OPEN:
  #    - Update product domain record
  #    - Create audit log entry with "ERP-originated" flag
  # 5. If period is CLOSED:
  #    - Skip update
  #    - Log: "Period closed - ERP edit not synced to Teampay"
end
```

### Flow-11: No Sync When Closed

This is the inverse of Flow-10 - when period is CLOSED, the propagation is skipped.

**Key Points:**
- ERP mirror IS updated (reflects ERP state)
- Product domain is NOT updated (retains original values)
- This is acceptable divergence

---

## Phase 3: Create Test Files

### File Naming Convention

Follow the existing pattern with `flow_` prefix:

```
test/flame_teampay_payables/ember_erp/integration/flows/flow_10_erp_bidirectional_sync_test.exs
test/flame_teampay_payables/ember_erp/integration/flows/flow_11_erp_closed_no_sync_test.exs
```

### Flow-10 Test Structure

```elixir
defmodule FlameTeampayPayables.EmberErp.Integration.Flows.Flow10ErpBidirectionalSyncTest do
  @moduledoc """
  Flow-10 Lifecycle Test: ERP Edit → Teampay (Bi-directional Sync, Open Period)

  This flow tests the bi-directional sync functionality when:
  - Transaction was pushed to ERP
  - Period is OPEN
  - ERP admin edits coding in NetSuite
  - Changes should propagate back to Teampay

  ```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         FLOW-10 LIFECYCLE TEST                              │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │   INITIAL STATE                                                             │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │         │ NetSuite            │                   │
  │   │ Department: Sales   │ SYNCED  │ Department: Sales   │                   │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   ERP ADMIN EDITS (Period is OPEN)                                          │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │         │ NetSuite            │                   │
  │   │ Department: Sales   │         │ Department: Marketing│ ← CHANGE         │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   AFTER SYNC + BRIDGE                                                       │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │         │ NetSuite            │                   │
  │   │ Department: Marketing│ SYNCED │ Department: Marketing│                   │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   RESULT: ERP change propagated to Teampay ✓                                │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
  ```

  ## Session Reference

  - Session: SC-2026-01-02-002
  - Flow Documentation: FLOW-10-ERP-EDIT-BIDIRECTIONAL.md
  """

  use FlameTeampayPayables.ErpIntegrationCase

  # ... test implementation
end
```

### Flow-10 Test Cases

| Test ID | Description | Assertion |
|---------|-------------|-----------|
| F10-T01 | ERP coding change detected during sync | Bill mirror has new values |
| F10-T02 | Period is OPEN → changes propagate | Product domain updated |
| F10-T03 | Audit log created with ERP-originated flag | Audit entry exists |
| F10-T04 | Protected coding fields NOT updated | If coding rule protects field, skip |
| F10-T05 | Full lifecycle: Push → ERP Edit → Sync → Bridge → Verify | End-to-end |

### Flow-11 Test Structure

```elixir
defmodule FlameTeampayPayables.EmberErp.Integration.Flows.Flow11ErpClosedNoSyncTest do
  @moduledoc """
  Flow-11 Lifecycle Test: ERP Edit (Closed Period) - No Sync Back to Teampay

  This flow tests that ERP changes do NOT propagate when:
  - Transaction was pushed to ERP
  - Period is CLOSED
  - ERP admin edits coding in NetSuite
  - Changes should NOT propagate back to Teampay

  ```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         FLOW-11 LIFECYCLE TEST                              │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │   INITIAL STATE (Period is CLOSED)                                          │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │         │ NetSuite            │                   │
  │   │ Department: Sales   │ SYNCED  │ Department: Sales   │                   │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   ERP ADMIN EDITS (Period is CLOSED)                                        │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │         │ NetSuite            │                   │
  │   │ Department: Sales   │         │ Department: Marketing│ ← CHANGE         │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   AFTER SYNC + BRIDGE                                                       │
  │   ┌─────────────────────┐         ┌─────────────────────┐                   │
  │   │ Teampay             │    ≠    │ NetSuite            │                   │
  │   │ Department: Sales   │ DIFFERS │ Department: Marketing│                   │
  │   │ (unchanged)         │         │                     │                   │
  │   └─────────────────────┘         └─────────────────────┘                   │
  │                                                                             │
  │   ERP Mirror:                                                               │
  │   ┌─────────────────────┐                                                   │
  │   │ Bill                │                                                   │
  │   │ Department: Marketing│ ← Mirror has ERP values                          │
  │   └─────────────────────┘                                                   │
  │                                                                             │
  │   RESULT: Acceptable divergence - ERP is authoritative for closed books     │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
  ```

  ## Session Reference

  - Session: SC-2026-01-02-002
  - Flow Documentation: FLOW-11-ERP-EDIT-CLOSED-NO-SYNC.md
  """

  use FlameTeampayPayables.ErpIntegrationCase

  # ... test implementation
end
```

### Flow-11 Test Cases

| Test ID | Description | Assertion |
|---------|-------------|-----------|
| F11-T01 | ERP coding change detected during sync | Bill mirror has new values |
| F11-T02 | Period is CLOSED → changes do NOT propagate | Product domain unchanged |
| F11-T03 | ERP mirror IS updated | Mirror reflects ERP state |
| F11-T04 | Log entry created | "Period closed - ERP edit not synced" |
| F11-T05 | Full lifecycle: Push → Close Period → ERP Edit → Sync → Verify divergence | End-to-end |

---

## Phase 4: Run Tests and Verify

### Run New Tests

```bash
mix test test/flame_teampay_payables/ember_erp/integration/flows/flow_10_erp_bidirectional_sync_test.exs
mix test test/flame_teampay_payables/ember_erp/integration/flows/flow_11_erp_closed_no_sync_test.exs
```

### Run Full ERP Test Suite

```bash
mix test test/flame_teampay_payables/ember_erp --max-failures 3
```

All tests must pass with 0 failures.

---

## Acceptance Criteria

1. ✅ Phase 1 investigation documented
2. ✅ Phase 2 implementation complete (if needed)
3. ✅ Flow-10 test file created with minimum 5 test cases
4. ✅ Flow-11 test file created with minimum 5 test cases
5. ✅ All new tests passing
6. ✅ Full ERP test suite passing (0 regressions)
7. ✅ Subcommittee verification (read actual code)

---

## Files to Create

| File | Description |
|------|-------------|
| `flow_10_erp_bidirectional_sync_test.exs` | Flow-10 test file |
| `flow_11_erp_closed_no_sync_test.exs` | Flow-11 test file |

## Files to NOT Modify

| File | Reason |
|------|--------|
| `expense_report_flow_10_lifecycle_test.exs` | Keep as-is, tests valid scenario |
| `card_spend_flow_11_lifecycle_test.exs` | Keep as-is, tests valid scenario |

---

## Notes for Engineering

1. **Do NOT rename existing test files** - They are valid and passing
2. **Use `flow_` prefix** for new test file names
3. **Bi-directional sync may not be implemented** - Phase 1 will determine this
4. **If not implemented, implement first** - Then write tests
5. **GAP-BIDI-001** in product docs confirms this is a known gap

---

*Sync Committee Engineering Handoff*  
*Session: SC-2026-01-02-002*

