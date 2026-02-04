# Session Transcript

**Session**: 2026-01-23_002_tracing-adoption-implementation  
**Type**: Design + Implementation  
**Chair**: Dr. Alexandra Chen

---

## Opening

**CHAIR**: This session is called to order. Goal: Create an immediately-executable implementation plan for distributed tracing adoption.

---

## Research Phase

**Dr. Kenji Tanaka (Research Librarian)**:

I researched the current tracing state in the codebase.

**Critical Finding**: Tracing is ALREADY IMPLEMENTED!

Files examined:
- `tempo-config.yml` - Tempo configured with OTLP receivers on 4317/4318
- `datasources.yml` - Loki → Tempo derivedFields present
- `mix.exs` - OpenTelemetry packages installed (5 packages)
- `application.ex` - OTel exporter started, Phoenix/Ecto auto-instrumentation active
- `tempo_tracing_service.ex` - 15+ span types implemented
- `reactor_instrumentation.ex` - Step-level child spans with context propagation
- `freeze_card_reactor.ex` - Fully instrumented example

**Gap Identified**: Tempo → Loki linking NOT configured. Users can go Log → Trace but not Trace → Logs.

---

## Design Phase

**Dr. Amanda Foster (SC03 Lead - Distributed Tracing)**:

The infrastructure is solid. What's missing:

1. Tempo datasource needs `tracesToLogsV2` for bi-directional linking
2. Verification that traces are actually appearing in Tempo
3. Documentation for the team

**Dr. William Park (SC04 Lead - Dashboard Architect)**:

I recommend adding these Tempo features:
- `nodeGraph: enabled` for visual trace representation
- `lokiSearch` for searching logs from Tempo explore
- `serviceMap` for service dependency visualization

---

## Skeptic Challenge

**Elena Vasquez (SK002 - Complexity Auditor)**:

My concern: We're declaring victory without verification. The code exists, but has anyone confirmed traces appear in Tempo?

**Resolution**: Added verification procedure to implementation plan. Status should not be updated until Human Director confirms traces are visible.

**Dr. Richard Thornton (SK001 - Devil's Advocate General)**:

Concerns addressed in plan:
1. Performance overhead - Negligible (~30μs per operation)
2. Storage costs - Already has 60-day retention
3. Cardinality - Not an issue for Tempo (unlike Prometheus)
4. Sampling - Not needed at current volume

---

## Implementation

**Phase 1 EXECUTED**: Updated `datasources.yml` with:
- `tracesToLogsV2` configuration
- `nodeGraph` enabled
- `lokiSearch` enabled
- `serviceMap` with Prometheus

---

## Closing

**CHAIR**: This session produced:
- 4 decisions (DEC-078 through DEC-081)
- 1 configuration change (datasources.yml)
- 1 comprehensive implementation plan
- Verification procedure for Human Director

Human Director: Please execute the verification procedure to confirm traces are working.

Session CLOSED pending verification.
