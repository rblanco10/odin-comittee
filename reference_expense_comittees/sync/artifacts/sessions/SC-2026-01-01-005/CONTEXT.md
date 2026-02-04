# Session SC-2026-01-01-005: Context

**Session ID:** SC-2026-01-01-005  
**Topic:** Flow-08: Reimbursement → New Vendor (NO ERP Vendor Creation)  
**Started:** 2026-01-01

---

## Previous Session Summary (SC-2026-01-01-004)

Flow-07 was successfully implemented and verified:
- ✅ 5/5 Flow-07 lifecycle tests passing
- ✅ 294/294 total ERP tests passing
- ✅ All 3 subcommittees approved implementation
- ✅ Employee verification assertions added per user feedback

Key artifact: `test/flame_teampay_payables/ember_erp/integration/flows/expense_report_flow_07_lifecycle_test.exs`

---

## Current Session Scope

### Objective
Implement and verify Flow-08: Reimbursement for a NEW vendor (never before seen in ERP).

### Critical Invariant (MUST UNDERSTAND)

> **Reimbursements NEVER auto-create ERP vendors.**
> 
> Unlike card transactions (Flows 2-3) where vendors CAN be auto-created based on VendorPolicy, 
> reimbursements treat the vendor as **attribution/reporting only**. The vendor stays as a 
> Teampay-only VendorDetail record with `erp_vendor_id: NULL`.

### Key Differences from Related Flows

| Aspect | Card (Flow-02/03) | Reimb. Existing (Flow-07) | Reimb. New (Flow-08) |
|--------|-------------------|---------------------------|----------------------|
| Vendor in ERP? | Created if policy allows | Already exists | **NEVER created** |
| ERP Record | Vendor Bill | Expense Report | Expense Report |
| Payment To | Vendor | Employee | Employee |
| Vendor Liability | ✅ Yes | ❌ No | ❌ No |
| VendorDetail Created | ✅ Yes | ✅ Yes | ✅ Yes |
| VendorDetail.erp_vendor_id | Set (linked) | Set (linked) | **NULL** |

---

## Learnings from Prior Flows

### From Flow-07 (Reimbursement → Existing Vendor)
1. ExpenseReport is the correct ERP entity type (not Vendor Bill)
2. Payment payee is the EMPLOYEE, not the vendor
3. Employee verification assertions are REQUIRED in tests
4. `PushExpenseReportReactor` handles the push phase
5. `ExpenseReportReconciliationService` handles the bridge phase

### From Flows 2-3 (Card → New Vendor)
1. Card flows CAN auto-create vendors via `VendorPolicy.should_auto_create?/2`
2. VendorPolicy has modes: `:auto_create`, `:threshold`, `:manual`
3. Flow-08 must SKIP all vendor policy checks for reimbursements

---

## Session Requirements

1. **Committee Phase:**
   - Deep research comparing Flow-08 vs Flow-07 and Card flows
   - Document how `PushExpenseReportReactor` handles new vendors (it should skip vendor creation)
   - Create formal findings document

2. **Engineering Phase:**
   - Receive formal handoff from committee
   - Create technical implementation plan
   - Design comprehensive test cases
   - Implement tests in `expense_report_flow_08_lifecycle_test.exs`

3. **Verification Phase:**
   - All Flow-08 tests must pass
   - All 294+ ERP tests must pass (0 failures)
   - At least 3 subcommittees must verify work quality

---

*Documented by Sync Committee Chair*  
*Session: SC-2026-01-01-005*

