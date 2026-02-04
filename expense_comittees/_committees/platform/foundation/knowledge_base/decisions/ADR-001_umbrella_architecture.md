# ADR-001: Umbrella Application Architecture

> **Status**: APPROVED  
> **Date**: 2026-01-08  
> **Decision Makers**: Human Director, Platform Foundation Committee  
> **Category**: Constitutional

---

## Context

The existing `flame_teampay_payables` codebase is a monolithic Elixir application with 40+ "embers" (domain modules). While functional, this architecture has limitations:

1. **Tight coupling**: Embers can import from any other ember
2. **No deployment granularity**: Everything deploys together
3. **Unclear boundaries**: New developers struggle to understand the architecture
4. **Scaling limitations**: Cannot scale individual components independently

The Human Director commissioned a new **Accounts Receivable** platform and used this as an opportunity to restructure the entire platform.

---

## Decision

We will build the Ember Platform as an **Elixir umbrella application** with a strict **5-tier architecture**.

### The 5 Tiers

| Tier | Prefix | Purpose | Database? | External APIs? |
|------|--------|---------|-----------|----------------|
| 1 | `core_*` | Pure libraries | ❌ | ❌ |
| 2 | `infra_*` | Infrastructure services | ✅ | ✅ |
| 3 | `domain_*` | Shared business logic | ✅ | ❌ |
| 4 | `product_*` | Customer-facing products | ✅ | Via infra |
| 5 | `web_*` | Phoenix applications | Via others | ❌ |

### Location

```
ashwood/
└── projects/
    └── elixir/
        └── ember_platform/      # The umbrella
            ├── mix.exs
            ├── config/
            └── apps/            # 21 apps across 5 tiers
```

### Dependency Rules (Constitutional)

1. **Downward Only**: Higher tiers depend on lower, never reverse
2. **No Horizontal Products**: Products cannot depend on products
3. **Core is Pure**: No database or external API in core
4. **Infrastructure is Shared**: Products share infra, don't duplicate

---

## Alternatives Considered

### Alternative 1: Continue Monolithic Structure

**Rejected because**:
- Does not address boundary issues
- AR platform would further complicate existing structure
- No path to independent deployment

### Alternative 2: Microservices (Separate Repos)

**Rejected because**:
- Premature for current team size
- High operational overhead
- Difficult to share types and behaviors
- Refactoring is much harder across repos

### Alternative 3: Umbrella Without Tiers

**Rejected because**:
- No structural guidance for dependency management
- New developers still wouldn't understand boundaries
- Easy to violate architectural principles

---

## Consequences

### Positive

1. **Clear boundaries**: Developers know where code belongs
2. **Independent evolution**: Products can evolve independently
3. **Shared infrastructure**: Payment, ERP, etc. maintained once
4. **Testability**: Each app can be tested in isolation
5. **Future flexibility**: Can extract to services later if needed

### Negative

1. **Migration effort**: Existing code must be migrated
2. **Learning curve**: Team must learn umbrella conventions
3. **Some complexity**: More mix.exs files to maintain
4. **Discipline required**: Rules must be enforced

### Risks

1. **Migration disruption**: Mitigated by careful sequencing
2. **Rule violations**: Mitigated by compile-time enforcement
3. **Over-engineering**: Mitigated by Human Director oversight

---

## Implementation

### Phase 1: Foundation
- Create umbrella structure
- Create core tier apps
- Create infra_workspaces

### Phase 2: Infrastructure Migration
- Migrate ember_payments → infra_payments
- Migrate ember_erp → infra_erp
- Migrate other infrastructure

### Phase 3: Domain Migration
- Migrate ember_coding → domain_coding
- Migrate ember_approvals → domain_approvals
- Create other domain apps

### Phase 4: Product Migration
- Migrate ember_expense → product_expense
- Migrate ember_ap_invoices → product_payables
- Build product_receivables (new)

### Phase 5: Web Layer
- Create web_internal
- Create web_portal

---

## Participants

- **Human Director** — Final approval
- **Dr. Marcus Blackwell** — Chair
- **Helena Andersen** — Umbrella architecture
- **Dr. Catherine Wells** — Core tier design
- **Robert Chen** — Infrastructure tier design
- **All Critics** — Challenge and validation

---

## References

- [Umbrella Structure](../architecture/umbrella_structure.md)
- [Dependency Rules](../architecture/dependency_rules.md)
- [Naming Convention](../architecture/naming_convention.md)

---

*This is a constitutional decision. Changes require Human Director approval.*
