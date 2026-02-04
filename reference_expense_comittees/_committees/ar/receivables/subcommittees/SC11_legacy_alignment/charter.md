# SC11 Legacy Alignment Charter

> **Code**: SC11  
> **Focus**: Cross-cutting (Loopback2 compatibility)  
> **Lead**: Dr. Victor Kozlov (C001)

---

## Purpose

Ensure all AR implementations maintain compatibility with the legacy Loopback2/roadrunner system that shares the same MySQL database.

---

## Scope

### Primary Jurisdiction
- Loopback2 model compatibility
- Column name mapping (camelCase)
- Data type compatibility
- Status value alignment
- Legacy API behavior

### Reference Areas

```
roadrunner_samples/
├── common/models/          # Loopback2 model definitions
│   ├── receivable.json
│   ├── customer.json
│   └── ...
```

---

## Key Questions

1. Will Loopback2 read records created by Ash correctly?
2. Are column names mapped correctly with `source:` option?
3. Do status values match legacy expectations?
4. Are data types compatible?
5. Are timestamps and KSUIDs formatted correctly?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Dr. Victor Kozlov | C001 |
| **Historian** | Samuel Reed | H003 |
| **Integration** | James O'Connor | IS004 |
| **Technical** | Bjarne Stroustrup II | TS004 |
| **Technical** | Barbara Liskov II | TS007 |

---

## Verification Checklist

For every Classic domain change:

```markdown
## Legacy Alignment Checklist

- [ ] Column names match Loopback2 model definition
- [ ] `source:` option used for camelCase mapping
- [ ] Data types match legacy (especially dates, decimals)
- [ ] Status values exist in legacy enum
- [ ] Timestamps in ISO format
- [ ] KSUIDs properly formatted
- [ ] Nullable fields match legacy behavior
- [ ] Default values compatible
```

---

## Constitutional Authority

Per Article II, Section 2.1:
- SC11 has authority to **BLOCK** any change that breaks legacy compatibility
- Exceptions require Human Director override

---

## Coordination

| With SC | On Topic |
|---------|----------|
| All Classic Domain (SC01-SC06) | Legacy alignment verification |
| SC14 | Legacy compatibility testing |
| SC15 | Migration planning |

---

*"The legacy system doesn't complain; it just silently breaks."*

