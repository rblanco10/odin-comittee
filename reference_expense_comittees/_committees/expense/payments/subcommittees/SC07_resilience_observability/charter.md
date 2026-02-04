# SC07: Resilience & Observability Subcommittee

> **Code**: SC07  
> **Focus**: System resilience and observability

---

## Charter

### Purpose
Ensure ember_payments handles failures gracefully and provides visibility into operations.

### Scope
- Circuit breakers
- Retry strategies
- Metrics and logging
- Tracing

---

## Members

**Lead**: Christina Nguyen (Resilience Expert)

**Core Members**:
- Heather Wong (Observability Expert)
- Elena Rodriguez (Failure Advocate)

---

## Code Focus Areas

```
services/
├── payments_circuit_breaker.ex

observability/services/
├── loki_logging_service.ex
├── prometheus_metrics_service.ex
├── tempo_tracing_service.ex
```

---

*"Resilience is invisible when it works; observability shows when it doesn't."*
