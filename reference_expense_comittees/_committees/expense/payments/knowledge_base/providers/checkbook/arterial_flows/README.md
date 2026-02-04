# Checkbook Arterial Flows

> **Provider**: Checkbook.io  
> **Last Updated**: 2026-01-08  
> **Model**: Arterial Flow Documentation  
> **Status**: Production

---

## Overview

This directory contains the **arterial flow documentation** for Checkbook.io integration. The arterial model organizes flows by their core business purpose rather than individual API operations.

---

## What is an "Arterial Flow"?

Arterial flows are the **main highways** of a payment provider integration:

- **Arteries** = Core business processes that must work for the system to function
- **Outcomes** = Different results that can occur within each arterial flow
- **Extensions** = Optional capabilities that enhance the core flows

---

## Checkbook Arterial Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHECKBOOK ARTERIAL MODEL                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  A1: KYB VERIFICATION                                           │   │
│  │  "Who is this business?"                                        │   │
│  │  └── Single API call, instant verification                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  A2: FUNDING SOURCE SETUP                                       │   │
│  │  "Where does the money come from?"                              │   │
│  │  └── Plaid (instant) or Micro-deposits (3-5 days)               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  A3: CHECK CREATION                                             │   │
│  │  "Send someone money"                                           │   │
│  │  ├── Digital checks (email delivery)                            │   │
│  │  └── Physical checks (printed & mailed)                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  A4: CHECK LIFECYCLE                                            │   │
│  │  "What's happening with my check?"                              │   │
│  │  └── Webhook-driven state machine                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  A5: CHECK CANCELLATION                                         │   │
│  │  "Stop that check!"                                             │   │
│  │  └── Void before cashed, release budget                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Document Index

| Document | Description | Prerequisites |
|----------|-------------|---------------|
| [A1_kyb_verification.md](./A1_kyb_verification.md) | Business identity verification | None |
| [A2_funding_source_setup.md](./A2_funding_source_setup.md) | Bank account connection | A1 Complete |
| [A3_check_creation.md](./A3_check_creation.md) | Digital & physical check creation | A1 + A2 Complete |
| [A4_check_lifecycle.md](./A4_check_lifecycle.md) | Webhook-driven status updates | A3 Check Created |
| [A5_check_cancellation.md](./A5_check_cancellation.md) | Voiding checks before deposit | A3 Check Created |

---

## Reading Guide

### For New Developers

1. Start with **A1** to understand how businesses get verified
2. Read **A2** to learn about funding source setup
3. Study **A3** for the main payment creation flow
4. Review **A4** for webhook handling patterns
5. Understand **A5** for cancellation scenarios

### For Debugging

- **Check not being created?** → Check A1 (KYB) and A2 (funding source)
- **Status not updating?** → Check A4 (webhook handling)
- **Payment stuck?** → Check A3 (creation) and A4 (lifecycle)
- **Budget not released?** → Check A5 (cancellation)

### For Testing

Each flow document includes:
- Expected outcomes
- Error scenarios
- Test cases to cover

---

## Key Differences: Checkbook vs Dwolla

| Aspect | Checkbook | Dwolla |
|--------|-----------|--------|
| **Primary Use** | Digital/Physical Checks | ACH Transfers |
| **KYB Flow** | Single API call | Multi-step process |
| **Recipient Onboarding** | Not required | Requires Dwolla customer |
| **Batch API** | ❌ None | ✅ Mass Payments |
| **Webhook Reliability** | Good | Excellent |

---

## Code Locations

```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/
├── ember_payments/
│   ├── adapters/providers/checkbook/
│   │   ├── adapter.ex                           # Main facade
│   │   ├── client.ex                            # HTTP client
│   │   ├── config.ex                            # Configuration
│   │   ├── capabilities/
│   │   │   ├── payout_disbursement.ex           # A3: Check creation
│   │   │   ├── funding_source_management.ex     # A2: Bank accounts
│   │   │   ├── identity_verification.ex         # A1: KYB
│   │   │   └── account_management.ex            # Account operations
│   │   └── mappers/
│   │       ├── payout_mapper.ex                 # Request/response mapping
│   │       └── funding_source_mapper.ex         # Bank account mapping
│   ├── services/
│   │   ├── checkbook_kyb_orchestrator.ex        # A1: KYB orchestration
│   │   ├── checkbook_sync_service.ex            # Status synchronization
│   │   └── checkbook_reconciliation_service.ex  # Reconciliation
│   ├── webhooks/
│   │   └── webhook_handler.ex                   # A4: CheckbookWebhookHandler
│   └── workers/
│       └── checkbook_status_polling_worker.ex   # Status polling
```

---

## Quick Reference

### API Endpoints

| Flow | Endpoint | Method |
|------|----------|--------|
| A1: KYB | `/v3/user` | PUT |
| A2: Add Bank | `/v3/account/bank` | POST |
| A2: Verify Bank | `/v3/account/bank/verify` | POST |
| A3: Digital Check | `/v3/check/digital` | POST |
| A3: Physical Check | `/v3/check/physical` | POST |
| A4: Get Status | `/v3/check/{id}` | GET |
| A5: Cancel | `/v3/check/{id}` | DELETE |

### Status Mapping

| Checkbook Status | Internal Status | Meaning |
|------------------|-----------------|---------|
| UNPAID | :pending | Check created, not cashed |
| IN_PROCESS | :processing | Being processed |
| PRINTED | :processing | Physical check printed |
| MAILED | :mailed | Physical check in mail |
| PAID | :completed | Successfully cashed |
| VOID | :voided | Cancelled by issuer |
| EXPIRED | :expired | Uncashed too long |
| FAILED | :failed | Error occurred |

---

*"Checkbook: digital checks at API speed."*

