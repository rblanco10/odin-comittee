# SC14: Checkbook Deep Dive Subcommittee

> **Code**: SC14  
> **Focus**: Checkbook.io integration excellence

---

## Charter

### Purpose
Ensure world-class Checkbook.io integration.

### Scope
- Check creation flows
- Status tracking
- Reconciliation
- Webhook handling

---

## Members

**Lead**: Rachel Kim (Checkbook Expert)

**Core Members**:
- Rebecca Morrison (Check Specialist)

---

## Code Focus Areas

```
adapters/providers/checkbook/
├── adapter.ex
├── client.ex
├── capabilities/
└── mappers/

services/
├── checkbook_reconciliation_service.ex
├── checkbook_sync_service.ex

workers/
├── checkbook_status_polling_worker.ex
```

---

*"Checkbook delivers checks reliably; our integration must match."*
