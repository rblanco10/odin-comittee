# Marqeta Implementation Guide

> **Location**: `adapters/providers/marqeta/`  
> **API**: REST  
> **Status**: Development

---

## Overview

Marqeta provides card issuance and transaction processing.

---

## Code Structure

```
adapters/providers/marqeta/
├── adapter.ex
├── client.ex
├── capabilities/
│   ├── card_issuance.ex
│   ├── identity_verification.ex
│   └── ...
└── mappers/
    ├── card_mapper.ex
    ├── user_mapper.ex
    └── transaction_mapper.ex
```

---

## Authentication

```elixir
# Basic Auth
Authorization: Basic {base64(api_key:api_secret)}
Content-Type: application/json
```

---

## Token Model

```
Business Token (optional)
    ↓
User Token (cardholder)
    ↓
Card Token (specific card)
```

---

## Key Operations

### Create User
```elixir
POST /users
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
# Returns: user_token
```

### Create Card
```elixir
POST /cards
{
  "card_product_token": "program_token",
  "user_token": "user_xxx"
}
# Returns: card_token
```

### Card Transitions
```elixir
POST /cards/{token}/transitions
{
  "state": "ACTIVE",
  "channel": "API"
}
```

---

## Webhook Events

| Type | Meaning |
|------|---------|
| card.created | Card generated |
| cardtransition | State changed |
| transaction.authorization | Auth request |
| transaction.clearing | Settlement |

---

*"Marqeta: modern card issuance platform."*
