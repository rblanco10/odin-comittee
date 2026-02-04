# SC03: Distributed Tracing Subcommittee

> **Code**: SC03  
> **Focus**: Tempo integration and trace design  
> **Members**: 10  
> **Lead**: Dr. Amanda Foster (Tempo Expert)

---

## Charter

The Distributed Tracing Subcommittee is responsible for designing and maintaining the tracing infrastructure. This includes span design, context propagation, sampling strategies, and Tempo integration.

---

## Scope

### In Scope
- Span design and naming
- Trace context propagation
- Sampling strategies
- Baggage propagation
- OpenTelemetry integration
- Tempo configuration
- Trace-to-log correlation
- Exemplars

### Out of Scope
- Dashboard creation (SC04)
- Alert rules (SC07)
- Log correlation details (SC01)

---

## Members

| ID | Name | Role | Expertise |
|----|------|------|-----------|
| SC03-001 | **Dr. Amanda Foster** | Tempo Expert (Lead) | Tempo architecture |
| SC03-002 | **James Wright** | Trace Context Architect | Context propagation |
| SC03-003 | **Nicole Chen** | Span Designer | Span structure |
| SC03-004 | **Ryan Mitchell** | OpenTelemetry Evangelist | OTel standards |
| SC03-005 | **Dr. Sandra Lee** | Trace Sampling Strategist | Sampling design |
| SC03-006 | **Brandon Taylor** | Cross-Service Tracer | Multi-service traces |
| SC03-007 | **Heather Wong** | Trace Visualization Expert | Trace display |
| SC03-008 | **Paul Fitzgerald** | Baggage Propagation Specialist | Baggage usage |
| SC03-009 | **Timothy Brooks** | Trace Storage Optimizer | Storage efficiency |
| SC03-010 | **Jessica Reyes** | Tracing Overhead Skeptic | Challenge overhead |

---

## Key Questions

1. What span naming convention should we use?
2. How do we propagate trace context across services?
3. What sampling strategy is appropriate?
4. When should we use baggage?
5. How do we correlate traces with logs?
6. What's the acceptable tracing overhead?

---

## Deliverables

- Span naming convention guide
- Context propagation patterns
- Sampling strategy document
- OpenTelemetry configuration
- Trace-log correlation patterns

---

*"A trace tells the story of a request; make it a good story."*

