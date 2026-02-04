# SC02 Customer Sync Charter

> **Code**: SC02  
> **Lifecycle**: customer_lifecycle  
> **Lead**: Rebecca Morrison (DE002)

---

## Purpose

Govern all aspects of customer records, including master data management, address handling, payment terms, and customer sync with external systems.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Domain.Customer` resource
- `FlamePsAr.Classic.Domain.CustomerAddress` resource
- `FlamePsAr.Classic.Domain.CustomerContact` resource
- Customer sync workflows
- Customer deduplication logic

### Code Focus Areas

```
lib/flame_ps_ar/classic/domain/
├── resources/customer.ex
├── resources/customer_address.ex
├── resources/customer_contact.ex
└── services/customer_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/customer_lifecycle/`

---

## Key Questions

1. How are customers created and validated?
2. What is the address normalization logic?
3. How are payment terms defaulted and overridden?
4. How does customer sync from ERP work?
5. How is customer deduplication handled?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Rebecca Morrison | DE002 |
| **Domain Expert** | Jonathan Blake | DE001 |
| **Critic** | Dr. Victor Kozlov | C001 |
| **Critic** | Dr. Sarah Kim | C007 |
| **Technical** | Barbara Liskov II | TS007 |
| **Integration** | James O'Connor | IS004 |

---

## Constitutional Considerations

- **Legacy Compatibility**: Customer records must be readable by Loopback2
- **Tenant Isolation**: All queries must include owner_id
- **Data Integrity**: Customer IDs used as foreign keys across system

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Customer-receivable relationships |
| SC03 | Customer collection history |
| SC05 | Customer payment methods |
| SC07 | Customer pull from ERP |
| SC11 | Legacy customer format |

---

*"Know your customer, know your revenue."*

