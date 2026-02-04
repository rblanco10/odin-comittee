# Session Decisions

> **Session**: 2026-01-08_002_tier1-core-scaffold  
> **Status**: CLOSED  
> **Outcome**: Pivoted from Tier 1 to Tier 2 architecture planning

---

## Ratified Decisions

### DEC-002-001: Umbrella Scaffold Created

**Status**: ✅ COMPLETED (but superseded)

**Decision**: Created umbrella scaffold with 4 core tier apps.

**Note**: This was completed but later superseded by DEC-002-003.

---

### DEC-002-002: Core Tier Apps Are Premature

**Status**: ✅ APPROVED

**Decision**: The 4-app Core tier structure (core_types, core_auth, core_behaviors, core_telemetry) is premature.

**Rationale**:
- Existing codebase has minimal pure code suitable for Core tier
- `MoneyHelpers` is unused (196 lines)
- `core_auth` would have almost no content — ember_authorization is mostly DB-backed
- `core_behaviors` would require creating NEW code, not migrating
- `core_telemetry` is thin — most observability code has external dependencies

**Action**: Delete core tier apps before next session. Focus on Tier 2.

**Approved By**: Human Director

---

### DEC-002-003: Tier 2 Infrastructure Architecture

**Status**: ✅ APPROVED

**Decision**: Tier 2 Infrastructure will have 5 apps, with identity/workspaces/authorization COMBINED into one app.

**Architecture**:

| App | Source Embers | Files | Dependencies |
|-----|---------------|-------|--------------|
| **infra_identity** | ember_identity + ember_workspaces + ember_authorization | 171 | None (foundation) |
| **infra_payments** | ember_payments | 290 | infra_identity |
| **infra_erp** | ember_erp | 481 | infra_identity |
| **infra_communications** | ember_communications | 95 | infra_identity |
| **infra_documents** | ember_document_intake | 100 | infra_identity |

**Rationale for combining identity/workspaces/authorization**:
- Circular dependencies exist between these three embers
- ember_identity depends on ember_workspaces AND ember_authorization
- ember_workspaces depends on ember_identity AND ember_authorization
- ember_authorization depends on ember_identity AND ember_workspaces
- Separation would require code refactoring (violates "no rewrite" constraint)

**Rationale for keeping payments/erp/etc separate**:
- ONE-WAY dependencies only (no circularity)
- payments → identity cluster: 38 refs (clean)
- erp → identity cluster: 8 refs (clean)
- identity cluster → payments/erp: 2 refs (easily fixable)

**Approved By**: Human Director

---

### DEC-002-004: Web Tier Deferred

**Status**: ⏸️ DEFERRED

**Decision**: Tier 5 Web apps (web_internal, web_portal) remain deferred pending Human Director decision on structure.

---

## Superseded Decisions

| Original | Superseded By | Reason |
|----------|---------------|--------|
| 4 separate Core tier apps | DEC-002-002 | Premature, insufficient content |
| Separate infra_workspaces, infra_authorization | DEC-002-003 | Circular dependencies |

---

## Decision Log

| ID | Date | Decision | Status |
|----|------|----------|--------|
| DEC-002-001 | 2026-01-08 | Umbrella scaffold created | ✅ Superseded |
| DEC-002-002 | 2026-01-08 | Core tier is premature | ✅ Approved |
| DEC-002-003 | 2026-01-08 | Tier 2 architecture (5 apps) | ✅ Approved |
| DEC-002-004 | 2026-01-08 | Web tier deferred | ⏸️ Deferred |

---

*Session closed by Dr. Marcus Blackwell, Chair*
