# SC08 ERP Push Charter

> **Code**: SC08  
> **Lifecycle**: erp_push_lifecycle  
> **Lead**: Lisa Nakamura (DE008)

---

## Purpose

Govern all aspects of outbound ERP synchronization, including pushing payments, journal entries, and AR data to Sage Intacct, NetSuite, and QuickBooks.

---

## Scope

### Primary Jurisdiction
- `FlamePsAr.EmberErp` push operations
- Journal entry creation
- Payment posting
- Dimension mapping for GL
- Batch posting strategies

### Code Focus Areas

```
lib/flame_ps_ar/ember_erp/
├── resources/erp_journal.ex
├── resources/erp_posting.ex
├── services/push_*.ex
└── reactors/push_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/erp_push_lifecycle/`

---

## Key Questions

1. How are journal entries formatted for each ERP?
2. What is the batch posting size limit?
3. How are posting failures handled?
4. What is the retry strategy?
5. How is posting verification performed?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Lisa Nakamura | DE008 |
| **Domain Expert** | Robert Huang | DE010 |
| **Integration** | Patricia Chen | IS001 |
| **Integration** | Mohammed Al-Hassan | IS002 |
| **Critic** | Michael Walsh | C008 |
| **Critic** | Elena Volkov | C003 |
| **Technical** | Ken Thompson Jr. | TS005 |

---

## Constitutional Considerations

- **Decimal Precision**: Journal entries must use correct decimal precision
- **Balancing**: All journal entries MUST balance to exactly 0.00
- **Error Recovery**: Robust handling of posting failures
- **Audit Trail**: Complete audit trail for all postings

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC05 | Payment posting coordination |
| SC07 | Bidirectional sync coordination |
| SC10 | GL posting coordination |
| SC09 | Change event tracking |

---

*"Push precisely; the GL has no tolerance for errors."*

