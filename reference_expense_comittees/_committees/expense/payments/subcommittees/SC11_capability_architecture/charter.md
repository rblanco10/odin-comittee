# SC11: Capability Architecture Subcommittee

> **Code**: SC11  
> **Focus**: Capability pattern design and maintenance

---

## Charter

### Purpose
Maintain and evolve the capability abstraction layer.

### Scope
- Capability behaviors
- Capability types
- Capability routing
- New capability design

---

## Members

**Lead**: Dr. William Chang (Capability Patterns Expert)

**Core Members**:
- Margaret O'Neill (Adapter Patterns Expert)

---

## Code Focus Areas

```
capabilities/
├── card_issuance/
├── identity_verification/
├── payment_collection/
├── payment_initiation/
├── payout_disbursement/
└── ...

adapters/capability_router.ex
```

---

*"Capabilities define WHAT; they must not leak HOW."*
