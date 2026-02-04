# SC10 Write-to-Accounting Charter

> **Code**: SC10  
> **Lifecycle**: write_to_accounting_lifecycle  
> **Lead**: Robert Huang (DE010)

---

## Purpose

Govern all aspects of financial posting, including GL entries, journal creation, period close integration, and reconciliation support.

---

## Scope

### Primary Jurisdiction
- Write-to-Accounting workflows
- GL entry creation
- Journal entry formats
- Period close handling
- Reconciliation reports

### Code Focus Areas

```
lib/flame_ps_ar/ember_erp/
├── resources/accounting_entry.ex
├── resources/gl_transaction.ex
└── services/write_to_accounting_*.ex
```

### Lifecycle Reference
`docs/agents/architecture/lifecycles/write_to_accounting_lifecycle/`

---

## Key Questions

1. What transactions generate GL entries?
2. How are journal entries formatted and balanced?
3. What is the period close workflow?
4. How are reconciliation discrepancies identified?
5. What audit requirements apply to accounting entries?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Robert Huang | DE010 |
| **Domain Expert** | Lisa Nakamura | DE008 |
| **Integration** | Patricia Chen | IS001 |
| **Critic** | Michael Walsh | C008 |
| **Critic** | Yuki Santos | C005 |
| **Technical** | Ken Thompson Jr. | TS005 |

---

## Constitutional Considerations

- **Decimal Precision**: All accounting amounts MUST use Decimal
- **Balancing**: Journal entries MUST balance to exactly 0.00
- **Immutability**: Posted entries cannot be modified
- **Audit Trail**: Complete audit trail required

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC05 | Payment GL entries |
| SC08 | ERP posting coordination |
| SC09 | Accounting change events |

---

*"The GL is the source of truth; treat it with reverence."*

