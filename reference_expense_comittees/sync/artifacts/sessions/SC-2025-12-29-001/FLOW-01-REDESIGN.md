# Flow-01 Test Redesign - Full Lifecycle Testing

> **Session:** SC-2025-12-29-001  
> **Date:** 2025-12-29  
> **Status:** Approved for Implementation

---

## Problem Statement

The current Flow-01 tests have two critical issues:

### Issue 1: Incomplete Flow Coverage

Current tests only cover the **Push phase**. A true "Flow" must cover all three phases:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT "FLOW-01" ACTUALLY MEANS                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PUSH PHASE                                                    │
│   ┌──────────────────────┐                                      │
│   │ PushCardSpendReactor │ → Bill + Payment created in ERP      │
│   │ via ExecutePush      │ → PushRequest.status = :pushed       │
│   └──────────┬───────────┘                                      │
│              │                                                  │
│   SYNC PHASE │                                                  │
│   ┌──────────▼───────────┐                                      │
│   │ WorkspaceSyncReactor │ → Fetches Bill from ERP              │
│   │                      │ → Bill mirror populated              │
│   └──────────┬───────────┘                                      │
│              │                                                  │
│   BRIDGE PHASE                                                  │
│   ┌──────────▼───────────┐                                      │
│   │ BridgeReactor        │ → BillReconciliationService          │
│   │ Step 9               │ → Links PushRequest ↔ Bill mirror    │
│   └──────────────────────┘ → Status = SYNCED                    │
│                                                                 │
│   RESULT: Complete lifecycle verified                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Current State:** Tests only run `Reactor.run(PushCardSpendReactor, ...)` — this is ~33% of the flow.

### Issue 2: Bypassing Production Code Paths

Current tests bypass critical production code:

| What Tests Do | What Production Does | Impact |
|---------------|---------------------|--------|
| `Reactor.run()` directly | `Ash.update(:execute_push)` | Status handling not tested |
| `test_push` flag | Real `Ash.get()` call | Transaction loading not tested |
| No sync phase | WorkspaceSyncReactor runs | Sync not tested |
| No bridge phase | BridgeReactor runs | Reconciliation not tested |

---

## Solution Design

### New Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLOW-01 TRUE LIFECYCLE TEST                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SETUP                                                         │
│   ├── Create Workspace, Entity, ErpConnection                  │
│   ├── Create AccountingPeriod (open)                           │
│   ├── Create AccountingVendor (existing)                       │
│   └── Create ExpenseCardTransaction (real or via test_push)    │
│                                                                 │
│   PHASE 1: PUSH                                                 │
│   ├── Create PushRequest via PushOrchestrator                  │
│   ├── Execute via Ash.update(:execute_push)  ← PRODUCTION PATH │
│   ├── Assert: PushRequest.status == :pushed                    │
│   ├── Assert: PushRequest.external_id != nil                   │
│   └── Assert: MockAdapter received correct bill data           │
│                                                                 │
│   PHASE 2: SYNC                                                 │
│   ├── Configure MockAdapter with bill from ERP                 │
│   ├── Run WorkspaceSyncReactor for bills                       │
│   ├── Assert: Bill mirror exists with matching external_id     │
│   └── Assert: Bill mirror has correct amount, vendor, etc.     │
│                                                                 │
│   PHASE 3: BRIDGE                                               │
│   ├── Run BridgeReactor (or just reconciliation step)          │
│   ├── Assert: PushRequest linked to Bill mirror                │
│   ├── Assert: PushRequest.accounting_resource_id set           │
│   └── Assert: Source transaction linked to Bill (if applicable)│
│                                                                 │
│   FINAL ASSERTIONS                                              │
│   ├── Complete audit trail exists                               │
│   ├── All relationships properly linked                         │
│   └── Status reflects fully synced state                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Changes

1. **Use `ExecutePush` action** instead of `Reactor.run()` directly
   - Tests the real production code path
   - Status handling is automatic
   - Actor context reconstruction is tested

2. **Run all three phases** in sequence
   - Push → Sync → Bridge
   - Each phase builds on the previous
   - Final state is verified

3. **Keep existing unit tests** for isolated testing
   - Current tests become "Push Unit Tests"
   - New tests are "Flow Integration Tests"
   - Both have value

---

## Test Cases

### Primary Test: F01-LIFECYCLE - Full Push → Sync → Bridge

**Purpose:** Verify complete card spend flow works end-to-end

**Steps:**
1. Setup: Open period, existing vendor, card transaction
2. Push: Execute push, verify Bill + Payment created
3. Sync: Run sync, verify Bill mirror populated
4. Bridge: Run reconciliation, verify linking

**Assertions:**
- PushRequest.status = :pushed (after push)
- Bill mirror exists with correct external_id
- PushRequest.accounting_resource_id = Bill.id
- All metadata preserved

### Secondary Tests: Phase-Specific Validation

These validate specific behaviors within each phase:

| Test | Phase | Validates |
|------|-------|-----------|
| F01-P1-PERIOD | Push | Period validation (open → success) |
| F01-P1-NO-PERIOD | Push | No periods synced → FAIL HARD |
| F01-P1-VENDOR | Push | Vendor exists → used correctly |
| F01-P1-NO-VENDOR | Push | No vendor → clear error |
| F01-P2-SYNC | Sync | Bill fetched and mirrored |
| F01-P3-RECONCILE | Bridge | PushRequest linked to Bill |

---

## Implementation Plan

### File Changes

1. **Rename existing test file** to clarify scope:
   - `card_spend_flow_01_test.exs` → `card_spend_push_unit_test.exs`
   - These remain as unit tests for push phase isolation

2. **Create new lifecycle test file**:
   - `card_spend_flow_01_lifecycle_test.exs`
   - Tests full Push → Sync → Bridge flow

3. **Update helper functions**:
   - Add `execute_push/2` helper that uses `Ash.update(:execute_push)`
   - Add `run_sync/1` helper for sync phase
   - Add `run_reconciliation/1` helper for bridge phase

---

## Success Criteria

✅ Flow-01 lifecycle test passes with all three phases  
✅ Tests use production code paths (ExecutePush, not Reactor.run)  
✅ PushRequest status correctly managed by ExecutePush  
✅ Sync phase brings back Bill from mock ERP  
✅ Bridge phase links PushRequest to Bill mirror  
✅ All existing push unit tests still pass  
✅ Clear separation between unit tests and lifecycle tests  

---

## Architecture Clarification

### PushRequest Status Management

**Finding:** Status is correctly managed by `ExecutePush` action, NOT by reactor compensate functions.

```elixir
# ExecutePush action (line 60-61, 114-122, 168-177):
# Before: status = :pending
# Start:  status = :processing (line 60)
# Success: status = :pushed (line 116)
# Failure: status = :failed (line 171)
```

**Implication:** Tests that call `Reactor.run()` directly bypass this logic. Production always uses `ExecutePush`, so production behavior is correct.

### Why This Matters

- The "bug" reported by committee (status stays :pending) is a **test artifact**
- Production code is correct
- Tests were not testing production code path
- This redesign fixes that gap

---

*Document Created: 2025-12-29*  
*Author: Sync Committee Engineering Subcommittee*

