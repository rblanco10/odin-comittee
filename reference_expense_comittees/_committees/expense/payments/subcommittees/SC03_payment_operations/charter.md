# SC03: Payment Operations Subcommittee

> **Code**: SC03  
> **Focus**: ACH, check payments, and payout flows

---

## Charter

### Purpose
Oversee non-card payment operations including ACH transfers and check issuance.

### Scope
- ACH payment flows (Dwolla)
- Check creation (Checkbook)
- Payout batch processing
- Payment status tracking

### Key Questions
1. Are ACH flows reliable?
2. Are checks delivered successfully?
3. Is batch processing efficient?
4. Is status tracking accurate?

---

## Members

**Lead**: Diana Foster (Payment Rails Generalist)

**Core Members**:
- Jonathan Blake (ACH Specialist)
- Rebecca Morrison (Check Specialist)
- Charles Wright (Wire Specialist)
- Rachel Kim (Checkbook Expert)
- Christopher Jordan (Dwolla Expert)

**Critics**:
- Elena Rodriguez (Failure Advocate)

---

## Code Focus Areas

```
resources/payout/
├── payout_batch.ex
├── payout_item.ex

services/
├── checkbook_reconciliation_service.ex
├── checkbook_sync_service.ex

workers/
├── checkbook_status_polling_worker.ex
```

---

*"Payments are promises; delivery is everything."*
