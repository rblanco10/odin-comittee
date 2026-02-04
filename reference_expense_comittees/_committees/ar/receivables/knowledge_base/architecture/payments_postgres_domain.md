# Payments Domain (PostgreSQL)

> **Module**: `FlamePsAr.Payments`  
> **Location**: `lib/flame_ps_ar/payments/`  
> **Database**: PostgreSQL  
> **Tenant**: `workspace_id` (UUID)  
> **Last Verified**: 2026-01-14

---

## Overview

The PostgreSQL-backed Payments domain provides global autopay configuration and Oban workers for payment processing.

**⚠️ IMPORTANT**: This domain is **SEPARATE** from `FlamePsAr.Classic.Payments` (MySQL).

---

## Architecture Distinction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TWO PAYMENT DOMAINS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  FlamePsAr.Classic.Payments     │  │  FlamePsAr.Payments             │  │
│  │  (MySQL)                        │  │  (PostgreSQL)                   │  │
│  │                                 │  │                                 │  │
│  │  - Autopay records              │  │  - AutopayConfiguration         │  │
│  │  - Payer funds                  │  │  - Global settings per workspace │  │
│  │  - Transactions                 │  │  - Oban workers                 │  │
│  │  - Banking resources            │  │                                 │  │
│  │  - Card resources               │  │                                 │  │
│  │                                 │  │                                 │  │
│  │  Tenant: owner_id (KSUID)       │  │  Tenant: workspace_id (UUID)    │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| `AutopayConfiguration` | `resources/autopay_configuration.ex` | Global autopay settings per workspace |

---

## Manual Actions

| Action | Location | Purpose |
|--------|----------|---------|
| `ExecuteAutopayBatch` | `manual_actions/execute_autopay_batch.ex` | Batch autopay execution |

---

## Workers

This domain contains Oban workers for payment processing (see `workers/` directory).

---

## Relationship to Classic.Payments

| Aspect | Classic.Payments | Payments (PostgreSQL) |
|--------|------------------|----------------------|
| Database | MySQL | PostgreSQL |
| Tenant | `owner_id` (KSUID) | `workspace_id` (UUID) |
| Scope | Individual autopay records | Global configuration |
| Resources | 61+ (Autopay, Payment, Banking, Cards) | 1 (AutopayConfiguration) |
| Purpose | Transaction records | Configuration + Workers |

---

## Constitutional Considerations

- **Database Separation**: Configuration lives in PostgreSQL, transactions in MySQL
- **Tenant Context**: Uses `workspace_id` not `owner_id`
- **Worker Coordination**: Oban workers coordinate with Classic.Payments resources

---

## Code References

```
lib/flame_ps_ar/payments/
├── payments.ex                      # Ash domain definition
├── resources/
│   └── autopay_configuration.ex     # Global autopay config
├── manual_actions/
│   └── execute_autopay_batch.ex     # Batch execution
└── workers/                         # Oban workers
```

---

*"Configuration orchestrates; transactions execute."*
