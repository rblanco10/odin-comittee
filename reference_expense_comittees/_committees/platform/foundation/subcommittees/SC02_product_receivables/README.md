# SC02: Product Receivables Subcommittee

> **Code**: SC02  
> **Lead**: Victoria Castellanos  
> **Co-Lead**: Dr. Emmanuel Adeyemi  
> **Focus**: Accounts Receivable product architecture and design

---

## Mission

The Product Receivables Subcommittee is responsible for the architecture and design of `product_receivables` — the Accounts Receivable application within the Ember Platform.

We ensure that the AR product:
1. Meets competitive feature parity and beyond
2. Integrates properly with shared infrastructure
3. Follows platform conventions and patterns
4. Delivers world-class user experience

---

## Jurisdiction

### Primary Responsibilities

- Define AR domain models and resources
- Design AR workflows and state machines
- Specify integrations with infrastructure
- Review AR-related architectural decisions
- Ensure competitive feature coverage

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Internal AR resource design | Subcommittee approval |
| AR state machine design | Subcommittee approval |
| AR → Infrastructure integration | Subcommittee + SC05 |
| AR → Domain integration | Subcommittee + affected domain lead |
| Cross-product integration (AP/Expense) | Full committee |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Victoria Castellanos | Lead | Collections, Dunning |
| Dr. Emmanuel Adeyemi | Co-Lead | Cash Application |
| Thomas Müller | Infra Liaison | Payments integration |
| Jennifer Okafor | Infra Liaison | ERP integration |
| Dr. Robert Fitzgerald | Domain Liaison | GL Coding |
| Dr. Patricia Nguyen | Domain Liaison | Approvals |
| Dr. Priya Sharma | Critic | Testing implications |
| Marcus Webb | Critic | Operations concerns |

---

## AR Domain Model

### Core Domains

| Domain | Purpose | Key Resources |
|--------|---------|---------------|
| Customers | B2B customer management | Customer, Contact, CreditAccount |
| Invoices | AR invoice lifecycle | Invoice, InvoiceLine, CreditMemo |
| Payments | Payment collection | PaymentReceipt, Allocation, Refund |
| Collections | Dunning and collections | DunningCampaign, Dispute, WriteOff |
| Credit | Credit management | CreditPolicy, CreditApplication |
| Cash Application | Payment matching | RemittanceAdvice, MatchingSuggestion |
| Checkout | Customer payment portal | PaymentLink, CheckoutSession |

### Resource Hierarchy

```
Customer (B2B Company)
├── Contact (People at company)
├── CreditAccount
│   ├── CreditPolicy
│   └── CreditHold
├── PaymentMethod (on file)
└── Invoice
    ├── InvoiceLine
    ├── CreditMemo
    └── PaymentAllocation
        └── PaymentReceipt
```

---

## Infrastructure Dependencies

| Infra App | AR Usage |
|-----------|----------|
| `infra_payments` | Collect ACH, card, wire payments |
| `infra_erp` | Sync invoices, customers, payments to ERP |
| `infra_identity` | Customer KYB verification |
| `infra_communications` | Dunning emails, SMS reminders |
| `infra_documents` | Invoice PDFs, statement generation |
| `infra_workspaces` | Multi-tenancy, user context |

---

## Domain Dependencies

| Domain App | AR Usage |
|------------|----------|
| `domain_coding` | GL coding for AR transactions |
| `domain_approvals` | Write-off approvals, credit approvals |
| `domain_audit` | Complete audit trail |
| `domain_bulk` | Import/export customers, invoices |
| `domain_compliance` | AR compliance rules |

---

## Competitive Feature Matrix

| Feature | Priority | Notes |
|---------|----------|-------|
| Invoice Management | P0 | Core functionality |
| Multi-payment Methods | P0 | ACH, Card, Wire, Check |
| Customer Portal | P0 | Self-service |
| ERP Integration | P0 | NetSuite, Sage, QB, Dynamics |
| Dunning Automation | P0 | Email sequences |
| Cash Application | P1 | Auto-matching |
| Credit Management | P1 | Limits, holds |
| Payment Links | P1 | Shareable URLs |
| Dispute Management | P1 | Customer disputes |
| AI Matching | P2 | ML-powered matching |
| Predictive Analytics | P2 | Risk scoring |

---

## State Machines

### Invoice Lifecycle
```
draft → sent → partially_paid → paid → closed
              ↓
            disputed → resolved
              ↓
            written_off
```

### Dispute Lifecycle
```
opened → under_review → resolved
                         ├── accepted (credit issued)
                         ├── rejected
                         └── partial_credit
```

### Customer Collection Status
```
current → past_due → in_collections → legal → written_off
   ↑_________↓ (when paid)
```

---

## Open Design Questions

1. **Credit scoring integration**: Build in-house or integrate with bureau?
2. **Lockbox support**: Needed for enterprise? Priority?
3. **Multi-currency**: Full support or phase 2?
4. **AR financing**: Early payment discounts architecture?

---

## Meeting Cadence

- **Regular**: Twice weekly during active development
- **Design Review**: As needed for major features
- **Integration Review**: Monthly with SC05 (Infrastructure)

---

## Related Documentation

- [Receivables Scope](../../knowledge_base/products/receivables_scope.md)
- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)

---

*"World-class AR means world-class cash flow for our customers."*
