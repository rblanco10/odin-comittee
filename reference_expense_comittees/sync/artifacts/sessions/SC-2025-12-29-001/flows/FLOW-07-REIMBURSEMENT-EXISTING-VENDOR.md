# Flow 7: Reimbursement → Existing Vendor (Open Period)

> **Session:** SC-2025-12-29-001  
> **Category:** Reimbursement  
> **Period:** Open  
> **Vendor:** Existing  
> **Status:** Gap Analysis Complete

---

## Scenario

- Accounting period is **open**
- Vendor (e.g., Delta Airlines) **exists** in ERP
- Employee submits reimbursement request
- Manager approves
- Admin pays via ACH

---

## Key Invariants

> **Cards create vendor payables; reimbursements do NOT.**
>
> - No Vendor Bill created
> - No vendor liability in ERP
> - Payment is to **employee**, not vendor
> - Vendor used for **reporting/attribution only**

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 7: REIMBURSEMENT → EXISTING VENDOR (OPEN)                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ ReimbursementRequest (REPORT)       ReimbursementPayment (PAYMENT)   │      │
│   │                                                                      │      │
│   │ ┌────────────────────┐              ┌────────────────────┐          │      │
│   │ │ - amount: $450     │              │ - amount: $450     │          │      │
│   │ │ - vendor: Delta    │              │ - payee: EMPLOYEE  │ ← KEY!   │      │
│   │ │ - status: approved │              │ - method: ACH      │          │      │
│   │ │ - employee: John   │              │ - status: paid     │          │      │
│   │ └─────────┬──────────┘              └─────────┬──────────┘          │      │
│   │           │                                   │                      │      │
│   │           │ Sync on APPROVAL                  │ Sync on PAYMENT      │      │
│   │           ▼                                   ▼                      │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                    │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              │            P U S H   P H A S E     │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              ▼                                    ▼                             │
│   ┌─────────────────────────┐      ┌─────────────────────────┐                  │
│   │PushExpenseReportReactor │      │PushExpenseReportPayment │                  │
│   │                         │      │Reactor                  │                  │
│   │ Creates in NetSuite:    │      │                         │                  │
│   │ ┌─────────────────────┐ │      │ Creates in NetSuite:    │                  │
│   │ │ EXPENSE REPORT      │ │      │ ┌─────────────────────┐ │                  │
│   │ │                     │ │      │ │ AP PAYMENT          │ │                  │
│   │ │ - employee: John    │ │      │ │                     │ │                  │
│   │ │ - amount: $450      │ │      │ │ - payee: EMPLOYEE   │ │ ← NOT vendor!   │
│   │ │ - GL: 6250 Travel   │ │      │ │ - amount: $450      │ │                  │
│   │ │ - receipt attached  │ │      │ │ - applied to:       │ │                  │
│   │ │   at line level     │ │      │ │   Expense Report    │ │                  │
│   │ └─────────────────────┘ │      │ └─────────────────────┘ │                  │
│   │                         │      │                         │                  │
│   │ Does NOT create:        │      │ Does NOT create:        │                  │
│   │ ✗ Vendor Bill           │      │ ✗ Bill Payment          │                  │
│   │ ✗ Vendor liability      │      │ ✗ Vendor payment        │                  │
│   └─────────────────────────┘      └─────────────────────────┘                  │
│              │                                    │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              │               S Y N C              │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              ▼                                    ▼                             │
│   ┌─────────────────────────┐      ┌─────────────────────────┐                  │
│   │   ExpenseReport         │      │   ExpenseReportPayment  │                  │
│   │   (ERP Mirror)          │      │   (ERP Mirror)          │                  │
│   └─────────────────────────┘      └─────────────────────────┘                  │
│              │                                    │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              │               B R I D G E          │                             │
│   ═══════════╪════════════════════════════════════╪═════════════════════════    │
│              ▼                                    ▼                             │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ BridgeReactor                                                           │   │
│   │                                                                         │   │
│   │ Step 10: ExpenseReportReconciliationService                             │   │
│   │ → Links ReimbursementRequest.erp_expense_report_id                      │   │
│   │                                                                         │   │
│   │ Step 19: ExpenseReportPaymentReconciliation                             │   │
│   │ → Links payment records                                                 │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   RESULT:                                                                       │
│   ✓ Vendor visible in Teampay for reporting (Delta Airlines)                   │
│   ✗ NO vendor bill created                                                      │
│   ✗ NO vendor liability                                                         │
│   ✓ Payment is to EMPLOYEE                                                      │
│   ✓ Status = Synced                                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Two-Object Model

| Object | Purpose | Sync Trigger | ERP Record |
|--------|---------|--------------|------------|
| **ReimbursementRequest** | Expense | On **approval** | Expense Report |
| **ReimbursementPayment** | Cash movement | On **payment execution** | AP Payment (to employee) |

---

## ERP Records Created

### Expense Report

| Field | Value |
|-------|-------|
| Employee | John (requesting employee) |
| Amount | $450 |
| GL Account | 6250 (Travel) |
| Department | Sales |
| Location | Remote |
| Class | Opex |
| Project | Customer Growth |
| Expense Date | Original date (preserved) |
| Attachments | Receipt at line level |

### AP Payment (Employee Reimbursement)

| Field | Value |
|-------|-------|
| **Payee** | **Employee** (not vendor!) |
| Amount | $450 |
| Account | Cash or clearing account |
| Applied To | Expense Report |

---

## What is NOT Created

| Record | Why Not |
|--------|---------|
| **Vendor Bill** | Reimbursements don't create vendor payables |
| **Bill Payment** | No bill to pay |
| **Vendor Liability** | Employee is paid directly |

---

## Verification Checklist

- [ ] Expense Report created with line-level receipts
- [ ] AP Payment payee is **employee** (not vendor)
- [ ] Vendor attribution visible for **reporting only**
- [ ] **No vendor liability** in ERP
- [ ] Status = **Synced**

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-UI-003 | UI | No "Sync" button on Ready to Pay tab | 🔴 High | 🔴 Missing |
| GAP-UI-004 | UI | No "Sync" button on All tab | 🔴 High | 🔴 Missing |
| GAP-UI-005 | UI | No "Sync" button on Paid tab (for payment) | 🔴 High | 🔴 Missing |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Push | `PushExpenseReportReactor` | ✅ Exists |
| Push | `PushExpenseReportPaymentReactor` | ✅ Exists |
| Sync | ExpenseReport sync | ✅ Exists |
| Bridge | `ExpenseReportReconciliationService` | ✅ Exists |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 2 |
| Manual Sync | Part 2 | Flow 2 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

