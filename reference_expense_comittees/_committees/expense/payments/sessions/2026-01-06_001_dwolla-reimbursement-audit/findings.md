# Session Findings: 2026-01-06_001_dwolla-reimbursement-audit

## Session Summary

**Date:** 2026-01-06  
**Goal:** Production Readiness Audit of the Dwolla reimbursement flow  
**Status:** ✅ CONCLUDED — Audit complete, gaps documented  
**Members Consulted:** 11

---

## Executive Summary

The Dwolla reimbursement flow is **substantially implemented** for the happy path. However, **six gaps** were identified that must be addressed before production deployment, with one being **critical (P0)**.

---

## What's Working ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Dwolla Adapter | ✅ Complete | 14 files, full capability coverage |
| ReimbursementPaymentReactor | ✅ Complete | 9 steps, 1,536 lines, compensation logic |
| SubmitPayoutBatchReactor | ✅ Complete | Platform Model support, correlation IDs |
| Webhook Handler (transfers) | ✅ Basic | Handles created/completed/failed/cancelled |
| Observability (sync path) | ✅ Complete | Metrics, tracing, logging in client |
| Notification System | ✅ Complete | Debit initiated, credit settled, failures |
| Audit Logging | ✅ Complete | AuditLogger integration |

---

## Gaps Identified

### 🔴 P0 — CRITICAL (Blocks Production)

#### GAP-006: Employee Recipient Onboarding Missing

**Impact:** No employee can set up their bank account for ACH reimbursements in production.

**Current State:** 
- `UserProfileEditLive` stores bank info locally in `UserProfile`
- Does NOT create Dwolla customer or funding source
- Does NOT create `PartnerRecipient` record
- Seeds create records manually with shared test credentials

**Required Components:**
1. `EmployeeRecipientOrchestrator` service
2. Integration with `UserProfileEditLive` UI
3. Webhook handler for `funding-source.verified`
4. (Optional) Plaid processor token for instant verification

**Effort:** 3-5 days

---

### 🔴 P1 — HIGH (Required for Resilience)

#### GAP-001: No Dwolla Transfer Sync Worker

**Impact:** Missed webhooks leave payments stuck in `:processing` forever.

**Required:** `DwollaTransferSyncWorker` (pattern exists in WEX)

**Effort:** 2-3 days

---

#### GAP-002: Budget Settlement Missing from Webhook Handler

**Impact:** `BudgetTransaction` never transitions from `:committed` to `:actual`.

**Required:** Call `ReimbursementBudgetService.settle_budget_on_payment_completion/1` in webhook handler when transfer completes.

**Effort:** 0.5 days

---

#### GAP-003: Webhook Handler Lacks Observability

**Impact:** Cannot monitor webhook volume, latency, or failures.

**Required:**
- Prometheus metrics for webhook events
- Tempo spans for webhook processing
- Loki structured logs

**Effort:** 1-2 days

---

### 🟡 P2 — MEDIUM (Recommended)

#### GAP-004: No Webhook Retry via Oban

**Impact:** Transient failures during webhook processing lose the event.

**Why It Matters:**
- Race conditions: webhook can arrive before payment record is created
- Database timeouts lose the webhook
- Oban provides persistent queue with automatic retry

**Required:** Enqueue webhooks to Oban for async processing with retry.

**Effort:** 1-2 days

---

### 🟢 P3 — LOW (Nice to Have)

#### GAP-005: `get_batch_status/2` Is a Stub

**Impact:** Cannot poll batch status without webhooks.

**Note:** Not critical because we track individual transfers and rely on webhooks.

**Effort:** 1 day (if Mass Payments API is implemented)

---

## Key Clarifications from Discussion

### Mass Payments API

- **What it is:** Dwolla's API for batch payments in a single request
- **Current approach:** Individual transfers (1 API call per payment)
- **Impact:** For single reimbursements (our use case), current approach works fine
- **When needed:** If bulk reimbursements (50+ at once) become a requirement

### Why Sync Worker Matters

Without a sync worker, if a webhook fails:
- Payment stays in `:processing` forever
- Budget stays `:committed` (never becomes `:actual`)
- Employee sees "Processing..." indefinitely
- Finance team has no visibility

### Why Webhook Retry Matters

- Webhooks can arrive before payment record is created (race condition)
- Database timeouts lose the webhook
- Oban provides persistent queue with automatic retry

### Dwolla Recipient Architecture

Receiving funds requires two entities in Dwolla:
1. **Customer** (recipient) - Created via `POST /customers`
2. **Funding Source** (bank account) - Added via `POST /customers/{id}/funding-sources`

Current code only stores bank info locally; it does NOT register with Dwolla.

---

## Recommended Roadmap

### Week 1 (P0 + P1)
- [ ] Build `EmployeeRecipientOrchestrator` service
- [ ] Integrate with `UserProfileEditLive`
- [ ] Create `DwollaTransferSyncWorker`
- [ ] Add budget settlement to webhook handler

### Week 2 (P1 + P2)
- [ ] Add webhook observability (metrics, tracing, logging)
- [ ] Handle `funding-source.verified` webhook
- [ ] Consider Oban for webhook retry
- [ ] Create alerting rules

### Week 3 (Testing + Documentation)
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Runbook documentation

**Total Estimated Effort:** 2-3 weeks

---

## Members Who Contributed

| Member | Role | Contributions |
|--------|------|---------------|
| Victoria Sterling | Chair | Session orchestration, checkpoints |
| Dr. Henry Blackwood | Historian | Historical context |
| Christopher Jordan | Dwolla Specialist | Adapter audit, Mass Payments explanation, recipient flow |
| Maria Santos | Flow Expert | End-to-end flow tracing |
| Dr. Sandra Lee | Observability Expert | Webhook observability patterns |
| Heather Wong | Async Processing Expert | Reimbursement flow observability map |
| Ryan Mitchell | Error Handling Expert | Sync worker priority, webhook retry |
| Dr. Amanda Foster | Performance & Scaling | Production readiness checklist |
| Christina Nguyen | Workflow Architect | Implementation roadmap |
| Yuki Tanaka | Reliability Critic | Priority matrix, gap assessment |
| Douglas Chen | Maintenance Critic | Long-term maintainability |

---

## Files Examined

- `dwolla/capabilities/payout_disbursement.ex` - Core payout logic
- `dwolla/capabilities/funding_source_management.ex` - Funding source creation
- `dwolla/capabilities/recipient_management.ex` - Customer/recipient creation
- `dwolla/client.ex` - HTTP client with observability
- `webhooks/webhook_handler.ex` - Transfer webhook processing
- `reactors/reimbursement_payment_reactor.ex` - Payment orchestration
- `reactors/payout/submit_payout_batch_reactor.ex` - Batch submission
- `resources/partner_recipient/partner_recipient.ex` - Employee-Dwolla linkage
- `user_profile_edit_live.ex` - Employee bank account UI
- `employee_integration.ex` - Employee payment info lookup

---

*Session concluded 2026-01-06*

