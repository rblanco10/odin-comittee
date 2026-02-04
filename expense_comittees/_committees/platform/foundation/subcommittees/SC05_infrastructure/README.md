# SC05: Infrastructure Subcommittee

> **Code**: SC05  
> **Lead**: Thomas Müller  
> **Co-Lead**: Jennifer Okafor  
> **Focus**: Shared infrastructure services architecture

---

## Mission

The Infrastructure Subcommittee is responsible for all `infra_*` applications — the shared services that power all products. We are the foundation upon which AR, AP, Expense, and Treasury are built.

We ensure that infrastructure:
1. Provides robust, shared capabilities
2. Abstracts provider complexity from products
3. Maintains high availability and reliability
4. Enables products to focus on business logic

---

## Jurisdiction

### Primary Responsibilities

- Design and maintain infrastructure apps
- Define capability interfaces for products
- Manage provider adapter implementations
- Ensure infrastructure reliability
- Review infrastructure-related decisions

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| New provider adapter | Subcommittee approval |
| Capability interface change | Subcommittee + affected product leads |
| New infrastructure app | Full committee |
| Cross-infrastructure integration | Subcommittee approval |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Thomas Müller | Lead | Payments |
| Jennifer Okafor | Co-Lead | ERP |
| Dr. Isabella Romano | Member | Payment processing |
| Dr. Rajesh Patel | Member | ERP sync |
| Ahmad Hassan | Member | Identity (KYC/KYB) |
| Sophia Rodriguez | Member | Communications |
| David Kim | Member | Documents |
| Dr. Anna Kowalski | Member | Workspaces |
| Benjamin Park | Member | Webhooks |
| Dr. Maria Santos | Member | External APIs |

---

## Infrastructure Apps

### infra_workspaces
**Purpose**: Multi-tenancy foundation

| Resource | Purpose |
|----------|---------|
| Workspace | Top-level tenant |
| Entity | Business entity within workspace |
| User | User accounts |
| Role | RBAC roles |
| Permission | Granular permissions |

**Used By**: All products

---

### infra_payments
**Purpose**: Payment provider abstraction

| Capability | Description | Providers |
|------------|-------------|-----------|
| Card Issuance | Issue virtual/physical cards | Marqeta |
| ACH | Bank transfers | Dwolla, Stripe |
| Card Processing | Accept card payments | Stripe |
| Wire | Wire transfers | Checkbook |
| Check | Check issuance | Checkbook |

**Used By**: 
- `product_expense` — Card issuance, reimbursement disbursement
- `product_payables` — Bill payment
- `product_receivables` — Payment collection

---

### infra_erp
**Purpose**: ERP system integration

| Capability | Description | Providers |
|------------|-------------|-----------|
| Sync | Bidirectional data sync | All ERPs |
| Push | Write to ERP | All ERPs |
| Webhook | Receive ERP events | NetSuite, Intacct |

**Supported ERPs**:
- NetSuite
- Sage Intacct
- QuickBooks (Online, Desktop)
- Microsoft Dynamics

**Used By**: All products (for ERP sync)

---

### infra_identity
**Purpose**: Identity verification

| Capability | Description | Providers |
|------------|-------------|-----------|
| KYC | Individual verification | Persona |
| KYB | Business verification | Persona |

**Used By**:
- `product_expense` — Employee verification
- `product_receivables` — Customer verification

---

### infra_communications
**Purpose**: Outbound communications

| Capability | Description | Providers |
|------------|-------------|-----------|
| Email | Transactional email | SendGrid |
| SMS | Text notifications | Twilio |
| Push | Push notifications | (TBD) |

**Used By**: All products

---

### infra_documents
**Purpose**: Document processing and storage

| Capability | Description | Providers |
|------------|-------------|-----------|
| Storage | File storage | S3 |
| OCR | Document OCR | (TBD) |
| PDF | PDF generation | (TBD) |

**Used By**: All products

---

## Capability Pattern

All infrastructure apps follow the capability-adapter pattern:

```elixir
# Capability defines the interface
defmodule InfraPayments.Capabilities.CardIssuance.Behavior do
  @callback issue_card(params) :: {:ok, Card.t()} | {:error, term()}
  @callback freeze_card(card_id) :: :ok | {:error, term()}
end

# Adapter implements for specific provider
defmodule InfraPayments.Adapters.Marqeta.CardIssuance do
  @behaviour InfraPayments.Capabilities.CardIssuance.Behavior
  
  def issue_card(params), do: # Marqeta-specific implementation
end

# Registry maps providers to adapters
defmodule InfraPayments.Adapters.Registry do
  def get_adapter(:marqeta, :card_issuance) do
    InfraPayments.Adapters.Marqeta.CardIssuance
  end
end
```

---

## Reliability Patterns

### Circuit Breaker
External APIs use circuit breakers to prevent cascade failures.

### Rate Limiting
Webhook endpoints use Hammer for rate limiting.

### Retry Logic
Oban workers handle retries with exponential backoff.

### Observability
All infrastructure uses structured logging with correlation IDs.

---

## Meeting Cadence

- **Regular**: Weekly
- **Incident Review**: As needed
- **Capacity Planning**: Monthly

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Dependency Rules](../../knowledge_base/architecture/dependency_rules.md)

---

*"Solid infrastructure makes solid products possible."*
