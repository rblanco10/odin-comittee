# Engineering Handoff: Reimbursements ERP Sync Enhancement

**Session:** SC-2026-01-05-002  
**Date:** 2026-01-05  
**Status:** ✅ APPROVED  
**Confidence:** HIGH

---

## Executive Summary

The Sync Committee has approved enhancements to the Reimbursements page ERP sync functionality:

1. **Rename "Ready to Pay" tab to "Finalize & Pay"**
2. **Remove ERP Sync buttons from non-Paid tabs** (Ready to Pay / Finalize & Pay, Scheduled, All)
3. **Add unified "Sync to ERP" button in Paid tab only** — syncs both Expense Report AND Payment in one click
4. **Both records visible in NetSuite** — Expense Report with linked Bill Payment in Related Records

---

## Requirements

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Rename "Ready to Pay" → "Finalize & Pay" | Text change in `reimbursements_live.ex` |
| 2 | Remove sync buttons from non-Paid tabs | Remove ERP Sync column from Ready to Pay, Scheduled, All tabs |
| 3 | Single button syncs both records in Paid tab | New `sync_reimbursement_complete/2` + unified UI handler |
| 4 | NetSuite shows both records linked | ✅ Already works via apply list |

---

## Implementation Tasks

### Task 1: Rename Tab Label

**File:** `lib/flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex`

**Location:** Line 316

**Change:**

```elixir
# Before:
Ready to Pay

# After:
Finalize & Pay
```

**Effort:** 5 minutes

---

### Task 2: Remove ERP Sync Column from Non-Paid Tabs

**File:** `lib/flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex`

#### 2.1 Remove from Ready to Pay Tab

Remove the ERP Sync column header and cell from the `ready_to_pay_tab` component.

**Table Header (around line 835-855):**

Remove this column header:

```elixir
<%= if @has_erp_connection do %>
  <th class="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
    ERP Sync
  </th>
<% end %>
```

**Table Body (around line 950-956):**

Remove this cell:

```elixir
<%= if @has_erp_connection do %>
  <td class="px-4 py-3" id={"erp-sync-#{r.id}"} phx-hook="StopPropagation">
    <.erp_sync_status_cell
      reimbursement={r}
      syncing_id={@syncing_report_id}
      type={:report}
    />
  </td>
<% end %>
```

#### 2.2 Remove from All Tab

**Table Header (around line 1600-1620):**

Remove ERP Sync column header.

**Table Body (around line 1707-1714):**

Remove this cell:

```elixir
<%= if @has_erp_connection do %>
  <td class="px-4 py-3" id={"erp-all-sync-#{r.id}"} phx-hook="StopPropagation">
    <.erp_sync_status_cell
      reimbursement={r}
      syncing_id={@syncing_report_id}
      type={:report}
    />
  </td>
<% end %>
```

#### 2.3 Remove Unused Assigns

After removing the sync columns from non-Paid tabs, the following assigns can be removed from those tab component calls if no longer needed:

- `syncing_report_id` from `ready_to_pay_tab` and `all_tab` assigns

**Effort:** 30 minutes

---

### Task 3: Create Unified Sync Service Function

**File:** `lib/flame_teampay_payables/ember_erp/services/manual_sync_service.ex`

**Add new function after `sync_reimbursement_payment/2`:**

```elixir
# ============================================================================
# UNIFIED REIMBURSEMENT SYNC (SC-2026-01-05-002)
# ============================================================================

@doc """
Manually sync a complete reimbursement (expense report + payment) to ERP.

For paid reimbursements, this syncs both the expense report and the payment
in a single operation. The payment sync automatically depends on the report
being synced first (via erp_expense_report_id check).

This is the recommended entry point for the "Paid" tab sync button.

## Options

- `:workspace_id` - Required. The workspace ID.
- `:actor` - Optional. The user triggering the sync.

## Returns

- `{:ok, %{report: result, payment: result}}` - Both operations completed
- `{:error, %{report: error, payment: :not_attempted}}` - Report failed

Where `result` can be:
- `{:ok, push_request}` - Successfully queued
- `{:ok, :already_synced}` - Already synced to ERP
- `{:error, reason}` - Failed
- `:not_applicable` - No payment exists for this request
"""
@spec sync_reimbursement_complete(Ash.UUID.t(), keyword()) ::
        {:ok, map()} | {:error, map()}
def sync_reimbursement_complete(request_id, opts \\ []) do
  workspace_id = Keyword.fetch!(opts, :workspace_id)
  actor = Keyword.get(opts, :actor)

  Logger.info("ManualSyncService: Starting unified sync for reimbursement",
    request_id: request_id,
    workspace_id: workspace_id
  )

  # Step 1: Sync the expense report
  report_result = sync_reimbursement_report(request_id, opts)

  case report_result do
    {:ok, _} ->
      # Report synced (or already synced), proceed to payment
      sync_payment_after_report(request_id, workspace_id, opts, report_result)

    {:error, _} = error ->
      # Report failed, don't attempt payment
      Logger.warning("ManualSyncService: Report sync failed, skipping payment",
        request_id: request_id,
        error: inspect(error)
      )
      {:error, %{report: error, payment: :not_attempted}}
  end
end

defp sync_payment_after_report(request_id, workspace_id, opts, report_result) do
  # Find the completed payment for this request
  case get_completed_payment_for_request(request_id, workspace_id) do
    {:ok, payment} when not is_nil(payment) ->
      # Payment exists, sync it
      payment_result = sync_reimbursement_payment(payment.id, opts)

      Logger.info("ManualSyncService: Unified sync complete",
        request_id: request_id,
        report_result: format_result(report_result),
        payment_result: format_result(payment_result)
      )

      {:ok, %{report: report_result, payment: payment_result}}

    {:ok, nil} ->
      # No payment exists (shouldn't happen in Paid tab, but handle gracefully)
      Logger.info("ManualSyncService: No payment found for request",
        request_id: request_id
      )
      {:ok, %{report: report_result, payment: :not_applicable}}

    {:error, reason} ->
      Logger.warning("ManualSyncService: Failed to load payment",
        request_id: request_id,
        error: inspect(reason)
      )
      {:ok, %{report: report_result, payment: {:error, reason}}}
  end
end

defp get_completed_payment_for_request(request_id, workspace_id) do
  import Ash.Expr

  ReimbursementPayment
  |> Ash.Query.filter(expr(request_id == ^request_id))
  |> Ash.Query.filter(expr(payment_status in [:completed, :mailed]))
  |> Ash.Query.limit(1)
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end

defp format_result({:ok, %{id: _}}), do: :queued
defp format_result({:ok, :already_synced}), do: :already_synced
defp format_result({:error, reason}), do: {:error, reason}
defp format_result(:not_applicable), do: :not_applicable
defp format_result(other), do: other
```

**Effort:** 45 minutes

---

### Task 4: Add Unified UI Event Handler

**File:** `lib/flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex`

**Add new handler after existing sync handlers (around line 7730):**

```elixir
@doc """
Handle unified sync of reimbursement (expense report + payment) to ERP.
SC-2026-01-05-002: Single button in Paid tab syncs both records.
"""
def handle_event("sync_both_to_erp", %{"id" => request_id}, socket) do
  Logger.info("Unified sync to ERP requested for reimbursement: #{request_id}")

  workspace = socket.assigns.current_workspace
  actor = socket.assigns.current_user

  # Set loading state - use a dedicated assign for unified sync
  socket = assign(socket, :syncing_unified_id, request_id)

  case ManualSyncService.sync_reimbursement_complete(request_id,
         workspace_id: workspace.id,
         actor: actor
       ) do
    {:ok, %{report: report_result, payment: payment_result}} ->
      flash_message = build_unified_sync_flash(report_result, payment_result)
      flash_type = determine_flash_type(report_result, payment_result)

      {:noreply,
       socket
       |> assign(:syncing_unified_id, nil)
       |> put_flash(flash_type, flash_message)
       |> reload_current_tab_data()}

    {:error, %{report: error, payment: :not_attempted}} ->
      {:noreply,
       socket
       |> assign(:syncing_unified_id, nil)
       |> put_flash(:error, "Failed to sync expense report: #{format_sync_error(error)}")}
  end
end

defp build_unified_sync_flash(report_result, payment_result) do
  report_msg = case report_result do
    {:ok, _push_request} -> "Expense report sync initiated"
    {:ok, :already_synced} -> "Expense report already synced"
    {:error, reason} -> "Expense report failed: #{format_sync_error(reason)}"
  end

  payment_msg = case payment_result do
    {:ok, _push_request} -> "payment sync initiated"
    {:ok, :already_synced} -> "payment already synced"
    :not_applicable -> "no payment to sync"
    {:error, reason} -> "payment failed: #{format_sync_error(reason)}"
  end

  "#{report_msg}, #{payment_msg}."
end

defp determine_flash_type(report_result, payment_result) do
  report_ok = match?({:ok, _}, report_result)
  payment_ok = match?({:ok, _}, payment_result) or payment_result == :not_applicable

  if report_ok and payment_ok, do: :info, else: :warning
end

defp format_sync_error({:error, reason}), do: format_sync_error(reason)
defp format_sync_error(:not_found), do: "not found"
defp format_sync_error(:not_ready), do: "not ready for sync"
defp format_sync_error(:no_connection), do: "no ERP connection"
defp format_sync_error(:push_disabled), do: "ERP push disabled"
defp format_sync_error(:report_not_synced), do: "expense report not synced"
defp format_sync_error(reason) when is_binary(reason), do: reason
defp format_sync_error(reason), do: inspect(reason)
```

**Effort:** 30 minutes

---

### Task 5: Update Paid Tab ERP Sync Cell

**File:** `lib/flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex`

#### 5.1 Add `syncing_unified_id` to Paid Tab Assigns

**Location:** Around line 406 in the paid_tab call:

```elixir
<.paid_tab
  # ... existing assigns ...
  syncing_unified_id={@syncing_unified_id}  # ADD THIS
/>
```

#### 5.2 Add Initial Assign in mount

**Location:** In `mount/3` function:

```elixir
|> assign(:syncing_unified_id, nil)
```

#### 5.3 Update `erp_sync_status_cell` for Unified Sync

The paid tab should use the unified sync handler. Modify the `erp_sync_status_cell` function to handle the new `:unified` type:

**Location:** Around line 1971

**Replace the existing logic for `:payment` type or add new `:unified` type:**

```elixir
defp erp_sync_status_cell(assigns) do
  r = assigns.reimbursement
  syncing_id = assigns.syncing_id
  type = assigns.type

  # Determine sync status based on type
  {is_synced, sync_event, needs_dependency} = case type do
    :report ->
      # For reports only (not used after this change)
      erp_id = Map.get(r, :erp_expense_report_id)
      {not is_nil(erp_id), "sync_report_to_erp", false}

    :payment ->
      # For payments only (legacy, keep for backwards compatibility)
      erp_id = Map.get(r, :erp_ap_payment_id)
      report_synced = not is_nil(Map.get(r, :erp_expense_report_id))
      {not is_nil(erp_id), if(report_synced, do: "sync_payment_to_erp", else: nil), not report_synced}

    :unified ->
      # SC-2026-01-05-002: Unified sync for Paid tab
      # Both must be synced for "complete" status
      report_synced = not is_nil(Map.get(r, :erp_expense_report_id))
      payment_synced = not is_nil(Map.get(r, :erp_ap_payment_id))
      is_fully_synced = report_synced and payment_synced
      {is_fully_synced, "sync_both_to_erp", false}
  end

  is_syncing = syncing_id == r.id

  assigns = assigns
    |> assign(:r, r)
    |> assign(:is_synced, is_synced)
    |> assign(:is_syncing, is_syncing)
    |> assign(:sync_event, sync_event)
    |> assign(:needs_dependency, needs_dependency)

  ~H"""
  <div class="flex items-center gap-2">
    <%= cond do %>
      <% @is_syncing -> %>
        <%!-- Loading state --%>
        <div class="flex items-center gap-2 text-[var(--text-secondary)]">
          <.icon name="hero-arrow-path" class="w-4 h-4 animate-spin" />
          <span class="text-xs">Syncing...</span>
        </div>

      <% @is_synced -> %>
        <%!-- Synced state --%>
        <div class="flex items-center gap-2 text-emerald-600">
          <.icon name="hero-check-circle" class="w-4 h-4" />
          <span class="text-xs font-medium">Synced</span>
        </div>

      <% @needs_dependency -> %>
        <%!-- Dependency not met (legacy - not used in unified mode) --%>
        <div class="flex items-center gap-2 text-amber-600" title="Expense report must be synced first">
          <.icon name="hero-clock" class="w-4 h-4" />
          <span class="text-xs">Waiting</span>
        </div>

      <% @sync_event != nil -> %>
        <%!-- Ready to sync --%>
        <button
          type="button"
          phx-click={@sync_event}
          phx-value-id={@r.id}
          class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <.icon name="hero-arrow-path" class="w-3.5 h-3.5" />
          Sync to ERP
        </button>

      <% true -> %>
        <%!-- No action available --%>
        <span class="text-xs text-[var(--text-secondary)]">—</span>
    <% end %>
  </div>
  """
end
```

#### 5.4 Update Paid Tab Cell to Use `:unified` Type

**Location:** Around line 1528-1535, change the paid tab's sync cell:

```elixir
<%= if @has_erp_connection do %>
  <td class="px-4 py-3" id={"erp-payment-sync-#{r.id}"} phx-hook="StopPropagation">
    <.erp_sync_status_cell
      reimbursement={r}
      syncing_id={@syncing_unified_id}
      type={:unified}
    />
  </td>
<% end %>
```

**Effort:** 45 minutes

---

### Task 6: Clean Up Unused Event Handlers (Optional)

After removing sync buttons from non-Paid tabs, the following handlers become unused for those contexts but should be kept for backwards compatibility:

- `handle_event("sync_report_to_erp", ...)` — Keep (may be used elsewhere)
- `handle_event("sync_payment_to_erp", ...)` — Keep (may be used elsewhere)

**No action required.**

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `reimbursements_live.ex` | Tab rename, remove sync columns from non-Paid tabs, add unified handler, update paid tab cell |
| `manual_sync_service.ex` | Add `sync_reimbursement_complete/2` function |

---

## Testing Checklist

### Manual Testing

- [ ] Navigate to Reimbursements page
- [ ] Verify "Ready to Pay" tab is now "Finalize & Pay"
- [ ] Verify no ERP Sync column in "Finalize & Pay" tab
- [ ] Verify no ERP Sync column in "Scheduled" tab
- [ ] Verify no ERP Sync column in "All" tab
- [ ] Navigate to "Paid" tab with a paid reimbursement
- [ ] Verify ERP Sync column shows "Sync to ERP" button
- [ ] Click "Sync to ERP" button
- [ ] Verify loading state shows "Syncing..."
- [ ] Verify success flash shows both operations
- [ ] Verify status changes to "Synced" ✓
- [ ] Open NetSuite → Verify Expense Report created
- [ ] Open NetSuite → Verify Bill Payment/Check created
- [ ] Verify Bill Payment has Expense Report in Apply list
- [ ] Verify Expense Report shows Bill Payment in Related Records

### Edge Cases

- [ ] Click sync on already-synced reimbursement → Should show "already synced"
- [ ] Click sync when no ERP connection → Should show appropriate error
- [ ] Click sync when push disabled → Should show "ERP push disabled"

---

## Dependency Chain

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Sync to ERP" in Paid tab                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  ManualSyncService.sync_reimbursement_complete/2                │
│                                                                  │
│  Step 1: sync_reimbursement_report(request_id)                  │
│    └─> Creates PushRequest for expense_report                   │
│    └─> AshOban → PushExpenseReportReactor                       │
│    └─> NetSuite POST /expenseReport                             │
│    └─> external_id stored on PushEntityRecord                   │
│    └─> erp_expense_report_id updated on ReimbursementRequest    │
│                                                                  │
│  Step 2: sync_reimbursement_payment(payment_id)                 │
│    └─> Checks report has erp_expense_report_id (automatic wait) │
│    └─> Creates PushRequest for expense_report_payment           │
│    └─> AshOban → PushExpenseReportPaymentReactor                │
│    └─> NetSuite POST /check with apply list                     │
│    └─> external_id stored on PushEntityRecord                   │
│    └─> erp_ap_payment_id updated on ReimbursementPayment        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  NetSuite Result                                                 │
│                                                                  │
│  • Expense Report created (e.g., EXP09422811)                   │
│  • Bill Payment/Check created (e.g., #5344)                     │
│  • Apply list links payment → expense report                    │
│  • Related Records shows bidirectional link                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Committee Sign-off

| Member | Role | Approval |
|--------|------|----------|
| Committee Chair | Process | ✅ |
| Sync Architect | Technical | ✅ |
| NetSuite Domain Expert | ERP Domain | ✅ |
| Edge Case Hunter | Technical | ✅ |
| End User Advocate | User & Integration | ✅ |

**Approved by Human:** 2026-01-05

---

## Related Sessions

- **SC-2026-01-02-004**: Original reimbursement sync implementation
- **SC-2026-01-02-005**: PushConfiguration entity_type mismatch
- **SC-2026-01-02-007**: Binary UUID serialization fix
- **SC-2026-01-02-008**: AshOban trigger configuration
- **SC-2026-01-02-011**: AshOban multitenancy fix

---

*Document generated by Sync Committee Session SC-2026-01-05-002*

