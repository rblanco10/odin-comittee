# Critical Fixes Implementation Plan - Decisions

> **Session**: 2026-01-20_007_critical-fixes-implementation-plan  
> **Date**: 2026-01-20

---

## DEC-025: Implementation Plan Structure

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Dr. Alexandra Chen (Chief Orchestrator)

**Decision**: Organize implementation plan into 5 phases:
1. Verification & Discovery
2. Critical Fixes
3. High-Priority Fixes
4. Testing & Validation
5. Documentation

**Rationale**: Systematic approach ensures nothing is missed and changes are verified before proceeding.

**Status**: ✅ Approved

---

## DEC-026: Tempo Datasource UID Strategy

**Proposed by**: Sarah Mitchell (Dashboard Provisioning Engineer)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Decision**: Add explicit `uid: tempo` to Tempo datasource configuration in `datasources.yml` rather than using Grafana auto-generated UID.

**Rationale**: 
- Ensures consistency across environments
- Makes UID predictable and maintainable
- Prevents issues when Grafana regenerates UIDs

**Status**: ✅ Approved

---

## DEC-027: Rate Function Query Fix

**Proposed by**: Emily Watson (Loki Query Master)  
**Seconded by**: Maria Santos (Dashboard Performance Optimizer)

**Decision**: Use fixed range `[5m]` for rate queries (Option 1) rather than time-range aware calculation.

**Rationale**:
- More efficient (better caching)
- Standard practice for real-time monitoring
- Simpler and more maintainable
- Time-range awareness not critical for this use case

**Status**: ✅ Approved

---

## DEC-028: JSON Parsing Strategy

**Proposed by**: Emily Watson (Loki Query Master)  
**Seconded by**: Elena Vasquez (Complexity Auditor)

**Decision**: 
1. Verify actual log format first (Phase 1, Step 1.1)
2. Choose query approach based on verification:
   - If JSON: Keep `| json`, add documentation
   - If Labels: Remove `| json`, use label selectors
   - If Text: Use regex extraction or label enrichment
3. Do not implement hybrid approach unless absolutely necessary

**Rationale**: 
- Avoids unnecessary complexity
- Ensures queries match actual log structure
- Prevents silent failures

**Status**: ✅ Approved

---

## DEC-029: Tempo Panel Type

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Emily Watson (Loki Query Master)

**Decision**: Change Tempo panel type from "table" to "traces" (Option 1) for better trace visualization.

**Rationale**:
- Traces panel type is designed for trace visualization
- Better user experience
- More appropriate for the use case

**Status**: ✅ Approved

---

## DEC-030: Unwrap Ordering Fix

**Proposed by**: Emily Watson (Loki Query Master)  
**Seconded by**: Carlos Mendez (PromQL Wizard)

**Decision**: Fix unwrap ordering in all latency queries: unwrap first, then filter.

**Correct Order:**
```logql
| json | unwrap duration_ms | duration_ms > 0
```

**Rationale**: Unwrap converts to numeric type, then filtering works correctly.

**Status**: ✅ Approved

---

## DEC-031: ERP Webhook Inclusion

**Proposed by**: Emily Watson (Loki Query Master)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Decision**: Add ERP webhooks to "Overall Webhook Health" calculation to include all webhook types.

**Rationale**: Dashboard title says "all providers" but query was incomplete. This makes it accurate.

**Status**: ✅ Approved

---

## DEC-032: Testing Strategy

**Proposed by**: Carlos Mendez (PromQL Wizard)  
**Seconded by**: Maria Santos (Dashboard Performance Optimizer)

**Decision**: Implement 3-level testing:
1. Individual query testing in Explore
2. Dashboard panel testing
3. Integration testing

**Rationale**: Ensures fixes work at all levels before considering complete.

**Status**: ✅ Approved

---

*Decisions recorded by Session Historian*
