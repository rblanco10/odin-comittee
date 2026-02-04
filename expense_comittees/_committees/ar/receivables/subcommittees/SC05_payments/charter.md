# SC05 Payments Charter

> **Code**: SC05  
> **Lifecycle**: payments_lifecycle  
> **Lead**: Marcus Chen (DE005)

---

## Purpose

Govern all aspects of payment processing, including payment initiation, application to receivables, refunds, autopay, and banking integration.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.Classic.Payments.Payment` resource
- `FlamePsAr.Classic.Payments.PaymentApplication` resource
- `FlamePsAr.Classic.Payments.PaymentMethod` resource
- `FlamePsAr.Classic.Payments.Autopay` resource
- Payment processing workflows
- Banking integrations

### Code Focus Areas

```
lib/flame_ps_ar/classic/payments/
├── resources/payment.ex
├── resources/payment_application.ex
├── resources/payment_method.ex
├── resources/autopay.ex
├── reactors/payment_*.ex
└── services/payment_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/payments_lifecycle/`

---

## Key Questions

1. How are payments processed end-to-end?
2. What is the payment application algorithm?
3. How are overpayments handled?
4. What is the refund workflow?
5. How does autopay scheduling work?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Marcus Chen | DE005 |
| **Domain Expert** | Angela Martinez | DE006 |
| **Critic** | Elena Volkov | C003 |
| **Critic** | Priya Nakamura | C002 |
| **Technical** | Dr. Alan Turing Jr. | TS001 |
| **Integration** | Hiroshi Tanaka | IS005 |

---

## Constitutional Considerations

- **Decimal for Money**: All payment amounts MUST be Decimal
- **State Machine**: Payment states (pending, processing, completed, failed, refunded)
- **Legacy**: Payment records readable by Loopback2
- **Security**: PCI compliance for payment methods

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Payment application to receivables |
| SC03 | Collection plan payments |
| SC08 | Payment posting to ERP |
| SC10 | GL entries for payments |
| SC13 | Payment UI flows |

---

*"Payments are promises fulfilled."*

