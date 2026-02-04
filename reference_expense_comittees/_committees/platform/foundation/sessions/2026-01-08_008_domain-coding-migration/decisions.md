# Session 008 Decisions

> **Session**: `2026-01-08_008_domain-coding-migration`

---

## Decision 1: First Domain Tier App Selection

**Decision**: Select `domain_coding` as the first Domain Tier (Tier 3) application.

**Rationale**:
- Most foundational domain library — GL coding is used by all products
- Clean boundaries — coding is a distinct, well-defined capability
- 107 files — substantial but manageable scope
- Clear dependencies on Tier 2 (identity, erp)

**Alternatives Considered**:
- `domain_approvals` — Also foundational but depends on coding (approval policies reference GL codes)
- `domain_audit` — Cross-cutting but less critical for initial product migration
- `domain_bulk` — Generic utility, less domain-specific

**Status**: ✅ Approved

---

## Decision 2: Single Ash Domain

**Decision**: Use single Ash domain `DomainCoding.Coding` for all coding functionality.

**Rationale**:
- Coding is a cohesive bounded context
- All resources relate to GL coding functionality
- Follows pattern established in Tier 2 apps
- Simpler dependency management

**Status**: ✅ Approved

---

## Decision 3: Tier 2 Dependencies

**Decision**: `domain_coding` depends on:
- `core_data` — Shared Repo
- `infra_identity` — Workspace, Entity, User references
- `infra_erp` — ERP sync for GL accounts/dimensions

**Rationale**:
- Core data provides database access
- Identity provides multi-tenancy context
- ERP provides GL account sync (coding values map to ERP dimensions)

**Dependency Direction**: Tier 3 → Tier 2 → Tier 1 (compliant with governance)

**Status**: ✅ Approved

---

## Decision 4: Adapter Stub Strategy

**Decision**: Create adapter stubs for:
- Product-level dependencies (stubs for invoice/expense resources)
- Communications (optional notification delivery)
- Assistants (AI actions for coding suggestions)

**Rationale**:
- Domain tier should not depend on Product tier
- Stubs allow compilation while products are migrated later
- Follows established pattern from Tier 2 migrations

**Status**: ✅ Approved
