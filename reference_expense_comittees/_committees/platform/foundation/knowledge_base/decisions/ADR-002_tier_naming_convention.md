# ADR-002: Tier-Prefixed Naming Convention

> **Status**: APPROVED  
> **Date**: 2026-01-08  
> **Decision Makers**: Human Director, Platform Foundation Committee  
> **Category**: Constitutional

---

## Context

With 21 apps across 5 tiers, developers need to quickly understand which tier an app belongs to. This affects:

- Understanding architectural role
- Knowing what dependencies are allowed
- Onboarding new team members
- Code review for architectural compliance

---

## Decision

All applications in the Ember Platform umbrella **MUST** use a tier-prefixed naming convention.

| Tier | Prefix | Examples |
|------|--------|----------|
| Core | `core_` | `core_types`, `core_auth`, `core_behaviors` |
| Infrastructure | `infra_` | `infra_workspaces`, `infra_payments`, `infra_erp` |
| Domain | `domain_` | `domain_coding`, `domain_approvals`, `domain_audit` |
| Product | `product_` | `product_expense`, `product_payables`, `product_receivables` |
| Web | `web_` | `web_internal`, `web_portal` |

---

## Rationale

### Proposed By

Dr. William Chang (Ash Framework Expert) proposed this convention during the founding session.

### Benefits

1. **Immediate clarity**: Looking at `infra_payments` tells you it's infrastructure
2. **Prevents mistakes**: You won't accidentally make `product_expense` depend on `product_receivables`
3. **Onboarding**: New developers understand the architecture instantly
4. **Refactoring**: Easy to identify what tier something belongs to
5. **Code review**: Dependency violations are obvious

### Human Director Endorsement

The Human Director explicitly approved this convention:

> "I really liked the naming changes proposed by Dr. William Chang."

---

## Alternatives Considered

### Alternative 1: No Prefix

```
apps/
├── types/
├── payments/
├── receivables/
```

**Rejected because**:
- Unclear which tier an app belongs to
- Easy to accidentally violate dependencies
- Requires external documentation

### Alternative 2: Numeric Prefix

```
apps/
├── t1_types/
├── t2_payments/
├── t4_receivables/
```

**Rejected because**:
- Not human-readable
- Requires remembering tier numbers
- Less meaningful in code

### Alternative 3: Suffix Instead of Prefix

```
apps/
├── types_core/
├── payments_infra/
├── receivables_product/
```

**Rejected because**:
- Harder to visually scan in listings
- Prefixes are more natural for sorting

### Alternative 4: Verbose Prefix

```
apps/
├── tier_1_core_types/
├── tier_2_infra_payments/
```

**Rejected because**:
- Too long for practical use
- Clutters import statements

---

## Consequences

### Positive

1. Architecture is self-documenting
2. IDE autocomplete shows tiers naturally
3. File system listings group by tier
4. Dependency rules are visually apparent

### Negative

1. Longer app names than unprefixed
2. Module names slightly longer

### Neutral

1. Team must learn the convention (one-time)
2. Renaming during migration

---

## Enforcement

1. **New apps**: Must use correct prefix or creation is rejected
2. **Dependencies**: Compile-time validation checks prefix relationships
3. **Code review**: PRs checked for convention compliance
4. **Committee review**: Tier Specialists approve new apps

---

## Participants

- **Dr. William Chang** — Original proposal
- **Human Director** — Approval
- **Margaret O'Neill** — Folder structure refinement
- **Dr. Marcus Blackwell** — Committee approval

---

## References

- [Naming Convention](../architecture/naming_convention.md)
- [Umbrella Structure](../architecture/umbrella_structure.md)
- [ADR-001: Umbrella Architecture](ADR-001_umbrella_architecture.md)

---

*This is a constitutional decision. Changes require Human Director approval.*
