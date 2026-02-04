# Session SC-2026-01-01-004: Flow-07 Reimbursement → Existing Vendor

## Session Objective

Implement and verify **Flow-07: Reimbursement → Existing Vendor (Open Period)**, the first of the reimbursement flows, following the same patterns established in Flows 1-6 (Card flows).

---

## Scope

### In Scope
- Flow-07: Reimbursement → Existing Vendor (Open Period)
- Full lifecycle test (Push → Sync → Bridge)
- All ERP tests must pass (0 failures)

### Out of Scope (Future Sessions)
- Flow-08: Reimbursement → New Vendor
- Flow-09: Reimbursement → Closed Period

---

## Key Differences: Card vs Reimbursement

| Aspect | Card Flows (1-6) | Reimbursement Flows (7-9) |
|--------|------------------|---------------------------|
| **ERP Entity Created** | Vendor Bill + Bill Payment | Expense Report + AP Payment |
| **Payment Payee** | Vendor | **Employee** |
| **Vendor Liability?** | ✅ Yes | ❌ No |
| **Vendor Required in ERP?** | ✅ Yes | ❌ No (attribution only) |
| **Reactor** | PushCardSpendReactor | PushExpenseReportReactor |
| **Reconciliation** | BillReconciliationService | ExpenseReportReconciliationService |

---

## Flow-07 Specifics

### Scenario
- Accounting period is **open**
- Vendor (e.g., Delta Airlines) **exists** in ERP
- Employee submits reimbursement request
- Manager approves
- Admin pays via ACH

### Key Invariants

> **Cards create vendor payables; reimbursements do NOT.**
>
> - No Vendor Bill created
> - No vendor liability in ERP
> - Payment is to **employee**, not vendor
> - Vendor used for **reporting/attribution only**

### Two-Object Model

| Object | Purpose | Sync Trigger | ERP Record |
|--------|---------|--------------|------------|
| **ReimbursementRequest** | Expense | On **approval** | Expense Report |
| **ReimbursementPayment** | Cash movement | On **payment execution** | AP Payment (to employee) |

---

## Existing Implementation Status

### Reactors
| Component | Status |
|-----------|--------|
| `PushExpenseReportReactor` | ✅ Exists |
| `PushExpenseReportPaymentReactor` | ✅ Exists |

### Sync
| Component | Status |
|-----------|--------|
| ExpenseReport sync | ✅ Exists |
| ExpenseReportPayment sync | ✅ Exists |

### Bridge
| Component | Status |
|-----------|--------|
| `ExpenseReportReconciliationService` | ✅ Exists |
| `ExpenseReportPaymentReconciliationService` | ✅ Exists |

---

## Test Requirements

Following the pattern from `card_spend_flow_01_lifecycle_test.exs`:

1. **Complete Lifecycle Test**: Push → Sync → Bridge
2. **Phase-Specific Tests**: Push, Sync, Bridge individually
3. **Assertions Required**:
   - Expense Report created (not Vendor Bill)
   - AP Payment payee is **employee** (not vendor)
   - No vendor liability created
   - Status transitions correctly
   - Reconciliation links records properly

---

## References

- Flow-07 Documentation: `flows/FLOW-07-REIMBURSEMENT-EXISTING-VENDOR.md`
- Card Flow Pattern: `card_spend_flow_01_lifecycle_test.exs`
- PushExpenseReportReactor: `lib/.../reactors/expense/push_expense_report_reactor.ex`
- ExpenseReportReconciliationService: `lib/.../reconciliation/expense_report_reconciliation_service.ex`

