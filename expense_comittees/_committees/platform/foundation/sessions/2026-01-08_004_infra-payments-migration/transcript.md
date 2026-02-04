# Session Transcript

> **Session**: 2026-01-08_004_infra-payments-migration  
> **Started**: 2026-01-08  
> **Status**: 🔄 IN PROGRESS

---

## Session Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 004: infra-payments-migration*

**Today's Goal**: Fully migrate `ember_payments` (~290 files) and `ember_payment_instruments` (~33 files) into `infra_payments` Tier 2 app.

**Activated Members**:
- Chair: Dr. Marcus Blackwell
- Vice Chair: Helena Andersen (Integration)
- Infrastructure Tier Expert: Robert Chen
- Ash Framework Expert: Dr. William Chang
- Payments Infrastructure Specialist: Thomas Müller
- Critics: Professor Miranda Okonkwo (Complexity), Dr. Priya Sharma (Testing)
- Research Clerk: David Okonkwo
- Recording Clerk: Emily Chen

**Context**: This follows our successful `infra_identity` migration (Session 003) where we migrated 343+ files. We will apply the same patterns:
- Shared Repo from `core_data`
- Adapter stubs for external dependencies
- Multiple Ash domains within a single app

---

## Research Phase

### David Okonkwo — Research Clerk

*I am David Okonkwo, Research Clerk, and I am researching the source embers.*

**Source Analysis**:

#### ember_payments (~290 files)
- **Domain**: Money movement, identity verification, card operations
- **Resources**: 27 Ash resources across Config, Connection, Identity, Transaction, Card, Payout, Account, Webhook, Testing, Reconciliation
- **Adapters**: 7 provider implementations (Stripe, Dwolla, Checkbook, Marqeta, Persona, Adyen, WEX Fleet)
- **Capabilities**: 18 abstract capability behaviors
- **Services**: 33 business logic services
- **Reactors**: 21 multi-step workflows
- **Workers**: 4 background job workers

#### ember_payment_instruments (~33 files)
- **Domain**: Universal payment instrument storage
- **Resources**: 5 Ash resources (Instrument, InstrumentToken, InstrumentOwnership, InstrumentVerification, InstrumentUsage)
- **Types**: 4 type modules (pure enums)
- **Services**: 3 services
- **Reactors**: 4 workflows

**External Dependencies Identified**:
- `infra_identity` (Workspaces, Entity scoping) - CAN INTEGRATE
- `ember_audit` - Will need stub
- `ember_communications` - Will need stub  
- `ember_erp` - Will need stub
- `ember_expense_card` - Will need stub (product tier)
- `ember_workforce` - Will need stub

---

## Committee Deliberation

*(Transcript continues as migration progresses)*
