# Decisions

> **Session ID**: 2026-01-09_010_domain-audit-migration  
> **Date**: 2026-01-09

---

## Decisions Made

### D-001: domain_audit Tier Classification

**Decision**: `domain_audit` is classified as **Tier 3 (Domain)**.

**Rationale**: 
- Provides shared business logic (audit logging) used by multiple products
- Has database tables (audit_logs, audit_contexts, retention_policies)
- Does not depend on specific product implementations

**Approved By**: Dr. Marcus Blackwell (Chair), Dr. Sarah Lin (Domain Expert)

---

### D-002: domain_audit Dependencies

**Decision**: `domain_audit` depends on:
- `core_data` (Tier 1) — Shared database access via CoreData.Repo
- `infra_identity` (Tier 2) — Workspace/Entity/User context

**Rationale**: 
- Follows downward dependency rule
- Audit logs need workspace/entity context from infra_identity
- Uses shared repository from core_data

**Approved By**: Full Committee

---

### D-003: Adapter Pattern for External Dependencies

**Decision**: Use adapter pattern for:
- PubSub (DomainAudit.Adapters.PubSub)
- Observability (DomainAudit.Adapters.Observability)

**Rationale**:
- Allows domain_audit to compile independently
- Product/Web tiers can configure actual implementations
- Follows established pattern from domain_coding

**Approved By**: Dr. Sarah Lin, Robert Chen

---

### D-004: Single Ash Domain Structure

**Decision**: Use single Ash domain `DomainAudit.Audit` containing:
- AuditLog resource (immutable audit entries)
- AuditContext resource (request/session context)
- RetentionPolicy resource (retention configuration)

**Rationale**:
- All resources are closely related
- Simpler configuration
- Consistent with domain_coding and domain_approvals patterns

**Approved By**: Dr. William Chang (Ash Expert)

---

### D-005: DSL Extension Location

**Decision**: Keep AshAudit extension at `DomainAudit.AshAudit` (root level).

**Rationale**:
- Follows Ash convention for extensions
- Easy to reference in resource definitions
- Consistent with original ember_audit structure

**Approved By**: Dr. William Chang

---

## Summary

| ID | Decision | Status |
|----|----------|--------|
| D-001 | domain_audit is Tier 3 | ✅ Approved |
| D-002 | Dependencies: core_data, infra_identity | ✅ Approved |
| D-003 | Adapter pattern for PubSub/Observability | ✅ Approved |
| D-004 | Single Ash domain structure | ✅ Approved |
| D-005 | AshAudit extension at root level | ✅ Approved |
