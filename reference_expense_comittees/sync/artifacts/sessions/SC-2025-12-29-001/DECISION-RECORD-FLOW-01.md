# Decision Record: Flow-01 Implementation

> **Session:** SC-2025-12-29-001  
> **Date:** 2025-12-29  
> **Status:** APPROVED  
> **Committee:** Sync Committee (Full Quorum)

---

## Executive Summary

This document records all decisions made by the Sync Committee for the implementation of Flow-01 (Card Transaction → Existing Vendor, Open Period). These decisions are binding and must be implemented as specified.

---

## Decision 1: Reactor Rename

### Decision

**RENAME** `PushBillWithPaymentReactor` to `PushCardSpendReactor`

### Rationale

- The current name "PushBillWithPayment" is generic and doesn't reflect that this reactor is specifically for card transactions
- Multiple flows can create bills with payments (e.g., AP invoices), but this reactor is card-centric
- The new name aligns with `entity_type: :card_spend`
- Provides clarity for future developers

### Implementation Details

| Item | Old | New |
|------|-----|-----|
| **Module Name** | `FlameTeampayPayables.EmberErp.Resources.Reactors.AP.PushBillWithPaymentReactor` | `FlameTeampayPayables.EmberErp.Resources.Reactors.AP.PushCardSpendReactor` |
| **File Path** | `reactors/ap/push_bill_with_payment_reactor.ex` | `reactors/ap/push_card_spend_reactor.ex` |
| **Test File** | `push_bill_with_payment_reactor_test.exs` | `push_card_spend_reactor_test.exs` |

### Files Requiring Updates

1. `lib/.../ember_erp/resources/reactors/ap/push_bill_with_payment_reactor.ex` → rename + update module
2. `lib/.../ember_erp/registries/reactor_registry.ex` → update reactor mapping
3. `lib/.../ember_erp/services/configuration_save_service.ex` → update reference
4. `lib/.../ember_bridge/services/reconciliation/bill_reconciliation_service.ex` → update reference
5. `test/.../integration/push/push_bill_with_payment_reactor_test.exs` → rename + update
6. `test/support/erp_integration/mock_adapter.ex` → update reference
7. All flow documentation files (FLOW-01 through FLOW-14)

---

## Decision 2: Period Validation Behavior

### Decision

**FAIL HARD** when no accounting periods are synced.

### Rationale

- Accounting periods are central to operations
- Missing periods indicates a critical sync failure
- Allowing push without period validation would create data integrity issues
- User explicitly confirmed this requirement

### Implementation Details

```elixir
# In validate_accounting_period step:
case find_open_period_for_date(date, workspace_id, erp_connection_id) do
  {:ok, :period_open} ->
    {:ok, data}  # Continue with original date
    
  {:ok, adjusted_date} ->
    # Period closed, adjust to next open (for Flow 4, 5, 9)
    {:ok, adjust_posting_date(data, adjusted_date)}
    
  {:error, :no_periods_synced} ->
    # FAIL HARD - do not proceed
    {:error, "No accounting periods synced for this ERP connection. " <>
             "Please run a sync to fetch accounting periods before pushing transactions."}
    
  {:error, :no_open_period_found} ->
    # All periods closed, no future open period
    {:error, "No open accounting period found. All periods are closed."}
end
```

### Error Message

> "No accounting periods synced for this ERP connection. Please run a sync to fetch accounting periods before pushing transactions."

---

## Decision 3: Manual Sync Button Locations

### Decision

Add manual sync buttons to **BOTH**:
1. Transaction list view (per-row button)
2. Transaction detail view (prominent button)

### Implementation Details

#### Transaction List View

```heex
<%!-- Per-row sync button in transaction list --%>
<button
  :if={@push_mode == :manual and not transaction.synced?}
  phx-click="sync_transaction"
  phx-value-id={transaction.id}
  class="..."
>
  <span class="hero-arrow-path w-4 h-4" />
  Sync
</button>
```

#### Transaction Detail View

```heex
<%!-- Prominent sync button in detail view --%>
<.button_v2
  :if={@push_mode == :manual and not @transaction.synced?}
  phx-click="sync_transaction"
  phx-value-id={@transaction.id}
  variant="primary"
>
  <span class="hero-arrow-path w-5 h-5 mr-2" />
  Sync to ERP
</.button_v2>
```

#### Event Handler

```elixir
def handle_event("sync_transaction", %{"id" => transaction_id}, socket) do
  case PushOrchestrator.push_entity(
    socket.assigns.erp_connection_id,
    "expense",
    :card_transaction,
    "ExpenseCard.ExpenseCardTransaction",
    transaction_id,
    :manual,
    socket.assigns.current_user.id,
    %{triggered_by: "manual_ui_button"},
    socket.assigns.current_user
  ) do
    {:ok, push_request} ->
      {:noreply, 
       socket
       |> put_flash(:info, "Sync started")
       |> assign(:syncing_ids, [transaction_id | socket.assigns.syncing_ids])}
       
    {:error, reason} ->
      {:noreply, put_flash(socket, :error, "Sync failed: #{reason}")}
  end
end
```

---

## Decision 4: Vendor Resolution Enhancement

### Decision

Prepare the vendor resolution step for Flows 2-6 by restructuring to support:
- Vendor existence check (Flow 1)
- Vendor policy loading (Flows 2, 3, 6)
- Threshold check (Flows 2, 3)
- Auto-create (Flow 2, 5)
- Blocking with message (Flow 3, 6)

### Implementation Details

```elixir
# Enhanced resolve_vendor step structure
defp resolve_vendor_from_transaction(transaction, push_request, actor) do
  case check_vendor_exists(transaction, push_request, actor) do
    {:ok, vendor_info} ->
      # Vendor exists - Flow 1 happy path
      {:ok, vendor_info}
      
    {:error, :vendor_not_found} ->
      # Vendor doesn't exist - check policy
      handle_missing_vendor(transaction, push_request, actor)
  end
end

defp handle_missing_vendor(transaction, push_request, actor) do
  # Load vendor policy
  case load_vendor_policy(push_request) do
    {:ok, policy} ->
      amount = extract_amount(transaction)
      
      case VendorPolicy.should_auto_create?(policy, amount) do
        true ->
          # Flow 2, 5: Auto-create vendor
          create_vendor_in_erp(transaction, push_request, actor)
          
        false ->
          # Flow 3, 6: Block with message
          {:error, :blocked, build_blocking_message(policy, amount)}
      end
      
    {:error, :policy_not_found} ->
      # Default to blocking if no policy
      {:error, "No vendor linked and no vendor policy configured"}
  end
end
```

---

## Decision 5: Testing Strategy

### Decision

Implement a **hybrid testing approach**:

1. **Rename existing test** → `push_card_spend_reactor_test.exs` (unit-level reactor tests)
2. **Create new flow test** → `flows/card_spend_flow_01_test.exs` (scenario-based tests)

### Test File Structure

```
test/.../ember_erp/integration/
├── push/
│   └── push_card_spend_reactor_test.exs    ← RENAMED
└── flows/
    └── card_spend_flow_01_test.exs         ← NEW
```

### Flow 01 Test Cases (Required)

| ID | Test Case | Priority |
|----|-----------|----------|
| F01-T01 | Period is open → push succeeds | P0 |
| F01-T02 | No periods synced → fails hard with clear message | P0 |
| F01-T03 | Vendor exists with external_id → uses it | P0 |
| F01-T04 | Vendor linked but no external_id → lookup from mirror | P1 |
| F01-T05 | No vendor linked → returns error | P0 |
| F01-T06 | Bill created successfully with correct data | P0 |
| F01-T07 | Bill Payment created successfully | P0 |
| F01-T08 | PushRequest status becomes :pushed | P0 |
| F01-T09 | External IDs stored in push_metadata | P0 |
| F01-T10 | Full lifecycle: push → sync → reconcile | P0 |

---

## Decision 6: Step Ordering in Reactor

### Decision

The `PushCardSpendReactor` steps will be ordered as follows:

| Step # | Step Name | Purpose |
|--------|-----------|---------|
| 1 | `validate_push_request` | Load and validate PushRequest |
| 2 | `load_source_card_transaction` | Load ExpenseCardTransaction |
| 3 | `load_coding_assignments` | Load line-item coding |
| 4 | `resolve_vendor` | Check/create vendor (enhanced) |
| 5 | `validate_accounting_period` | **NEW** - Check period, fail if none |
| 6 | `transform_to_bill_format` | Build ERP payload |
| 7 | `push_bill_to_erp` | Push Bill via adapter |
| 8 | `push_bill_payment_to_erp` | Push Bill Payment via adapter |
| 9 | `complete_push_request` | Mark as pushed, store external_ids |

---

## Decision 7: Error Messages

### Decision

All error messages must be user-friendly and actionable.

| Scenario | Error Message |
|----------|---------------|
| No periods synced | "No accounting periods synced for this ERP connection. Please run a sync to fetch accounting periods before pushing transactions." |
| No open period | "No open accounting period found. All periods are closed." |
| No vendor linked | "Cannot push card transaction: No vendor linked. Merchant '[name]' must be mapped to a vendor before syncing to ERP." |
| Vendor not in ERP | "Vendor '[name]' is not synced to ERP. Please sync vendors first." |
| Vendor threshold exceeded | "Vendor auto-creation is restricted for transactions over $[threshold]. Please create or approve this vendor in the ERP and retry sync." |
| Auto-create disabled | "This vendor does not exist in the ERP. Please create the vendor before syncing." |

---

## Decision 8: Documentation Updates

### Decision

All 14 flow documents must be updated to reflect the reactor rename.

| File | Find | Replace |
|------|------|---------|
| FLOW-01 through FLOW-06 | `PushBillWithPaymentReactor` | `PushCardSpendReactor` |
| INDEX.md | N/A | Update references |

---

## Signatures

- **Sync Architect**: Approved ✅
- **Push Specialist**: Approved ✅
- **Bridge Analyst**: Approved ✅
- **UI/UX Advocate**: Approved ✅

---

*Decision Record Finalized: 2025-12-29*  
*Session: SC-2025-12-29-001*

