# Knowledge Base

> **Purpose**: Accumulated expertise and reference material for the AR Receivables Committee  
> **Last Verified**: 2026-01-14

---

## Structure

```
knowledge_base/
├── architecture/           # Architectural reference
│   ├── domain_boundaries.md          # All 7 domains overview
│   ├── classic_domain_breakdown.md   # Classic domain subdirectories
│   ├── events_domain.md              # Events domain (PostgreSQL)
│   ├── ember_identity_domain.md      # Identity/Auth domain
│   ├── ember_workspaces_domain.md    # Workspaces/Entity bridging
│   ├── payments_postgres_domain.md   # Payments config domain
│   ├── three_layer_model.md          # Surfaces/Arch/Foundations
│   ├── state_machines.md             # State machine rules
│   └── multitenancy.md               # Multi-tenancy patterns
├── lifecycles/             # Lifecycle documentation
│   ├── receivable_lifecycle.md       # SC01 - Receivable states
│   ├── autopay_lifecycle.md          # SC05 - Autopay states
│   ├── payments_lifecycle.md         # SC05 - Payments domain
│   ├── events_lifecycle.md           # SC09 - Capture/Dispatch
│   ├── customer_lifecycle.md         # SC02
│   ├── collections_lifecycle.md      # SC03
│   ├── fees_lifecycle.md             # SC04
│   ├── plan_lifecycle.md             # SC06
│   ├── write_to_accounting_lifecycle.md # SC10
│   ├── erp_pull_lifecycle.md         # SC07
│   └── erp_push_lifecycle.md         # SC08
├── legacy/                 # Legacy system reference
│   ├── loopback2_models.md
│   ├── column_mapping.md
│   └── status_values.md
├── patterns/               # Design patterns
│   ├── reactor_pattern.md
│   ├── service_pattern.md
│   ├── resource_pattern.md
│   └── adapter_pattern.md
├── providers/              # ERP provider guides
│   ├── sage_intacct.md
│   ├── netsuite.md
│   └── quickbooks.md
└── glossary/               # Terminology
    ├── terms.md
    └── acronyms.md
```

---

## Usage Guidelines

### Grounding Requirement

All knowledge base entries MUST:
- Reference specific code locations
- Include file paths and line numbers where applicable
- Be verified against current codebase state

### Staleness Review

Knowledge base entries are reviewed:
- On first access in any session
- Quarterly by historians
- After major refactoring efforts

### Update Authority

| Knowledge Type | Update Authority |
|----------------|------------------|
| Architecture guides | Full committee approval |
| Lifecycle documentation | Relevant subcommittee + verification |
| Legacy alignment | SC11 + verification |
| Patterns | Any member with review |
| Glossary | Any member with review |

---

## Quick Reference

### Architecture Documentation

| Topic | Location | Subcommittee |
|-------|----------|--------------|
| Domain boundaries (7 domains) | architecture/domain_boundaries.md | Full committee |
| Classic domain breakdown | architecture/classic_domain_breakdown.md | Full committee |
| Events domain | architecture/events_domain.md | SC09 |
| Ember Identity domain | architecture/ember_identity_domain.md | SC11 |
| Ember Workspaces domain | architecture/ember_workspaces_domain.md | SC11, SC15 |
| Payments (PostgreSQL) | architecture/payments_postgres_domain.md | SC05 |
| Three-layer architecture | architecture/three_layer_model.md | Full committee |
| State machine rules | architecture/state_machines.md | Full committee |
| Multi-tenancy | architecture/multitenancy.md | Full committee |

### Lifecycle Documentation

| Topic | Location | Subcommittee |
|-------|----------|--------------|
| Receivable lifecycle | lifecycles/receivable_lifecycle.md | SC01 |
| Autopay lifecycle | lifecycles/autopay_lifecycle.md | SC05 |
| Payments lifecycle | lifecycles/payments_lifecycle.md | SC05 |
| Events lifecycle | lifecycles/events_lifecycle.md | SC09 |
| Customer lifecycle | lifecycles/customer_lifecycle.md | SC02 |
| Collections lifecycle | lifecycles/collections_lifecycle.md | SC03 |
| Fees lifecycle | lifecycles/fees_lifecycle.md | SC04 |
| Plan lifecycle | lifecycles/plan_lifecycle.md | SC06 |
| Write-to-accounting | lifecycles/write_to_accounting_lifecycle.md | SC10 |
| ERP pull | lifecycles/erp_pull_lifecycle.md | SC07 |
| ERP push | lifecycles/erp_push_lifecycle.md | SC08 |

### Legacy & Patterns

| Topic | Location | Subcommittee |
|-------|----------|--------------|
| Loopback2 reference | legacy/loopback2_models.md | SC11 |
| Column mapping | legacy/column_mapping.md | SC11 |
| Status values | legacy/status_values.md | SC11 |
| Reactor pattern | patterns/reactor_pattern.md | Pattern Historian |
| Service pattern | patterns/service_pattern.md | Pattern Historian |
| Sage Intacct | providers/sage_intacct.md | SC07/SC08 |
| NetSuite | providers/netsuite.md | SC07/SC08 |
| QuickBooks | providers/quickbooks.md | SC07/SC08 |

---

## Update Protocol

When updating knowledge base:

1. **Propose change** in committee session
2. **Verify** against current codebase
3. **Get approval** from appropriate authority
4. **Update document** with date stamp
5. **Update README.md** "Last Verified" date

---

*"Knowledge shared is knowledge multiplied."*

