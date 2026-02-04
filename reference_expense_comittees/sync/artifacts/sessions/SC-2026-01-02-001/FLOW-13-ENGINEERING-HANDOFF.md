# Flow-13: Manual Sync Trigger — Engineering Handoff

> **Session:** SC-2026-01-02-001  
> **Status:** IMPLEMENTATION PHASE (REVISED)  
> **Created:** 2026-01-02  
> **Updated:** 2026-01-02 — Committee findings incorporated

---

## Overview

Flow-13 enables finance users to manually trigger sync when `push_mode = :manual`.
When automatic push is disabled, transactions accumulate in "Ready to Sync" state
until finance explicitly triggers sync via UI buttons.

---

## ⚠️ COMMITTEE RESEARCH FINDINGS

### Critical Architecture Understanding

**The existing Flow tests (1-12) are 100% DOWNSTREAM of the push decision point.**

They test: `PushRequest exists` → `Execute Push` → `Sync` → `Bridge`

They do NOT test: `Transaction approved` → `Should we create PushRequest?`

### Decision Point Locations

| Domain | File | Function | Check |
|--------|------|----------|-------|
| Card | `TransactionApprovedReactor` | `maybe_push_card_transaction_to_erp/3` | `SyncPreferencesService.auto_push?()` |
| Reimbursement | `PushOnStatusChange` | `check_preference_and_push/4` | `SyncPreferencesService.manual_push?()` |

### What This Means for Flow-13

Flow-13 tests must verify **both layers**:
1. **Layer 1 (Decision):** When `push_mode = :manual`, auto-push is blocked
2. **Layer 2 (Trigger):** `ManualSyncService` creates `PushRequest` and lifecycle works

See `COMMITTEE-FINDINGS.md` for full analysis.

---

## Product Requirements Summary

### Configuration

```elixir
%{
  push_mode: :manual,  # Transactions don't auto-push
  sync_mode: :auto     # Inbound sync still automatic
}
```

### Sync Eligibility

| Transaction Type | Eligible When |
|------------------|---------------|
| Card Transaction | Settled + coded + receipt (if required) |
| Reimbursement Report | Approved |
| Reimbursement Payment | Payment executed |

### Sync Button Locations (UI Work - OUT OF SCOPE)

| Location | Scope |
|----------|-------|
| Transaction List (Cards tab) | Bulk/Individual |
| Transaction Detail | Individual |
| Ready to Pay Tab | Bulk |
| All Tab | Bulk |
| Reimbursement Detail | Individual |
| Paid Tab | Bulk |
| Payment Detail | Individual |

---

## What Already Exists

| Component | Status | Location |
|-----------|--------|----------|
| `push_mode` configuration | ✅ | `SyncPreferencesService` |
| `manual_push?/2` helper | ✅ | `SyncPreferencesService` |
| `auto_push?/2` helper | ✅ | `SyncPreferencesService` |
| Auto-push skip when manual | ✅ | `TransactionApprovedReactor`, `PushOnStatusChange` |
| `PushOrchestrator.push_entity/9` | ✅ | Entry point for pushes |
| `PushOrchestrator.push_batch/7` | ✅ | Batch push entry point |

---

## What We're Building

### ManualSyncService (CREATED)

**File:** `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

A service that allows finance users to trigger sync for selected transactions.

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.ManualSyncService do
  @moduledoc """
  Service for manual sync operations when push_mode = :manual.
  
  Finance users can select transactions and trigger sync via UI buttons.
  This service handles the backend logic for those sync requests.
  """
  
  # Single card transaction
  @spec sync_card_transaction(Ash.UUID.t(), keyword()) :: 
    {:ok, PushRequest.t()} | {:error, term()}
  def sync_card_transaction(transaction_id, opts \\ [])
  
  # Batch card transactions
  @spec sync_card_transactions([Ash.UUID.t()], keyword()) :: 
    {:ok, list()} | {:error, term()}
  def sync_card_transactions(transaction_ids, opts \\ [])
  
  # Single reimbursement report
  @spec sync_reimbursement_report(Ash.UUID.t(), keyword()) :: 
    {:ok, PushRequest.t()} | {:error, term()}
  def sync_reimbursement_report(request_id, opts \\ [])
  
  # Batch reimbursement reports
  @spec sync_reimbursement_reports([Ash.UUID.t()], keyword()) :: 
    {:ok, list()} | {:error, term()}
  def sync_reimbursement_reports(request_ids, opts \\ [])
end
```

---

## Revised Test Scenarios

### Part A: Decision Point Tests (NEW - Never Tested Before)

These tests verify the `push_mode` decision is respected.

| Test ID | Scenario | Setup | Expected |
|---------|----------|-------|----------|
| F13-A01 | Card approved with `push_mode = :manual` | Set connection to manual mode, approve card transaction | NO `PushRequest` created, reactor returns `:manual_push_mode` |
| F13-A02 | Reimbursement approved with `push_mode = :manual` | Set connection to manual mode, approve reimbursement | NO `PushRequest` created |
| F13-A03 | Card approved with `push_mode = :automatic` (control) | Keep default auto mode, approve card transaction | `PushRequest` IS created |

### Part B: Manual Trigger Tests

These tests verify `ManualSyncService` works correctly.

| Test ID | Scenario | Expected |
|---------|----------|----------|
| F13-B01 | Manual sync card when `push_mode = :manual` | `PushRequest` created, Push → Sync → Bridge works |
| F13-B02 | Manual sync reimbursement when `push_mode = :manual` | `PushRequest` created, lifecycle completes |
| F13-B03 | Manual sync already-synced card | Returns `:already_synced` (idempotent) |
| F13-B04 | Batch manual sync multiple cards | All eligible synced, returns results |
| F13-B05 | Manual sync card missing coding | Returns error with specific message |

### Part C: Full Lifecycle Integration

| Test ID | Scenario | Expected |
|---------|----------|----------|
| F13-C01 | Complete manual flow: approve (blocked) → manual sync → Push → Sync → Bridge | Transaction synced to ERP |

---

## Test File Structure

```
test/flame_teampay_payables/ember_erp/integration/flows/
├── card_spend_flow_13_manual_sync_test.exs     # Card manual sync tests
└── reimbursement_flow_13_manual_sync_test.exs  # Reimbursement manual sync tests (optional)
```

---

## Engineering Implementation Plan

### Phase 1: Setup Test Infrastructure

1. Create test file with proper tags
2. Set up helper to configure `push_mode` on ERP connection
3. Verify `SyncPreferencesService.manual_push?/2` returns correct value

### Phase 2: Decision Point Tests (Part A)

1. Test card approval with `push_mode = :manual` blocks auto-push
2. Verify no `PushRequest` is created
3. Test control case with `push_mode = :automatic` creates `PushRequest`

### Phase 3: Manual Trigger Tests (Part B)

1. Test `ManualSyncService.sync_card_transaction/2` creates `PushRequest`
2. Test idempotency (already synced returns appropriate response)
3. Test batch operations

### Phase 4: Full Lifecycle Test (Part C)

1. End-to-end test combining decision block + manual trigger + lifecycle

---

## Key Integration Points

### Setting push_mode in Tests

```elixir
defp set_push_mode(connection, workspace_id, mode) do
  config = connection.configuration || %{}
  erp_prefs = Map.get(config, "erp_preferences", %{})
  updated_prefs = Map.put(erp_prefs, "push_mode", Atom.to_string(mode))
  updated_config = Map.put(config, "erp_preferences", updated_prefs)
  
  Ash.update!(connection, %{configuration: updated_config}, 
    tenant: workspace_id, 
    authorize?: false
  )
end
```

### Verifying No PushRequest Created

```elixir
# Query for PushRequests for a specific transaction
push_requests = PushRequest
  |> Ash.Query.filter(source_resource_id == ^transaction_id)
  |> Ash.Query.filter(workspace_id == ^workspace_id)
  |> Ash.read!(tenant: workspace_id, authorize?: false)

assert push_requests == [], "No PushRequest should be created in manual mode"
```

---

## Session Scope

**IN SCOPE:**
- ManualSyncService implementation ✅ (DONE)
- Decision point tests (Part A)
- Manual trigger tests (Part B)
- Full lifecycle test (Part C)

**OUT OF SCOPE:**
- UI buttons (separate UI work)
- LiveView integration (done when UI is built)

---

## References

- `COMMITTEE-FINDINGS.md` — Full research analysis
- `FLOW-13-MANUAL-SYNC-TRIGGER.md` — Product requirements
- `REQUIREMENTS-CONSOLIDATED.md` — Universal invariants

---

*Engineering Handoff Document (Revised)*  
*Session: SC-2026-01-02-001*
