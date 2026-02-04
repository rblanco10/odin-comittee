# Flow 9: Reimbursement → Closed Period Fallback

> **Session:** SC-2025-12-29-001  
> **Category:** Reimbursement  
> **Period:** Closed (fallback to next open)  
> **Vendor:** Any  
> **Status:** Gap Analysis Complete

---

## Scenario

- Expense occurred in a **closed period**
- Reimbursement submitted and approved in an **open period**
- Same fallback logic as card transactions

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 9: REIMBURSEMENT → CLOSED PERIOD FALLBACK                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TIMELINE                                                                      │
│   ────────────────────────────────────────────────────────────────────────      │
│   March 15       March 31           April 5           April 6                   │
│      │               │                  │                 │                     │
│      ▼               ▼                  ▼                 ▼                     │
│   Expense        Period            Reimbursement      Sync                      │
│   incurred       closes            approved           triggered                 │
│   (receipt)                                                                     │
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ReimbursementRequest │                                                      │
│   │ - expense_date: Mar 15│ ← In CLOSED period                                  │
│   │ - approved_date: Apr 5│ ← In OPEN period                                    │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    P U S H   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ PushExpenseReportReactor                                             │      │
│   │                                                                      │      │
│   │ Validate Accounting Period:                                          │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  expense_date = March 15                                       │   │      │
│   │ │                                                                │   │      │
│   │ │  1. Is March 15 in open period? → NO (March closed)            │   │      │
│   │ │  2. Find next open period → April 2025                         │   │      │
│   │ │  3. Apply fallback:                                            │   │      │
│   │ │     - PRESERVE expense_date: March 15                          │   │      │
│   │ │     - SET posting_period: April 2025                           │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                                      │      │
│   │ Push to NetSuite:                                                    │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  Expense Report:                                               │   │      │
│   │ │    expense_date: March 15 ← PRESERVED                          │   │      │
│   │ │    posting_period: April 2025 ← FALLBACK                       │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ After Payment (on payment date):                                     │      │
│   │                                                                      │      │
│   │ PushExpenseReportPaymentReactor                                      │      │
│   │ → AP Payment posted on payment date (April 6)                        │      │
│   │ → Applied to Expense Report                                          │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   RESULT:                                                                       │
│   ✓ Expense Date: March 15 (preserved)                                         │
│   ✓ ERP Posting Period: April 2025 (moved forward)                             │
│   ✓ Payment to employee                                                        │
│   ✗ No vendor liability                                                         │
│   ✓ Status = Synced                                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Dates

| Date Type | Value | Notes |
|-----------|-------|-------|
| **Expense Date** | March 15 | **PRESERVED** - when expense occurred |
| **ERP Posting Date** | April 1 | Moved to next open period |
| **Payment Date** | April 6 | When payment was executed |

---

## Verification Checklist

- [ ] Expense date **preserved**
- [ ] ERP Posting Period **moved forward**
- [ ] Payment to **employee**
- [ ] **No vendor liability**
- [ ] Status = **Synced**

---

## Gap Analysis

Same gaps as Flow 4 (period validation in push reactors).

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-PERIOD-001 | Push | Period validation in `PushExpenseReportReactor` | 🔴 Critical | ⚠️ Needs verification |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 7 |
| Manual Sync | Part 2 | Flow 7 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

