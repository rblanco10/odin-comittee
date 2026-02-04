# Session Goal

> **Session ID**: 2026-01-14_001_checkbook-localhost-testing  
> **Opened**: 2026-01-14  
> **Requested By**: Human Director

---

## Primary Objective

Test all 18 Checkbook flows on localhost server, one by one, to verify end-to-end functionality:

**Setup Flows (7)**:
- CHK-S1: KYB - Instant Approval
- CHK-S2: KYB - Document Required → Approved
- CHK-S3: KYB - Document Required → Rejected
- CHK-S4: KYB - Document Required → Timeout
- CHK-S5: KYB - Rejected
- CHK-S6: Company Bank - Plaid IAV
- CHK-S7: Company Bank - Manual Entry

**Payout Flows (10)**:
- CHK-P1: Check Payment - Digital Success
- CHK-P2: Check Payment - Physical Success
- CHK-P3: Check Payment - Digital Bounce
- CHK-P4: Check Payment - Physical Return
- CHK-P5: Check Payment - Cancelled
- CHK-P6: Check Payment - Error
- CHK-P7: Check Payment - Stuck (No Webhook)
- CHK-P8: Void Check - While Pending
- CHK-P9: Void Check - Stop Payment
- CHK-P10: Void Check - Too Late

**Operations (1)**:
- CHK-O1: Reconciliation

---

## Success Criteria

- [ ] All 18 flows tested on localhost
- [ ] Each flow verified end-to-end
- [ ] Issues documented as encountered
- [ ] Verification steps documented
- [ ] Any blockers or gaps identified

---

## Scope Boundaries

**IN SCOPE:**
- Testing each flow on localhost
- Verifying API calls work correctly
- Checking state transitions
- Documenting results

**OUT OF SCOPE:**
- Fixing implementation issues (separate task)
- Performance testing
- Load testing
- Production deployment

---

## Expected Outputs

- [ ] Test results for each of the 18 flows
- [ ] Documentation of any issues found
- [ ] Verification checklist
- [ ] Recommendations for improvements
