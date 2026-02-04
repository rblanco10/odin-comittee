# Session Decisions

> **Session ID**: 2026-01-09_011_domain-bulk-migration  
> **Date**: 2026-01-09

---

## Decisions Made

### DEC-011-001: Tier Classification

**Decision**: `domain_bulk` is classified as **Tier 3 (Domain)**.

**Rationale**:
- Provides shared business logic for bulk import/export operations
- Used across multiple products (Expense, AR, AP, Treasury)
- Has database tables for job tracking
- Depends only on lower tiers (core_data, infra_identity)

**Status**: ✅ Approved

---

### DEC-011-002: Module Naming Convention

**Decision**: Use `DomainBulk.Bulk` as the main Ash domain module.

**Pattern**:
- App name: `domain_bulk`
- Main domain: `DomainBulk.Bulk`
- Resources: `DomainBulk.Bulk.Resources.*`
- Services: `DomainBulk.Bulk.Services.*`

**Status**: ✅ Approved

---

### DEC-011-003: Dependency Structure

**Decision**: `domain_bulk` depends on:
- `core_data` (Tier 1) — for CoreData.Repo
- `infra_identity` (Tier 2) — for Workspace/Entity references

**Verification**: Dependencies are downward only (Tier 3 → Tier 2 → Tier 1). ✅ Constitutional compliance.

**Status**: ✅ Approved

---

### DEC-011-004: Adapter Pattern for External Dependencies

**Decision**: Create adapter modules for external dependencies:
- `DomainBulk.Adapters.Observability` — for tracing/metrics
- `DomainBulk.Adapters.Storage` — for S3/local file storage
- `DomainBulk.Adapters.PubSub` — for real-time updates

**Rationale**: Follows established pattern from other domain apps.

**Status**: ✅ Approved

---

### DEC-011-005: Product Query Stubs

**Decision**: Use embedded Ash resources as stubs for product-layer query dependencies.

**Rationale**: The `ClientBillingExportQuery` and `AuditEvidenceExportQuery` reference
product-tier resources (ExpenseCardTransaction, ReimbursementRequest). Rather than
removing these useful queries, we stub the resources to allow compilation while
preserving the query logic for when products are migrated.

**Pattern**: `use Ash.Resource, data_layer: :embedded` for stub resources.

**Status**: ✅ Approved

---
