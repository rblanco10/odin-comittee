# Session Goal

> **Session**: 2026-01-08_002_tier1-core-scaffold  
> **Opened**: 2026-01-08  
> **Status**: ACTIVE

---

## Objective

Create the Tier 1 Core apps scaffold for the Ember Platform umbrella application.

## Scope

- Create umbrella root at `projects/elixir/ember_platform/`
- Create 4 core tier apps:
  - `core_types` — Money, Currency, shared structs
  - `core_auth` — Policy definitions, roles, permissions (pure)
  - `core_behaviors` — Shared behaviors (Syncable, Auditable, Approvable)
  - `core_telemetry` — Observability utilities (telemetry events, helpers)

## Constraints

1. **Tier 5 (Web) EXCLUDED** — Pending Human Director decision
2. **NO REWRITE** — Migration = structural reorganization only
3. **Preserve ALL functionality** — Existing ember logic must be preserved
4. **Focus on Tier 1 only** — Get this right before proceeding

## Human Director Guidance

> "As we break these embers out into apps, I think we have to figure out what 
> the logical translation is. But the really, really important part is, as we 
> build them out, we need the same functionality that's in the other ones."

---

*Session opened by Dr. Marcus Blackwell, Chair*
