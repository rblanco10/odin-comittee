# SC03 Collections Charter

> **Code**: SC03  
> **Lifecycle**: collections_lifecycle  
> **Lead**: Charles Wright (DE003)

---

## Purpose

Govern all aspects of collection workflows, including collection plan creation, scheduling, payment tracking, and communication management for overdue accounts.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Domain.CollectionPlan` resource
- `FlamePsAr.Classic.Domain.CollectionSchedule` resource
- `FlamePsAr.Classic.Domain.CollectionPayment` resource
- Collection workflow reactors
- Aging bucket management

### Code Focus Areas

```
lib/flame_ps_ar/classic/domain/
├── resources/collection_plan.ex
├── resources/collection_schedule.ex
├── resources/collection_payment.ex
├── reactors/collection_*.ex
└── services/collection_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/collections_lifecycle/`

---

## Key Questions

1. When is a collection plan created for a receivable?
2. How are payment schedules generated?
3. What triggers status transitions in collection plans?
4. How are collection communications tracked?
5. How does plan completion affect receivable status?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Charles Wright | DE003 |
| **Domain Expert** | Diana Foster | DE004 |
| **Domain Expert** | Marcus Chen | DE005 |
| **Critic** | Elena Volkov | C003 |
| **Critic** | Dr. James Morrison | C004 |
| **Technical** | Margaret Hamilton III | TS002 |

---

## Constitutional Considerations

- **Legacy Compatibility**: Collection plans must sync with legacy
- **State Machine**: Plan states (created, active, completed, cancelled)
- **Decimal for Money**: All amounts in Decimal
- **Performance**: Collection list pages within budget

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Receivable aging triggers |
| SC04 | Late fees during collection |
| SC05 | Payment application to plans |
| SC08 | Collection sync to ERP |
| SC13 | Collection UI flows |

---

*"Collections is problem-solving, not punishment."*

