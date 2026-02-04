# Session Transcript

> **Session**: 2026-01-08_002_tier1-core-scaffold  
> **Status**: ACTIVE

---

## Session Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 2026-01-08_002_tier1-core-scaffold: Tier 1 Core Apps Scaffold.*

**Today's Goal**: Create the Tier 1 Core apps scaffold with proper structure for later migration of existing functionality.

**Human Director Constraint**: This is NOT a rewrite. All existing functionality must be preserved. We are reorganizing, not rebuilding.

**Activated Members**:
- Dr. Catherine Wells, Core Tier Specialist
- Dr. Amanda Foster, Elixir/OTP Expert
- Helena Andersen, Vice Chair (Umbrella Architecture)
- Emily Chen, Recording Clerk
- Dr. Reginald Thornbury, Critic (Traditional Architecture)

---

## Research Phase

### David Okonkwo — Research Clerk

*This is David Okonkwo, Research Clerk. I am researching the existing flame_teampay_payables codebase to identify what functionality maps to Tier 1 Core.*

**Findings from existing codebase:**

The `flame_teampay_payables` application contains 40+ embers with ~2,797 files. For Tier 1 Core (pure Elixir, no DB, no external APIs), the following have been identified:

**Potential core_types candidates:**
- `FlameTeampayPayables.MoneyHelpers` — Pure money handling utilities
- Various `Types` modules scattered across embers (70+ type definitions found)

**Potential core_behaviors candidates:**
- `FlameTeampayPayables.Observability.Behaviours.DomainLoggingBehaviour` — Behaviour definition
- Various `@callback` definitions in webhook handlers, capabilities, etc.

**Potential core_telemetry candidates:**
- `flame_teampay_payables/telemetry/` — Telemetry handlers
- Pure observability helpers (not the Loki/Tempo clients which have external deps)

**Potential core_auth candidates:**
- Pure policy/permission definitions (need to extract from ember_authorization which has DB resources)

---

*Transcript continues...*
