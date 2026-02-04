# Dwolla Implementation Guide

> **Location**: `adapters/providers/dwolla/`  
> **API**: REST (HAL+JSON)  
> **Status**: Available

---

## Overview

Dwolla provides ACH payment initiation and customer verification.

---

## Code Structure

```
adapters/providers/dwolla/
├── adapter.ex
├── client.ex
├── auth/
│   └── oauth_handler.ex          # OAuth 2.0
├── capabilities/
│   ├── identity_verification.ex  # KYB/KYC
│   ├── payout_disbursement.ex    # Transfers
│   ├── recipient_management.ex
│   └── funding_source_management.ex
└── mappers/
    ├── customer_mapper.ex
    └── transfer_mapper.ex
```

---

## Authentication

```elixir
# OAuth 2.0 Client Credentials
POST /token
grant_type=client_credentials
Authorization: Basic {base64(client_id:client_secret)}

# Use token
Authorization: Bearer {access_token}
```

---

## Key Operations

### Create Transfer (ACH)
```elixir
POST /transfers
{
  "_links": {
    "source": {"href": "funding_source_url"},
    "destination": {"href": "funding_source_url"}
  },
  "amount": {"value": "100.00", "currency": "USD"}
}
```

### Transfer Status
```
pending → processed → completed
       → cancelled
       → failed (with return code)
```

---

## Webhook Events

| Topic | Meaning |
|-------|---------|
| transfer_created | Transfer initiated |
| transfer_completed | ACH settled |
| transfer_failed | ACH returned |
| customer_verified | KYB complete |
| customer_verification_document_needed | Document required |

---

## KYB Flow

```
1. Create business customer
2. Add controller (required)
3. Add beneficial owners (25%+ ownership)
4. Certify beneficial ownership
5. Await verification (webhooks)
```

---

*"Dwolla: ACH made accessible via API."*
