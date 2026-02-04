# Session Transcript

> **Session ID**: 2026-01-09_011_domain-bulk-migration  
> **Date**: 2026-01-09

---

## Session Opening

### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. Opening session 011: Domain Bulk Migration.*

**Today's Goal**: Migrate `domain_bulk` — bulk operations, import/export, and streaming — to the Ember Platform umbrella, ensuring it compiles successfully.

---

## Research Phase

### David Okonkwo — Research Clerk

*I am David Okonkwo, Research Clerk, and I am researching the `ember_bulk_operations` source code structure.*

**Findings**:
- Source: `flame_teampay_payables/lib/flame_teampay_payables/ember_bulk_operations/`
- **38 .ex files** to migrate
- Single Ash domain with 6 resources
- Full observability stack (Tempo, Prometheus, Loki)
- Parsers: CSV, Excel, JSON
- Exporters: CSV, Excel, JSON, PackBundler
- Workers: ImportWorker, ExportWorker
- Strategies: Background, Streaming, Synchronous

**Dependencies identified**:
- `FlameTeampayPayables.Repo` → `CoreData.Repo`
- `FlameTeampayPayables.EmberWorkspaces` → `InfraIdentity.Workspaces`
- `FlameTeampayPayables.EmberIdentity` → `InfraIdentity.Identity`
- `FlameTeampayPayables.Observability` → Adapter pattern

---

## Architecture Decision

### Dr. Sarah Lin — Domain Tier Expert

*I am Dr. Sarah Lin, Domain Tier Expert. I confirm `domain_bulk` is correctly classified as Tier 3.*

**Rationale**:
1. Provides shared business logic (bulk import/export)
2. Used by multiple products (Expense, AR, AP)
3. Has database tables (ExportJob, ImportJob, etc.)
4. Depends on Tier 1 (core_data) and Tier 2 (infra_identity)
5. Does NOT depend on any product-tier modules

**Dependency Graph**:
```
domain_bulk (Tier 3)
    ├── core_data (Tier 1)
    └── infra_identity (Tier 2)
```

**Handoff**: → Andrew Martinez to design migration script.

---

## Migration Execution

### Andrew Martinez — Domain Specialist (Bulk Operations)

*I am Andrew Martinez, Domain Specialist for Bulk Operations. I am executing the migration.*

**Approach**:
1. Create `domain_bulk` app scaffold
2. Create migration script with sed transformations
3. Run migration script
4. Create adapter stubs for external dependencies
5. Update umbrella configuration
6. Compile and fix any remaining issues

---
