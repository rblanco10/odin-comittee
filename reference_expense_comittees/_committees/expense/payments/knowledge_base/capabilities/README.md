# Capability Documentation

This directory contains detailed documentation for each capability in the EmberPayments domain.

## What is a Capability?

A **Capability** is an abstract interface that defines a specific category of payment operations. Each capability is implemented by one or more payment providers through adapter modules.

## Capability Behaviors Location

All capability behaviors are defined in:
```
lib/flame_teampay_payables/ember_payments/capabilities/
├── account_management/
│   ├── behavior.ex
│   └── types.ex
├── card_issuance/
│   ├── behavior.ex
│   └── types.ex
├── funding_source_management/
│   ├── behavior.ex
│   └── types.ex
├── fx_conversion/
│   ├── behavior.ex
│   └── types.ex
├── identity_verification/
│   ├── behavior.ex
│   └── types.ex
├── payment_collection/
│   ├── behavior.ex
│   └── types.ex
├── payment_initiation/
│   ├── behavior.ex
│   └── types.ex
├── payout_disbursement/
│   ├── behavior.ex
│   └── types.ex
└── recipient_management/
    ├── behavior.ex
    └── types.ex
```

## Available Capabilities

| Capability | Description | Primary Use Cases |
|------------|-------------|-------------------|
| **Payment Initiation** | Push payments to recipients | Vendor payments, reimbursements |
| **Payment Collection** | Pull payments from payers | Invoices, subscriptions |
| **Payout Disbursement** | Bulk payment batches | Payroll, mass payouts |
| **Card Issuance** | Virtual/physical card management | Expense cards, fleet cards |
| **Identity Verification** | KYB/KYC verification | Onboarding, compliance |
| **Account Management** | Provider account operations | Balance checks, statements |
| **Funding Source Management** | Bank account linking | ACH setup, verification |
| **Recipient Management** | Payee data management | Recipient directory |
| **FX Conversion** | Currency exchange | International payments |

## Provider Support Matrix

| Capability | Checkbook | Dwolla | Marqeta | WEX |
|------------|-----------|--------|---------|-----|
| Payment Initiation | ✓ | ✓ | - | - |
| Payment Collection | ✓ | ✓ | - | - |
| Payout Disbursement | ✓ | ✓ | - | - |
| Card Issuance | - | - | ✓ | ✓ |
| Identity Verification | - | ✓ | ✓ | - |
| Account Management | ✓ | ✓ | ✓ | ✓ |
| Funding Source Management | ✓ | ✓ | - | - |
| Recipient Management | ✓ | ✓ | - | - |
| FX Conversion | - | - | - | - |

## Capability Pattern Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  (Services, Resources, LiveViews)                                │
└─────────────────────────┬────────────────────────────────────────┘
                          │ calls
┌─────────────────────────▼────────────────────────────────────────┐
│                    CapabilityRouter                              │
│  - Selects best provider for capability                          │
│  - Considers: cost, speed, availability, workspace preferences   │
└─────────────────────────┬────────────────────────────────────────┘
                          │ routes to
┌─────────────────────────▼────────────────────────────────────────┐
│                    Capability Behavior                           │
│  - Defines interface contract (@callback)                        │
│  - Defines types for params/results                              │
└─────────────────────────┬────────────────────────────────────────┘
                          │ implemented by
┌─────────────────────────▼────────────────────────────────────────┐
│                    Provider Adapters                             │
│  - Implements behavior callbacks                                 │
│  - Translates to/from provider API format                        │
│  - Handles provider-specific logic                               │
└──────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

1. **Behavior-Based Abstraction**: Each capability defines `@callback` specs that adapters must implement
2. **Type Safety**: Associated `Types` modules define typespecs for all parameters and results
3. **Provider Agnostic**: Business code calls capabilities, not provider-specific methods
4. **Capability Discovery**: Use `get_capabilities/1` to introspect provider support
5. **Webhook Consistency**: Each capability includes `validate_webhook/3` and `parse_webhook_event/2`

## Related Documentation

- [Adapter Pattern](../architecture/adapter_pattern.md)
- [Capability Pattern](../architecture/capability_pattern.md)
- [Provider Guides](../providers/)
