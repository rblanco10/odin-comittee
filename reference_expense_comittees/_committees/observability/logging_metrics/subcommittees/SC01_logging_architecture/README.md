# SC01: Logging Architecture Subcommittee

> **Code**: SC01  
> **Focus**: Log structure, routing, buffering, and delivery  
> **Members**: 12  
> **Lead**: Dr. Michael Torres (Log Structure Architect)

---

## Charter

The Logging Architecture Subcommittee is responsible for designing and maintaining the logging infrastructure. This includes log structure, formatting, routing, buffering, and delivery to Loki.

---

## Scope

### In Scope
- Structured logging format and schema
- Log levels and their semantics
- Buffering and backpressure strategies
- Log routing and filtering
- Correlation ID propagation
- Async logging patterns
- Loki integration
- Log sampling strategies

### Out of Scope
- What to log (domain-specific)
- Dashboard creation (SC04)
- Alert rules (SC07)
- Security/PII concerns (SC08)

---

## Members

| ID | Name | Role | Expertise |
|----|------|------|-----------|
| SC01-001 | **Dr. Michael Torres** | Log Structure Architect (Lead) | Overall logging architecture |
| SC01-002 | **Rachel Kim** | Buffer Strategist | Buffering, backpressure |
| SC01-003 | **Christopher Jordan** | Log Routing Engineer | Routing, filtering |
| SC01-004 | **Elena Vasquez** | Structured Logging Purist | JSON structure, schema |
| SC01-005 | **Dr. Nathan Pierce** | Log Level Taxonomist | Level semantics |
| SC01-006 | **Jennifer Adams** | Context Propagation Expert | Correlation IDs |
| SC01-007 | **Thomas Grant** | Log Sampling Specialist | Sampling strategies |
| SC01-008 | **Lisa Nakamura** | Async Logging Advocate | Async patterns |
| SC01-009 | **Dr. William Chang** | Log Correlation Expert | Cross-service correlation |
| SC01-010 | **Margaret O'Neill** | Backpressure Engineer | Backpressure handling |
| SC01-011 | **Alex Rivera** | Log Format Standardizer | Format standards |
| SC01-012 | **Christina Nguyen** | Logging Skeptic | Challenge assumptions |

---

## Key Questions

1. What structured logging format should we use?
2. What are the semantics of each log level?
3. How do we handle buffering and backpressure?
4. How do we propagate correlation IDs?
5. When should we sample logs?
6. How do we ensure async logging doesn't lose data?

---

## Deliverables

- Structured logging schema
- Log level guidelines
- Buffering strategy document
- Correlation ID propagation pattern
- Elixir logging module patterns

---

*"Good logs tell a story; great logs tell the right story."*

