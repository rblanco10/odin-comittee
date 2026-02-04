# Product: Receivables (AR) Scope

> **Type**: Product Reference  
> **App**: `product_receivables`  
> **Status**: PLANNED (Not yet built)

---

## Overview

`product_receivables` is the Accounts Receivable product within the Ember Platform. It enables businesses to manage their receivables, collect payments, and automate collections workflows.

---

## Target Users

| Role | Description | Key Needs |
|------|-------------|-----------|
| AR Admin | Configures AR policies and integrations | Policy setup, ERP sync, user management |
| AR Manager | Oversees collections and credit | Dashboards, approvals, risk oversight |
| AR Clerk | Day-to-day AR operations | Invoice management, payment processing |
| AR Collector | Specialized in collections | Dunning workflows, dispute handling |
| AR Viewer | Read-only access | Reporting, status checking |
| External Payer | Customer paying invoices | Self-service portal, payment submission |

---

## Core Domains

### 1. Customer Management (`customers/`)

**Purpose**: Manage B2B customers (companies) who owe money.

**Key Entities**:
- `Customer` - Business entity that receives invoices
- `Contact` - People within customer organizations
- `CustomerGroup` - Segmentation for policies
- `CreditAccount` - Credit terms and limits
- `PaymentMethod` - Stored payment methods

**Key Operations**:
- Create/update customers
- Sync from ERP
- Apply credit policies
- Manage payment methods

---

### 2. Invoice Management (`invoices/`)

**Purpose**: Create and manage AR invoices.

**Key Entities**:
- `Invoice` - AR invoice sent to customer
- `InvoiceLine` - Line items
- `CreditMemo` - Credit adjustments
- `DebitMemo` - Debit adjustments
- `Statement` - Periodic statements
- `RecurringInvoice` - Scheduled invoicing

**Key Operations**:
- Create/edit invoices
- Sync from ERP
- Generate statements
- Manage recurring billing
- Apply taxes

---

### 3. Payment Collection (`payments/`)

**Purpose**: Receive payments from customers.

**Key Entities**:
- `PaymentReceipt` - Received payment record
- `PaymentAllocation` - Links payment to invoice(s)
- `Refund` - Payment reversal
- `AutoPay` - Recurring payment schedule

**Key Operations**:
- Process ACH, card, wire, check
- Apply to invoices
- Handle partial payments
- Process overpayments
- Issue refunds

**Infrastructure**: Uses `infra_payments` for provider integration

---

### 4. Collections/Dunning (`collections/`)

**Purpose**: Automated and manual collection activities.

**Key Entities**:
- `DunningCampaign` - Automated reminder sequence
- `DunningStep` - Individual reminder in campaign
- `CollectionActivity` - Manual collection actions
- `PromiseToPay` - Customer payment commitment
- `Dispute` - Customer dispute of invoice
- `WriteOff` - Uncollectible amount

**Key Operations**:
- Configure dunning campaigns
- Send automated reminders (via `infra_communications`)
- Record collection activities
- Track promises to pay
- Manage disputes
- Process write-offs

---

### 5. Credit Management (`credit/`)

**Purpose**: Manage customer credit and risk.

**Key Entities**:
- `CreditPolicy` - Credit rules and limits
- `CreditApplication` - Customer credit request
- `CreditHold` - Account hold status
- `CreditReview` - Periodic review record
- `RiskScore` - Calculated risk rating

**Key Operations**:
- Define credit policies
- Process credit applications
- Set/adjust credit limits
- Apply credit holds
- Integrate risk data

---

### 6. Cash Application (`cash_application/`)

**Purpose**: Match incoming payments to invoices.

**Key Entities**:
- `RemittanceAdvice` - Payer's payment details
- `MatchingSuggestion` - AI-suggested matches
- `MatchingRule` - Automated matching rules
- `Exception` - Unmatched payment

**Key Operations**:
- Parse remittance data
- Auto-match payments
- Handle exceptions
- AI-assisted matching (future)

---

### 7. Customer Portal (`checkout/`)

**Purpose**: Customer-facing payment experience.

**Key Entities**:
- `PaymentLink` - Shareable payment URL
- `CheckoutSession` - Active payment session
- `QRCode` - Payment QR code

**Key Operations**:
- Generate payment links
- Create checkout pages
- Process portal payments

**Note**: Frontend lives in `web_portal`

---

## Integration Points

### Infrastructure Dependencies

| Infra App | Usage |
|-----------|-------|
| `infra_workspaces` | Multi-tenancy, user context |
| `infra_payments` | Payment collection (Stripe, ACH, etc.) |
| `infra_erp` | Sync invoices, customers, payments |
| `infra_identity` | Customer KYB verification |
| `infra_communications` | Dunning emails, SMS |
| `infra_documents` | Invoice PDFs, statement generation |

### Domain Dependencies

| Domain App | Usage |
|------------|-------|
| `domain_coding` | GL coding for transactions |
| `domain_approvals` | Write-off approvals, credit approvals |
| `domain_audit` | Complete audit trail |
| `domain_bulk` | Import/export operations |
| `domain_compliance` | Regulatory compliance |

---

## Competitive Feature Matrix

Based on analysis of PayStand, Billtrust, HighRadius, Versapay:

| Feature | Priority | Competitors Have |
|---------|----------|------------------|
| Invoice management | P0 | All |
| Multiple payment methods | P0 | All |
| Customer portal | P0 | All |
| Dunning automation | P0 | All |
| ERP integration | P0 | All |
| Cash application | P1 | Most |
| Credit management | P1 | Most |
| AI matching | P2 | HighRadius, Billtrust |
| Predictive analytics | P2 | HighRadius |
| Payment links | P1 | PayStand, Versapay |
| QR codes | P2 | PayStand |
| Lockbox integration | P2 | Billtrust, HighRadius |

---

## Folder Structure

```
apps/product_receivables/
├── mix.exs
├── lib/
│   ├── product_receivables.ex        # Root module
│   ├── domain.ex                     # Ash domain
│   │
│   ├── customers/
│   │   ├── resources/
│   │   │   ├── customer.ex
│   │   │   ├── contact.ex
│   │   │   ├── customer_group.ex
│   │   │   ├── credit_account.ex
│   │   │   └── payment_method.ex
│   │   └── services/
│   │       └── customer_service.ex
│   │
│   ├── invoices/
│   │   ├── resources/
│   │   │   ├── invoice.ex
│   │   │   ├── invoice_line.ex
│   │   │   ├── credit_memo.ex
│   │   │   └── statement.ex
│   │   ├── services/
│   │   └── workers/
│   │
│   ├── payments/
│   │   ├── resources/
│   │   │   ├── payment_receipt.ex
│   │   │   ├── payment_allocation.ex
│   │   │   ├── refund.ex
│   │   │   └── auto_pay.ex
│   │   ├── services/
│   │   ├── reactors/
│   │   └── workers/
│   │
│   ├── collections/
│   │   ├── resources/
│   │   │   ├── dunning_campaign.ex
│   │   │   ├── collection_activity.ex
│   │   │   ├── promise_to_pay.ex
│   │   │   ├── dispute.ex
│   │   │   └── write_off.ex
│   │   ├── services/
│   │   └── workers/
│   │
│   ├── credit/
│   │   ├── resources/
│   │   │   ├── credit_policy.ex
│   │   │   ├── credit_application.ex
│   │   │   └── credit_hold.ex
│   │   └── services/
│   │
│   ├── cash_application/
│   │   ├── resources/
│   │   ├── services/
│   │   └── matching/
│   │
│   └── checkout/
│       ├── resources/
│       └── services/
│
└── test/
```

---

## State Machines

### Invoice States
```
draft → sent → partially_paid → paid → closed
              ↓
            disputed → resolved
              ↓
            written_off
```

### Dispute States
```
opened → under_review → resolved (accepted | rejected | partial_credit)
```

### Collection States (per customer)
```
current → past_due → in_collections → legal → written_off
```

---

## Future Considerations

1. **AI-Powered Cash Application**: ML-based matching
2. **Predictive Collections**: Risk scoring and prioritization
3. **Payment Financing**: Early payment discounts
4. **Multi-Currency**: Full support for international AR
5. **Treasury Integration**: Cash flow forecasting

---

## Related Documentation

- [Umbrella Structure](../architecture/umbrella_structure.md)
- [Dependency Rules](../architecture/dependency_rules.md)
- [ADR-001: Umbrella Architecture](../decisions/ADR-001_umbrella_architecture.md)

---

*Last updated: 2026-01-08*
