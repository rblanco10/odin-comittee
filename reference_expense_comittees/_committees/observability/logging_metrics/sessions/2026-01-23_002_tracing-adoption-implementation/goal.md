# Session Goal

**Session ID**: 2026-01-23_002_tracing-adoption-implementation  
**Type**: Design + Implementation  
**Opened**: 2026-01-23  
**Chair**: Dr. Alexandra Chen

---

## Primary Objective

Create a comprehensive, immediately-executable implementation plan for distributed tracing adoption, then verify traces are flowing correctly from Elixir to Tempo to Grafana.

---

## Success Criteria

- [ ] Complete understanding of current OTel configuration and what's already implemented
- [ ] Fix any gaps in Grafana configuration (Tempo ↔ Loki linking)
- [ ] Verify traces are actually being sent and stored in Tempo
- [ ] Add trace visibility to key dashboards
- [ ] Create verification procedure for immediate testing
- [ ] Address all potential concerns (sampling, performance, cardinality)

---

## Scope

### In Scope
- Tempo ↔ Loki bi-directional linking in Grafana
- Verification that traces are being sent to Tempo
- Dashboard enhancement with trace panels
- Performance and cardinality considerations
- Verification procedure

### Out of Scope
- New reactor instrumentation (already implemented)
- HTTP client instrumentation (future phase)
- Oban job tracing (future phase)

---

## Session Members

- Dr. Alexandra Chen (Chair)
- Dr. Kenji Tanaka (Research Librarian)
- Dr. Amanda Foster (SC03 Lead - Distributed Tracing)
- Dr. William Park (SC04 Lead - Dashboard Architect)
- Dr. Janet Liu (SC05 Lead - Elixir/Ash Integration)
- Elena Vasquez (SK002 - Complexity Auditor)
- Dr. Richard Thornton (SK001 - Devil's Advocate General)

---

## Key Discovery

**CRITICAL FINDING**: Tracing is ALREADY IMPLEMENTED in card reactors!

The following services are in place and being used:
- `TempoTracingService` - 15+ span types for card/payment operations
- `ReactorInstrumentation` - Step-level child spans
- OpenTelemetry configuration - HTTP exporter to Tempo

The gaps are in **verification** and **Grafana configuration**, not in the Elixir code.
