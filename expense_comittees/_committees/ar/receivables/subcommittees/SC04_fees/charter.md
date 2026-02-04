# SC04 Fees Charter

> **Code**: SC04  
> **Lifecycle**: fees_lifecycle  
> **Lead**: Diana Foster (DE004)

---

## Purpose

Govern all aspects of fee management, including late fees, service charges, fee schedules, calculations, and waivers within the AR domain.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Domain.Fee` resource
- `FlamePsAr.Classic.Domain.FeeSchedule` resource
- `FlamePsAr.Classic.Domain.FeeWaiver` resource
- Fee calculation logic
- Grace period handling

### Code Focus Areas

```
lib/flame_ps_ar/classic/domain/
├── resources/fee.ex
├── resources/fee_schedule.ex
├── resources/fee_waiver.ex
└── services/fee_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/fees_lifecycle/`

---

## Key Questions

1. How are fees calculated based on schedules?
2. What triggers fee application to receivables?
3. How are grace periods enforced?
4. What is the fee waiver workflow?
5. How are fee caps applied?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Diana Foster | DE004 |
| **Domain Expert** | Charles Wright | DE003 |
| **Critic** | Yuki Santos | C005 |
| **Critic** | Dr. James Morrison | C004 |
| **Technical** | Margaret Hamilton III | TS002 |
| **Technical** | Donald Knuth III | TS008 |

---

## Constitutional Considerations

- **Decimal for Money**: Fee amounts MUST be Decimal
- **Edge Cases**: Zero fee, maximum fee, partial periods
- **Legacy**: Fee records readable by Loopback2
- **Compliance**: Regulatory fee caps by jurisdiction

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Fee application to receivables |
| SC03 | Fees during collection |
| SC08 | Fee posting to ERP |
| SC13 | Fee display in UI |

---

*"Fair fees motivate; unfair fees alienate."*

