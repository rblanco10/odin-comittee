# Push Architecture Design Proposal: Option D (Sync-Only Mirrors)

> **Session:** SC-2025-12-22-004
> **Date:** 2025-12-22
> **Status:** PROPOSED
> **Topic:** Push/Sync Separation with Strong Linkages

---

## Executive Summary

This document proposes **Option D: Sync-Only Mirrors**, a push architecture where:

- **Push** sends data to ERP and stores only the `external_id` on `PushRequest`
- **Sync** creates/updates the `Accounting.*` mirror tables from ERP data
- **No conflict** between push and sync — clean responsibility separation
- **ERP is truth** — sync always reflects actual ERP state
- **Strong linkages** enable full UI traceability from push initiation through ERP verification

---

## Problem Statement

### Current State

```
PUSH FLOW (Current)
═══════════════════════════════════════════════════════════════════════════

PushOrchestrator.push_entity()
         │
         ▼
PushRequest (pending)
         │
         ▼
PushBillReactor
         │
         ├─► Step 4: Push to ERP → external_id returned
         │
         ├─► Step 5: Create/Update Accounting.AP.Bill  ← ⚠️ CONFLICT POINT
         │           (sets external_id, vendor, amount, sync_version="push")
         │
         └─► Step 6: Link source → mirror


SYNC FLOW (Parallel)
═══════════════════════════════════════════════════════════════════════════

WorkspaceSyncWorker (every 2 min)
         │
         ▼
BillSyncHandler.upsert_bill()
         │
         └─► Update Accounting.AP.Bill  ← ⚠️ OVERWRITES push data
             (sets all fields from ERP response)
```

### Problem: Push and Sync Both Write to Same Table

| Scenario | What Happens | Issue |
|----------|--------------|-------|
| Push creates Bill → Sync runs | Sync **overwrites** all fields | Push provenance lost |
| Push updates Bill → Sync runs | Sync **overwrites** update | Temporary data visible, then replaced |
| Sync runs → Push runs → Sync runs | Three writes to same record | Unnecessary churn |

### The Core Principle

> **ERP is the source of truth.** Accounting mirrors should reflect ERP state, not Teampay state.

If push writes to the mirror, we're contaminating the "ERP truth" with "Teampay intent."

---

## Proposed Solution: Option D

### Architecture

```
PUSH FLOW (Option D)
═══════════════════════════════════════════════════════════════════════════

PushOrchestrator.push_entity()
         │
         ▼
PushRequest (pending)
         │  source_resource_id = Invoice.id
         │  source_resource_type = "Invoice"
         │  source_domain = "ap"
         │
         ▼
PushBillReactor (Modified)
         │
         ├─► Step 4: Push to ERP → external_id returned
         │
         ├─► Step 5: Update PushRequest  ← NEW BEHAVIOR
         │           • status = :pushed
         │           • external_id = {ERP's ID}
         │           • processed_at = now()
         │           • DO NOT touch Accounting.AP.Bill
         │
         └─► Step 6: (No mirror linking - sync handles this)


SYNC FLOW (Unchanged - every 2 min)
═══════════════════════════════════════════════════════════════════════════

WorkspaceSyncWorker
         │
         ▼
BillSyncHandler.upsert_bill()
         │
         └─► Create/Update Accounting.AP.Bill
             • Syncs ALL data from ERP (amount, vendor, dates, etc.)
             • external_id matches what push received
             • sync_version = current sync run version


POST-SYNC RECONCILIATION (New)
═══════════════════════════════════════════════════════════════════════════

After sync completes:
         │
         ▼
PushReconciliationService (New)
         │
         ├─► Find PushRequests with status=:pushed and no accounting_resource_id
         │
         ├─► Match by external_id → Accounting.*.Bill
         │
         ├─► Update PushRequest:
         │       • accounting_resource_id = Bill.id
         │       • sync_verified_at = now()  ← NEW FIELD
         │
         └─► Update Invoice (product domain):
                 • erp_bill_id = Bill.id
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Push writes to** | PushRequest only | Clean separation, no mirror contamination |
| **Mirror writes by** | Sync only | ERP is truth, sync reflects ERP state |
| **Reconciliation** | Post-sync service | Links push to mirror via external_id match |
| **Latency** | ~2 minutes | Acceptable for verification (push is immediate) |
| **Provenance** | `origin_push_request_id` on mirror | Optional trace back to push origin |

---

## Linkage Model (Strong Traceability)

### Data Model Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT DOMAIN                                 │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                         Invoice                                  │    │
│   │  id: UUID                                                        │    │
│   │  invoice_number: "INV-2025-0001"                                │    │
│   │  processing_status: :approved                                    │    │
│   │  erp_bill_id: UUID ─────────────────────────────────────────────┼───┐│
│   └────────────────────────────────────────────────────────────────┘    ││
└──────────────────────────────────────────────────────────────────────────┘│
                    ▲                                                       │
                    │ source_resource_id                                    │
                    │                                                       │
┌───────────────────┼──────────────────────────────────────────────────────┐│
│                   │              ERP DOMAIN                               ││
│                   │                                                       ││
│   ┌───────────────┴────────────────────────────────────────────────┐     ││
│   │                       PushRequest                               │     ││
│   │  id: UUID                                                       │     ││
│   │  source_resource_id: Invoice.id  ◄──────────────────────────────│     ││
│   │  source_resource_type: "Invoice"                                │     ││
│   │  source_domain: "ap"                                            │     ││
│   │                                                                 │     ││
│   │  status: :pushed | :sync_verified  ← NEW STATUS                 │     ││
│   │  external_id: "ERP-123"  ─────────────────────────────────────┐ │     ││
│   │  accounting_resource_id: UUID ──────────────────────────────┐ │ │     ││
│   │  sync_verified_at: DateTime ← NEW FIELD                     │ │ │     ││
│   └────────────────────────────────────────────────────────────┬┼─┼─┘     ││
│                                                                ││ │       ││
│                                     ┌──────────────────────────┘│ │       ││
│                                     │ accounting_resource_id    │ │       ││
│                                     ▼                           │ │       ││
│   ┌─────────────────────────────────────────────────────────────┼─┴┐     ││
│   │                   Accounting.AP.Bill                        │  │     ││
│   │  id: UUID  ◄────────────────────────────────────────────────┼──┼─────┘│
│   │  external_id: "ERP-123"  ◄──────────────────────────────────┘  │      │
│   │  vendor_id: UUID                                               │      │
│   │  amount: Decimal                                               │      │
│   │  last_synced_at: DateTime                                      │      │
│   │  origin_push_request_id: UUID ← NEW FIELD (optional)           │      │
│   │  erp_metadata: %{}                                             │      │
│   └────────────────────────────────────────────────────────────────┘      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Linkage Summary

| From | To | Via | When Set |
|------|-----|-----|----------|
| Invoice | PushRequest | Query by `source_resource_id = Invoice.id` | At push creation |
| PushRequest | Invoice | `source_resource_id` | At push creation |
| PushRequest | ERP Record | `external_id` | After push success |
| PushRequest | Accounting.Bill | `accounting_resource_id` | After sync + reconciliation |
| Accounting.Bill | PushRequest | `origin_push_request_id` (NEW) | After sync + reconciliation |
| Invoice | Accounting.Bill | `erp_bill_id` | After sync + reconciliation |
| Accounting.Bill | Invoice | Query by `erp_bill_id` | N/A (reverse query) |

---

## UI Status Traceability

### Status Timeline (Example: Bill Push)

```
TIMELINE
═══════════════════════════════════════════════════════════════════════════

T+0:00  User approves Invoice → Push triggered
        ├─► Invoice: processing_status = :approved
        └─► PushRequest: status = :pending
                         source_resource_id = Invoice.id
            UI shows: "Syncing to ERP..."

T+0:03  Oban picks up PushRequest, reactor runs
        └─► PushRequest: status = :processing
            UI shows: "Syncing to ERP..."

T+0:08  Push succeeds, ERP returns external_id
        └─► PushRequest: status = :pushed
                         external_id = "ERP-123"
                         processed_at = T+0:08
            UI shows: "Sent to ERP ✓ (awaiting sync verification)"

T+2:00  Sync runs for workspace
        ├─► BillSyncHandler fetches bills from ERP
        └─► Creates/Updates Accounting.AP.Bill
            external_id = "ERP-123"

T+2:00  Post-sync reconciliation runs
        ├─► Matches PushRequest.external_id → Bill.external_id
        ├─► Updates PushRequest:
        │       accounting_resource_id = Bill.id
        │       sync_verified_at = T+2:00
        │       status = :sync_verified  ← NEW STATUS
        ├─► Updates Accounting.AP.Bill:
        │       origin_push_request_id = PushRequest.id
        └─► Updates Invoice:
                erp_bill_id = Bill.id
            UI shows: "Synced to ERP ✓✓" (verified)

═══════════════════════════════════════════════════════════════════════════
```

### UI State Matrix

| PushRequest.status | sync_verified_at | erp_bill_id | UI Display |
|--------------------|------------------|-------------|------------|
| `:pending` | NULL | NULL | "Queued for sync..." |
| `:processing` | NULL | NULL | "Syncing to ERP..." |
| `:pushed` | NULL | NULL | "Sent to ERP ✓ (verifying...)" |
| `:sync_verified` | Set | Set | "Synced to ERP ✓✓" |
| `:failed` | NULL | NULL | "Sync failed ✗ (retry available)" |
| `:skipped` | NULL | NULL | "Sync skipped (already exists)" |

### Query Patterns for UI

```elixir
# Get push status for an Invoice
def get_push_status(invoice_id) do
  PushRequest
  |> Ash.Query.filter(source_resource_id == ^invoice_id)
  |> Ash.Query.filter(source_resource_type == "Invoice")
  |> Ash.Query.sort(inserted_at: :desc)
  |> Ash.Query.limit(1)
  |> Ash.read_one!()
end

# Check if push is fully verified
def push_verified?(push_request) do
  push_request.status == :sync_verified and
  not is_nil(push_request.sync_verified_at) and
  not is_nil(push_request.accounting_resource_id)
end

# Get the verified ERP data for an Invoice
def get_erp_data(invoice) do
  if invoice.erp_bill_id do
    Ash.get!(Accounting.AP.Bill, invoice.erp_bill_id)
  else
    nil
  end
end
```

---

## Schema Changes

### 1. PushRequest: Add Verification Fields

```elixir
# In push_request.ex - attributes do block

# NEW: Sync verification timestamp
attribute :sync_verified_at, :utc_datetime_usec, allow_nil?: true,
  description: "When the push was verified by sync (mirror created/matched)"

# MODIFY: Add :sync_verified to status constraints
attribute :status, :atom, allow_nil?: false, default: :pending,
  constraints: [one_of: [:pending, :processing, :pushed, :sync_verified, :failed, :skipped]]
```

### 2. Accounting.AP.Bill: Add Origin Tracking (Optional but Recommended)

```elixir
# In accounting/ap/bill.ex - attributes do block

# NEW: Track which push request created this (optional)
attribute :origin_push_request_id, :uuid, allow_nil?: true,
  description: "PushRequest that triggered creation of this mirror (if any)"

# Note: Most mirrors are created by sync alone, so this is nullable
```

### 3. Migration

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddPushSyncVerification do
  use Ecto.Migration

  def change do
    # Add sync verification to PushRequest
    alter table(:ember_erp_push_requests) do
      add :sync_verified_at, :utc_datetime_usec
    end

    # Add origin tracking to Accounting.AP.Bill
    alter table(:ember_erp_accounting_ap_bills) do
      add :origin_push_request_id, :uuid
    end

    # Index for reconciliation queries
    create index(:ember_erp_push_requests, [:external_id, :status],
      where: "status = 'pushed' AND accounting_resource_id IS NULL",
      name: "push_requests_awaiting_reconciliation_idx")

    create index(:ember_erp_accounting_ap_bills, [:origin_push_request_id],
      name: "ap_bills_origin_push_idx")
  end
end
```

---

## New Components

### 1. PushReconciliationService

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.PushReconciliationService do
  @moduledoc """
  Reconciles pushed records with their synced accounting mirrors.
  
  Called after sync completes to:
  1. Match PushRequests (status=:pushed) to Accounting.* mirrors by external_id
  2. Update PushRequest with accounting_resource_id and sync_verified_at
  3. Update accounting mirror with origin_push_request_id (optional)
  4. Update product domain resources with mirror links (erp_bill_id, etc.)
  """

  require Logger

  @doc """
  Reconcile all unverified push requests for a workspace.
  Called after WorkspaceSyncWorker completes.
  """
  def reconcile_workspace(workspace_id, entity_type \\ :all) do
    push_requests = get_unverified_push_requests(workspace_id, entity_type)
    
    Enum.reduce(push_requests, {0, 0}, fn push_request, {success, failed} ->
      case reconcile_push_request(push_request, workspace_id) do
        {:ok, _} -> {success + 1, failed}
        {:error, reason} ->
          Logger.warning("Reconciliation failed for PushRequest #{push_request.id}: #{inspect(reason)}")
          {success, failed + 1}
      end
    end)
  end

  defp get_unverified_push_requests(workspace_id, entity_type) do
    PushRequest
    |> Ash.Query.filter(status == :pushed)
    |> Ash.Query.filter(is_nil(accounting_resource_id))
    |> Ash.Query.filter(not is_nil(external_id))
    |> maybe_filter_entity_type(entity_type)
    |> Ash.read!(tenant: workspace_id, authorize?: false)
  end

  defp reconcile_push_request(push_request, workspace_id) do
    with {:ok, mirror} <- find_mirror_by_external_id(push_request, workspace_id),
         {:ok, _} <- update_push_request(push_request, mirror),
         {:ok, _} <- update_mirror_origin(mirror, push_request),
         {:ok, _} <- update_source_resource(push_request, mirror, workspace_id) do
      {:ok, :reconciled}
    end
  end

  defp find_mirror_by_external_id(push_request, workspace_id) do
    mirror_module = get_mirror_module(push_request.entity_type)
    
    mirror_module
    |> Ash.Query.filter(external_id == ^push_request.external_id)
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
    |> case do
      {:ok, nil} -> {:error, :mirror_not_found}
      {:ok, mirror} -> {:ok, mirror}
      error -> error
    end
  end

  defp update_push_request(push_request, mirror) do
    Ash.update(push_request, %{
      accounting_resource_id: mirror.id,
      accounting_resource_type: mirror.__struct__ |> to_string(),
      sync_verified_at: DateTime.utc_now(),
      status: :sync_verified
    }, authorize?: false)
  end

  defp update_mirror_origin(mirror, push_request) do
    # Only update if the mirror has origin_push_request_id field
    if has_origin_field?(mirror) do
      Ash.update(mirror, %{
        origin_push_request_id: push_request.id
      }, authorize?: false)
    else
      {:ok, mirror}
    end
  end

  defp update_source_resource(push_request, mirror, workspace_id) do
    # Update the product domain resource with the mirror link
    case push_request.source_domain do
      "ap" -> update_invoice_erp_link(push_request.source_resource_id, mirror.id, workspace_id)
      "expense" -> update_expense_erp_link(push_request.source_resource_id, mirror.id, workspace_id)
      _ -> {:ok, :skipped}
    end
  end

  defp update_invoice_erp_link(invoice_id, bill_id, workspace_id) do
    Invoice
    |> Ash.get!(invoice_id, tenant: workspace_id, authorize?: false)
    |> Ash.update(%{erp_bill_id: bill_id}, action: :link_erp_bill, authorize?: false)
  end

  # ... helper functions
end
```

### 2. Integration with Sync Worker

```elixir
# In WorkspaceSyncWorker, after sync completes:

defp process_workspace(workspace_id) do
  with {:ok, _} <- run_sync_reactor(workspace_id),
       {:ok, _} <- run_bridge_if_enabled(workspace_id),
       {:ok, stats} <- reconcile_pushes(workspace_id) do  # NEW
    Logger.info("Workspace #{workspace_id}: sync complete, reconciled #{stats.success} pushes")
    {:ok, stats}
  end
end

defp reconcile_pushes(workspace_id) do
  {success, failed} = PushReconciliationService.reconcile_workspace(workspace_id)
  {:ok, %{success: success, failed: failed}}
end
```

---

## Modified Push Reactor

### PushBillReactor Changes

```elixir
# BEFORE (Current)
step :update_accounting_mirror do
  run fn %{push_result: push_result, push_request: push_request}, _context ->
    if push_request.accounting_resource_id do
      # Update existing
      Ash.update(Bill, push_request.accounting_resource_id, %{
        external_id: push_result.external_id,
        last_synced_at: DateTime.utc_now()
      })
    else
      # Create new
      Ash.create(Bill, %{
        external_id: push_result.external_id,
        vendor_id: ...,
        amount: ...,
        sync_version: "push"
      })
    end
  end
end

# AFTER (Option D)
step :update_push_request_with_result do
  run fn %{push_result: push_result, push_request: push_request}, _context ->
    # Only update PushRequest - DO NOT touch accounting mirror
    Ash.update(push_request, %{
      status: :pushed,
      external_id: push_result.external_id,
      processed_at: DateTime.utc_now(),
      push_metadata: Map.merge(push_request.push_metadata, %{
        erp_response: push_result.metadata
      })
    }, authorize?: false)
  end
end

# REMOVED: step :link_source_to_mirror
# Reason: Sync + Reconciliation handles this now
```

---

## Latency Analysis

```
TIMELINE (Option D)
═══════════════════════════════════════════════════════════════════════════

T+0:00  Push triggered
        └─► User sees: "Syncing to ERP..."

T+0:05  Push completes
        └─► User sees: "Sent to ERP ✓ (awaiting verification)"
        ─── EXTERNAL_ID IS SET, PUSH IS CONFIRMED ───

T+0:05 → T+2:00  (Gap: up to 2 minutes)
        └─► User sees: "Sent to ERP ✓ (awaiting verification)"
        ─── Record exists in ERP, mirror not yet created ───

T+2:00  Sync runs, mirror created
        └─► User sees: "Synced to ERP ✓✓"
        ─── FULLY VERIFIED, ALL LINKS ESTABLISHED ───

═══════════════════════════════════════════════════════════════════════════

WORST CASE DELAY: Push completes at T+0:01, sync ran at T+0:00
                  Next sync at T+2:00 → 1:59 wait for verification

AVERAGE DELAY: ~1 minute

ACCEPTABLE: Yes - push is confirmed immediately, verification is async
═══════════════════════════════════════════════════════════════════════════
```

---

## Benefits

### 1. ERP is Truth (Preserved)

| Aspect | Before (Current) | After (Option D) |
|--------|------------------|------------------|
| Mirror source | Push OR Sync | Sync only |
| Data accuracy | Push data may differ from ERP | Always matches ERP |
| Sync_version meaning | "push" vs sync run # | Always sync run # |

### 2. No Conflict

- Push and sync never compete for the same write
- No need for "sync skips if push" logic
- No data churn (write → overwrite → write)

### 3. Strong Traceability

- `PushRequest.source_resource_id` → traces to Invoice
- `PushRequest.external_id` → traces to ERP record
- `PushRequest.accounting_resource_id` → traces to mirror
- `Invoice.erp_bill_id` → traces to mirror
- `Accounting.Bill.origin_push_request_id` → traces back to push

### 4. Clear UI States

- "Queued" → "Sending" → "Sent" → "Verified"
- User knows exactly where their push is
- Verification gives confidence data is in ERP

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sync fails, mirror never created | Low | Medium | PushRequest stays at `:pushed`, UI shows "awaiting verification" |
| External_id mismatch | Very Low | Medium | Reconciliation logs mismatch, manual review |
| ERP deletes record before sync | Very Low | Medium | Sync creates nothing, reconciliation finds no match |
| Reconciliation performance | Low | Low | Index on external_id + status, batch processing |

---

## Implementation Order

1. **Migration** — Add `sync_verified_at` to PushRequest, `origin_push_request_id` to Bill
2. **Status update** — Add `:sync_verified` to PushRequest status enum
3. **PushReconciliationService** — New service for post-sync reconciliation
4. **Modify push reactors** — Remove mirror creation, only update PushRequest
5. **Integrate with WorkspaceSyncWorker** — Call reconciliation after sync
6. **Update UI queries** — Use new status for display states
7. **Tests** — Unit + integration for reconciliation flow

---

## Committee Notes

### Alignment with Sync Committee Principles

| Principle | Alignment |
|-----------|-----------|
| ERP is truth | ✅ Sync-only mirrors guarantee ERP reflection |
| Predictable syncing | ✅ No push interference in sync flow |
| Clean separation | ✅ Push = queue + send, Sync = mirror |
| Strong linkages | ✅ Full trace from Invoice → PushRequest → Mirror |

### Comparison to Alternatives

| Option | Mirror Writes By | Conflict Risk | ERP Truth | Complexity |
|--------|------------------|---------------|-----------|------------|
| A (Current) | Push + Sync | High | ❌ Contaminated | Low |
| B (Push Protected) | Push + Sync | Medium | ❌ Data drift | Medium |
| C (Preserve Provenance) | Push + Sync | Low | ⚠️ Partial | Medium |
| **D (Sync-Only)** | **Sync only** | **None** | **✅ Preserved** | **Medium** |

### Recommendation

**Option D is recommended** as the cleanest separation of concerns with full traceability.

---

## Addendum: Push Mode Toggle (Added Post-Implementation)

### Background

During implementation review, a gap was identified: automatic pushes were hardcoded in domain logic without a global toggle. This creates inconsistent behavior where some entity types auto-push while others don't.

### The Push Mode Setting

A new `push_mode` preference has been added at the ErpConnection level:

```elixir
# Stored in ErpConnection.configuration["erp_preferences"]["push_mode"]
push_mode: :automatic | :manual
```

| Mode | Behavior |
|------|----------|
| `:automatic` | Domain events (approval, payment, etc.) trigger automatic pushes |
| `:manual` | ALL pushes must be explicitly triggered by user action |

### Implementation

**SyncPreferencesService** (updated):

```elixir
# Get the push mode for a connection
SyncPreferencesService.get_push_mode(erp_connection_id, workspace_id: workspace_id)
# => :automatic or :manual

# Check if auto-push is enabled
SyncPreferencesService.auto_push?(erp_connection_id, workspace_id: workspace_id)
# => true or false

# Check if manual-push mode is active
SyncPreferencesService.manual_push?(erp_connection_id, workspace_id: workspace_id)
# => true or false

# Update the preference
SyncPreferencesService.update_preferences(erp_connection_id, %{push_mode: :manual}, workspace_id: workspace_id)
```

**Automatic Push Trigger Points** (all updated to check `push_mode`):

| Location | Before | After |
|----------|--------|-------|
| `TransactionApprovedReactor` | Always auto-push | Check `auto_push?` first |
| `PushOnStatusChange` (reimbursements) | Check only `reimbursement_sync_status` | Check `push_mode` first, then status |

### UI Implications

When `push_mode: :manual`:
- User must click "Sync to ERP" button explicitly
- Domain events (approval, payment) do NOT trigger pushes
- UI should expose the manual push action prominently

When `push_mode: :automatic`:
- Pushes trigger automatically on configured events
- No user action needed
- UI shows sync status passively

### Consistency with Sync Mode

This mirrors the existing `sync_mode` preference:

| Preference | Controls | Values |
|------------|----------|--------|
| `sync_mode` | Scheduled syncs (pull FROM ERP) | `:auto` / `:manual` |
| `push_mode` | Automatic pushes (push TO ERP) | `:automatic` / `:manual` |

Both are per-ErpConnection settings, giving customers full control over integration behavior.

---

*Document updated: 2025-12-22 by Sync Committee*
*Session: SC-2025-12-22-004*

