# SC15: Dwolla Deep Dive Subcommittee

> **Code**: SC15  
> **Focus**: Dwolla integration excellence

---

## Charter

### Purpose
Ensure world-class Dwolla integration for ACH payments.

### Scope
- ACH transfer flows
- Customer verification
- Funding source management
- Webhook handling

---

## Members

**Lead**: Christopher Jordan (Dwolla Expert)

**Core Members**:
- Jonathan Blake (ACH Specialist)

---

## Code Focus Areas

```
adapters/providers/dwolla/
├── adapter.ex
├── client.ex
├── auth/oauth_handler.ex
├── capabilities/
└── mappers/

services/
├── dwolla_kyb_orchestrator.ex
```

---

*"Dwolla moves money via ACH; reliability is non-negotiable."*
