# Session Goal

> **Session**: 2026-01-08_004_infra-payments-migration  
> **Status**: 🔄 IN PROGRESS

---

## Objective

Fully migrate `ember_payments` and `ember_payment_instruments` from `flame_teampay_payables` into the new `infra_payments` Tier 2 infrastructure app within the Ember Platform umbrella.

---

## Scope

### Source Material
| Ember | File Count | Description |
|-------|------------|-------------|
| `ember_payments` | ~290 files | Payment operations, KYB, cards, transactions, provider adapters |
| `ember_payment_instruments` | ~33 files | Universal payment instrument storage and tokenization |

### Target Structure
```
apps/infra_payments/
├── lib/
│   ├── infra_payments.ex
│   ├── infra_payments/
│   │   ├── application.ex
│   │   ├── payments.ex              # Ash Domain: Payments
│   │   ├── instruments.ex           # Ash Domain: Instruments
│   │   ├── payments/                # All payments resources, services, adapters
│   │   ├── instruments/             # All instruments resources, services
│   │   └── adapters/                # Stubs for external dependencies
│   └── mix.exs
└── test/
```

---

## Success Criteria

1. ✅ `infra_payments` app created with proper umbrella structure
2. ✅ All ~323 source files migrated with updated module names
3. ✅ Two Ash domains configured (Payments, Instruments)
4. ✅ Adapter stubs for external dependencies (like infra_identity)
5. ✅ Integration with `core_data` (shared Repo)
6. ✅ Integration with `infra_identity` where needed
7. ✅ **APP COMPILES SUCCESSFULLY**

---

## Constraints

- **No rewrites**: Structural reorganization only
- **Preserve all functionality**: Every capability must be migrated
- **Follow patterns from infra_identity**: Adapter stubs, domain structure
- **Tier 2 compliance**: May have database and external APIs

---

## Key Decisions Needed

1. Module naming convention: `InfraPayments.Payments.*` vs `InfraPayments.*`
2. Provider adapter organization
3. Which external dependencies to stub vs. integrate
4. Handling of `infra_identity` integration points

---

*Migration is structural reorganization, NOT a rewrite.*
