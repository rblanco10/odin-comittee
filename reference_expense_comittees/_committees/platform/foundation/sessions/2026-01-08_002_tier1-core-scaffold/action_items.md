# Action Items

> **Session**: 2026-01-08_002_tier1-core-scaffold  
> **Status**: CLOSED

---

## For Next Session

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| AI-003-001 | Delete core tier apps | 🔴 High | Remove projects/elixir/ember_platform/apps/core_* |
| AI-003-002 | Create infra_identity scaffold | 🔴 High | Combined: identity + workspaces + authorization |
| AI-003-003 | Fix setup_progress_service dependency | 🟡 Medium | Move to higher tier or use callback pattern |
| AI-003-004 | Create infra_payments scaffold | 🟡 Medium | After infra_identity |
| AI-003-005 | Create infra_erp scaffold | 🟡 Medium | After infra_identity |
| AI-003-006 | Update TRANSLATION_MAP.md | 🟡 Medium | Reflect new Tier 2 structure |

---

## Completed This Session

| ID | Item | Status |
|----|------|--------|
| AI-002-001 | Create umbrella scaffold | ✅ Complete |
| AI-002-002 | Create core_types app | ✅ Complete (to be deleted) |
| AI-002-003 | Create core_auth app | ✅ Complete (to be deleted) |
| AI-002-004 | Create core_behaviors app | ✅ Complete (to be deleted) |
| AI-002-005 | Create core_telemetry app | ✅ Complete (to be deleted) |
| AI-002-006 | Document translation map | ✅ Complete (needs update) |
| AI-002-007 | Investigate circular dependencies | ✅ Complete |
| AI-002-008 | Validate Tier 2 architecture | ✅ Complete |

---

## Key Findings to Preserve

### Circular Dependency Analysis

**Identity cluster has internal circular dependencies:**
```
ember_identity ←→ ember_workspaces ←→ ember_authorization
```

**Payments and ERP are clean:**
```
ember_payments → identity cluster (ONE-WAY, 38 refs)
ember_erp → identity cluster (ONE-WAY, 8 refs)
identity cluster → payments/erp (2 refs, easily fixable)
```

### File Counts for Migration Planning

| Ember | Files | Target App |
|-------|-------|------------|
| ember_identity | 66 | infra_identity |
| ember_workspaces | 68 | infra_identity |
| ember_authorization | 37 | infra_identity |
| ember_payments | 290 | infra_payments |
| ember_erp | 481 | infra_erp |
| ember_communications | 95 | infra_communications |
| ember_document_intake | 100 | infra_documents |

---

## Blockers

*None — architecture validated, ready for implementation*

---

*Last Updated: 2026-01-08*
