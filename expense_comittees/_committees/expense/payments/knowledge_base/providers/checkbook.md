# Checkbook Implementation Guide

> **Location**: `adapters/providers/checkbook/`  
> **API**: REST  
> **Status**: Production

---

## Overview

Checkbook.io provides digital and physical check issuance.

---

## Code Structure

```
adapters/providers/checkbook/
├── adapter.ex                    # Main facade
├── client.ex                     # HTTP client (Req)
├── capabilities/
│   ├── payout_disbursement.ex    # Check creation
│   ├── account_management.ex
│   └── funding_source_management.ex
└── mappers/
    └── check_mapper.ex           # Data transformation
```

---

## Authentication

```elixir
# Headers
Authorization: {api_key}:{api_secret}
Content-Type: application/json

# Environments
Sandbox: https://sandbox.checkbook.io/v3
Production: https://checkbook.io/v3
```

---

## Key Operations

### Create Check
```elixir
POST /v3/check
{
  "recipient": "John Doe",
  "email": "john@example.com",  # Digital
  # OR
  "address": {...},             # Physical
  "amount": 100.00,
  "memo": "Payment"
}
```

### Check Status
```
UNPAID → IN_TRANSIT → PAID
      → VOID
      → EXPIRED
      → RETURNED
```

---

## Webhook Events

| Event | Meaning |
|-------|---------|
| check.created | Check generated |
| check.sent | Email/mail sent |
| check.deposited | Recipient deposited |
| check.paid | Funds cleared |
| check.voided | Cancelled |
| check.returned | Bounced |

---

## Supporting Services

```
services/checkbook_reconciliation_service.ex
services/checkbook_sync_service.ex
workers/checkbook_status_polling_worker.ex
```

---

*"Checkbook: digital checks at API speed."*
