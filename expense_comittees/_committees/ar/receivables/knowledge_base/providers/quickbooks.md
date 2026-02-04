# QuickBooks Provider Guide

> **Subcommittee**: SC07, SC08  
> **Specialist**: Olga Petrov (IS003)  
> **Last Verified**: 2026-01-14

---

## Overview

QuickBooks Online integration for customers using Intuit QuickBooks.

---

## API Basics

- **Protocol**: REST (JSON)
- **Authentication**: OAuth 2.0
- **Rate Limiting**: Varies by operation
- **Sandbox**: Available for testing

---

## Common Operations

### Invoice Creation

```json
POST /v3/company/{companyId}/invoice
{
  "CustomerRef": {
    "value": "123"
  },
  "Line": [
    {
      "Amount": 100.00,
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": {
          "value": "456"
        }
      }
    }
  ]
}
```

### Invoice Query

```
GET /v3/company/{companyId}/query?query=
SELECT * FROM Invoice WHERE MetaData.LastUpdatedTime > '2026-01-01'
```

---

## Known Quirks

1. **QBO vs QBD**: APIs differ significantly
2. **OAuth Refresh**: Tokens expire, implement refresh
3. **Name Uniqueness**: Customer/vendor names must be unique
4. **Minor Versions**: Include for consistent behavior
5. **Decimal Precision**: Limited compared to other ERPs

---

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| `6000` | Business validation error | Check request data |
| `3200` | Element id not found | Verify reference exists |
| `610` | Object not found | Re-query and retry |

---

*"QuickBooks is simple on the surface, complex underneath."*

