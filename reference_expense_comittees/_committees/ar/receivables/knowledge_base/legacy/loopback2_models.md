# Loopback2 Models Reference

> **Subcommittee**: SC11  
> **Reference**: `roadrunner_samples/`  
> **Last Verified**: 2026-01-14

---

## Overview

The legacy system uses Loopback2 framework with MySQL. All Ash implementations in the Classic domain MUST be compatible with these model definitions.

---

## Model Location

```
roadrunner_samples/
├── common/models/          # Loopback2 model definitions
│   ├── receivable.json
│   ├── customer.json
│   ├── payment.json
│   └── ...
```

---

## Key Model Patterns

### Model Definition Structure

```json
{
  "name": "Receivable",
  "base": "PersistedModel",
  "idInjection": false,
  "properties": {
    "id": {
      "type": "string",
      "id": true,
      "required": true
    },
    "ownerId": {
      "type": "string",
      "required": true
    },
    "customerId": {
      "type": "string",
      "required": true
    },
    "amount": {
      "type": "number",
      "required": true
    },
    "status": {
      "type": "string",
      "default": "created"
    }
  }
}
```

---

## Column Naming Convention

Loopback2 uses camelCase for property names. When mapping to MySQL:

| Loopback2 Property | MySQL Column | Ash Attribute |
|-------------------|--------------|---------------|
| `ownerId` | `ownerId` | `owner_id` with `source: "ownerId"` |
| `customerId` | `customerId` | `customer_id` with `source: "customerId"` |
| `createdAt` | `createdAt` | `created_at` with `source: "createdAt"` |

---

## ID Format (KSUID)

Loopback2 models use KSUID for primary keys:
- 27 characters
- Lexicographically sortable
- Includes timestamp component

---

## Compatibility Checklist

When creating new Ash resources:

- [ ] Verify property names match model definition
- [ ] Add `source:` option for camelCase mapping
- [ ] Confirm data types match
- [ ] Verify status enums match
- [ ] Test round-trip: create in Ash, read in Loopback2

---

*"Legacy models are documentation; respect them."*

