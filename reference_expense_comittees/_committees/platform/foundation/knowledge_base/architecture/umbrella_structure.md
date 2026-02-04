# Umbrella Structure

> **Type**: Architecture Reference  
> **Decision**: ADR-001  
> **Status**: APPROVED (2026-01-08)

---

## Overview

The Ember Platform is organized as an Elixir umbrella application with a strict 5-tier architecture.

---

## Physical Location

```
ashwood/                              # Workspace root
└── projects/
    └── elixir/
        └── ember_platform/           # The umbrella
            ├── mix.exs               # Umbrella config
            ├── config/               # Shared configuration
            └── apps/                 # All applications
```

---

## The 5 Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 5: WEB (web_*)                                            │
│  Phoenix applications, HTTP endpoints, LiveView                 │
│  Examples: web_internal, web_portal                             │
├─────────────────────────────────────────────────────────────────┤
│  TIER 4: PRODUCTS (product_*)                                   │
│  Customer-facing business applications                          │
│  Examples: product_receivables, product_payables, product_expense│
├─────────────────────────────────────────────────────────────────┤
│  TIER 3: DOMAIN (domain_*)                                      │
│  Shared business logic used by multiple products                │
│  Examples: domain_coding, domain_approvals, domain_audit        │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2: INFRASTRUCTURE (infra_*)                               │
│  Shared services with external integrations                     │
│  Examples: infra_workspaces, infra_payments, infra_erp          │
├─────────────────────────────────────────────────────────────────┤
│  TIER 1: CORE (core_*)                                          │
│  Pure Elixir libraries, no database, no external APIs           │
│  Examples: core_types, core_auth, core_behaviors, core_telemetry│
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete App List (21 Apps)

### Tier 1: Core Libraries

| App | Purpose |
|-----|---------|
| `core_types` | Money, Currency, Address, shared structs |
| `core_auth` | Policy definitions, roles, permissions |
| `core_behaviors` | Shared behaviors: Syncable, Auditable, Approvable |
| `core_telemetry` | Observability utilities: metrics, tracing, logging |

### Tier 2: Infrastructure Services

| App | Purpose | Key Integrations |
|-----|---------|------------------|
| `infra_workspaces` | Multi-tenancy (Workspace, Entity, User) | Foundation for all |
| `infra_payments` | Payment providers | Stripe, Dwolla, Checkbook, Marqeta |
| `infra_erp` | ERP integrations | NetSuite, Sage Intacct, QuickBooks, Dynamics |
| `infra_identity` | KYC/KYB verification | Persona, Stripe Identity |
| `infra_communications` | Email, SMS, notifications | SendGrid, Twilio |
| `infra_documents` | Document processing, OCR, storage | S3, OCR providers |

### Tier 3: Shared Domain

| App | Purpose | Used By |
|-----|---------|---------|
| `domain_coding` | GL coding, dimensions, rules engine | AP, AR, Expense |
| `domain_approvals` | Approval workflows, policies | AP, AR, Expense |
| `domain_audit` | Audit trails, Ash extension | All products |
| `domain_bulk` | Import/export operations | All products |
| `domain_compliance` | Compliance rules | All products |

### Tier 4: Product Applications

| App | Purpose |
|-----|---------|
| `product_expense` | Expense management (cards, reimbursements, receipts) |
| `product_payables` | Accounts Payable (invoices, vendors, bill pay) |
| `product_receivables` | Accounts Receivable (invoices, collections, payments) |
| `product_treasury` | Treasury management (future) |

### Tier 5: Web Applications

| App | Purpose |
|-----|---------|
| `web_internal` | Internal dashboard (employees, admins) |
| `web_portal` | Customer-facing portal (payers for AR) |

---

## Folder Structure

```
apps/
│
│# ═══ TIER 1: CORE ═══
├── core_types/
│   ├── mix.exs
│   └── lib/
│       ├── money.ex
│       ├── currency.ex
│       └── ...
├── core_auth/
├── core_behaviors/
├── core_telemetry/
│
│# ═══ TIER 2: INFRASTRUCTURE ═══
├── infra_workspaces/
│   ├── mix.exs
│   └── lib/
│       ├── domain.ex
│       ├── resources/
│       ├── services/
│       └── workers/
├── infra_payments/
│   └── lib/
│       ├── adapters/
│       ├── capabilities/
│       ├── resources/
│       ├── services/
│       ├── reactors/
│       ├── webhooks/
│       └── workers/
├── infra_erp/
├── infra_identity/
├── infra_communications/
├── infra_documents/
│
│# ═══ TIER 3: DOMAIN ═══
├── domain_coding/
├── domain_approvals/
├── domain_audit/
├── domain_bulk/
├── domain_compliance/
│
│# ═══ TIER 4: PRODUCT ═══
├── product_expense/
│   └── lib/
│       ├── cards/
│       ├── reimbursements/
│       ├── receipts/
│       ├── reports/
│       └── ...
├── product_payables/
│   └── lib/
│       ├── invoices/
│       ├── vendors/
│       ├── payments/
│       ├── matching/
│       └── ...
├── product_receivables/
│   └── lib/
│       ├── customers/
│       ├── invoices/
│       ├── payments/
│       ├── collections/
│       ├── credit/
│       ├── cash_application/
│       └── ...
├── product_treasury/
│
│# ═══ TIER 5: WEB ═══
├── web_internal/
│   └── lib/
│       └── web_internal/
│           ├── endpoint.ex
│           ├── router.ex
│           ├── components/
│           └── live/
└── web_portal/
    └── lib/
        └── web_portal/
            ├── endpoint.ex
            ├── router.ex
            └── live/
```

---

## Dependency Graph

```
                    web_internal
                         │
                         ▼
    ┌────────────────────┴────────────────────┐
    │                                         │
    ▼                                         ▼
product_expense                        product_receivables
    │                                         │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
domain_coding                domain_approvals
    │                             │
    └──────────────┬──────────────┘
                   ▼
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
infra_workspaces            infra_payments
    │                             │
    └──────────────┬──────────────┘
                   ▼
              core_types
```

---

## Related Documentation

- [Tier Naming Convention](naming_convention.md)
- [Dependency Rules](dependency_rules.md)
- [ADR-001: Umbrella Architecture](../decisions/ADR-001_umbrella_architecture.md)

---

*Last updated: 2026-01-08*
