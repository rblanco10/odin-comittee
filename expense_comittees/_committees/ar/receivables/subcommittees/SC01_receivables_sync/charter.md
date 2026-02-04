# SC01 Receivables Sync Charter

> **Code**: SC01  
> **Lifecycle**: receivable_lifecycle  
> **Lead**: Jonathan Blake (DE001)

---

## Purpose

Govern all aspects of receivable resources, including creation, updates, sync, balance calculations, and status management within the `flame_ps_ar` domain.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Domain.Receivable` resource
- `FlamePsAr.Classic.Domain.ReceivableLineItem` resource
- Receivable sync workflows
- Balance calculation logic
- Invoice PDF generation

### Code Focus Areas

```
lib/flame_ps_ar/classic/domain/
├── resources/receivable.ex
├── resources/receivable_line_item.ex
├── services/receivable_*.ex
└── reactors/receivable_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/receivable_lifecycle/`

---

## Key Questions

1. How are receivables created and validated?
2. How is balance calculated and updated?
3. What triggers status transitions?
4. How does sync with legacy (Loopback2) work?
5. What performance considerations for large receivable sets?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Jonathan Blake | DE001 |
| **Domain Expert** | Rebecca Morrison | DE002 |
| **Critic** | Dr. Victor Kozlov | C001 |
| **Critic** | Priya Nakamura | C002 |
| **Technical** | Margaret Hamilton III | TS002 |
| **Technical** | Bjarne Stroustrup II | TS004 |

---

## Constitutional Considerations

- **Legacy Compatibility**: Receivables must be readable by Loopback2
- **Decimal for Money**: amount, balance, lineTotal must be Decimal
- **Tenant Isolation**: All queries must include owner_id
- **Performance Budget**: Receivable list < 200ms, 5 queries max

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC02 | Customer relationships |
| SC03 | Collection plan creation |
| SC05 | Payment application |
| SC07 | ERP invoice pull |
| SC11 | Legacy alignment verification |

---

*"Every AR journey begins with a receivable."*

