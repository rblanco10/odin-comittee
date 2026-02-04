# NetSuite Provider Guide

> **Subcommittee**: SC07, SC08  
> **Specialist**: Mohammed Al-Hassan (IS002)  
> **Last Verified**: 2026-01-14

---

## Overview

NetSuite integration for customers using Oracle NetSuite as their ERP.

---

## API Basics

- **Protocol**: REST or SOAP (SuiteTalk)
- **Authentication**: OAuth 2.0 or Token-based
- **Rate Limiting**: 10 requests/second
- **SuiteScript**: Server-side customization available

---

## Common Operations

### Invoice Creation (REST)

```json
POST /services/rest/record/v1/invoice
{
  "entity": {"id": "123"},
  "trandate": "2026-01-14",
  "item": {
    "items": [
      {
        "item": {"id": "456"},
        "amount": 100.00
      }
    ]
  }
}
```

### Invoice Query (SuiteQL)

```sql
SELECT id, tranid, entity, trandate, total
FROM transaction
WHERE type = 'CustInvc'
AND lastmodifieddate >= '2026-01-01'
```

---

## Known Quirks

1. **Internal IDs**: Change between sandbox and production
2. **External IDs**: Use for stable references
3. **Rate Limiting**: 10 req/sec, implement backoff
4. **SuiteScript Time**: 45 second execution limit
5. **Custom Fields**: Prefixed with `custbody_` or `custcol_`

---

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| `429` | Rate limited | Back off, retry |
| `INVALID_KEY_OR_REF` | Bad reference | Verify ID exists |
| `USER_ERROR` | Validation failed | Check request format |

---

*"NetSuite is flexible but finicky; test thoroughly."*

