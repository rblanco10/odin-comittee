# Session Goal

> **Session ID**: 2026-01-15_001_checkbook-dev-site-testing  
> **Opened**: 2026-01-15  
> **Requested By**: Human Director

---

## Primary Objective

Create a comprehensive walkthrough guide for testing all 18 Checkbook flows on the dev site (https://dev.teampay.io/expense/), including:

1. Step-by-step instructions for each flow
2. Prerequisites and setup requirements
3. Expected results and verification steps
4. Troubleshooting guidance
5. Testing checklist

---

## Success Criteria

- [ ] Complete testing guide created for all 18 flows
- [ ] Clear step-by-step instructions for each flow
- [ ] Prerequisites documented (KYB, bank accounts, etc.)
- [ ] Expected results defined for each flow
- [ ] Verification steps provided
- [ ] Troubleshooting section included
- [ ] Testing checklist created

---

## Scope Boundaries

**IN SCOPE:**
- Creating comprehensive testing guide
- Documenting all 18 Checkbook flows
- Step-by-step walkthrough instructions
- Prerequisites and setup requirements
- Expected results and verification
- Troubleshooting guidance

**OUT OF SCOPE:**
- Actually executing the tests (Human Director will do this)
- Fixing implementation issues found during testing
- Performance testing
- Load testing

---

## Expected Outputs

- [ ] Complete testing guide document
- [ ] Flow-by-flow instructions
- [ ] Prerequisites checklist
- [ ] Testing checklist
- [ ] Troubleshooting guide

---

## Flows to Document

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
