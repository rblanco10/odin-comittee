# Dashboard Implementation Review - Decisions

> **Session**: 2026-01-20_006_dashboard-implementation-review  
> **Date**: 2026-01-20

---

## DEC-021: Fix Critical Query Errors

**Proposed by**: Emily Watson (Loki Query Master)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Decision**: Fix all critical query errors identified in the review:
1. Fix rate function misuse in "Error Rate by Domain" panel
2. Fix Tempo datasource UID reference
3. Verify log format and adjust JSON parsing queries accordingly

**Rationale**: Critical errors prevent dashboards from functioning correctly.

**Status**: ✅ Approved

---

## DEC-022: Fix High-Priority Issues

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Emily Watson (Loki Query Master)

**Decision**: Fix high-priority issues:
1. Correct Tempo query syntax for table panel
2. Fix unwrap ordering in latency queries
3. Add ERP webhooks to overall webhook health calculation

**Rationale**: These issues affect data accuracy and completeness.

**Status**: ✅ Approved

---

## DEC-023: Address JSON Parsing Assumptions

**Proposed by**: Elena Vasquez (Complexity Auditor)  
**Seconded by**: Emily Watson (Loki Query Master)

**Decision**: 
1. Verify actual log format in Loki
2. If logs are JSON: keep current queries
3. If logs are not JSON: create label-based queries or add label extraction
4. Document log format assumptions in dashboard descriptions

**Rationale**: Queries must match actual log structure to work correctly.

**Status**: ✅ Approved

---

## DEC-024: Simplify Redundant Patterns (Deferred)

**Proposed by**: Elena Vasquez (Complexity Auditor)

**Decision**: Defer simplification of redundant regex patterns to future optimization pass.

**Rationale**: Patterns work correctly, optimization can be done later without functional impact.

**Status**: ✅ Approved (Deferred)

---

*Decisions recorded by Session Historian*
