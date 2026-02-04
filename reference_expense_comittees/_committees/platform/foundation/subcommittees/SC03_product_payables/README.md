# SC03: Product Payables Subcommittee

> **Code**: SC03  
> **Lead**: Derek Patterson  
> **Co-Lead**: Margaret O'Sullivan  
> **Focus**: Accounts Payable product architecture and migration

---

## Mission

The Product Payables Subcommittee is responsible for the architecture of `product_payables` — the Accounts Payable application migrated from `flame_teampay_payables/ember_ap_invoices`.

We ensure that the AP product:
1. Migrates cleanly from the legacy flame structure
2. Maintains existing functionality during migration
3. Integrates with shared infrastructure
4. Prepares for future enhancements

---

## Jurisdiction

### Primary Responsibilities

- Guide AP migration from legacy flame
- Define AP domain models in new structure
- Ensure backward compatibility during migration
- Coordinate with Expense and AR on shared needs
- Review AP-related architectural decisions

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Internal AP resource design | Subcommittee approval |
| Migration approach | Subcommittee + SC06 (Migration) |
| AP → Infrastructure integration | Subcommittee + SC05 |
| Cross-product integration | Full committee |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Derek Patterson | Lead | Invoice Processing |
| Margaret O'Sullivan | Co-Lead | Vendor Management |
| Thomas Müller | Infra Liaison | Payments (disbursement) |
| Jennifer Okafor | Infra Liaison | ERP integration |
| Dr. Robert Fitzgerald | Domain Liaison | GL Coding |
| Dr. Patricia Nguyen | Domain Liaison | Approvals |
| Carlos Rivera | Migration Liaison | Legacy migration |
| Sebastian Volkov | Critic | Performance |

---

## AP Domain Model

### Core Domains (Migrating from ember_ap_invoices)

| Domain | Purpose | Key Resources |
|--------|---------|---------------|
| Vendors | Vendor management | Vendor, VendorContact |
| Invoices | AP invoice lifecycle | Invoice, InvoiceLine |
| Payments | Bill payment | BillPayment, PaymentBatch |
| Matching | PO/Invoice matching | MatchingRule, MatchResult |
| Approvals | Payment approvals | (uses domain_approvals) |

---

## Migration Status

### From flame_teampay_payables

| Legacy Module | Target App | Status |
|---------------|------------|--------|
| `ember_ap_invoices` | `product_payables` | ⏳ Planned |
| `ember_vendors` | `product_payables` | ⏳ Planned |
| `ember_bill_pay` | `product_payables` | ⏳ Planned |

### Shared Modules → Infrastructure

| Legacy Module | Target App | Status |
|---------------|------------|--------|
| `ember_payments` | `infra_payments` | ⏳ Planned |
| `ember_erp` | `infra_erp` | ⏳ Planned |
| `ember_workspaces` | `infra_workspaces` | ⏳ Planned |

### Shared Modules → Domain

| Legacy Module | Target App | Status |
|---------------|------------|--------|
| `ember_coding` | `domain_coding` | ⏳ Planned |
| `ember_approvals` | `domain_approvals` | ⏳ Planned |

---

## Infrastructure Dependencies

| Infra App | AP Usage |
|-----------|----------|
| `infra_payments` | Disburse payments (ACH, check, wire) |
| `infra_erp` | Sync invoices, vendors, payments |
| `infra_documents` | Invoice OCR, document storage |
| `infra_workspaces` | Multi-tenancy |

---

## Coordination with Other Products

### Shared with AR
- GL Coding (via `domain_coding`)
- Approval workflows (via `domain_approvals`)
- Audit trails (via `domain_audit`)

### Shared with Expense
- Vendor master data
- Payment processing
- Approval workflows

---

## Meeting Cadence

- **Regular**: Weekly
- **Migration Review**: Weekly with SC06
- **Integration Review**: Bi-weekly with SC05

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Migration Strategy](../../knowledge_base/migration/) (TBD)

---

*"Efficient payables management is the foundation of healthy vendor relationships."*
