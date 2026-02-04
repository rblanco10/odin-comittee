# Status Values Reference

> **Subcommittee**: SC11  
> **Last Verified**: 2026-01-14

---

## Overview

Status values must match exactly between Ash and Loopback2. Any mismatch can cause the legacy system to fail silently.

---

## Standard Status Values

Per Article II, Section 2.4:

| Status | Description | Allowed Transitions |
|--------|-------------|---------------------|
| `created` | Initial state | → active |
| `active` | Normal operation | → inactive |
| `inactive` | Soft-deleted | → active |

⛔ **"removed" is NOT valid** - Use "inactive" for soft deletes

---

## Resource-Specific Statuses

### Receivable

| Status | Description |
|--------|-------------|
| `draft` | Being composed |
| `pending` | Ready to post |
| `posted` | Active receivable |
| `partial` | Partially paid |
| `paid` | Fully paid |
| `void` | Cancelled |

### Payment

| Status | Description |
|--------|-------------|
| `pending` | Initiated |
| `processing` | In progress |
| `completed` | Successful |
| `failed` | Rejected |
| `refunded` | Reversed |

### Collection Plan

| Status | Description |
|--------|-------------|
| `created` | Initial |
| `active` | In progress |
| `completed` | Finished |
| `cancelled` | Aborted |

---

## Legacy Compatibility Check

When introducing new status values:

1. Check Loopback2 model for existing enum
2. Verify legacy code handles the status
3. Test legacy reads of new status
4. Document in knowledge base

---

## Status Implementation

```elixir
attribute :status, :atom do
  constraints [one_of: [:created, :active, :inactive]]
  default :created
end
```

---

*"Statuses are contracts; breaking them breaks trust."*

