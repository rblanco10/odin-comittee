# Session SC-2025-12-22-004: Push Architecture Evaluation

> **Date:** 2025-12-22
> **Status:** ✅ IMPLEMENTED
> **Outcome:** Option D (Sync-Only Mirrors) fully implemented

---

## Summary

This session evaluated the current push (outbound) architecture and produced a design proposal for **Option D: Sync-Only Mirrors**.

### Key Decision

**Push and Sync must not both write to accounting mirror tables.**

The chosen approach:
- **Push** sends data to ERP and stores `external_id` on `PushRequest` only
- **Sync** creates/updates accounting mirrors from ERP data (ERP is truth)
- **Reconciliation** links PushRequest → Mirror after sync completes

### Benefits

1. **ERP is Truth** — Mirrors always reflect actual ERP state
2. **No Conflict** — Push and sync never compete for same writes
3. **Strong Traceability** — Full bidirectional linkage for UI status

---

## Artifacts

| Artifact | Description |
|----------|-------------|
| [DESIGN-PROPOSAL-OPTION-D.md](./DESIGN-PROPOSAL-OPTION-D.md) | Complete design proposal with schema changes, new components, and implementation order |
| [ENGINEERING-HANDOFF.md](./ENGINEERING-HANDOFF.md) | Technical handoff for engineering team with deployment order, rollback plan, and edge cases |
| [TASK-ASSIGNMENTS.md](./TASK-ASSIGNMENTS.md) | Specific tasks for each engineering team member with code templates and acceptance criteria |

## Implementation Summary

**All tasks completed on 2025-12-22.**

### Files Changed

| Category | File | Changes |
|----------|------|---------|
| Migration | `priv/repo/migrations/20251222230000_add_push_sync_verification.exs` | New fields: `sync_verified_at`, `origin_push_request_id`, indexes |
| Resource | `lib/.../ember_erp/resources/push_request/push_request.ex` | Added `sync_verified_at`, `:sync_verified` status, `mark_sync_verified` action |
| Resource | `lib/.../ember_erp/resources/accounting/ap/bill.ex` | Added `origin_push_request_id`, relationship, `link_origin_push` action |
| Resource | `lib/.../ember_erp/resources/accounting/expense/expense_report.ex` | Added `origin_push_request_id`, relationship, `link_origin_push` action |
| Service | `lib/.../ember_erp/services/push_reconciliation_service.ex` | **NEW** - Core reconciliation logic |
| Worker | `lib/.../ember_erp/workers/workspace_sync_worker.ex` | Integrated `reconcile_pushes/1` after sync |
| Reactor | `lib/.../ember_erp/resources/reactors/ap/push_bill_reactor.ex` | Removed mirror writes (Option D) |
| Reactor | `lib/.../ember_erp/resources/reactors/expense/push_expense_report_reactor.ex` | Removed mirror writes (Option D) |
| Reactor | `lib/.../ember_erp/resources/reactors/ap/push_vendor_reactor.ex` | Removed mirror writes (Option D) |
| Tests | `test/.../ember_erp/services/push_reconciliation_service_test.exs` | **NEW** - Unit tests for reconciliation |

---

## Quick Reference

### New Fields

```elixir
# PushRequest
attribute :sync_verified_at, :utc_datetime_usec  # When verified by sync
# Status: :pending → :processing → :pushed → :sync_verified | :failed

# Accounting.AP.Bill (optional)
attribute :origin_push_request_id, :uuid  # Trace back to push origin
```

### New Service

```elixir
PushReconciliationService.reconcile_workspace(workspace_id)
# Called after sync to:
# 1. Match PushRequests → Mirrors by external_id
# 2. Update PushRequest.accounting_resource_id
# 3. Update Invoice.erp_bill_id
```

### UI Status Flow

```
:pending      → "Queued for sync..."
:processing   → "Syncing to ERP..."
:pushed       → "Sent to ERP ✓ (verifying...)"
:sync_verified → "Synced to ERP ✓✓"
:failed       → "Sync failed ✗"
```

---

## Implementation Order

1. Migration — Add new fields
2. Status update — Add `:sync_verified` enum
3. PushReconciliationService — New reconciliation service
4. Modify push reactors — Remove mirror writes
5. Integrate with WorkspaceSyncWorker — Call reconciliation
6. Update UI — Use new status states
7. Tests — Unit + integration

---

*Session conducted by Sync Committee, 2025-12-22*

