# Classic Domain Breakdown

> **Module**: `FlamePsAr.Classic.Domain`  
> **Location**: `lib/flame_ps_ar/classic/`  
> **Database**: MySQL  
> **Tenant**: `owner_id` (KSUID)  
> **Last Verified**: 2026-01-14

---

## Overview

The Classic Domain is the largest domain in `flame_ps_ar`, containing all legacy MySQL resources that map to the existing Loopback2 tables.

**Total**: ~300+ resources across 20+ subdirectories.

---

## Subdirectory Catalog

### Core AR Resources

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `receivables/` | 7 | Receivable, ReceivableAttachment, ReceivableFund, etc. |
| `customers/` | 13 | Payer, PayerCustomer, PayerProfile, CustomerAction, etc. |
| `collections/` | 6 | Collection, CollectionPlan, CollectionAction, InvoiceGroup |
| `fees/` | 6 | Fee, FeeSetting, FeeSettingPlan, CollectedFee, etc. |

### Accounting & Ledger

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `accounting/` | 11 | AccountingAccount, AccountingEntry, AccountingEscrow, etc. |
| `ledger/` | 11 | Ledger, LedgerAccount, LedgerTransaction, BalanceEntry, etc. |

### Accounts & Plans

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `accounts/resources/` | 7 | Customer, Merchant, Settings, LegalEntity, etc. |
| `accounts/plan/` | 9 | Plan, PlanVersion, PlanPackage, PlanState, etc. |

### Transfers & Payments

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `transfers/` | 16 | Transfer, Wire, Withdrawal, Deposit, Recoup, etc. |
| `payables/` | 37 | AP resources (ApPayout, ApVendor, ApBudget, etc.) |

### Integrations

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `integrations/erp/` | 48 | NetSuite, Sage, Xero, Acumatica integrations |
| `integrations/payment_processors/` | 37 | Stripe, Vantiv integrations |
| `integrations/other/` | 5 | Check, Zapier, PaystandLiteSync |

### Reporting

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `reporting/` | 33 | Report, Statement, various report types and records |

### Security & System

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `security/` | 27 | Access, Role, User, OAuth, TwoFactor, etc. |
| `system/` | 23 | Action, Event, Resource, Trigger, Job, etc. |

### Other

| Directory | Resources | Description |
|-----------|-----------|-------------|
| `adjustments/` | 16 | Adjustment, Connection, DynamicDiscounting, etc. |
| `communications/` | 7 | EmailConfig, EmailTemplate, Mandrill, etc. |
| `defi/` | 3 | DeFi, DefiAccount, DefiTransfer |
| `disputes/` | 2 | Dispute, Refund |
| `legal/` | 3 | Assurety, Certification, CertificationStorage |
| `miscellaneous/` | 17 | Address, Company, Contact, CustomField, Vendor, etc. |
| `paystand_services/` | 4 | PsCheckFundEscrow, PsError, etc. |
| `subscriptions/` | 2 | PluginSubscription, Preset |

---

## Resource Count by Directory

```
classic/
├── accounting/resources/        [11 resources]
├── accounts/
│   ├── plan/resources/          [9 resources]
│   └── resources/               [7 resources]
├── adjustments/resources/       [16 resources]
├── collections/resources/       [6 resources]
├── communications/resources/    [7 resources]
├── customers/resources/         [13 resources]
├── defi/resources/              [3 resources]
├── disputes/resources/          [2 resources]
├── fees/resources/              [6 resources]
├── integrations/
│   ├── erp/resources/           [48 resources]
│   ├── other/resources/         [5 resources]
│   └── payment_processors/      [37 resources]
├── ledger/resources/            [11 resources]
├── legal/resources/             [3 resources]
├── miscellaneous/resources/     [17 resources]
├── payables/resources/          [37 resources]
├── paystand_services/resources/ [4 resources]
├── receivables/resources/       [7 resources]
├── reporting/resources/         [33 resources]
├── security/resources/          [27 resources]
├── subscriptions/resources/     [2 resources]
├── system/resources/            [23 resources]
└── transfers/resources/         [16 resources]
                                ─────────────
                                 ~310 resources
```

---

## Subcommittee Ownership by Directory

| Directory | Subcommittee | Lead |
|-----------|--------------|------|
| `receivables/` | SC01 | Jonathan Blake |
| `customers/` | SC02 | Rebecca Morrison |
| `collections/` | SC03 | Charles Wright |
| `fees/` | SC04 | Diana Foster |
| `accounts/plan/` | SC06 | Kevin O'Brien |
| `integrations/erp/` | SC07, SC08 | Thomas Grant, Lisa Nakamura |
| `accounting/`, `ledger/` | SC10 | Robert Huang |
| `security/`, `system/` | SC11 | Dr. Victor Kozlov |
| `reporting/` | SC12 | Priya Nakamura |
| `transfers/`, `payables/` | Cross-cutting | Multiple |

---

## Supporting Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `KSUID` | `classic/ksuid.ex` | KSUID generation for primary keys |
| `PolymorphicResource` | `classic/calculations/` | Polymorphic resource resolution |
| `JsonString` | `classic/types/` | Custom JSON string type |

---

## Context Modules

| Module | Location | Purpose |
|--------|----------|---------|
| `Customers` | `classic/customers/customers.ex` | Customer query context |
| `Receivables` | `classic/receivables/receivables.ex` | Receivable query context |

---

## Legacy Compatibility

All resources in the Classic domain:
- Map to existing MySQL tables with exact names
- Use `source(:camelCaseName)` for column mapping
- Preserve Loopback2 compatibility
- Use `owner_id` (KSUID) for multitenancy

---

## Constitutional Considerations

- **Legacy Compatibility**: All tables readable by Loopback2
- **Column Mapping**: snake_case Elixir → camelCase MySQL
- **Decimal Precision**: Financial fields use `{:decimal, precision: 24, scale: 8}`
- **Tenant Isolation**: `owner_id` required on all resources
- **Index Coverage**: Custom indexes for performance-critical queries

---

*"The Classic domain is the foundation upon which we build."*
