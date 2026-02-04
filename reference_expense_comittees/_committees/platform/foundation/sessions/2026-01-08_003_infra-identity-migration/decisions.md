# Decisions Log

> **Session**: 2026-01-08_003_infra-identity-migration  
> **Status**: ✅ COMPLETED

---

## Decisions Made

| # | Decision | Rationale | Approved By |
|---|----------|-----------|-------------|
| 1 | **Create `core_data` app for shared Repo** | Single connection pool across all apps; enables cross-app transactions; clear Tier 1 dependency | Human Director + Chair |
| 2 | **Move Vault to `core_data`** | Encryption is a shared concern; keeps sensitive data handling centralized | Chair |
| 3 | **Maintain three Ash domains within `infra_identity`** | Preserves logical separation (Identity, Workspaces, Authorization) while resolving circular dependencies | Dr. William Chang (Ash Expert) |
| 4 | **Create adapter stubs for external dependencies** | Allows compilation without tight coupling to legacy flame_teampay_payables; clear TODO markers for future migration | Professor Okonkwo (Critic) + Chair |
| 5 | **Disable AshAudit extension temporarily** | Full AshAudit DSL is complex; can be re-enabled when infra_audit is migrated | Chair |
| 6 | **Replace Oban.Pro.Worker with standard Oban.Worker** | Oban Pro is a paid feature not included in standard deps; standard Worker sufficient for cleanup jobs | Felix Martinez (Dependencies Expert) |

---

## Architecture Decisions

### ADR-004: Shared Repository Pattern

**Context**: In an umbrella, each app can have its own Repo. This creates separate connection pools.

**Decision**: Create a single `core_data` app at Tier 1 that provides `CoreData.Repo`. All higher-tier apps depend on this.

**Consequences**:
- ✅ Single connection pool (efficient)
- ✅ Cross-app transactions work
- ✅ Clear dependency hierarchy
- ⚠️ All apps coupled to core_data

### ADR-005: External Dependency Adapters

**Context**: `infra_identity` has dependencies on many other embers (Workforce, Audit, Communications, etc.)

**Decision**: Create stub adapter modules in `InfraIdentity.Adapters.*` that define the interfaces but with no-op implementations.

**Consequences**:
- ✅ Allows independent compilation
- ✅ Clear interface boundaries
- ✅ Easy to replace with real implementations
- ⚠️ Some functionality is stubbed (audit logging, communications)

---

## Files Created

### core_data App
- `apps/core_data/mix.exs`
- `apps/core_data/lib/core_data.ex`
- `apps/core_data/lib/core_data/repo.ex`
- `apps/core_data/lib/core_data/vault.ex`
- `apps/core_data/lib/core_data/application.ex`

### infra_identity App
- `apps/infra_identity/mix.exs`
- `apps/infra_identity/lib/infra_identity.ex`
- `apps/infra_identity/lib/infra_identity/application.ex`
- `apps/infra_identity/lib/infra_identity/identity.ex` (Ash Domain)
- `apps/infra_identity/lib/infra_identity/workspaces.ex` (Ash Domain)
- `apps/infra_identity/lib/infra_identity/authorization.ex` (Ash Domain)
- `apps/infra_identity/lib/infra_identity/adapters/external_stubs.ex`
- Plus 173+ migrated files from ember_identity, ember_workspaces, ember_authorization

---

## Warnings to Address Later

The following optional dependencies produce warnings but don't block compilation:
- `Wax` - WebAuthn/FIDO2 support
- `Assent` - OAuth provider strategies

Add these dependencies when those features are needed.
