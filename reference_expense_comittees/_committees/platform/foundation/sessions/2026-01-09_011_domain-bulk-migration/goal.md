# Session Goal

> **Session ID**: 2026-01-09_011_domain-bulk-migration  
> **Date**: 2026-01-09  
> **Status**: IN_PROGRESS

---

## Objective

Migrate `ember_bulk_operations` from `flame_teampay_payables` to `domain_bulk` (Tier 3) in the Ember Platform umbrella.

## Scope

### Source
```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_bulk_operations/
├── capabilities/
│   └── bulk_processable.ex
├── config.ex
├── domain.ex
├── exporters/
│   ├── csv_exporter.ex
│   ├── excel_exporter.ex
│   ├── json_exporter.ex
│   └── pack_bundler.ex
├── observability/
│   └── services/ (12 files)
├── parsers/
│   ├── csv_parser.ex
│   ├── excel_parser.ex
│   └── json_parser.ex
├── queries/
│   ├── audit_evidence_export_query.ex
│   └── client_billing_export_query.ex
├── resources/
│   ├── bulk_job_error.ex
│   ├── export_config.ex
│   ├── export_job.ex
│   ├── export_query.ex
│   ├── import_config.ex
│   └── import_job.ex
├── services/
│   ├── error_report_generator.ex
│   ├── export_service.ex
│   ├── import_service.ex
│   ├── progress_tracker.ex
│   └── validator_service.ex
├── storage/
│   └── file_storage.ex
├── strategies/
│   ├── background.ex
│   ├── streaming.ex
│   └── synchronous.ex
├── templates/
│   ├── audit_evidence_report.ex
│   └── client_billing_report.ex
└── workers/
    ├── export_worker.ex
    └── import_worker.ex
```

### Target
```
projects/elixir/ember_platform/apps/domain_bulk/
├── lib/
│   └── domain_bulk/
│       ├── bulk.ex                    # Main Ash domain
│       ├── config.ex
│       ├── adapters/                  # External dependency stubs
│       ├── capabilities/
│       ├── exporters/
│       ├── observability/
│       ├── parsers/
│       ├── queries/
│       ├── resources/
│       ├── services/
│       ├── storage/
│       ├── strategies/
│       ├── templates/
│       └── workers/
└── mix.exs
```

## Dependencies

**Tier Compliance (Downward Only)**:
- `core_data` (Tier 1) — Shared Repo
- `infra_identity` (Tier 2) — Workspace/Entity references

## Module Transformations

| Original | Target |
|----------|--------|
| `FlameTeampayPayables.EmberBulkOperations` | `DomainBulk.Bulk` |
| `FlameTeampayPayables.EmberBulkOperations.Resources.*` | `DomainBulk.Bulk.Resources.*` |
| `FlameTeampayPayables.EmberBulkOperations.Services.*` | `DomainBulk.Bulk.Services.*` |
| `FlameTeampayPayables.EmberBulkOperations.Workers.*` | `DomainBulk.Workers.*` |
| `FlameTeampayPayables.EmberBulkOperations.Exporters.*` | `DomainBulk.Bulk.Exporters.*` |
| `FlameTeampayPayables.EmberBulkOperations.Parsers.*` | `DomainBulk.Bulk.Parsers.*` |
| `FlameTeampayPayables.EmberBulkOperations.Observability.*` | `DomainBulk.Bulk.Observability.*` |
| `FlameTeampayPayables.Repo` | `CoreData.Repo` |
| `FlameTeampayPayables.EmberWorkspaces.*` | `InfraIdentity.Workspaces.*` |
| `FlameTeampayPayables.EmberIdentity.*` | `InfraIdentity.Identity.*` |

## Success Criteria

1. ✅ All ~38 source files migrated
2. ✅ Module names properly transformed
3. ✅ Dependencies correctly wired to umbrella apps
4. ✅ `mix compile` succeeds in domain_bulk
5. ✅ `mix compile` succeeds at umbrella root

## Activated Members

- **Chair**: Dr. Marcus Blackwell
- **Domain Specialist**: Andrew Martinez (Bulk Operations)
- **Tier Expert**: Dr. Sarah Lin (Domain Tier)
- **Research Clerk**: David Okonkwo
- **Recording Clerk**: Emily Chen
