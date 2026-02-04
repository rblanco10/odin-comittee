# Action Items

> **Session**: 2026-01-08_004_infra-payments-migration  
> **Status**: ✅ COMPLETED

---

## Completed Action Items

| # | Action | Assignee | Status |
|---|--------|----------|--------|
| 1 | Research source ember dependencies | Research Clerk | ✅ Completed |
| 2 | Create infra_payments app scaffold | Migration Team | ✅ Completed |
| 3 | Migrate ember_payments resources | Migration Team | ✅ Completed (288 files) |
| 4 | Migrate ember_payment_instruments | Migration Team | ✅ Completed (31 files) |
| 5 | Create adapter stubs | Migration Team | ✅ Completed |
| 6 | Configure Ash domains (Payments, Instruments) | Ash Expert | ✅ Completed |
| 7 | Fix Oban.Pro.Worker → Oban.Worker | Migration Team | ✅ Completed |
| 8 | Fix :money type → AshMoney.Types.Money | Migration Team | ✅ Completed |
| 9 | Remove AshAudit blocks | Migration Team | ✅ Completed |
| 10 | Add sweet_xml dependency | Migration Team | ✅ Completed |
| 11 | Compile and verify | Full Team | ✅ Completed |
| 12 | Update STATUS.md | Recording Clerk | ✅ Completed |

---

## Follow-up Items (Future Sessions)

| # | Action | Priority | Notes |
|---|--------|----------|-------|
| 1 | Migrate infra_erp | High | Next infrastructure app |
| 2 | Migrate infra_communications | High | Many stubs depend on this |
| 3 | Replace Reimbursements stubs | Medium | When product_expense is migrated |
| 4 | Re-enable AshAudit | Low | When infra_audit is migrated |
| 5 | Add Oban.Pro if needed | Low | Evaluate if Pro features are required |

---

## Blockers Encountered and Resolved

| Blocker | Resolution |
|---------|------------|
| `Oban.Pro.Worker` not available | Replaced with standard `Oban.Worker` |
| `:money` type not recognized | Changed to `AshMoney.Types.Money` |
| `audit do` blocks require AshAudit | Removed blocks (same as infra_identity) |
| `SweetXml` not available | Added to dependencies |
| `InfraPayments.EmberReimbursements` reference | Created stub adapter |
| Domain references using `.Domain` suffix | Fixed sed transformation |

---

*All action items completed. Session 004 closed successfully.*
