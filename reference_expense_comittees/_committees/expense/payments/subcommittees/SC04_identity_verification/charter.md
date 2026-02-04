# SC04: Identity Verification Subcommittee

> **Code**: SC04  
> **Focus**: KYB, KYC, and document verification

---

## Charter

### Purpose
Oversee identity verification operations including business verification (KYB), individual verification (KYC), and document handling.

### Scope
- KYB application workflows
- KYC verification
- Beneficial ownership
- Document upload and verification

### Key Questions
1. Are KYB flows complete and reliable?
2. Is beneficial ownership handled correctly?
3. Are documents processed securely?
4. Is verification status accurate?

---

## Members

**Lead**: Dr. Nathan Pierce (KYB Specialist)

**Core Members**:
- Jennifer Adams (KYC Specialist)
- Thomas Grant (Beneficial Owner Expert)
- Lisa Nakamura (Document Verification Expert)
- Janet Liu (Financial Regulations Expert)

**Critics**:
- Dr. Eleanor Vance (Security Adversary)

---

## Code Focus Areas

```
resources/identity/
├── kyb_application.ex
├── kyb_verification.ex
├── beneficial_owner.ex

services/
├── dwolla_kyb_orchestrator.ex
├── marqeta_kyb_orchestrator.ex
├── checkbook_kyb_orchestrator.ex

reactors/identity/
├── submit_kyb_application_reactor.ex
├── add_beneficial_owner_reactor.ex
```

---

*"Identity verification is the gateway; get it wrong and everything stops."*
