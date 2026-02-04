# SC06 Plan Compilation Charter

> **Code**: SC06  
> **Lifecycle**: plan_lifecycle  
> **Lead**: Kevin O'Brien (DE009)

---

## Purpose

Govern all aspects of plan management, including plan compilation, statement generation, billing cycle handling, and mid-cycle changes.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Domain.Plan` resource
- `FlamePsAr.Classic.Domain.PlanCompilation` resource
- `FlamePsAr.Classic.Domain.Statement` resource
- Compilation workflow reactors
- Billing cycle calculations

### Code Focus Areas

```
lib/flame_ps_ar/classic/domain/
├── resources/plan.ex
├── resources/plan_compilation.ex
├── resources/statement.ex
├── reactors/plan_*.ex
└── services/plan_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/plan_lifecycle/`

---

## Key Questions

1. What triggers plan compilation?
2. How are statements generated from compilations?
3. How are mid-cycle changes handled?
4. What is the pro-ration logic?
5. How does compilation affect receivables?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Kevin O'Brien | DE009 |
| **Domain Expert** | Diana Foster | DE004 |
| **Critic** | Dr. James Morrison | C004 |
| **Critic** | Yuki Santos | C005 |
| **Technical** | Margaret Hamilton III | TS002 |
| **Technical** | Donald Knuth III | TS008 |

---

## Constitutional Considerations

- **Decimal for Money**: All plan amounts MUST be Decimal
- **Legacy**: Plans must sync with Loopback2
- **State Machine**: Plan states (draft, active, paused, cancelled)
- **Performance**: Compilation batch processing

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Receivable creation from compilation |
| SC04 | Fee generation during compilation |
| SC07 | Plan sync from ERP |
| SC13 | Statement UI display |

---

*"Good planning is invisible until it's missing."*

