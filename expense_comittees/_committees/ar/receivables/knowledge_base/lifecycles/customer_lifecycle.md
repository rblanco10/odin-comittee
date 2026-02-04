# Customer Lifecycle

> **Subcommittee**: SC02  
> **Reference**: `docs/agents/architecture/lifecycles/customer_lifecycle/`  
> **Last Verified**: 2026-01-14

---

## Overview

The customer lifecycle governs the creation and management of customer master data in the AR system.

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌─────────┐    ┌────────┐                               │
│         │ created │───►│ active │◄────┐                        │
│         └─────────┘    └───┬────┘     │                        │
│                            │          │                         │
│                            ▼          │                         │
│                       ┌──────────┐    │                        │
│                       │ inactive │────┘                        │
│                       └──────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Definitions

| State | Description | Conditions |
|-------|-------------|------------|
| `created` | Initial creation | Before activation |
| `active` | Normal operating state | Ready for receivables |
| `inactive` | Soft-deleted or suspended | No new receivables |

---

## Key Processes

### 1. Customer Creation

- **Trigger**: Manual creation, ERP sync
- **Validation**: Required fields, address format
- **Output**: Customer in `created` state

### 2. Activation

- **Trigger**: Activate action
- **Validation**: All required data present
- **Output**: Customer in `active` state

### 3. Deactivation

- **Trigger**: Deactivate action
- **Validation**: No open receivables (optional)
- **Output**: Customer in `inactive` state

---

## Related Resources

| Resource | Relationship |
|----------|--------------|
| `CustomerAddress` | has_many |
| `CustomerContact` | has_many |
| `Receivable` | has_many |
| `PaymentMethod` | has_many |

---

## Code References

```
lib/flame_ps_ar/classic/domain/
├── resources/customer.ex
├── resources/customer_address.ex
├── resources/customer_contact.ex
└── services/customer_*.ex
```

---

*"Know your customer, know your business."*

