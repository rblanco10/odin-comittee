# ERP Pull Lifecycle

> **Subcommittee**: SC07  
> **Reference**: `docs/agents/architecture/lifecycles/erp_pull_lifecycle/`  
> **Last Verified**: 2026-01-14

---

## Overview

The ERP pull lifecycle governs the inbound synchronization of data from ERP systems (Sage, NetSuite, QuickBooks).

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERP PULL LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌──────────┐    ┌─────────┐    ┌───────────┐                │
│    │ pending  │───►│ running │───►│ completed │                │
│    └──────────┘    └────┬────┘    └───────────┘                │
│                         │                                        │
│                         ▼                                        │
│                    ┌────────┐                                   │
│                    │ failed │                                   │
│                    └────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pull Process

1. **Schedule/Trigger**: Time-based or manual
2. **Connect**: Authenticate with ERP
3. **Fetch**: Retrieve changed records
4. **Transform**: Map to local format
5. **Store**: Write to database
6. **Log**: Record sync status

---

## Related Resources

| Resource | Relationship |
|----------|--------------|
| `ErpSync` | tracks sync status |
| `ErpInvoice` | pulled invoices |
| `Customer` | updated from ERP |

---

## Code References

```
lib/flame_ps_ar/ember_erp/
├── resources/erp_sync.ex
├── resources/erp_invoice.ex
├── services/pull_*.ex
└── reactors/pull_*.ex
```

---

*"Pull with precision; errors propagate."*

