# Flow 8: Reimbursement → New Vendor (NO ERP Vendor Creation)

> **Session:** SC-2025-12-29-001  
> **Category:** Reimbursement  
> **Period:** Open  
> **Vendor:** New (Teampay-only)  
> **Status:** Gap Analysis Complete

---

## Scenario

- Accounting period is **open**
- Vendor (e.g., Blue Bottle Coffee) has **never appeared** in Teampay or ERP
- Employee submits out-of-pocket expense
- Reimbursements are **employee-payable, not vendor-payable**

---

## Critical Invariant

> **Vendors are auto-created in the ERP only for card/AP spend.**
>
> Reimbursements **NEVER** auto-create ERP vendors. The vendor is for attribution/reporting only and stays as a Teampay-only VendorDetail.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│          FLOW 8: REIMBURSEMENT → NEW VENDOR (NO ERP VENDOR CREATION)            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ReimbursementRequest │                                                      │
│   │ - amount: $18.75     │                                                      │
│   │ - vendor: Blue Bottle│ ← NEW (never seen before)                            │
│   │   Coffee             │                                                      │
│   │ - expense_date: Apr 5│                                                      │
│   │ - receipt: attached  │                                                      │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                        VendorDetail                                  │      │
│   │                    (TEAMPAY-ONLY RECORD)                             │      │
│   │                                                                      │      │
│   │  ┌────────────────────────────────────────────────────────────────┐  │      │
│   │  │ VendorDetail                                                   │  │      │
│   │  │                                                                │  │      │
│   │  │ - vendor_name: "Blue Bottle Coffee"                            │  │      │
│   │  │ - source: :reimbursement                                       │  │      │
│   │  │ - erp_vendor_id: NULL ← NOT linked to ERP                      │  │      │
│   │  │                                                                │  │      │
│   │  │ PURPOSE:                                                       │  │      │
│   │  │ ✓ Attribution (who was the vendor?)                            │  │      │
│   │  │ ✓ Reporting (spend by vendor)                                  │  │      │
│   │  │ ✓ Auto-coding (future expenses at this vendor)                 │  │      │
│   │  │                                                                │  │      │
│   │  │ NOT FOR:                                                       │  │      │
│   │  │ ✗ ERP vendor record                                            │  │      │
│   │  │ ✗ Vendor payable/liability                                     │  │      │
│   │  └────────────────────────────────────────────────────────────────┘  │      │
│   │                                                                      │      │
│   │  NOT PROMOTED TO ERP-BACKED VENDOR                                   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    P U S H   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ PushExpenseReportReactor                                             │      │
│   │                                                                      │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  CRITICAL CHECK: Is this a reimbursement?                      │   │      │
│   │ │                                                                │   │      │
│   │ │  entity_type == :expense_report                                │   │      │
│   │ │                                                                │   │      │
│   │ │  ════════════════════════════════════════════════════════════  │   │      │
│   │ │  ║  SKIP VENDOR CREATION                                    ║  │   │      │
│   │ │  ║                                                          ║  │   │      │
│   │ │  ║  - Do NOT check VendorPolicy                             ║  │   │      │
│   │ │  ║  - Do NOT auto-create vendor in ERP                      ║  │   │      │
│   │ │  ║  - Proceed directly to Expense Report creation           ║  │   │      │
│   │ │  ════════════════════════════════════════════════════════════  │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                      GAP-VENDOR-003  │      │
│   │                                                                      │      │
│   │ Creates in NetSuite:                                                 │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │ EXPENSE REPORT (line-level)                                    │   │      │
│   │ │                                                                │   │      │
│   │ │ - employee: requesting employee                                │   │      │
│   │ │ - amount: $18.75                                               │   │      │
│   │ │ - expense date: April 5 (preserved)                            │   │      │
│   │ │ - memo/description: "Blue Bottle Coffee" ← For reference only  │   │      │
│   │ │ - receipt: attached                                            │   │      │
│   │ │                                                                │   │      │
│   │ │ NOTE: Vendor field on expense line may be NULL or N/A         │   │      │
│   │ │       depending on ERP configuration                           │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ After Payment: PushExpenseReportPaymentReactor                       │      │
│   │                                                                      │      │
│   │ Creates:                                                             │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │ AP PAYMENT                                                     │   │      │
│   │ │                                                                │   │      │
│   │ │ - payee: EMPLOYEE (not vendor!)                                │   │      │
│   │ │ - amount: $18.75                                               │   │      │
│   │ │ - applied to: Expense Report                                   │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   VERIFICATION:                                                                 │
│   ✓ Vendor "Blue Bottle Coffee" visible in Teampay reporting                   │
│   ✗ NO ERP vendor created                                                       │
│   ✗ NO vendor liability in ERP                                                  │
│   ✓ Payment is to employee                                                      │
│   ✓ Status = Synced                                                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Card vs Reimbursement (New Vendor)

| Aspect | Card Transaction | Reimbursement |
|--------|-----------------|---------------|
| ERP Vendor Created? | ✅ Yes (if policy allows) | ❌ **NEVER** |
| ERP Record | Vendor Bill + Bill Payment | Expense Report + AP Payment |
| Payment Payee | Vendor | **Employee** |
| Vendor Liability? | ✅ Yes | ❌ No |
| VendorDetail Created? | ✅ Yes | ✅ Yes |
| VendorDetail linked to ERP? | ✅ Yes | ❌ No |

---

## Verification Checklist

- [ ] Vendor visible in Teampay reporting as "Blue Bottle Coffee"
- [ ] **No ERP vendor created**
- [ ] **No vendor liability**
- [ ] VendorDetail.erp_vendor_id is NULL
- [ ] Status = **Synced**

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-VENDOR-003 | Push | Need to verify `PushExpenseReportReactor` does NOT attempt vendor auto-creation | 🟡 Medium | ⚠️ Needs verification |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Product | VendorDetail for reimbursement vendors | ✅ Exists |
| Push | `PushExpenseReportReactor` skips vendor creation | ⚠️ Needs verification |
| Push | Expense Report created without vendor field | ⚠️ Needs verification |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 4 |
| Manual Sync | Part 2 | Flow 4 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

