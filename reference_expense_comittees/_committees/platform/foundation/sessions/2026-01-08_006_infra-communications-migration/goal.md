# Session Goal

> **Session**: 2026-01-08_006_infra-communications-migration  
> **Type**: Infrastructure Migration  
> **Chair**: Dr. Marcus Blackwell

---

## Objective

Fully migrate `ember_communications` from `flame_teampay_payables` to `infra_communications` in the Ember Platform umbrella. This is a **complete migration** (not scaffolding), following the same pattern as:
- Session 003: infra_identity (343+ files)
- Session 004: infra_payments (324 files)
- Session 005: infra_erp (485 files)

---

## Success Criteria

1. **Compiles**: `mix compile` succeeds for `infra_communications`
2. **Complete**: All communications functionality migrated:
   - 9 Ash resources
   - 4 provider adapters (Email, InApp, Slack, Teams)
   - Services, reactors, capabilities, observability
3. **Integrated**: Proper dependencies on `core_data`, `infra_identity`
4. **Clean**: Stubs in sister apps (`infra_identity`, `infra_payments`, `infra_erp`) updated to reference real `infra_communications` modules

---

## Scope

### In Scope
- All `ember_communications` resources and domain logic
- Provider adapters (Email, InApp, Slack, Teams)
- Services (template rendering, channel selection, preference resolution)
- Capabilities (channel messaging, transactional messaging, push notifications)
- Reactors (deliver_message, prepare_delivery)
- Observability (metrics, logging, tracing)
- Cache modules
- Workers
- Updating stubs in other infra apps

### Out of Scope
- Web layer components (LiveView pages)
- Domain-specific notification definitions (those stay in their domains)
- Product-tier integrations

---

## Dependencies

### Will Depend On
- `core_data` (Repo, Vault) - Tier 1
- `infra_identity` (Workspace, Entity, User) - Tier 2

### Will Be Depended On By
- `infra_identity` (invitation emails)
- `infra_payments` (payment notifications, 3DS OTP)
- `infra_erp` (sync notifications)
- Future domain and product tier apps

---

## Architecture Decision

**Single Ash Domain**: `InfraCommunications.Communications`

This follows the same pattern as:
- `InfraIdentity` (3 domains: Identity, Workspaces, Authorization)
- `InfraPayments` (2 domains: Payments, Instruments)
- `InfraErp` (1 domain: Erp)

---

*Session goal established by Dr. Marcus Blackwell, Chair.*
