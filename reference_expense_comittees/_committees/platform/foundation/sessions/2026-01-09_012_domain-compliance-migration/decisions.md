# Decisions

> **Session ID**: 2026-01-09_012_domain-compliance-migration  
> **Date**: 2026-01-09

---

## Decisions Made

### D-001: domain_compliance Tier Classification

**Decision**: `domain_compliance` is classified as **Tier 3 (Domain)**.

**Rationale**: 
- Provides shared business logic (compliance/KYB processing) used by multiple products
- Has database tables (inference jobs, review queue items, sessions)
- Does not depend on specific product implementations

**Approved By**: Dr. Marcus Blackwell (Chair), Dr. Sarah Lin (Domain Expert)

---

### D-002: Combined Domain Structure

**Decision**: Combine `ember_compliance` and `ember_compliance_review` into single app with two Ash domains:
- `DomainCompliance.Inference` — Data extraction, confidence scoring
- `DomainCompliance.Review` — Queue management, ML insights, sessions

**Rationale**: 
- Both modules are closely related (compliance/KYB workflow)
- Follows pattern of infra_identity with multiple domains
- Simplifies deployment and configuration
- Reduces inter-app communication overhead

**Approved By**: Dr. Sarah Lin (Domain Expert), Full Committee

---

### D-003: domain_compliance Dependencies

**Decision**: `domain_compliance` depends on:
- `core_data` (Tier 1) — Shared database access via CoreData.Repo
- `infra_identity` (Tier 2) — Workspace/Entity context for multi-tenancy

**Rationale**: 
- Follows downward dependency rule
- Compliance data needs workspace context from infra_identity
- Uses shared repository from core_data

**Approved By**: Full Committee

---

### D-004: Adapter Pattern for External Dependencies

**Decision**: Use adapter pattern for:
- PubSub (DomainCompliance.Adapters.PubSub)
- Observability (DomainCompliance.Adapters.Observability)
- ERP Integration (DomainCompliance.Adapters.Erp) — For data extraction
- Identity/HRIS (DomainCompliance.Adapters.Identity) — For employee data

**Rationale**:
- Allows domain_compliance to compile independently
- Product/Web tiers can configure actual implementations
- Follows established pattern from domain_coding, domain_audit

**Approved By**: Dr. Sarah Lin, Robert Chen

---

### D-005: Module Naming Convention

**Decision**: Use following module structure:
- `DomainCompliance.Inference` — Main Ash domain for inference
- `DomainCompliance.Inference.Resources.*` — Inference resources
- `DomainCompliance.Inference.Services.*` — Inference services
- `DomainCompliance.Review` — Main Ash domain for review
- `DomainCompliance.Review.Resources.*` — Review resources
- `DomainCompliance.Review.Services.*` — Review services

**Approved By**: Dr. Patricia Weston (Standards)

---

## Summary

| ID | Decision | Status |
|----|----------|--------|
| D-001 | domain_compliance is Tier 3 | ✅ Approved |
| D-002 | Combined domain structure (Inference + Review) | ✅ Approved |
| D-003 | Dependencies: core_data, infra_identity | ✅ Approved |
| D-004 | Adapter pattern for external deps | ✅ Approved |
| D-005 | Module naming convention | ✅ Approved |
