# ERP Push Lifecycle

> **Subcommittee**: SC08  
> **Reference**: `docs/agents/architecture/lifecycles/erp_push_lifecycle/`  
> **Last Verified**: 2026-01-14

---

## Overview

The ERP push lifecycle governs the outbound synchronization of data to ERP systems (Sage, NetSuite, QuickBooks).

---

## Lifecycle States

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERP PUSH LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐    ┌─────────┐    ┌────────┐    ┌───────────┐   │
│    │ pending │───►│ queued  │───►│ posted │───►│ confirmed │   │
│    └─────────┘    └────┬────┘    └───┬────┘    └───────────┘   │
│                        │             │                          │
│                        ▼             ▼                          │
│                   ┌────────┐    ┌──────────┐                   │
│                   │ failed │    │ rejected │                   │
│                   └────────┘    └──────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Push Process

1. **Queue**: Record marked for push
2. **Batch**: Group records for efficiency
3. **Transform**: Map to ERP format
4. **Post**: Send to ERP
5. **Verify**: Confirm receipt
6. **Log**: Record push status

---

## Related Resources

| Resource | Relationship |
|----------|--------------|
| `ErpPosting` | tracks posting status |
| `ErpJournal` | journal entries |
| `AccountingEntry` | GL entries |

---

## Code References

```
lib/flame_ps_ar/ember_erp/
├── resources/erp_journal.ex
├── resources/erp_posting.ex
├── services/push_*.ex
└── reactors/push_*.ex
```

---

*"Push precisely; the GL has no patience for errors."*

