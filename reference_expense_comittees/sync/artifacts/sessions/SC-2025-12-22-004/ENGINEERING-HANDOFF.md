# Engineering Handoff: Option D Push/Sync Separation

> **Session:** SC-2025-12-22-004
> **Date:** 2025-12-22
> **Audience:** Engineering team implementing Option D
> **Priority:** HIGH — Resolves push/sync conflict identified as P0 gap

---

## Quick Context

**What:** Separate push and sync responsibilities so they never conflict on accounting mirror writes.

**Why:** Currently both push and sync write to `Accounting.AP.Bill` (and other mirrors), causing data conflicts and breaking the "ERP is truth" principle.

**Key Principle:** 
- **Push** sends to ERP → stores `external_id` on `PushRequest` only
- **Sync** creates/updates mirrors from ERP → mirrors always reflect ERP truth
- **Reconciliation** links them together after sync

---

## Deployment Order (Critical)

```
PHASE 1: Schema Changes (Deploy together)
─────────────────────────────────────────
1. Migration: add_push_verification_fields
   • PushRequest: sync_verified_at, update status enum
   • Accounting.AP.Bill: origin_push_request_id
2. Deploy resource changes (PushRequest, Bill)

⚠️  DO NOT modify reactors until Phase 1 is complete

PHASE 2: Push Reactor Changes (Deploy together)
─────────────────────────────────────────
3. Modify all 13 push reactors:
   • Remove mirror creation steps
   • Update PushRequest with external_id only
4. Create PushReconciliationService
5. Integrate with WorkspaceSyncWorker

PHASE 3: Testing & Verification
─────────────────────────────────────────
6. Integration tests for full push → sync → reconcile flow
7. Manual verification in staging
```

---

## What Changes

### Before (Current Behavior)

```elixir
# PushBillReactor - CURRENT
step :push_to_erp do
  run fn ..., _context ->
    # Push to ERP, get external_id
    CapabilityRouter.push(...)
  end
end

step :update_accounting_mirror do  # ← PROBLEM
  run fn %{push_result: push_result}, _context ->
    # Creates or updates Accounting.AP.Bill
    if existing_mirror do
      Ash.update(Bill, mirror_id, %{external_id: push_result.external_id, ...})
    else
      Ash.create(Bill, %{external_id: push_result.external_id, amount: ..., vendor: ...})
    end
  end
end

step :link_source_to_mirror do  # ← PROBLEM
  run fn ..., _context ->
    # Links Invoice → Bill
    Ash.update(Invoice, invoice_id, %{erp_bill_id: bill.id})
  end
end
```

### After (Option D)

```elixir
# PushBillReactor - OPTION D
step :push_to_erp do
  run fn ..., _context ->
    # Push to ERP, get external_id (unchanged)
    CapabilityRouter.push(...)
  end
end

step :update_push_request_with_result do  # ← NEW
  run fn %{push_result: push_result, push_request: push_request}, _context ->
    # ONLY update PushRequest - NO mirror touch
    Ash.update(push_request, %{
      status: :pushed,
      external_id: push_result.external_id,
      processed_at: DateTime.utc_now()
    }, authorize?: false)
  end
end

# REMOVED: step :update_accounting_mirror
# REMOVED: step :link_source_to_mirror
# Reason: Sync + Reconciliation handles this now
```

---

## New Components

### 1. PushReconciliationService

**File:** `lib/flame_teampay_payables/ember_erp/services/push_reconciliation_service.ex`

**Purpose:** After sync completes, match pushed records to their synced mirrors.

**Algorithm:**
```
FOR each PushRequest WHERE status = :pushed AND accounting_resource_id IS NULL:
  1. Look up mirror by external_id
  2. IF found:
     - Update PushRequest.accounting_resource_id = mirror.id
     - Update PushRequest.sync_verified_at = now()
     - Update PushRequest.status = :sync_verified
     - Update mirror.origin_push_request_id = push_request.id (optional)
     - Update source resource (Invoice.erp_bill_id = mirror.id)
  3. IF not found:
     - Log warning (mirror not yet synced, will retry next run)
```

### 2. Integration Point

**File:** `lib/flame_teampay_payables/ember_erp/workers/workspace_sync_worker.ex`

**Change:** Add reconciliation call after sync completes:

```elixir
defp process_workspace(workspace_id) do
  with {:ok, _} <- run_sync_reactor(workspace_id),
       {:ok, _} <- run_bridge_if_enabled(workspace_id),
       {:ok, stats} <- reconcile_pushes(workspace_id) do  # ← ADD
    {:ok, stats}
  end
end

defp reconcile_pushes(workspace_id) do
  PushReconciliationService.reconcile_workspace(workspace_id)
end
```

---

## Schema Changes

### PushRequest

```elixir
# attributes do block - ADD:
attribute :sync_verified_at, :utc_datetime_usec,
  allow_nil?: true,
  public?: true,
  description: "When sync verified this push (mirror created/matched)"

# MODIFY status constraints:
attribute :status, :atom, allow_nil?: false, default: :pending,
  constraints: [one_of: [:pending, :processing, :pushed, :sync_verified, :failed, :skipped]]
  #                                                       ↑ NEW STATUS
```

### Accounting.AP.Bill (and other mirrors)

```elixir
# attributes do block - ADD:
attribute :origin_push_request_id, :uuid,
  allow_nil?: true,
  public?: true,
  description: "PushRequest that triggered creation (if any)"
```

---

## Migration

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddPushSyncVerification do
  use Ecto.Migration

  def change do
    # PushRequest changes
    alter table(:ember_erp_push_requests) do
      add :sync_verified_at, :utc_datetime_usec
    end

    # Accounting.AP.Bill changes
    alter table(:ember_erp_accounting_ap_bills) do
      add :origin_push_request_id, :uuid
    end

    # Index for efficient reconciliation queries
    create index(:ember_erp_push_requests, [:external_id, :status],
      where: "status = 'pushed' AND accounting_resource_id IS NULL",
      name: "push_requests_awaiting_reconciliation_idx")

    create index(:ember_erp_accounting_ap_bills, [:origin_push_request_id],
      name: "ap_bills_origin_push_idx")
  end
end
```

---

## Push Reactors to Modify

All 13 push reactors need the same pattern change:

| Domain | Reactor | File Path |
|--------|---------|-----------|
| AP | PushBillReactor | `ember_erp/resources/reactors/ap/push_bill_reactor.ex` |
| AP | PushBillLineItemReactor | `ember_erp/resources/reactors/ap/push_bill_line_item_reactor.ex` |
| AP | PushAPPaymentReactor | `ember_erp/resources/reactors/ap/push_ap_payment_reactor.ex` |
| AP | PushAPPaymentApplicationReactor | `ember_erp/resources/reactors/ap/push_ap_payment_application_reactor.ex` |
| AP | PushCardTransactionReactor | `ember_erp/resources/reactors/ap/push_card_transaction_reactor.ex` |
| AP | PushVendorReactor | `ember_erp/resources/reactors/ap/push_vendor_reactor.ex` |
| Expense | PushExpenseReportReactor | `ember_erp/resources/reactors/expense/push_expense_report_reactor.ex` |
| Expense | PushExpenseLineItemReactor | `ember_erp/resources/reactors/expense/push_expense_line_item_reactor.ex` |
| Expense | PushCardTransactionReactor | `ember_erp/resources/reactors/expense/push_card_transaction_reactor.ex` |
| Expense | PushVendorCreditReactor | `ember_erp/resources/reactors/expense/push_vendor_credit_reactor.ex` |
| Journal | PushJournalEntryReactor | `ember_erp/resources/reactors/journal/push_journal_entry_reactor.ex` |
| Documents | PushReceiptFileReactor | `ember_erp/resources/reactors/documents/push_receipt_file_reactor.ex` |

**Pattern for each:**
1. Find and remove `step :update_accounting_mirror`
2. Find and remove `step :link_source_to_mirror` 
3. Add `step :update_push_request_with_result` after `:push_to_erp`
4. Update compensation logic (no mirror rollback needed)

---

## Testing Strategy

### Unit Tests

**PushReconciliationService:**
```elixir
# Test cases:
- reconcile_workspace/1 with no unverified pushes → {:ok, {0, 0}}
- reconcile_workspace/1 with 3 pushes, 3 mirrors → {:ok, {3, 0}}
- reconcile_workspace/1 with 3 pushes, 2 mirrors → {:ok, {2, 1}} (1 pending)
- reconcile_push_request/2 links PushRequest → Mirror correctly
- reconcile_push_request/2 updates Invoice.erp_bill_id
- find_mirror_by_external_id/2 returns correct mirror
- entity_type routing works for all 13 types
```

**Modified Push Reactors:**
```elixir
# Test cases for each reactor:
- Successful push → PushRequest status = :pushed
- Successful push → PushRequest external_id set
- Successful push → NO Accounting.* record created (verify with Ash.read)
- Successful push → NO Invoice.erp_bill_id set
- Failed push → PushRequest status = :failed
- Failed push → compensation runs, no side effects
```

### Integration Tests

```elixir
# End-to-end scenarios:
1. Invoice approved → Push completes → PushRequest.external_id set
2. Sync runs → Accounting.AP.Bill created
3. Reconciliation runs → PushRequest.accounting_resource_id set
4. Reconciliation runs → Invoice.erp_bill_id set
5. Second sync → Mirror updated, links preserved

# Timing scenarios:
- Push completes, sync hasn't run → PushRequest.status = :pushed
- Sync runs → PushRequest.status = :sync_verified
```

### Manual Testing Checklist

```
□ Create ERP connection
□ Create Invoice, approve it → triggers push
□ Verify PushRequest created with status :pending
□ Verify PushRequest processed, status :pushed, external_id set
□ Verify NO Accounting.AP.Bill created yet
□ Wait for sync (or trigger manually)
□ Verify Accounting.AP.Bill created with matching external_id
□ Verify reconciliation ran:
  □ PushRequest.accounting_resource_id = Bill.id
  □ PushRequest.sync_verified_at set
  □ PushRequest.status = :sync_verified
  □ Invoice.erp_bill_id = Bill.id
□ Open Invoice in UI, verify "Synced to ERP ✓✓" status
```

---

## Rollback Plan

### If Push Reactor Changes Cause Issues

1. **Revert reactor changes** — Restore mirror creation steps
2. **Keep schema changes** — No harm from extra fields
3. **Disable reconciliation** — Comment out call in WorkspaceSyncWorker

### If Reconciliation Causes Issues

1. **Disable in WorkspaceSyncWorker** — Comment out `reconcile_pushes/1` call
2. Pushes will stay at `:pushed` status (acceptable)
3. Users see "Sent to ERP ✓ (verifying...)" indefinitely
4. Links can be added manually via console if urgent

---

## Performance Considerations

### Reconciliation Query

```elixir
# Efficient: Uses index on (external_id, status)
PushRequest
|> Ash.Query.filter(status == :pushed)
|> Ash.Query.filter(is_nil(accounting_resource_id))
|> Ash.Query.filter(not is_nil(external_id))
|> Ash.Query.limit(500)  # Process in batches
```

### Expected Performance

| Metric | Expected | Alert Threshold |
|--------|----------|-----------------|
| Reconciliations per run | 0-50 | > 200 (unusual) |
| Duration | 100ms-2s | > 10s |
| Memory | < 50MB | > 200MB |

---

## Monitoring & Alerting

### Key Metrics

```elixir
# In PushReconciliationService
PrometheusMetricsService.emit_counter("push_reconciliations_total", count, %{
  status: "success" | "not_found" | "error"
})
PrometheusMetricsService.emit_histogram("push_reconciliation_duration_ms", duration)
```

### Suggested Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Reconciliation backlog | > 100 unverified after 10 min | Warning |
| Reconciliation errors | 5+ errors in 10 min | Warning |
| Push stuck at :pushed | > 30 min without :sync_verified | Info |

### Log Queries (Loki)

```
# Find reconciliation issues
{app="flame_teampay_payables"} |= "PushReconciliation" |= "error"

# Track reconciliation activity
{app="flame_teampay_payables"} |= "Reconciled" |= "PushRequest"
```

---

## Known Edge Cases

### 1. ERP Rejects Push But Returns Success

**Scenario:** ERP API returns 200 but doesn't create record.
**Impact:** Push marked `:pushed`, but sync won't find it.
**Handling:** Reconciliation logs "not found", retries next run. If persists > 30 min, alert.

### 2. Duplicate External IDs

**Scenario:** Two different pushes get same external_id (shouldn't happen).
**Handling:** First reconciliation wins. Log warning for second. Manual investigation needed.

### 3. Sync Deletes Record

**Scenario:** ERP record deleted between push and sync.
**Impact:** Mirror never created, reconciliation can't link.
**Handling:** PushRequest stays at `:pushed`. Add `:orphaned` status for these after N failed attempts.

### 4. Concurrent Push and Sync

**Scenario:** Push completes, sync starts before reconciliation.
**Impact:** None — sync creates mirror normally, reconciliation links afterward.

### 5. Invoice Deleted Before Reconciliation

**Scenario:** User deletes Invoice after push but before reconciliation.
**Impact:** `update_source_resource` fails silently.
**Handling:** Log warning, continue. PushRequest and Mirror still linked.

---

## Quick Copy-Paste

### New PushRequest Action

```elixir
# In push_request.ex actions block - ADD:
update :mark_sync_verified do
  description "Mark push as verified by sync"
  require_atomic? false
  accept [:accounting_resource_id, :accounting_resource_type, :sync_verified_at]
  
  change set_attribute(:status, :sync_verified)
end
```

### Reactor Step Template

```elixir
# Replace mirror update step with this:
step :update_push_request_with_result do
  argument :push_result, do: result(:push_to_erp)
  argument :push_request, do: result(:load_push_request)

  run fn %{push_result: push_result, push_request: push_request}, _context ->
    Ash.update(push_request, %{
      status: :pushed,
      external_id: push_result.external_id,
      processed_at: DateTime.utc_now(),
      push_metadata: Map.merge(push_request.push_metadata || %{}, %{
        erp_response_metadata: push_result.metadata
      })
    }, authorize?: false)
  end
end
```

### Reconciliation Query

```elixir
def get_unverified_push_requests(workspace_id, limit \\ 500) do
  alias FlameTeampayPayables.EmberErp.Resources.PushRequest

  PushRequest
  |> Ash.Query.filter(status == :pushed)
  |> Ash.Query.filter(is_nil(accounting_resource_id))
  |> Ash.Query.filter(not is_nil(external_id))
  |> Ash.Query.limit(limit)
  |> Ash.read!(tenant: workspace_id, authorize?: false)
end
```

---

## Dependencies

### What Must Exist Before This Works

1. `:sync_verified` added to PushRequest status enum
2. `sync_verified_at` column exists on PushRequest
3. `origin_push_request_id` column exists on Accounting.AP.Bill
4. Index on `(external_id, status)` for reconciliation queries
5. All 13 reactors modified to not create mirrors

### What This Does NOT Depend On

- Any specific ERP provider (works with all)
- Bridge system (completely independent)
- UI changes (works with current UI, just shows different statuses)

---

## Contacts

| Role | For What |
|------|----------|
| Sync Committee | Architecture questions, design decisions |
| Reactor Engineer | Reactor step modifications |
| Database Engineer | Migration and index optimization |
| Sync Pipeline Engineer | WorkspaceSyncWorker integration |
| Testing Engineer | Test coverage and fixtures |

---

*Document created: 2025-12-22 by Sync Committee*
*Good luck, engineers! 🚀*

