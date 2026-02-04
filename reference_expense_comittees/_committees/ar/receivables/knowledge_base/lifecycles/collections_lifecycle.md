# Collections Lifecycle

> **Subcommittee**: SC03  
> **Reference**: `docs/agents/architecture/lifecycles/collections_lifecycle/`  
> **Last Verified**: 2026-01-14

---

## Overview

The collections lifecycle governs the creation and management of collection plans for overdue receivables.

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                   COLLECTIONS LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐    ┌────────┐    ┌───────────┐                  │
│    │ created │───►│ active │───►│ completed │                  │
│    └─────────┘    └───┬────┘    └───────────┘                  │
│                       │                                         │
│                       ▼                                         │
│                  ┌───────────┐                                  │
│                  │ cancelled │                                  │
│                  └───────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Definitions

| State | Description | Conditions |
|-------|-------------|------------|
| `created` | Plan created | Initial creation |
| `active` | Plan in progress | Payments being collected |
| `completed` | Plan fulfilled | All payments received |
| `cancelled` | Plan cancelled | Before completion |

---

## Related Resources

| Resource | Relationship |
|----------|--------------|
| `CollectionSchedule` | has_many |
| `CollectionPayment` | has_many |
| `Receivable` | belongs_to |
| `Customer` | belongs_to (through receivable) |

---

## Code References

```
lib/flame_ps_ar/classic/domain/
├── resources/collection_plan.ex
├── resources/collection_schedule.ex
├── resources/collection_payment.ex
└── reactors/collection_*.ex
```

---

*"Collections turns promises into payments."*

