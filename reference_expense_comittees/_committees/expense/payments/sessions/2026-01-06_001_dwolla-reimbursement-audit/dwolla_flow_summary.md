# Dwolla Integration Flow Summary

> **Generated:** 2026-01-06  
> **Session:** 2026-01-06_001_dwolla-reimbursement-audit  
> **Status:** Audit Complete

---

## Overview

This document provides a comprehensive flow summary of the Dwolla integration within `ember_payments`, covering all major operations from employee onboarding to payment completion.

---

## Flow Summary Table

### 1. Employee Recipient Onboarding Flow

| Step | Action | Component | Location | Status |
|------|--------|-----------|----------|--------|
| 1.1 | Employee opens profile | `UserProfileEditLive` | `live/expense_v2/user_profile_edit_live.ex` | ✅ Exists |
| 1.2 | Employee clicks "Add Bank Account" | UI Event Handler | `handle_event("show_bank_options", ...)` | ✅ Exists |
| 1.3 | Employee enters bank details | Manual Entry Form | `handle_event("save_manual_bank", ...)` | ✅ Exists |
| 1.4 | **OR** Employee connects via Plaid | Plaid Link | `handle_event("launch_plaid", ...)` | ⚠️ Demo only |
| 1.5 | Store bank info locally | `UserProfile` resource | `ember_identity/resources/user_profile.ex` | ✅ Exists |
| 1.6 | Create Dwolla Customer | `RecipientManagement.create_recipient/3` | `dwolla/capabilities/recipient_management.ex` | ✅ Exists |
| 1.7 | Add Funding Source to Customer | `FundingSourceManagement.add_ach_funding_source/3` | `dwolla/capabilities/funding_source_management.ex` | ✅ Exists |
| 1.8 | Create `PartnerRecipient` record | Ash Resource | `ember_funding/resources/partner_recipient/` | ✅ Exists |
| 1.9 | **Orchestrator to connect 1.5→1.8** | `EmployeeRecipientOrchestrator` | — | ❌ **MISSING (GAP-006)** |
| 1.10 | Handle micro-deposit verification | Webhook: `funding-source.verified` | — | ⚠️ Partial |

---

### 2. Business Funding Source Setup Flow

| Step | Action | Component | Location | Status |
|------|--------|-----------|----------|--------|
| 2.1 | Admin opens Funding Setup | `FundingLive` | `live/expense_v2/setup/funding_live.ex` | ✅ Exists |
| 2.2 | Admin connects bank via Plaid | Plaid Link Integration | `handle_event("plaid_success", ...)` | ✅ Exists |
| 2.3 | Exchange Plaid token | `OpenBankingConnection` | `ember_open_banking/resources/` | ✅ Exists |
| 2.4 | Create `FundingBankAccount` | Ash Resource | `ember_funding/resources/funding_bank_account.ex` | ✅ Exists |
| 2.5 | Create funding source in Dwolla | `PartnerFundingOrchestrator` | `ember_funding/services/partner_funding_orchestrator.ex` | ✅ Exists |
| 2.6 | Create `PartnerFundingSource` record | Ash Resource | `ember_funding/resources/partner_funding_source/` | ✅ Exists |

---

### 3. Reimbursement Payment Initiation Flow

| Step | Action | Component | Location | Status |
|------|--------|-----------|----------|--------|
| 3.1 | Finance admin clicks "Pay" | `ReimbursementsLive` | `live/expense_v2/reimbursements_live.ex` | ✅ Exists |
| 3.2 | Check employee has bank account | `EmployeeIntegration.get_employee_payment_info/2` | `integrations/workforce/employee_integration.ex` | ✅ Exists |
| 3.3 | Display payment modal | UI Component | `render_payment_modal/1` | ✅ Exists |
| 3.4 | Submit payment | `handle_event("confirm_payment", ...)` | `reimbursements_live.ex` | ✅ Exists |
| 3.5 | Execute `ReimbursementPaymentReactor` | Ash Reactor | `reactors/reimbursement_payment_reactor.ex` | ✅ Exists |

---

### 4. ReimbursementPaymentReactor Steps

| Step | Action | Component | Status |
|------|--------|-----------|--------|
| 4.1 | Load reimbursement request | `load_reimbursement_request` | ✅ Exists |
| 4.2 | Get employee info | `get_employee_info` | ✅ Exists |
| 4.3 | Validate employee has bank | `validate_employee_bank_account` | ✅ Exists |
| 4.4 | Get payment connection | `get_payment_connection` | ✅ Exists |
| 4.5 | Prepare payment params | `prepare_payment_params` | ✅ Exists |
| 4.6 | Call payment layer | `call_payment_layer` → `SubmitPayoutBatchReactor` | ✅ Exists |
| 4.7 | Create payment record | `create_payment_record` → `ReimbursementPayment` | ✅ Exists |
| 4.8 | Update request status | `update_request_status` → `:payment_processing` | ✅ Exists |
| 4.9 | Link to budgets | `link_to_budgets` (note: does NOT settle) | ✅ Exists |
| 4.10 | Send notifications | `send_notifications` | ✅ Exists |
| 4.11 | Compensation on failure | Rollback logic | ✅ Exists |

---

### 5. SubmitPayoutBatchReactor Steps

| Step | Action | Component | Status |
|------|--------|-----------|--------|
| 5.1 | Get credentials | `CredentialResolver.resolve/4` | ✅ Exists |
| 5.2 | Build recipient funding sources | `build_recipient_funding_sources/4` | ✅ Exists |
| 5.3 | Generate correlation ID | `payout_batch_{uuid}` | ✅ Exists |
| 5.4 | Call Dwolla API | `PayoutDisbursement.create_payout_batch/3` | ✅ Exists |
| 5.5 | Create `PayoutBatch` record | Ash Resource | ✅ Exists |
| 5.6 | Create `PayoutItem` records | Ash Resource (with `external_reference`) | ✅ Exists |
| 5.7 | Compensation on failure | Rollback logic | ✅ Exists |

---

### 6. Dwolla API Call Flow

| Step | Action | Component | Status |
|------|--------|-----------|--------|
| 6.1 | Build transfer request | `TransferMapper.map_payout_params_to_dwolla/3` | ✅ Exists |
| 6.2 | Execute HTTP request | `Client.post/3` | ✅ Exists |
| 6.3 | Start observability span | `TracingHelpers.with_span/3` | ✅ Exists |
| 6.4 | Emit telemetry | `TelemetryHelpers.with_telemetry/3` | ✅ Exists |
| 6.5 | Log request | `LoggingHelpers.log_request/6` | ✅ Exists |
| 6.6 | Handle response | Parse HAL+JSON | ✅ Exists |
| 6.7 | Log response/error | `LoggingHelpers.log_response/6` | ✅ Exists |
| 6.8 | Return result | `{:ok, transfer_result}` | ✅ Exists |

---

### 7. Webhook Reception Flow

| Step | Action | Component | Location | Status |
|------|--------|-----------|----------|--------|
| 7.1 | Receive webhook | `WebhookController` | `controllers/webhook_controller.ex` | ✅ Exists |
| 7.2 | Validate signature | HMAC verification | Controller | ✅ Exists |
| 7.3 | Route to handler | `DwollaWebhookHandler` | `webhooks/webhook_handler.ex` | ✅ Exists |
| 7.4 | Parse topic | Extract `topic` from payload | Handler | ✅ Exists |
| 7.5 | Find payment record | `find_payment_by_transfer_id/1` | Handler | ✅ Exists |
| 7.6 | Update payment status | `update_payment_status/3` | Handler | ✅ Exists |
| 7.7 | Trigger notifications | `trigger_ach_*_notification/2` | Handler | ✅ Exists |
| 7.8 | **Settle budget** | `settle_budget_on_payment_completion/1` | — | ❌ **MISSING (GAP-002)** |
| 7.9 | **Emit metrics** | Prometheus counters | — | ❌ **MISSING (GAP-003)** |
| 7.10 | **Create trace span** | Tempo span | — | ❌ **MISSING (GAP-003)** |
| 7.11 | **Retry on failure** | Oban job | — | ❌ **MISSING (GAP-004)** |

---

### 8. Webhook Topic → Status Mapping

| Dwolla Topic | Internal Status | Notification Triggered |
|--------------|-----------------|------------------------|
| `transfer_created` | `:processing` | `ach_debit_initiated` |
| `transfer_completed` | `:completed` | `ach_credit_settled` |
| `transfer_failed` | `:failed` | `ach_payment_failed` |
| `transfer_cancelled` | `:cancelled` | `ach_payment_failed` |

---

### 9. Missed Webhook Recovery Flow

| Step | Action | Component | Location | Status |
|------|--------|-----------|----------|--------|
| 9.1 | Scheduled job runs | `DwollaTransferSyncWorker` | — | ❌ **MISSING (GAP-001)** |
| 9.2 | Find stuck payments | Query `:processing` > 30 min | — | ❌ **MISSING** |
| 9.3 | Call Dwolla API | `GET /transfers/{id}` | `DwollaSyncService` | ✅ Exists |
| 9.4 | Compare states | `get_sync_status/1` | `services/dwolla_sync_service.ex` | ✅ Exists |
| 9.5 | Update if out of sync | Transition to `:completed`/`:failed` | — | ❌ **MISSING** |
| 9.6 | Settle budget | Call budget service | — | ❌ **MISSING** |
| 9.7 | Trigger missed notifications | Notification service | — | ❌ **MISSING** |

---

### 10. Budget Lifecycle Flow

| Step | Action | Component | Current Status |
|------|--------|-----------|----------------|
| 10.1 | Approval creates budget | `BudgetTransaction` with `:committed` | ✅ Works |
| 10.2 | Payment initiated | Budget stays `:committed` | ✅ Works |
| 10.3 | Webhook: `transfer_completed` | Budget should → `:actual` | ❌ **NOT IMPLEMENTED** |
| 10.4 | Webhook: `transfer_failed` | Budget should → `:cancelled` | ❌ **NOT IMPLEMENTED** |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DWOLLA REIMBURSEMENT DATA FLOW                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │     EMPLOYEE     │                                                       │
│  │  Bank Onboarding │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │   UserProfile    │───▶│ ❌ MISSING LINK  │───▶│ PartnerRecipient │      │
│  │  (local store)   │    │  (orchestrator)  │    │ (Dwolla linkage) │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│                                                           │                 │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                           │                 │
│  ┌──────────────────┐                                     │                 │
│  │  FINANCE ADMIN   │                                     │                 │
│  │   Clicks "Pay"   │                                     │                 │
│  └────────┬─────────┘                                     │                 │
│           │                                               │                 │
│           ▼                                               ▼                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │ Reimbursement    │───▶│ SubmitPayout     │───▶│  Dwolla API      │      │
│  │ PaymentReactor   │    │ BatchReactor     │    │ POST /transfers  │      │
│  └──────────────────┘    └──────────────────┘    └────────┬─────────┘      │
│           │                       │                       │                 │
│           ▼                       ▼                       │                 │
│  ┌──────────────────┐    ┌──────────────────┐             │                 │
│  │ Reimbursement    │    │   PayoutBatch    │             │                 │
│  │ Payment (DB)     │    │   PayoutItem     │             │                 │
│  │ status=processing│    │ external_ref=xyz │◀────────────┘                 │
│  └──────────────────┘    └──────────────────┘                               │
│                                   ▲                                         │
│  ════════════════════════════════════════════════════════════════════════  │
│                                   │                                         │
│  ┌──────────────────┐    ┌────────┴─────────┐    ┌──────────────────┐      │
│  │  DWOLLA WEBHOOK  │───▶│  WebhookHandler  │───▶│ Update Payment   │      │
│  │ transfer_complete│    │ (find by ref)    │    │ status=completed │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
│                          ┌──────────────────┐                               │
│                          │  ❌ MISSING:     │                               │
│                          │  • Budget settle │                               │
│                          │  • Observability │                               │
│                          │  • Retry logic   │                               │
│                          └──────────────────┘                               │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  ❌ MISSING:     │───▶│ DwollaSyncSvc    │───▶│ Update if stale  │      │
│  │ TransferSync     │    │ (check Dwolla)   │    │ (recover missed) │      │
│  │ Worker           │    │                  │    │                  │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

| Category | File | Purpose |
|----------|------|---------|
| **Adapter** | `dwolla/adapter.ex` | Main adapter entry point |
| **Capabilities** | `dwolla/capabilities/payout_disbursement.ex` | ACH transfer creation |
| | `dwolla/capabilities/recipient_management.ex` | Customer/recipient CRUD |
| | `dwolla/capabilities/funding_source_management.ex` | Bank account management |
| **Client** | `dwolla/client.ex` | HTTP client with observability |
| **Mappers** | `dwolla/mappers/transfer_mapper.ex` | Request/response mapping |
| | `dwolla/mappers/recipient_mapper.ex` | Customer mapping |
| | `dwolla/mappers/funding_source_mapper.ex` | Funding source mapping |
| **Reactors** | `reactors/reimbursement_payment_reactor.ex` | Payment orchestration |
| | `reactors/payout/submit_payout_batch_reactor.ex` | Batch submission |
| **Webhooks** | `webhooks/webhook_handler.ex` | Transfer event processing |
| **Services** | `services/dwolla_sync_service.ex` | Status sync checking |
| **Resources** | `resources/partner_recipient/partner_recipient.ex` | Employee-Dwolla linkage |
| **UI** | `live/expense_v2/reimbursements_live.ex` | Payment UI |
| | `live/expense_v2/user_profile_edit_live.ex` | Bank account UI |

---

## Gap Summary

| Gap ID | Flow Affected | Impact | Priority |
|--------|---------------|--------|----------|
| GAP-006 | Employee Onboarding (1.9) | No production bank setup | 🔴 P0 |
| GAP-001 | Recovery (9.1-9.7) | Stuck payments on missed webhooks | 🔴 P1 |
| GAP-002 | Webhook (7.8) | Budgets never settle to `:actual` | 🔴 P1 |
| GAP-003 | Webhook (7.9-7.10) | No webhook monitoring | 🔴 P1 |
| GAP-004 | Webhook (7.11) | Lost webhooks on transient failures | 🟡 P2 |
| GAP-005 | Batch Status | Can't poll batch without webhooks | 🟢 P3 |

---

*Generated by Ember Payments Committee — 2026-01-06*

