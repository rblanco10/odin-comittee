# Session 008: Domain Coding Migration

> **Session Code**: `2026-01-08_008_domain-coding-migration`  
> **Status**: `IN_PROGRESS`  
> **Started**: 2026-01-08

---

## Goal

Fully migrate **ember_coding** from `flame_teampay_payables` to **`domain_coding`** (Tier 3), following our established script-based migration pattern.

---

## Scope

### Source
```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_coding/
├── bulk_operations/     # Import/export for coding data
├── definitions/         # Core resources: CodingCategory, CodingValue, CodingAssignment
├── domain.ex            # Ash domain definition
├── inference/           # ML-based auto-coding suggestions
├── integrations/        # ERP sync for GL accounts
├── notifications/       # Export/import notifications
├── observability/       # Metrics, logging, tracing
├── reactors/            # Workflow reactors
├── rules/               # Full rules engine
└── services/            # Query and utility services
```

### Target
```
projects/elixir/ember_platform/apps/domain_coding/
├── lib/domain_coding/
│   ├── coding/           # All coding functionality
│   ├── adapters/         # Stubs for external dependencies
│   ├── application.ex
│   └── coding.ex         # Public API
├── mix.exs
└── test/
```

---

## Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| `core_data` | Tier 1 | Shared Repo |
| `infra_identity` | Tier 2 | Workspace, Entity, User references |
| `infra_erp` | Tier 2 | ERP sync (GL accounts, dimensions) |

---

## Success Criteria

1. ✅ All 107 files migrated with proper module renaming
2. ✅ Application compiles without errors
3. ✅ Proper integration with Tier 2 infra apps
4. ✅ Adapter stubs for any external dependencies
5. ✅ Updated umbrella configuration

---

## Activated Members

- **Dr. Marcus Blackwell** — Chair (orchestrating)
- **Dr. Sarah Lin** — Domain Tier Expert
- **Robert Chen** — Infrastructure Tier Expert (for integration)
- **Dr. Robert Fitzgerald** — Coding Domain Expert
- **Emily Chen** — Recording Clerk

---

## Key Decisions to Make

1. Single Ash domain vs. multiple domains?
2. How to handle ERP integration dependency?
3. Adapter strategy for product-level stubs?
