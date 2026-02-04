# Engineering Handoff: Reimbursement → ERP Push Implementation

**Session:** SC-2026-01-02-004  
**Date:** 2026-01-02  
**Status:** ✅ APPROVED  
**Confidence:** HIGH

---

## Executive Summary

The Sync Committee has approved the implementation of manual "Sync to ERP" functionality for the Reimbursements page. This enables finance admins to push:

1. **Expense Reports** (from Ready to Pay / All tabs) → NetSuite Expense Report
2. **Expense Payments** (from Paid tab) → NetSuite Check (with apply list linking to expense report)

---

## Key Decisions

| Decision | Outcome | Rationale |
|----------|---------|-----------|
| Use `/check` endpoint for payments | ✅ Approved | NetSuite standard for all disbursements (ACH, wire, check) |
| Add `erp_ap_payment_id` field | ✅ Required | Idempotency and sync status tracking |
| Enforce expense report → payment order | ✅ Required | Payment `apply` list needs expense report `external_id` |
| Add `paymentmethod` field mapping | ⚠️ Non-blocking | Enhancement for reporting; can ship without |

---

## Implementation Tasks

### Priority 1: Backend (Required for UI)

#### Task 1.1: Add `erp_ap_payment_id` to ReimbursementPayment

**File:** `lib/flame_teampay_payables/ember_reimbursements/resources/payment/reimbursement_payment.ex`

**Changes:**

```elixir
# Add to attributes block (around line 175):
attribute :erp_ap_payment_id, :uuid do
  public? true
  description "EmberErp.ExpenseReportPayment mirror - linked after push/sync"
end

# Add to actions block:
update :link_erp_payment do
  description "Link this payment to its ERP payment mirror"
  require_atomic? false
  accept [:erp_ap_payment_id]
end
```

**Effort:** 30 minutes

---

#### Task 1.2: Create Migration

**File:** `priv/repo/migrations/YYYYMMDDHHMMSS_add_erp_ap_payment_id_to_reimbursement_payments.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddErpApPaymentIdToReimbursementPayments do
  use Ecto.Migration

  def change do
    alter table(:reimbursement_payments) do
      add :erp_ap_payment_id, :uuid, null: true
    end

    create index(:reimbursement_payments, [:erp_ap_payment_id])
  end
end
```

**Effort:** 15 minutes

---

#### Task 1.3: Implement `sync_reimbursement_payment/2`

**File:** `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

**Add the following function and helpers:**

```elixir
# ============================================================================
# REIMBURSEMENT PAYMENT SYNC
# ============================================================================

@doc """
Manually sync a reimbursement payment to ERP.

The linked expense report MUST be synced first. This creates a Check
transaction in NetSuite with an apply list linking to the expense report.

## Options

- `:workspace_id` - Required. The workspace ID.
- `:actor` - Optional. The user triggering the sync (for audit).

## Returns

- `{:ok, push_request}` - Push request created
- `{:ok, :already_synced}` - Payment already has ERP sync
- `{:error, :not_found}` - Payment not found
- `{:error, :expense_report_not_synced}` - Must sync expense report first
- `{:error, :not_ready}` - Payment not in completed status
- `{:error, :no_connection}` - No ERP connection for entity
"""
@spec sync_reimbursement_payment(Ash.UUID.t(), keyword()) ::
        {:ok, PushRequest.t()} | {:ok, :already_synced} | {:error, term()}
def sync_reimbursement_payment(payment_id, opts \\ []) do
  workspace_id = Keyword.fetch!(opts, :workspace_id)
  actor = Keyword.get(opts, :actor)

  Logger.info("ManualSyncService: Starting manual sync for reimbursement payment",
    payment_id: payment_id,
    workspace_id: workspace_id
  )

  alias FlameTeampayPayables.EmberReimbursements.Resources.Payment.ReimbursementPayment

  with {:ok, payment} <- load_reimbursement_payment(payment_id, workspace_id),
       {:ok, :not_synced} <- check_payment_not_already_synced(payment),
       {:ok, :ready} <- check_payment_ready(payment),
       {:ok, request} <- load_payment_linked_request(payment, workspace_id),
       {:ok, expense_report_external_id} <- get_expense_report_external_id(request, workspace_id),
       {:ok, erp_connection} <- get_erp_connection(workspace_id, payment.entity_id) do
    
    case PushOrchestrator.push_entity(
           erp_connection.id,
           "expense",
           :expense_report_payment,
           "Reimbursement.ReimbursementPayment",
           payment.id,
           :manual,
           get_actor_id(actor),
           %{
             triggered_by: "manual_sync",
             expense_report_external_id: expense_report_external_id,
             payment_method: payment.payment_method,
             total_amount: extract_amount(payment),
             payment_date: payment.payment_date
           },
           actor
         ) do
      {:ok, push_request} when is_map(push_request) ->
        Logger.info("ManualSyncService: Push request created for payment",
          push_request_id: push_request.id,
          payment_id: payment_id
        )
        {:ok, push_request}

      {:ok, :push_disabled} ->
        {:error, :push_disabled}

      {:error, reason} ->
        {:error, reason}
    end
  else
    {:ok, :already_synced} ->
      Logger.info("ManualSyncService: Payment already synced",
        payment_id: payment_id
      )
      {:ok, :already_synced}

    {:error, :expense_report_not_synced} ->
      Logger.warning("ManualSyncService: Expense report must be synced first",
        payment_id: payment_id
      )
      {:error, :expense_report_not_synced}

    {:error, reason} = error ->
      Logger.warning("ManualSyncService: Cannot sync payment",
        payment_id: payment_id,
        reason: inspect(reason)
      )
      error
  end
end

@doc """
Manually sync multiple reimbursement payments in batch.
"""
@spec sync_reimbursement_payments([Ash.UUID.t()], keyword()) :: {:ok, list()}
def sync_reimbursement_payments(payment_ids, opts \\ []) do
  results =
    Enum.map(payment_ids, fn id ->
      result = sync_reimbursement_payment(id, opts)
      {id, result}
    end)

  {:ok, results}
end

# Private helpers for payment sync

defp load_reimbursement_payment(payment_id, workspace_id) do
  alias FlameTeampayPayables.EmberReimbursements.Resources.Payment.ReimbursementPayment

  case Ash.get(ReimbursementPayment, payment_id,
         tenant: workspace_id,
         authorize?: false
       ) do
    {:ok, nil} -> {:error, :not_found}
    {:ok, payment} -> {:ok, payment}
    {:error, reason} -> {:error, reason}
  end
end

defp check_payment_not_already_synced(payment) do
  if is_nil(payment.erp_ap_payment_id) do
    {:ok, :not_synced}
  else
    {:ok, :already_synced}
  end
end

defp check_payment_ready(payment) do
  # Payment must be completed or mailed (for checks) to be eligible
  if payment.payment_status in [:completed, :mailed] do
    {:ok, :ready}
  else
    {:error, :not_ready}
  end
end

defp load_payment_linked_request(payment, workspace_id) do
  alias FlameTeampayPayables.EmberReimbursements.Resources.Request.ReimbursementRequest

  case Ash.get(ReimbursementRequest, payment.request_id,
         tenant: workspace_id,
         authorize?: false
       ) do
    {:ok, nil} -> {:error, :no_linked_request}
    {:ok, request} -> {:ok, request}
    {:error, reason} -> {:error, reason}
  end
end

defp get_expense_report_external_id(request, workspace_id) do
  case request.erp_expense_report_id do
    nil ->
      {:error, :expense_report_not_synced}

    erp_expense_report_id ->
      # Load the accounting mirror to get the NetSuite external_id
      alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReport

      case Ash.get(ExpenseReport, erp_expense_report_id,
             tenant: workspace_id,
             authorize?: false
           ) do
        {:ok, nil} -> {:error, :expense_report_mirror_not_found}
        {:ok, mirror} -> {:ok, mirror.external_id}
        {:error, _} -> {:error, :expense_report_mirror_not_found}
      end
  end
end

defp extract_amount(payment) do
  # Handle Money struct or direct value
  case payment do
    %{total_amount: %Money{amount: amount}} -> Decimal.to_float(amount)
    %{total_amount: amount} when is_number(amount) -> amount
    _ -> nil
  end
end
```

**Effort:** 1-2 hours

---

### Priority 2: Enhancement (Non-blocking)

#### Task 2.1: Add `paymentmethod` Mapping

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/push/expense_report_payments.ex`

**Changes to `transform_to_netsuite_format/2`:**

```elixir
defp transform_to_netsuite_format(data, custom_fields) do
  %{}
  |> add_field("entity", build_record_ref(data[:employee_id] || data["employee_id"]))
  |> add_field("account", build_record_ref(data[:bank_account_id] || data["bank_account_id"]))
  |> add_field("trandate", format_date(data[:payment_date] || data["payment_date"]))
  |> add_field("total", data[:total_amount] || data["total_amount"])
  |> add_field("currency", build_record_ref(data[:currency_code] || data["currency_code"]))
  |> add_field("memo", build_memo(data))
  |> add_field("tranid", data[:payment_number] || data["payment_number"])
  |> add_payment_method(data)  # ← ADD THIS LINE
  |> add_expense_apply(data)
  |> add_custom_fields(custom_fields)
end

# Add this new function:
defp add_payment_method(map, data) do
  payment_method = data[:payment_method] || data["payment_method"]

  method_name = case payment_method do
    :ach -> "ACH"
    :wire -> "Wire Transfer"
    :check -> "Check"
    "ach" -> "ACH"
    "wire" -> "Wire Transfer"
    "check" -> "Check"
    _ -> nil
  end

  if method_name do
    # Use name-based lookup - NetSuite will resolve to internal ID
    Map.put(map, "paymentmethod", %{"name" => method_name})
  else
    map
  end
end
```

**Effort:** 30 minutes

---

### Priority 3: Frontend

#### Task 3.1: Add Sync Status Columns

**File:** `lib/flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex`

- Add sync status column to Ready to Pay table
- Add sync status column to All table
- Add sync status column to Paid table

**Effort:** 1-2 hours

#### Task 3.2: Add Sync Buttons

- Individual sync button per row
- Call `ManualSyncService.sync_reimbursement_report/2` for reports
- Call `ManualSyncService.sync_reimbursement_payment/2` for payments

**Effort:** 1 hour

#### Task 3.3: Implement Event Handlers

```elixir
def handle_event("sync_report_to_erp", %{"id" => id}, socket) do
  case ManualSyncService.sync_reimbursement_report(id,
         workspace_id: socket.assigns.current_workspace.id,
         actor: socket.assigns.current_user
       ) do
    {:ok, _push_request} ->
      {:noreply,
       socket
       |> put_flash(:info, "Sync initiated")
       |> reload_reimbursements()}

    {:ok, :already_synced} ->
      {:noreply, put_flash(socket, :info, "Already synced to ERP")}

    {:error, reason} ->
      {:noreply, put_flash(socket, :error, "Sync failed: #{format_error(reason)}")}
  end
end

def handle_event("sync_payment_to_erp", %{"id" => id}, socket) do
  case ManualSyncService.sync_reimbursement_payment(id,
         workspace_id: socket.assigns.current_workspace.id,
         actor: socket.assigns.current_user
       ) do
    {:ok, _push_request} ->
      {:noreply,
       socket
       |> put_flash(:info, "Payment sync initiated")
       |> reload_paid_reimbursements()}

    {:ok, :already_synced} ->
      {:noreply, put_flash(socket, :info, "Payment already synced to ERP")}

    {:error, :expense_report_not_synced} ->
      {:noreply, put_flash(socket, :error, "Sync the expense report first before syncing the payment")}

    {:error, reason} ->
      {:noreply, put_flash(socket, :error, "Payment sync failed: #{format_error(reason)}")}
  end
end
```

**Effort:** 1 hour

---

## Dependency Chain

```
┌─────────────────────────────────────────────────────────────┐
│  SYNC ORDER ENFORCEMENT                                      │
│                                                              │
│  Step 1: Sync Expense Report (Ready to Pay / All tabs)      │
│  ├─ Creates NetSuite Expense Report                         │
│  ├─ Returns external_id                                     │
│  └─ Sets ReimbursementRequest.erp_expense_report_id         │
│                                                              │
│  Step 2: Sync Payment (Paid tab)                            │
│  ├─ REQUIRES: erp_expense_report_id to be set               │
│  ├─ Loads expense report mirror to get external_id          │
│  ├─ Creates NetSuite Check with apply list                  │
│  └─ Sets ReimbursementPayment.erp_ap_payment_id             │
└─────────────────────────────────────────────────────────────┘

If expense report not synced → Return error: :expense_report_not_synced
UI should display: "Sync the expense report first"
```

---

## Testing Checklist

- [ ] Add `erp_ap_payment_id` field to ReimbursementPayment
- [ ] Run migration
- [ ] Test `sync_reimbursement_payment/2` happy path
- [ ] Test `sync_reimbursement_payment/2` when already synced (idempotent)
- [ ] Test `sync_reimbursement_payment/2` when expense report not synced (error)
- [ ] Test `sync_reimbursement_payment/2` when payment not ready (error)
- [ ] Verify NetSuite Check created with correct apply list
- [ ] Verify `paymentmethod` field included (if Priority 2 implemented)

---

## Files Changed

| File | Change Type |
|------|-------------|
| `ember_reimbursements/resources/payment/reimbursement_payment.ex` | Add attribute + action |
| `priv/repo/migrations/...` | New migration |
| `ember_erp/services/manual_sync_service.ex` | Add functions |
| `ember_erp/adapters/providers/netsuite/capabilities/push/expense_report_payments.ex` | Add payment method (P2) |
| `flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex` | UI changes (P3) |

---

## Committee Sign-off

| Member | Role | Approval |
|--------|------|----------|
| Committee Chair | Process | ✅ |
| NetSuite Domain Expert | ERP Domain | ✅ |
| Expense Management Expert | Business Domain | ✅ |
| Sync Architect | Technical | ✅ |
| Dependency Guardian | Technical | ✅ |
| Data Mapping Specialist | Technical | ✅ |
| Standards Enforcer | Verification | ✅ |

**Approved by Human:** 2026-01-02

---

*Document generated by Sync Committee Session SC-2026-01-02-004*

