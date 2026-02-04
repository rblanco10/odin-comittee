# Session Decisions

> **Session**: 2026-01-08_001_inaugural  
> **Status**: ACTIVE

---

## Ratified Decisions

### DEC-2026-01-08-001: Umbrella Application Architecture

**Status**: ✅ APPROVED (Constitutional)

**Decision**: The Ember Platform will be built as an Elixir umbrella application with a strict 5-tier architecture.

**Details**:
- Location: `projects/elixir/ember_platform/`
- Tiers: Core, Infrastructure, Domain, Product, Web
- Apps: 21 initial applications
- Dependency rules are constitutional (inviolable without Human Director override)

**ADR**: `ADR-001_umbrella_architecture.md`

**Approved By**: Human Director

---

### DEC-2026-01-08-002: Tier-Prefixed Naming Convention

**Status**: ✅ APPROVED (Constitutional)

**Decision**: All applications in the umbrella must use tier-prefixed names.

**Convention**:
| Tier | Prefix |
|------|--------|
| Core | `core_*` |
| Infrastructure | `infra_*` |
| Domain | `domain_*` |
| Product | `product_*` |
| Web | `web_*` |

**ADR**: `ADR-002_tier_naming_convention.md`

**Approved By**: Human Director (explicit endorsement)

---

### DEC-2026-01-08-003: Platform Foundation Committee Establishment

**Status**: ✅ APPROVED

**Decision**: Create the Platform Foundation Committee to govern the Ember Platform architecture.

**Structure**:
- 43 members across 9 categories
- 8 subcommittees
- Modeled after Expense Payments Committee

**Location**: `_committees/platform/foundation/`

**Approved By**: Human Director

---

### DEC-2026-01-08-004: Dependency Rules (Constitutional)

**Status**: ✅ APPROVED (Constitutional)

**Decision**: The following dependency rules are constitutional and cannot be violated without Human Director override:

1. **Downward Only**: Higher tiers depend on lower, never reverse
2. **No Horizontal Products**: Products cannot depend on products
3. **Core is Pure**: No database or external APIs in core
4. **Infrastructure is Shared**: Products share infra, don't duplicate

**Enforcement**: Compile-time validation + code review

**Approved By**: Human Director

---

## Pending Decisions

*None at this time*

---

## Deferred Decisions

### DEF-2026-01-08-001: Umbrella Scaffold Creation

**Status**: ⏸️ DEFERRED to next session

**Topic**: Actually create the umbrella folder structure and mix.exs files

**Reason**: Committee establishment was priority for this session

**Next Action**: Schedule dedicated session for scaffold creation

---

### DEF-2026-01-08-002: Migration Sequence

**Status**: ⏸️ DEFERRED to future session

**Topic**: Order and approach for migrating from flame_teampay_payables

**Reason**: Requires Migration Subcommittee analysis

**Next Action**: Convene SC06 Migration for detailed planning

---

### DEF-2026-01-08-003: AR Product Detailed Architecture

**Status**: ⏸️ DEFERRED to future session

**Topic**: Detailed architecture of product_receivables

**Reason**: Requires Product: Receivables Subcommittee work

**Next Action**: Convene SC02 Product: Receivables after infrastructure is in place

---

## Decision Log

| ID | Date | Decision | Status |
|----|------|----------|--------|
| DEC-2026-01-08-001 | 2026-01-08 | Umbrella Architecture | ✅ Approved |
| DEC-2026-01-08-002 | 2026-01-08 | Tier Naming Convention | ✅ Approved |
| DEC-2026-01-08-003 | 2026-01-08 | Committee Establishment | ✅ Approved |
| DEC-2026-01-08-004 | 2026-01-08 | Dependency Rules | ✅ Approved |
| DEF-2026-01-08-001 | 2026-01-08 | Umbrella Scaffold | ⏸️ Deferred |
| DEF-2026-01-08-002 | 2026-01-08 | Migration Sequence | ⏸️ Deferred |
| DEF-2026-01-08-003 | 2026-01-08 | AR Detailed Architecture | ⏸️ Deferred |

---

*All constitutional decisions require Human Director override to modify.*
