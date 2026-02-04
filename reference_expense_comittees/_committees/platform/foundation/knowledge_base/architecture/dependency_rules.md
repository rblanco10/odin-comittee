# Dependency Rules

> **Type**: Architecture Reference (Constitutional)  
> **Decision**: ADR-001 (Constitutional Rules)  
> **Status**: APPROVED (2026-01-08)

---

## Overview

The Ember Platform enforces strict dependency rules to maintain architectural integrity. These rules are **constitutional** — they cannot be violated without explicit Human Director override.

---

## The Four Rules

### Rule 1: Downward Only

**Higher tiers may depend on lower tiers, never the reverse.**

```
TIER 5 (web_)     → TIER 4 (product_) ✅
TIER 4 (product_) → TIER 3 (domain_)  ✅
TIER 3 (domain_)  → TIER 2 (infra_)   ✅
TIER 2 (infra_)   → TIER 1 (core_)    ✅

TIER 1 (core_)    → TIER 2 (infra_)   ❌ FORBIDDEN
TIER 2 (infra_)   → TIER 3 (domain_)  ❌ FORBIDDEN
```

**Example:**
```elixir
# apps/product_receivables/mix.exs

defp deps do
  [
    # ✅ ALLOWED: Product depends on Domain
    {:domain_coding, in_umbrella: true},
    
    # ✅ ALLOWED: Product depends on Infrastructure
    {:infra_payments, in_umbrella: true},
    
    # ✅ ALLOWED: Product depends on Core
    {:core_types, in_umbrella: true},
  ]
end
```

---

### Rule 2: No Horizontal Product Dependencies

**`product_*` apps may NOT depend on other `product_*` apps.**

```
product_expense → product_receivables ❌ FORBIDDEN
product_receivables → product_payables ❌ FORBIDDEN
```

**Rationale**: Products must be independently deployable and evolvable. Cross-product features go in `domain_*` apps.

**If products need to share logic**:
```elixir
# ❌ WRONG: Product imports product
defp deps do
  [{:product_payables, in_umbrella: true}]  # Forbidden!
end

# ✅ RIGHT: Both products depend on shared domain
# apps/product_receivables/mix.exs
defp deps do
  [{:domain_coding, in_umbrella: true}]  # Shared logic here
end

# apps/product_payables/mix.exs
defp deps do
  [{:domain_coding, in_umbrella: true}]  # Both use it
end
```

---

### Rule 3: Core is Pure

**`core_*` apps may NOT have database or external API dependencies.**

```
core_types     → Ecto          ❌ FORBIDDEN
core_auth      → HTTPoison     ❌ FORBIDDEN
core_behaviors → AshPostgres   ❌ FORBIDDEN
```

**Allowed dependencies for Core**:
- Standard library
- Pure Elixir libraries (e.g., `decimal`, `jason`)
- Telemetry (for `core_telemetry`)
- Type libraries

**Rationale**: Core is the foundation. It must be stable, testable without external services, and have zero side effects.

---

### Rule 4: Infrastructure is Shared

**Multiple products MUST share `infra_*` services, not duplicate them.**

```
# ✅ CORRECT: Shared infrastructure
product_receivables → infra_payments (for collecting payments)
product_payables    → infra_payments (for disbursing payments)

# ❌ WRONG: Duplicated infrastructure
product_receivables contains its own Stripe integration
product_payables contains its own Stripe integration
```

**Rationale**: Infrastructure should be maintained once. Provider changes, security updates, and capability additions happen in one place.

---

## Visual Dependency Map

```
                         ┌──────────────┐
                         │ web_internal │
                         └──────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐   ┌────────────────┐   ┌─────────────────┐
│ product_expense │   │product_payables│   │product_receivables│
└────────┬────────┘   └───────┬────────┘   └────────┬────────┘
         │                    │                     │
         │     ╔══════════════╧══════════════╗      │
         │     ║   NO HORIZONTAL ARROWS!     ║      │
         │     ╚══════════════╤══════════════╝      │
         │                    │                     │
         └────────────┬───────┴───────┬─────────────┘
                      │               │
          ┌───────────┴───┐     ┌─────┴────────┐
          ▼               ▼     ▼              ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │domain_coding│  │domain_approvals│  │domain_audit│
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │infra_workspaces│ │infra_payments│ │infra_erp│
   └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
          │                │                 │
          └────────────────┼─────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌───────────┐    ┌───────────┐    ┌──────────────┐
   │core_types │    │core_auth  │    │core_behaviors│
   └───────────┘    └───────────┘    └──────────────┘
```

---

## Enforcement

### Compile-Time Enforcement

The umbrella's `mix.exs` should enforce dependencies:

```elixir
# config/mix_helpers.ex
defmodule MixHelpers do
  def validate_dependencies(app_name, deps) do
    tier = tier_from_prefix(app_name)
    
    Enum.each(deps, fn {dep, _opts} ->
      dep_tier = tier_from_prefix(dep)
      
      if dep_tier > tier do
        raise "Forbidden: #{app_name} (tier #{tier}) cannot depend on #{dep} (tier #{dep_tier})"
      end
      
      if tier == 4 and dep_tier == 4 and dep != app_name do
        raise "Forbidden: Product #{app_name} cannot depend on product #{dep}"
      end
    end)
  end
end
```

### Code Review Enforcement

All PRs adding dependencies must be reviewed for compliance.

### Architectural Review

The Platform Foundation Committee reviews and approves new dependencies quarterly.

---

## Exception Process

If a situation genuinely requires violating a dependency rule:

1. **Document the necessity** in detail
2. **Present to full committee** with all Tier Specialists
3. **Invite Critics** to challenge
4. **Chair presents to Human Director** with committee recommendation
5. **Human Director may approve** with documented rationale
6. **Exception is recorded** in `knowledge_base/exceptions/`

---

## Common Questions

### Q: What if two products need to share a feature?

A: Create a `domain_*` app for the shared logic. Both products depend on it.

### Q: What if domain logic needs payment capabilities?

A: Domain calls infra_payments through well-defined interfaces. The dependency is downward.

### Q: What about circular dependencies?

A: They're impossible if you follow the rules. If you think you need one, you've misclassified something.

---

## Related Documentation

- [Umbrella Structure](umbrella_structure.md)
- [Naming Convention](naming_convention.md)
- [ADR-001: Umbrella Architecture](../decisions/ADR-001_umbrella_architecture.md)

---

*These rules are constitutional. Violation requires Human Director override.*

*Last updated: 2026-01-08*
