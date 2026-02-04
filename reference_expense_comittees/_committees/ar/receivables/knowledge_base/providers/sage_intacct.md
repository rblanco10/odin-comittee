# Sage Intacct Provider Guide

> **Subcommittee**: SC07, SC08  
> **Specialist**: Patricia Chen (IS001)  
> **Last Verified**: 2026-01-14

---

## Overview

Sage Intacct is the primary ERP integration target. This guide documents API patterns and requirements.

---

## API Basics

- **Protocol**: SOAP/XML (Web Services)
- **Authentication**: Session-based with company credentials
- **Rate Limiting**: Reasonable limits, batch recommended
- **Batch Size**: Maximum 100 records per request

---

## Common Operations

### Journal Entry Push

```xml
<function controlid="create-je-001">
  <create_gltransaction>
    <journalid>ARJ</journalid>
    <datecreated>
      <year>2026</year>
      <month>01</month>
      <day>14</day>
    </datecreated>
    <gltransactionentries>
      <glentry>
        <accountno>1200</accountno>
        <trtype>1</trtype>
        <amount>100.00</amount>
      </glentry>
      <glentry>
        <accountno>4000</accountno>
        <trtype>-1</trtype>
        <amount>100.00</amount>
      </glentry>
    </gltransactionentries>
  </create_gltransaction>
</function>
```

### AR Invoice Pull

```xml
<function controlid="read-invoices-001">
  <readByQuery>
    <object>ARINVOICE</object>
    <fields>*</fields>
    <query>WHENMODIFIED &gt;= '01/01/2026'</query>
    <pagesize>100</pagesize>
  </readByQuery>
</function>
```

---

## Known Quirks

1. **Date Format**: YYYY-MM-DD only
2. **Decimal Precision**: 2 decimal places for most currency fields
3. **Dimension Values**: Must exist before use in transactions
4. **Journal Balance**: Must balance to exactly 0.00
5. **Session Timeout**: Sessions expire, implement refresh logic

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `GL-0001` | Invalid dimension | Verify dimension value exists |
| `GL-0002` | Out of balance | Check debit/credit totals |
| `XL03000001` | Session expired | Re-authenticate |

---

## Constitutional Considerations

- Decimal amounts must match Sage precision
- Batch size 100 maximum
- All pushes must be idempotent (use external keys)

---

*"Sage is powerful but particular; respect its preferences."*

