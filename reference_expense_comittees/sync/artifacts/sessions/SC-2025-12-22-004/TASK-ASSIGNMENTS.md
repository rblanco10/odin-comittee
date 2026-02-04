# Task Assignments: Option D Implementation

> **Session:** SC-2025-12-22-004
> **Date:** 2025-12-22
> **Status:** READY FOR IMPLEMENTATION

---

## Overview

This document assigns specific tasks to each engineering team member for implementing Option D (Sync-Only Mirrors).

**Total Estimated Effort:** 2-3 days
**Critical Path:** Database → Ash Resources → Reactors → Service → Integration → Tests

---

## Task Dependency Graph

```
                    ┌─────────────────────────────┐
                    │ 1. DATABASE ENGINEER        │
                    │    Migration                │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 2. ASH RESOURCES ENGINEER   │
                    │    PushRequest + Bill       │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 3. REACTOR ENGINEER │ │ 4. SYNC PIPELINE    │ │ 5. OBSERVABILITY    │
│    13 Push Reactors │ │    Reconciliation   │ │    Metrics & Logs   │
└──────────┬──────────┘ │    Service          │ └──────────┬──────────┘
           │            └──────────┬──────────┘            │
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 6. TESTING ENGINEER         │
                    │    Unit + Integration Tests │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 7. ENGINEERING LEAD         │
                    │    Review & Merge           │
                    └─────────────────────────────┘
```

---

## 1. DATABASE ENGINEER

**Priority:** HIGHEST (blocks all other work)
**Estimated Time:** 2-3 hours

### Task 1.1: Create Migration

**File:** `priv/repo/migrations/YYYYMMDDHHMMSS_add_push_sync_verification.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.AddPushSyncVerification do
  use Ecto.Migration

  def change do
    # ─── PUSH REQUEST CHANGES ───────────────────────────────────────────
    alter table(:ember_erp_push_requests) do
      add :sync_verified_at, :utc_datetime_usec
    end

    # ─── ACCOUNTING.AP.BILL CHANGES ─────────────────────────────────────
    alter table(:ember_erp_accounting_ap_bills) do
      add :origin_push_request_id, :uuid
    end

    # ─── INDEXES FOR RECONCILIATION ─────────────────────────────────────
    # Partial index: only unverified pushes with external_id
    create index(:ember_erp_push_requests, [:external_id],
      where: "status = 'pushed' AND accounting_resource_id IS NULL AND external_id IS NOT NULL",
      name: "push_requests_awaiting_reconciliation_idx")

    # Index for reverse lookup: which push created this bill?
    create index(:ember_erp_accounting_ap_bills, [:origin_push_request_id],
      name: "ap_bills_origin_push_idx")

    # Index for looking up bills by external_id during reconciliation
    create index(:ember_erp_accounting_ap_bills, [:external_id],
      where: "external_id IS NOT NULL",
      name: "ap_bills_external_id_idx")
  end
end
```

### Task 1.2: Verify Index Performance

After migration, run `EXPLAIN ANALYZE` on reconciliation query:

```sql
EXPLAIN ANALYZE
SELECT * FROM ember_erp_push_requests
WHERE status = 'pushed'
  AND accounting_resource_id IS NULL
  AND external_id IS NOT NULL
LIMIT 500;
```

**Expected:** Index scan, < 10ms

### Acceptance Criteria

- [ ] Migration runs without errors
- [ ] Migration is reversible
- [ ] Indexes created correctly
- [ ] Query performance verified

---

## 2. ASH RESOURCES ENGINEER

**Priority:** HIGH (blocks reactors and service)
**Estimated Time:** 2-3 hours
**Depends On:** Task 1 (Database Migration)

### Task 2.1: Update PushRequest Resource

**File:** `lib/flame_teampay_payables/ember_erp/resources/push_request/push_request.ex`

**Changes:**

1. **Add new attribute:**
```elixir
# In attributes do block
attribute :sync_verified_at, :utc_datetime_usec,
  allow_nil?: true,
  public?: true,
  description: "When sync verified this push (mirror created/matched)"
```

2. **Modify status constraints:**
```elixir
# BEFORE
attribute :status, :atom, allow_nil?: false, default: :pending,
  constraints: [one_of: [:pending, :processing, :pushed, :failed, :skipped]]

# AFTER
attribute :status, :atom, allow_nil?: false, default: :pending,
  constraints: [one_of: [:pending, :processing, :pushed, :sync_verified, :failed, :skipped]]
```

3. **Add new action:**
```elixir
# In actions do block
update :mark_sync_verified do
  description "Mark push as verified by sync reconciliation"
  require_atomic? false
  accept [:accounting_resource_id, :accounting_resource_type, :sync_verified_at]
  
  change set_attribute(:status, :sync_verified)
end

# In code_interface do block
define :mark_sync_verified
```

### Task 2.2: Update Accounting.AP.Bill Resource

**File:** `lib/flame_teampay_payables/ember_erp/resources/accounting/ap/bill.ex`

**Changes:**

1. **Add new attribute:**
```elixir
# In attributes do block
attribute :origin_push_request_id, :uuid,
  allow_nil?: true,
  public?: true,
  description: "PushRequest that triggered creation of this mirror (if via push)"
```

2. **Add relationship (optional but useful):**
```elixir
# In relationships do block
belongs_to :origin_push_request, FlameTeampayPayables.EmberErp.Resources.PushRequest do
  source_attribute :origin_push_request_id
  destination_attribute :id
  allow_nil? true
  attribute_writable? true
  description "The push request that created this bill mirror"
end
```

3. **Update from_erp action to accept origin:**
```elixir
# Modify create_from_erp action
create :create_from_erp do
  # ... existing accepts ...
  accept [..., :origin_push_request_id]  # ADD
end
```

### Acceptance Criteria

- [ ] PushRequest compiles with new attribute and action
- [ ] Accounting.AP.Bill compiles with new attribute
- [ ] `mix ash_postgres.generate_migrations` produces no changes (schema matches)
- [ ] `mix test` passes for affected resources

---

## 3. REACTOR ENGINEER

**Priority:** HIGH
**Estimated Time:** 4-6 hours
**Depends On:** Task 2 (Ash Resources)

### Task 3.1: Create Reactor Step Template

**File:** `lib/flame_teampay_payables/ember_erp/resources/reactors/shared/push_completion_step.ex`

```elixir
defmodule FlameTeampayPayables.EmberErp.Resources.Reactors.Shared.PushCompletionStep do
  @moduledoc """
  Shared step for completing a push request after successful ERP push.
  Used by all 13 push reactors.
  """

  def update_push_request_with_result(push_request, push_result) do
    alias FlameTeampayPayables.EmberErp.Resources.PushRequest

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

### Task 3.2: Modify Each Push Reactor

For **each of the 13 reactors**, apply this pattern:

**Before:**
```elixir
step :push_to_erp do
  # ... push logic ...
end

step :update_accounting_mirror do
  argument :push_result, do: result(:push_to_erp)
  argument :push_request, do: result(:load_push_request)

  run fn %{push_result: push_result, push_request: push_request}, _context ->
    # Creates or updates Accounting.* mirror
    # ... mirror creation logic ...
  end
end

step :link_source_to_mirror do
  # Links Invoice.erp_bill_id → Bill.id
  # ... linking logic ...
end
```

**After:**
```elixir
step :push_to_erp do
  # ... push logic ... (UNCHANGED)
end

step :update_push_request_with_result do
  argument :push_result, do: result(:push_to_erp)
  argument :push_request, do: result(:load_push_request)

  run fn %{push_result: push_result, push_request: push_request}, _context ->
    alias FlameTeampayPayables.EmberErp.Resources.Reactors.Shared.PushCompletionStep
    
    PushCompletionStep.update_push_request_with_result(push_request, push_result)
  end
end

# REMOVED: step :update_accounting_mirror
# REMOVED: step :link_source_to_mirror
```

### Task 3.3: Update Compensation Logic

**Before (typical):**
```elixir
compensate fn error, %{push_request: push_request, accounting_bill: bill}, _context ->
  # Rollback mirror? Mark failed?
  Ash.update(push_request, %{status: :failed, error_message: inspect(error)})
  # Maybe delete the created mirror...
  :ok
end
```

**After:**
```elixir
compensate fn error, %{push_request: push_request}, _context ->
  # No mirror to rollback - just mark failed
  Ash.update(push_request, %{
    status: :failed,
    error_message: inspect(error),
    processed_at: DateTime.utc_now()
  }, authorize?: false)
  :ok
end
```

### Reactor Checklist

| # | Reactor | File | Status |
|---|---------|------|--------|
| 1 | PushBillReactor | `ap/push_bill_reactor.ex` | [ ] |
| 2 | PushBillLineItemReactor | `ap/push_bill_line_item_reactor.ex` | [ ] |
| 3 | PushAPPaymentReactor | `ap/push_ap_payment_reactor.ex` | [ ] |
| 4 | PushAPPaymentApplicationReactor | `ap/push_ap_payment_application_reactor.ex` | [ ] |
| 5 | PushCardTransactionReactor (AP) | `ap/push_card_transaction_reactor.ex` | [ ] |
| 6 | PushVendorReactor | `ap/push_vendor_reactor.ex` | [ ] |
| 7 | PushExpenseReportReactor | `expense/push_expense_report_reactor.ex` | [ ] |
| 8 | PushExpenseLineItemReactor | `expense/push_expense_line_item_reactor.ex` | [ ] |
| 9 | PushCardTransactionReactor (Expense) | `expense/push_card_transaction_reactor.ex` | [ ] |
| 10 | PushVendorCreditReactor | `expense/push_vendor_credit_reactor.ex` | [ ] |
| 11 | PushJournalEntryReactor | `journal/push_journal_entry_reactor.ex` | [ ] |
| 12 | PushReceiptFileReactor | `documents/push_receipt_file_reactor.ex` | [ ] |
| 13 | (verify all listed) | | [ ] |

### Acceptance Criteria

- [ ] All 13 reactors modified
- [ ] No mirror creation steps remain
- [ ] Shared step module created
- [ ] Compensation logic simplified
- [ ] All reactor tests pass

---

## 4. SYNC PIPELINE ENGINEER

**Priority:** HIGH
**Estimated Time:** 4-5 hours
**Depends On:** Task 2 (Ash Resources)

### Task 4.1: Create PushReconciliationService

**File:** `lib/flame_teampay_payables/ember_erp/services/push_reconciliation_service.ex`

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.PushReconciliationService do
  @moduledoc """
  Reconciles pushed records with their synced accounting mirrors.
  
  Called after sync completes to:
  1. Match PushRequests (status=:pushed) to Accounting.* mirrors by external_id
  2. Update PushRequest with accounting_resource_id and sync_verified_at
  3. Update accounting mirror with origin_push_request_id
  4. Update product domain resources with mirror links (erp_bill_id, etc.)
  """

  require Logger
  import Ash.Expr

  alias FlameTeampayPayables.EmberErp.Resources.PushRequest
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.AP.Bill

  @batch_size 500

  @doc """
  Reconcile all unverified push requests for a workspace.
  Returns {success_count, not_found_count, error_count}
  """
  def reconcile_workspace(workspace_id, opts \\ []) do
    entity_type = Keyword.get(opts, :entity_type, :all)
    
    push_requests = get_unverified_push_requests(workspace_id, entity_type)
    
    Logger.info("PushReconciliation: Found #{length(push_requests)} unverified pushes for workspace #{workspace_id}")
    
    results = Enum.reduce(push_requests, %{success: 0, not_found: 0, error: 0}, fn push_request, acc ->
      case reconcile_push_request(push_request, workspace_id) do
        {:ok, :reconciled} -> %{acc | success: acc.success + 1}
        {:error, :mirror_not_found} -> %{acc | not_found: acc.not_found + 1}
        {:error, _reason} -> %{acc | error: acc.error + 1}
      end
    end)
    
    Logger.info("PushReconciliation: Complete. Success=#{results.success}, NotFound=#{results.not_found}, Error=#{results.error}")
    
    {:ok, results}
  end

  # ─── PRIVATE ────────────────────────────────────────────────────────────────

  defp get_unverified_push_requests(workspace_id, entity_type) do
    PushRequest
    |> Ash.Query.filter(status == :pushed)
    |> Ash.Query.filter(is_nil(accounting_resource_id))
    |> Ash.Query.filter(not is_nil(external_id))
    |> maybe_filter_entity_type(entity_type)
    |> Ash.Query.limit(@batch_size)
    |> Ash.read!(tenant: workspace_id, authorize?: false)
  end

  defp maybe_filter_entity_type(query, :all), do: query
  defp maybe_filter_entity_type(query, entity_type) do
    Ash.Query.filter(query, entity_type == ^entity_type)
  end

  defp reconcile_push_request(push_request, workspace_id) do
    with {:ok, mirror} <- find_mirror_by_external_id(push_request, workspace_id),
         {:ok, _} <- update_push_request(push_request, mirror),
         {:ok, _} <- update_mirror_origin(mirror, push_request, workspace_id),
         {:ok, _} <- update_source_resource(push_request, mirror, workspace_id) do
      {:ok, :reconciled}
    else
      {:error, :mirror_not_found} = error ->
        Logger.debug("PushReconciliation: Mirror not found for PushRequest #{push_request.id}, external_id=#{push_request.external_id}")
        error
      {:error, reason} = error ->
        Logger.warning("PushReconciliation: Failed for PushRequest #{push_request.id}: #{inspect(reason)}")
        error
    end
  end

  defp find_mirror_by_external_id(push_request, workspace_id) do
    mirror_module = get_mirror_module(push_request.entity_type)
    
    case Ash.Query.filter(mirror_module, external_id == ^push_request.external_id)
         |> Ash.read_one(tenant: workspace_id, authorize?: false) do
      {:ok, nil} -> {:error, :mirror_not_found}
      {:ok, mirror} -> {:ok, mirror}
      error -> error
    end
  end

  defp update_push_request(push_request, mirror) do
    PushRequest.mark_sync_verified(push_request, %{
      accounting_resource_id: mirror.id,
      accounting_resource_type: mirror.__struct__ |> to_string(),
      sync_verified_at: DateTime.utc_now()
    }, authorize?: false)
  end

  defp update_mirror_origin(mirror, push_request, workspace_id) do
    if has_origin_field?(mirror) and is_nil(mirror.origin_push_request_id) do
      Ash.update(mirror, %{
        origin_push_request_id: push_request.id
      }, tenant: workspace_id, authorize?: false)
    else
      {:ok, mirror}
    end
  end

  defp has_origin_field?(mirror) do
    Map.has_key?(mirror, :origin_push_request_id)
  end

  defp update_source_resource(push_request, mirror, workspace_id) do
    case push_request.source_domain do
      "ap" -> update_invoice_erp_link(push_request.source_resource_id, mirror.id, workspace_id)
      "expense" -> update_expense_report_erp_link(push_request.source_resource_id, mirror.id, workspace_id)
      _ -> {:ok, :skipped}
    end
  rescue
    error ->
      Logger.warning("PushReconciliation: Failed to update source resource: #{inspect(error)}")
      {:ok, :source_update_failed}  # Non-fatal, continue
  end

  defp update_invoice_erp_link(invoice_id, bill_id, workspace_id) do
    alias FlameTeampayPayables.EmberApInvoices.Resources.Invoice.Invoice

    case Ash.get(Invoice, invoice_id, tenant: workspace_id, authorize?: false) do
      {:ok, invoice} when not is_nil(invoice) ->
        Invoice.link_erp_bill(invoice, %{erp_bill_id: bill_id}, authorize?: false)
      _ ->
        {:ok, :invoice_not_found}  # Non-fatal
    end
  end

  defp update_expense_report_erp_link(_expense_report_id, _mirror_id, _workspace_id) do
    # TODO: Implement when expense domain is ready
    {:ok, :not_implemented}
  end

  # ─── ENTITY TYPE → MIRROR MODULE MAPPING ────────────────────────────────────

  defp get_mirror_module(:bill), do: Bill
  defp get_mirror_module(:ap_payment), do: FlameTeampayPayables.EmberErp.Resources.Accounting.AP.Payment
  defp get_mirror_module(:expense_report), do: FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReport
  defp get_mirror_module(:vendor), do: FlameTeampayPayables.EmberErp.Resources.Accounting.AP.Vendor
  defp get_mirror_module(:journal_entry), do: FlameTeampayPayables.EmberErp.Resources.Accounting.Journal.JournalEntry
  defp get_mirror_module(entity_type) do
    Logger.warning("PushReconciliation: Unknown entity_type #{inspect(entity_type)}")
    nil
  end
end
```

### Task 4.2: Integrate with WorkspaceSyncWorker

**File:** `lib/flame_teampay_payables/ember_erp/workers/workspace_sync_worker.ex`

**Find the main processing function and add reconciliation:**

```elixir
# BEFORE (typical structure)
defp process_workspace(workspace_id, run_number) do
  with {:ok, _} <- run_sync_reactor(workspace_id, run_number),
       {:ok, _} <- run_bridge_if_enabled(workspace_id) do
    {:ok, :completed}
  end
end

# AFTER
defp process_workspace(workspace_id, run_number) do
  alias FlameTeampayPayables.EmberErp.Services.PushReconciliationService

  with {:ok, _} <- run_sync_reactor(workspace_id, run_number),
       {:ok, _} <- run_bridge_if_enabled(workspace_id),
       {:ok, reconcile_stats} <- reconcile_pushes(workspace_id) do
    Logger.info("Workspace #{workspace_id}: sync complete, reconciled #{reconcile_stats.success} pushes")
    {:ok, :completed}
  end
end

defp reconcile_pushes(workspace_id) do
  PushReconciliationService.reconcile_workspace(workspace_id)
end
```

### Acceptance Criteria

- [ ] PushReconciliationService module created
- [ ] All entity type mappings complete
- [ ] WorkspaceSyncWorker integration added
- [ ] Logging and metrics in place
- [ ] Unit tests pass

---

## 5. OBSERVABILITY ENGINEER

**Priority:** MEDIUM
**Estimated Time:** 2-3 hours
**Can start in parallel with:** Tasks 3, 4

### Task 5.1: Add Prometheus Metrics

**Add to PushReconciliationService:**

```elixir
defp emit_metrics(results, duration_ms) do
  alias FlameTeampayPayables.ObservabilityServices.PrometheusMetricsService
  
  PrometheusMetricsService.emit_counter("push_reconciliations_total", results.success, %{status: "success"})
  PrometheusMetricsService.emit_counter("push_reconciliations_total", results.not_found, %{status: "not_found"})
  PrometheusMetricsService.emit_counter("push_reconciliations_total", results.error, %{status: "error"})
  PrometheusMetricsService.emit_histogram("push_reconciliation_duration_ms", duration_ms)
end
```

### Task 5.2: Add OpenTelemetry Tracing

**Add spans to PushReconciliationService:**

```elixir
def reconcile_workspace(workspace_id, opts \\ []) do
  require OpenTelemetry.Tracer, as: Tracer

  Tracer.with_span "push_reconciliation.reconcile_workspace" do
    Tracer.set_attribute("workspace_id", workspace_id)
    # ... existing logic ...
  end
end
```

### Task 5.3: Update Dashboard

Add to Grafana dashboard:
- Panel: "Push Reconciliations per Minute" (rate of success/not_found/error)
- Panel: "Reconciliation Duration" (p50, p95, p99)
- Panel: "Unverified Pushes" (gauge of pushes awaiting reconciliation)

### Acceptance Criteria

- [ ] Metrics emitted from reconciliation service
- [ ] Traces available in Tempo
- [ ] Dashboard updated (or spec provided)
- [ ] Alerts configured

---

## 6. TESTING ENGINEER

**Priority:** MEDIUM-HIGH
**Estimated Time:** 4-5 hours
**Depends On:** Tasks 2, 3, 4

### Task 6.1: Unit Tests for PushReconciliationService

**File:** `test/flame_teampay_payables/ember_erp/services/push_reconciliation_service_test.exs`

```elixir
defmodule FlameTeampayPayables.EmberErp.Services.PushReconciliationServiceTest do
  use FlameTeampayPayables.DataCase

  alias FlameTeampayPayables.EmberErp.Services.PushReconciliationService
  alias FlameTeampayPayables.EmberErp.Resources.PushRequest
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.AP.Bill

  describe "reconcile_workspace/1" do
    test "returns {0, 0, 0} when no unverified pushes" do
      workspace = create_workspace()
      
      assert {:ok, %{success: 0, not_found: 0, error: 0}} = 
        PushReconciliationService.reconcile_workspace(workspace.id)
    end

    test "reconciles pushes with matching mirrors" do
      workspace = create_workspace()
      
      # Create push request with external_id
      push_request = create_push_request(workspace, %{
        status: :pushed,
        external_id: "EXT-123"
      })
      
      # Create mirror with same external_id
      bill = create_bill(workspace, %{
        external_id: "EXT-123"
      })
      
      assert {:ok, %{success: 1, not_found: 0, error: 0}} =
        PushReconciliationService.reconcile_workspace(workspace.id)
      
      # Verify links created
      updated_push = Ash.get!(PushRequest, push_request.id, tenant: workspace.id)
      assert updated_push.status == :sync_verified
      assert updated_push.accounting_resource_id == bill.id
      assert not is_nil(updated_push.sync_verified_at)
    end

    test "handles missing mirrors gracefully" do
      workspace = create_workspace()
      
      # Create push request with external_id but no matching mirror
      create_push_request(workspace, %{
        status: :pushed,
        external_id: "EXT-MISSING"
      })
      
      assert {:ok, %{success: 0, not_found: 1, error: 0}} =
        PushReconciliationService.reconcile_workspace(workspace.id)
    end

    test "updates source Invoice.erp_bill_id" do
      workspace = create_workspace()
      invoice = create_invoice(workspace)
      
      push_request = create_push_request(workspace, %{
        status: :pushed,
        external_id: "EXT-456",
        source_domain: "ap",
        source_resource_id: invoice.id
      })
      
      bill = create_bill(workspace, %{external_id: "EXT-456"})
      
      PushReconciliationService.reconcile_workspace(workspace.id)
      
      updated_invoice = Ash.get!(Invoice, invoice.id, tenant: workspace.id)
      assert updated_invoice.erp_bill_id == bill.id
    end
  end

  # ... helper functions for creating test data ...
end
```

### Task 6.2: Reactor Tests

**File:** `test/flame_teampay_payables/ember_erp/resources/reactors/ap/push_bill_reactor_test.exs`

```elixir
describe "Option D behavior" do
  test "successful push does NOT create accounting mirror" do
    # ... setup ...
    
    {:ok, result} = Reactor.run(PushBillReactor, inputs)
    
    # Verify PushRequest updated
    push_request = Ash.get!(PushRequest, push_request_id, tenant: workspace_id)
    assert push_request.status == :pushed
    assert push_request.external_id == "ERP-789"
    
    # Verify NO mirror created
    assert {:ok, nil} = 
      Ash.Query.filter(Bill, external_id == "ERP-789")
      |> Ash.read_one(tenant: workspace_id)
  end

  test "successful push does NOT update Invoice.erp_bill_id" do
    # ... setup ...
    
    {:ok, result} = Reactor.run(PushBillReactor, inputs)
    
    invoice = Ash.get!(Invoice, invoice_id, tenant: workspace_id)
    assert is_nil(invoice.erp_bill_id)
  end
end
```

### Task 6.3: Integration Tests

**File:** `test/flame_teampay_payables/integration/push_sync_reconciliation_test.exs`

```elixir
defmodule FlameTeampayPayables.Integration.PushSyncReconciliationTest do
  use FlameTeampayPayables.DataCase

  @moduletag :integration

  describe "full push → sync → reconciliation flow" do
    test "push creates PushRequest, sync creates mirror, reconciliation links them" do
      # 1. Setup
      workspace = create_workspace_with_erp_connection()
      invoice = create_approved_invoice(workspace)
      
      # 2. Push
      {:ok, push_request} = PushOrchestrator.push_entity(
        workspace.erp_connection_id,
        "ap",
        :bill,
        "Invoice",
        invoice.id
      )
      
      # 3. Wait for push to complete (or run synchronously in test)
      Process.sleep(100)
      push_request = Ash.get!(PushRequest, push_request.id, tenant: workspace.id)
      assert push_request.status == :pushed
      assert not is_nil(push_request.external_id)
      
      # 4. Verify no mirror yet
      assert {:ok, nil} = find_bill_by_external_id(push_request.external_id, workspace.id)
      
      # 5. Run sync (mocked or use test ERP)
      {:ok, _} = WorkspaceSyncWorker.sync_workspace(workspace.id)
      
      # 6. Verify mirror created
      {:ok, bill} = find_bill_by_external_id(push_request.external_id, workspace.id)
      assert not is_nil(bill)
      
      # 7. Verify reconciliation linked them
      push_request = Ash.get!(PushRequest, push_request.id, tenant: workspace.id)
      assert push_request.status == :sync_verified
      assert push_request.accounting_resource_id == bill.id
      
      invoice = Ash.get!(Invoice, invoice.id, tenant: workspace.id)
      assert invoice.erp_bill_id == bill.id
    end
  end
end
```

### Acceptance Criteria

- [ ] Unit tests for PushReconciliationService
- [ ] Reactor tests verify no mirror creation
- [ ] Integration test for full flow
- [ ] All tests pass in CI

---

## 7. ENGINEERING LEAD

**Priority:** Ongoing
**Estimated Time:** 2-3 hours (review + coordination)

### Task 7.1: Coordinate Implementation

- [ ] Verify Phase 1 (migration) complete before Phase 2
- [ ] Check each engineer's progress daily
- [ ] Unblock dependencies as needed

### Task 7.2: Code Review

Review PRs in this order:
1. Migration (Database Engineer)
2. Resource changes (Ash Resources Engineer)
3. Reactors (Reactor Engineer)
4. Service (Sync Pipeline Engineer)
5. Observability (Observability Engineer)
6. Tests (Testing Engineer)

### Task 7.3: Final Verification

- [ ] All tests passing in CI
- [ ] No linting errors
- [ ] Documentation updated (ENGINEERING-HANDOFF.md)
- [ ] Staging deployment successful
- [ ] Manual testing checklist complete

### Acceptance Criteria

- [ ] All PRs merged
- [ ] Staging deployment verified
- [ ] Committee notified of completion

---

## Timeline

| Day | Focus | Expected Completion |
|-----|-------|---------------------|
| Day 1 AM | Migration + Resource changes | Tasks 1, 2 |
| Day 1 PM | Start reactors + service | Tasks 3, 4 in progress |
| Day 2 AM | Complete reactors + service | Tasks 3, 4 complete |
| Day 2 PM | Observability + tests | Tasks 5, 6 |
| Day 3 AM | Review + fixes | Task 7 |
| Day 3 PM | Staging deployment + verification | Complete |

---

## Human Decisions (Answered)

| Question | Answer |
|----------|--------|
| Feature flag? | **No** — Deploy directly, no gradual rollout |
| All entity types? | **Yes** — Implement reconciliation for all 13 entity types |
| Expense domain ready? | **Yes** — Expense-to-mirror linking is required |

---

*Document created: 2025-12-22 by Sync Committee*
*Implementation: Tonight! 🚀*

