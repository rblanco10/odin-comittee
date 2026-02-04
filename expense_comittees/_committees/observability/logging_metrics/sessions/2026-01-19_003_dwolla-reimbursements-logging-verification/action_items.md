# Action Items

> **Session ID**: 2026-01-19_003_dwolla-reimbursements-logging-verification
> **Date**: 2026-01-19

---

## New Action Items from This Session

| ID | Item | Owner | Priority | Status | Created |
|----|------|-------|----------|--------|---------|
| AI-019 | Verify Loki logs appear for blocked payment flow | SC01 | 🟠 Medium | Pending | 2026-01-19 |
| AI-020 | Confirm `log_payment_blocked_no_bank` is called in reactor | SC01 | 🟠 Medium | Pending | 2026-01-19 |
| AI-021 | Dashboard UX enhancements session | SC04 | 🟡 Low | Pending | 2026-01-19 |
| AI-022 | Test successful payment flow with employee WITH bank account | Human | 🟠 Medium | Pending | 2026-01-19 |

---

## Action Item Details

### AI-019: Verify Loki logs appear for blocked payment flow

**Context**: During IEx testing, the "Payment Blocked - No Bank Account" flow executed correctly and returned the expected error. However, the LokiLoggingService events did not appear in console output.

**Verification Steps**:
1. Query Loki: `{domain="ember_reimbursements", event_type=~".*payment_blocked.*"} | json`
2. Check if `LogBatchingGenServer` is running
3. Verify logs reach Loki endpoint

---

### AI-020: Confirm log_payment_blocked_no_bank is called

**Context**: Need to verify the `LokiLoggingService.log_payment_blocked_no_bank/1` function is actually invoked in the reactor flow.

**Location**: `reimbursement_payment_reactor.ex` around line 431

---

### AI-021: Dashboard UX enhancements

**Context**: Human Director requested dashboard improvements but session was closed before this work began.

**Scope for follow-up session**:
- Make dashboard more usable
- Easier to understand
- Better UX patterns

---

### AI-022: Test successful payment flow

**Context**: Only tested blocked flow. Need to test with employee who HAS bank account to verify success logging.

**Prerequisites**:
- Create test employee with linked bank account
- Or configure Dwolla sandbox connection

---

## Carried Forward from Prior Sessions

| ID | Item | Owner | Priority | Status |
|----|------|-------|----------|--------|
| AI-014 | **BUG**: Fix `provider` label not being set in Loki logs | SC01 | 🔴 High | Pending |
| AI-015 | Review `maybe_put_label/3` atom key vs string key handling | SC01 | 🔴 High | Pending |
| AI-016 | Verify `rail` label is being set correctly | SC01 | 🟠 Medium | Pending |
| AI-017 | Migrate remaining dashboard panels to Loki | Dr. William Park | 🟠 Medium | Pending |
