# Session Goal

> **Session ID**: 2026-01-09_010_domain-audit-migration  
> **Date**: 2026-01-09  
> **Type**: Migration  
> **Status**: IN_PROGRESS

---

## Objective

Migrate `ember_audit` from `flame_teampay_payables` to `domain_audit` in the Ember Platform umbrella (Tier 3: Domain).

## Scope

### Source
```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_audit/
```

### Target
```
projects/elixir/ember_platform/apps/domain_audit/
```

### Files to Migrate
- **43 Elixir source files**
- 3 Ash resources (AuditLog, AuditContext, RetentionPolicy)
- Ash DSL extension (AshAudit)
- Observability services (Tempo, Prometheus, Loki)
- Workers (async writer, export, archival)
- UI components (timeline, filters, details)

## Dependencies

| Dependency | Tier | Purpose |
|------------|------|---------|
| `core_data` | 1 | Shared Repo access |
| `infra_identity` | 2 | Workspace/Entity/User context |

## Success Criteria

1. ✅ All 43 files migrated with correct module namespacing
2. ✅ Application compiles without errors
3. ✅ Proper adapter stubs for external dependencies
4. ✅ Umbrella config updated
5. ✅ Migration script created

## Activated Members

- Dr. Marcus Blackwell (Chair)
- Dr. Sarah Lin (Domain Tier Expert)
- Dr. Lisa Thompson (Audit Lead)
- Carlos Rivera (Migration Historian)
- David Okonkwo (Research Clerk)
- Emily Chen (Recording Clerk)
