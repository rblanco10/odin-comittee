# SC04: Product Expense Subcommittee

> **Code**: SC04  
> **Lead**: Amanda Sullivan  
> **Co-Lead**: Christopher Zhang  
> **Focus**: Expense management product architecture and migration

---

## Mission

The Product Expense Subcommittee is responsible for the architecture of `product_expense` — the Expense Management application migrated from `flame_teampay_payables/ember_expense`.

We ensure that the Expense product:
1. Migrates cleanly from the legacy flame structure
2. Maintains card issuance and management capabilities
3. Integrates with shared infrastructure
4. Supports the modern expense UI (V2)

---

## Jurisdiction

### Primary Responsibilities

- Guide Expense migration from legacy flame
- Define Expense domain models in new structure
- Coordinate card issuance with infrastructure
- Review Expense-related architectural decisions
- Support Expense V2 UI development

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| Internal Expense resource design | Subcommittee approval |
| Migration approach | Subcommittee + SC06 (Migration) |
| Expense → Infrastructure integration | Subcommittee + SC05 |
| Cross-product integration | Full committee |

---

## Members

| Name | Role | Expertise |
|------|------|-----------|
| Amanda Sullivan | Lead | Cards, Policies |
| Christopher Zhang | Co-Lead | Reimbursements |
| Thomas Müller | Infra Liaison | Card issuance (Marqeta) |
| Dr. Robert Fitzgerald | Domain Liaison | GL Coding |
| Dr. Patricia Nguyen | Domain Liaison | Approvals |
| David Kim | Infra Liaison | Receipt processing |
| Carlos Rivera | Migration Liaison | Legacy migration |
| Lisa Park | Web Liaison | Expense V2 UI |

---

## Expense Domain Model

### Core Domains (Migrating from ember_expense)

| Domain | Purpose | Key Resources |
|--------|---------|---------------|
| Cards | Card issuance/management | Card, CardRequest, CardSpend |
| Reimbursements | Employee reimbursements | Reimbursement, ReimbursementLine |
| Receipts | Receipt capture/matching | Receipt, ReceiptMatch |
| Reports | Expense reports | ExpenseReport, ReportLine |
| Policies | Spending policies | SpendingPolicy, PolicyRule |
| Budgets | Budget tracking | Budget, BudgetAllocation |

---

## Migration Status

### From flame_teampay_payables

| Legacy Module | Target App | Status |
|---------------|------------|--------|
| `ember_expense` | `product_expense` | ⏳ Planned |
| `ember_cards` | `product_expense` | ⏳ Planned |
| `ember_receipts` | `product_expense` | ⏳ Planned |

---

## Infrastructure Dependencies

| Infra App | Expense Usage |
|-----------|---------------|
| `infra_payments` | Card issuance (Marqeta), reimbursement disbursement |
| `infra_documents` | Receipt OCR, storage |
| `infra_communications` | Expense notifications |
| `infra_workspaces` | Multi-tenancy, user context |

---

## Expense V2 Considerations

The Expense V2 UI uses a distinct design system (zkfold-inspired dark theme). Architectural considerations:

- **LiveView Components**: Modular, reusable
- **State Management**: Efficient for large expense lists
- **Real-time Updates**: Card transactions, approvals
- **Performance**: Fast pagination, filtering

---

## Meeting Cadence

- **Regular**: Weekly
- **Migration Review**: Weekly with SC06
- **UI Review**: Bi-weekly with web specialists

---

## Related Documentation

- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)
- [Expense V2 Design](../../knowledge_base/ui/) (TBD)

---

*"Expense management done right: fast, compliant, and user-friendly."*
