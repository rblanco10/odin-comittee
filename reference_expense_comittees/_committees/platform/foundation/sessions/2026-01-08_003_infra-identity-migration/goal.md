# Session Goal

> **Session**: 2026-01-08_003_infra-identity-migration  
> **Type**: Full Migration  
> **Priority**: Critical Path

---

## Objective

**Fully migrate `infra_identity`** — combining ember_identity, ember_workspaces, and ember_authorization into a single, compiling, functional infrastructure application within the Ember Platform umbrella.

This is NOT a scaffold. This is a complete migration.

---

## Success Criteria

1. **All code migrated**: Every file from ember_identity, ember_workspaces, and ember_authorization consolidated into `infra_identity`
2. **Compiles cleanly**: `mix compile` succeeds with no errors
3. **Dependencies resolved**: All inter-module references updated to new namespace
4. **Mix.exs complete**: All required dependencies declared
5. **Tests pass** (or at minimum, compile)
6. **Documentation updated**: Module references point to new locations

---

## Source Analysis

### ember_identity (137+ files)
- Location: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_identity/`
- Domain: Authentication, sessions, MFA, OAuth, WebAuthn
- Key dependencies: Ash, AshPostgres, Joken, Swoosh

### ember_workspaces (158+ files)
- Location: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_workspaces/`
- Domain: Multi-tenancy, workspaces, entities, memberships, SSO, SCIM
- Key dependencies: Ash, AshPostgres, AshCloak

### ember_authorization (48+ files)
- Location: `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_authorization/`
- Domain: Roles, permissions, policy checks, data scoping
- Key dependencies: Ash

---

## Known Blockers (from prior analysis)

### Cross-Reference Problem
Previous migration analysis identified 13+ files with stale `EmberCore.*` references that need updating.

### Circular Dependencies
identity ↔ workspaces ↔ authorization have circular dependencies — this is WHY they must be combined into a single app.

---

## Deliverables

1. `projects/elixir/ember_platform/apps/infra_identity/` — Complete application
2. Updated umbrella `mix.exs` if needed
3. Session `decisions.md` documenting architectural choices
4. Session `action_items.md` for follow-up work

---

## Human Director Mandate

> *"Migrate it over. Get it to fully work. Get the code to compile, dependencies, et cetera."*

This is the authoritative direction. The committee will accomplish this.
