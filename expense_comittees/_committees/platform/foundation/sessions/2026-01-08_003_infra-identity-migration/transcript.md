# Session Transcript

> **Session**: 2026-01-08_003_infra-identity-migration  
> **Started**: 2026-01-08  
> **Status**: IN PROGRESS

---

## Session Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 003: infra-identity-migration.*

**Today's Goal**: Fully migrate ember_identity, ember_workspaces, and ember_authorization into a single `infra_identity` application within the Ember Platform umbrella. This is a complete migration, not a scaffold.

**Human Director Mandate**: *"Migrate it over. Get it to fully work. Get the code to compile, dependencies, et cetera."*

---

## Initial Research Findings

### Source Code Location
The source code is located in `campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/`:
- `ember_identity/` — 137+ files (authentication, sessions, MFA, OAuth, WebAuthn)
- `ember_workspaces/` — 158+ files (multi-tenancy, workspaces, entities, SSO, SCIM)
- `ember_authorization/` — 48+ files (roles, permissions, policy checks)

### Existing Platform State
The umbrella at `projects/elixir/ember_platform/` has premature `core_*` apps that should be deleted.

### Known Blockers
Prior analysis identified cross-reference problems with stale `EmberCore.*` references.

---

## Activated Members

| Role | Member | Responsibility |
|------|--------|----------------|
| Chair | Dr. Marcus Blackwell | Session orchestration |
| Vice Chair | Helena Andersen | Umbrella app integration |
| Infrastructure Expert | Robert Chen | Tier 2 structure, service design |
| Elixir/OTP Expert | Dr. Amanda Foster | Module organization, supervision |
| Ash Expert | Dr. William Chang | Ash domains, resources |
| Dependencies Expert | Felix Martinez | Mix dependencies |
| Migration Expert | Carlos Rivera | Migration patterns |
| Integration Expert | Sarah Lindqvist | Cross-reference resolution |
| Critic | Professor Miranda Okonkwo | Complexity concerns |
| Critic | Dr. Priya Sharma | Testing implications |
| Recording Clerk | Emily Chen | Documentation |
| Research Clerk | David Okonkwo | Code investigation |

---

## Deliberation

*(Session in progress...)*
