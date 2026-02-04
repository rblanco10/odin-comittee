# Decisions Log

> **Session**: 2026-01-08_004_infra-payments-migration  
> **Status**: ✅ COMPLETED

---

## Decisions Made

| # | Decision | Rationale | Approved By |
|---|----------|-----------|-------------|
| 1 | **Two Ash domains within infra_payments** | Mirrors infra_identity pattern; Payments domain for money movement, Instruments domain for instrument storage | Human Director + Chair |
| 2 | **infra_payments depends on infra_identity** | Payment resources need Workspace/Entity relationships; tier rules allow this (infra can depend on infra) | Chair |
| 3 | **Reuse adapter stub pattern** | Proven pattern from infra_identity; allows independent compilation | Chair |
| 4 | **Replace Oban.Pro.Worker with standard Oban.Worker** | Oban Pro is a paid feature not in standard deps | Chair |
| 5 | **Disable AshAudit extension temporarily** | Same as infra_identity; can be re-enabled when infra_audit is migrated | Chair |
| 6 | **Add sweet_xml dependency** | Required for WEX Fleet SOAP XML parsing | Chair |

---

## Architecture Decisions

### ADR-006: Two-Domain Payment Infrastructure

**Context**: ember_payments and ember_payment_instruments are separate domains with different responsibilities.

**Decision**: Create two Ash domains within `infra_payments`:
- `InfraPayments.Payments` - Money movement, KYB, cards, transactions, provider adapters
- `InfraPayments.Instruments` - Universal payment instrument storage and tokenization

**Consequences**:
- ✅ Clear separation of concerns
- ✅ Mirrors the logical separation in source code
- ✅ Easier to reason about dependencies
- ⚠️ Cross-domain queries may need explicit domain specification

### ADR-007: Cross-Infrastructure Dependencies

**Context**: Payment resources need to reference Workspace and Entity.

**Decision**: `infra_payments` depends directly on `infra_identity` for Workspace/Entity resources.

**Consequences**:
- ✅ Proper foreign key relationships
- ✅ No need to stub Workspace/Entity
- ✅ Tier rules satisfied (Tier 2 can depend on Tier 2)
- ⚠️ infra_payments cannot be compiled without infra_identity

---

## Files Created

### infra_payments App (~324 files)
- `apps/infra_payments/mix.exs`
- `apps/infra_payments/lib/infra_payments.ex`
- `apps/infra_payments/lib/infra_payments/application.ex`
- `apps/infra_payments/lib/infra_payments/payments.ex` (Ash Domain)
- `apps/infra_payments/lib/infra_payments/instruments.ex` (Ash Domain)
- `apps/infra_payments/lib/infra_payments/adapters/external_stubs.ex`
- Plus 288 migrated files from ember_payments
- Plus 31 migrated files from ember_payment_instruments

### Migration Script
- `scripts/migrate_infra_payments.sh` - Automated migration with module renaming

---

## Module Transformations Applied

| Original Pattern | New Pattern |
|------------------|-------------|
| `FlameTeampayPayables.EmberPayments.*` | `InfraPayments.Payments.*` |
| `FlameTeampayPayables.EmberPaymentInstruments.*` | `InfraPayments.Instruments.*` |
| `FlameTeampayPayables.Repo` | `CoreData.Repo` |
| `FlameTeampayPayables.EmberWorkspaces.Resources.Workspace` | `InfraIdentity.Workspaces.Resources.Workspace.Workspace` |
| `FlameTeampayPayables.EmberWorkspaces.Resources.Entity` | `InfraIdentity.Workspaces.Resources.Entity.Entity` |
| `otp_app: :flame_teampay_payables` | `otp_app: :infra_payments` |

---

## Warnings to Address Later

The following stub dependencies produce warnings but don't block compilation:
- `InfraPayments.Adapters.Reimbursements.*` - Product tier, will remain stub
- `InfraPayments.Adapters.Communications.*` - Until infra_communications is migrated
- `InfraPayments.Conduit.*` - Service layer stubs

---

## Provider Support Verified

All provider adapters compiled successfully:
- ✅ Stripe
- ✅ Dwolla
- ✅ Checkbook
- ✅ Marqeta
- ✅ Persona
- ✅ Adyen
- ✅ WEX Fleet (SOAP)

---

*Session 004 concluded successfully with 324 files migrated and compiling.*
