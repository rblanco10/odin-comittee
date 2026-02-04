# Committee Findings: Flow-07 Reimbursement → Existing Vendor

> **Session:** SC-2026-01-01-004  
> **Date:** 2026-01-01  
> **Status:** Approved by Committee  
> **Turn:** 4

---

## 1. Executive Summary

The Sync Committee has reviewed Flow-07 (Reimbursement → Existing Vendor in Open Period) and determined that:

1. The underlying infrastructure **already exists** (reactors, sync, reconciliation)
2. What is **missing** is a lifecycle test that verifies the complete flow
3. The approach should **mirror the card flow pattern** established in Flows 1-6
4. The key difference is **payee is employee, not vendor**

---

## 2. Committee Understanding

### 2.1 Reimbursement Flows Overview (7-9)

The committee reviewed all three reimbursement flows to understand them cohesively:

| Flow | Scenario | Key Behavior |
|------|----------|--------------|
| **7** | Existing Vendor, Open Period | Happy path: ExpenseReport + AP Payment to employee |
| **8** | New Vendor | NO ERP vendor created (Teampay-only VendorDetail) |
| **9** | Closed Period | Period fallback (preserve expense_date, adjust posting_period) |

### 2.2 Fundamental Difference from Card Flows

| Aspect | Card Flows (1-6) | Reimbursement Flows (7-9) |
|--------|------------------|---------------------------|
| **ERP Entity** | Vendor Bill + Bill Payment | Expense Report + AP Payment |
| **Payment Payee** | Vendor | **Employee** |
| **Vendor Liability** | ✅ Created | ❌ Never created |
| **Vendor in ERP** | ✅ Required | ❌ For attribution only |
| **Reactor** | PushCardSpendReactor | PushExpenseReportReactor |
| **Reconciliation** | BillReconciliationService | ExpenseReportReconciliationService |

### 2.3 Flow-07 Specific Requirements

**Scenario:**
- Accounting period is **open**
- Vendor (e.g., Delta Airlines) **exists** in ERP (for attribution)
- Employee submits reimbursement request
- Manager approves
- Admin pays via ACH

**Key Invariants:**
1. **No Vendor Bill created** — Reimbursements don't create vendor payables
2. **Payment is to employee** — Not to the vendor
3. **Vendor is for attribution only** — Visible in reporting
4. **No vendor liability** — Employee is paid directly

**Two-Object Model:**

| Object | Purpose | Sync Trigger | ERP Record |
|--------|---------|--------------|------------|
| ReimbursementRequest | Expense | On approval | Expense Report |
| ReimbursementPayment | Cash movement | On payment execution | AP Payment (to employee) |

---

## 3. Pattern Analysis: Learning from Flows 1-6

The committee analyzed `card_spend_flow_01_lifecycle_test.exs` as the reference pattern:

### 3.1 Test Structure Pattern

```
Module: Flow[XX]LifecycleTest
  
  setup:
    - Create accounting period (open)
    - Create relevant ERP mirror entities (vendor, employee, etc.)
  
  describe "Complete Flow-XX Lifecycle":
    test "complete lifecycle: push creates [entity], sync mirrors it, bridge links it"
      - ARRANGE: Configure mock adapter, create push request
      - PHASE 1: Execute push via Ash.update(:execute_push)
      - PHASE 2: Run sync reactor
      - PHASE 3: Run reconciliation service
      - VERIFY: All links established correctly
  
  describe "Phase 1: Push":
    test "ExecutePush correctly handles status transitions"
    test "ExecutePush handles reactor failure correctly"
  
  describe "Phase 2: Sync":
    test "[Entity] is correctly synced from mock ERP"
  
  describe "Phase 3: Bridge (Reconciliation)":
    test "PushEntityRecord is linked to [Entity] after reconciliation"
  
  Helper Functions:
    - execute_push/2
    - create_flowXX_push_request/2  (unique per flow)
    - get_push_entity_record/2
    - seed_mock_sync_responses/3
    - configure_sync_response_for_[entity]/3
```

### 3.2 Key Adaptations for Flow-07

| Card Flow (Flow-01) | Reimbursement Flow (Flow-07) |
|---------------------|------------------------------|
| `entity_type: :card_spend` | `entity_type: :expense_report` |
| `source_domain: "expense_card"` | `source_domain: "expense"` |
| `Bill` mirror | `ExpenseReport` mirror |
| `BillReconciliationService` | `ExpenseReportReconciliationService` |
| `configure_sync_response(:bills, ...)` | `configure_sync_response(:expense_reports, ...)` |
| Verify Bill created | Verify ExpenseReport created |
| Verify Bill Payment to vendor | Verify AP Payment to **employee** |

---

## 4. Existing Implementation Audit

The committee verified the existing implementation:

### 4.1 Push Reactors

| Component | Location | Status |
|-----------|----------|--------|
| PushExpenseReportReactor | `lib/.../reactors/expense/push_expense_report_reactor.ex` | ✅ Exists |
| PushExpenseReportPaymentReactor | `lib/.../reactors/expense/push_expense_report_payment_reactor.ex` | ✅ Exists |

**Verified:** PushExpenseReportReactor creates `PushEntityRecord` with `entity_type: :expense_report`

### 4.2 Sync

| Component | Status |
|-----------|--------|
| ExpenseReport sync in WorkspaceSyncReactor | ✅ Exists |
| ExpenseReport mirror table | ✅ Exists |

### 4.3 Reconciliation

| Component | Location | Status |
|-----------|----------|--------|
| ExpenseReportReconciliationService | `lib/.../reconciliation/expense_report_reconciliation_service.ex` | ✅ Exists |
| ExpenseReportPaymentReconciliationService | `lib/.../reconciliation/expense_report_payment_reconciliation_service.ex` | ✅ Exists |

### 4.4 Mock Adapter

| Capability | Status | Notes |
|------------|--------|-------|
| `push_expense_report/3` | ⚠️ Needs verification | Must support in MockAdapter |
| Sync response for `:expense_reports` | ⚠️ Needs verification | May need configuration |

---

## 5. Gap Analysis

| Gap ID | Description | Severity | Resolution |
|--------|-------------|----------|------------|
| GAP-TEST-001 | No lifecycle test for Flow-07 | 🔴 Critical | Create `expense_report_flow_07_lifecycle_test.exs` |
| GAP-MOCK-001 | MockAdapter may not support expense report push | 🟠 High | Verify and add if missing |
| GAP-MOCK-002 | Sync response format for expense reports | 🟡 Medium | Configure in test setup |

---

## 6. Committee Recommendation

### 6.1 Approach

Create a new lifecycle test file `expense_report_flow_07_lifecycle_test.exs` that:

1. **Mirrors the structure** of `card_spend_flow_01_lifecycle_test.exs`
2. **Uses unique helper names** (e.g., `create_flow07_push_request`)
3. **Verifies the complete lifecycle**: Push → Sync → Bridge
4. **Asserts reimbursement-specific invariants**:
   - ExpenseReport created (NOT Bill)
   - AP Payment payee is employee (NOT vendor)
   - No vendor liability created
   - Status transitions correctly

### 6.2 Test Cases Required

| Test Case | Priority | Description |
|-----------|----------|-------------|
| TC-07-01 | 🔴 Critical | Complete lifecycle: push creates expense report, sync mirrors it, bridge links it |
| TC-07-02 | 🔴 Critical | ExecutePush correctly handles status transitions |
| TC-07-03 | 🟠 High | ExecutePush handles reactor failure correctly |
| TC-07-04 | 🔴 Critical | ExpenseReport is correctly synced from mock ERP |
| TC-07-05 | 🔴 Critical | PushEntityRecord is linked to ExpenseReport after reconciliation |

### 6.3 Success Criteria

1. All 5 test cases pass
2. All existing ERP tests continue to pass (0 failures)
3. Test follows established patterns from Flows 1-6
4. No shortcuts or compromises in test assertions

---

## 7. Committee Sign-Off

| Member | Role | Approval |
|--------|------|----------|
| Intake Coordinator | Materials gathering | ✅ Approved |
| Architecture Presenter | Pattern analysis | ✅ Approved |
| Sync Architect | Technical validation | ✅ Approved |
| Scribe | Documentation | ✅ Documented |
| Chair | Process oversight | ✅ Approved for handoff |

---

**Status:** Ready for Engineering Handoff

*Documented by Scribe*  
*Session: SC-2026-01-01-004*

