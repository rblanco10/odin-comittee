# SC07 ERP Pull Charter

> **Code**: SC07  
> **Lifecycle**: erp_pull_lifecycle  
> **Lead**: Thomas Grant (DE007)

---

## Purpose

Govern all aspects of inbound ERP synchronization, including pulling invoices, customers, and reference data from Sage Intacct, NetSuite, and QuickBooks.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.EmberErp` pull operations
- ERP invoice sync
- Customer data pull
- Dimension and metadata sync
- Conflict resolution

### Code Focus Areas

```
lib/flame_ps_ar/ember_erp/
├── resources/erp_sync.ex
├── resources/erp_invoice.ex
├── services/pull_*.ex
└── reactors/pull_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/erp_pull_lifecycle/`

---

## Key Questions

1. How is pull scheduling configured?
2. What is the data transformation pipeline?
3. How are conflicts between source and target resolved?
4. What error handling exists for failed pulls?
5. How is sync status tracked?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Thomas Grant | DE007 |
| **Integration** | Patricia Chen | IS001 |
| **Integration** | Mohammed Al-Hassan | IS002 |
| **Integration** | Olga Petrov | IS003 |
| **Critic** | Michael Walsh | C008 |
| **Critic** | Elena Volkov | C003 |
| **Technical** | Ken Thompson Jr. | TS005 |

---

## Constitutional Considerations

- **Tenant Isolation**: Pull operations scoped to workspace
- **Data Integrity**: Maintain referential integrity after pull
- **Error Recovery**: Graceful handling of partial failures
- **Performance**: Efficient batch processing

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Receivable sync from ERP invoices |
| SC02 | Customer sync from ERP |
| SC08 | Bidirectional sync coordination |
| SC11 | Legacy alignment for pulled data |

---

*"Pull with precision; sync with confidence."*

