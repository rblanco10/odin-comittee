# Action Items

> **Session ID**: 2026-01-13_001_sync-state-machine-audit  
> **Generated**: 2026-01-13  
> **Status**: Ready for Implementation

---

## Priority 0: Critical Fixes (Implement Immediately)

### AI-001: Add source_update_status to PushEntityRecord

**Assignee**: Implementation Team  
**File**: `lib/flame_teampay_payables/ember_erp/resources/push_request/push_entity_record.ex`  
**Priority**: P0  
**Estimated Effort**: 15 minutes

**Task**:
Add new attribute to track source update status:

```elixir
attribute :source_update_status, :atom do
  constraints [one_of: [:pending, :updated, :failed]]
  default :pending
  description "Status of updating the source domain record after push"
end
```

**Acceptance Criteria**:
- [ ] Attribute added with correct constraints
- [ ] Default is `:pending`
- [ ] Migration generated and applied

---

### AI-002: Add update_source_transaction step to PushCardSpendReactor

**Assignee**: Implementation Team  
**File**: `lib/flame_teampay_payables/ember_erp/resources/reactors/ap/push_card_spend_reactor.ex`  
**Priority**: P0  
**Estimated Effort**: 30 minutes

**Task**:
Add new step after `create_bill_entity_record`:

```elixir
# ============================================
# STEP: Update Source Transaction
# ============================================
step :update_source_transaction do
  argument :push_request, result(:validate_push_request)
  argument :bill_entity_record, result(:create_bill_entity_record)

  run fn %{push_request: pr, bill_entity_record: entity_record}, _context ->
    alias FlameTeampayPayables.EmberExpenseCard.Resources.ExpenseCardTransaction.ExpenseCardTransaction
    
    Logger.info("PushCardSpendReactor: Updating source transaction #{pr.source_resource_id}",
      push_request_id: pr.id,
      entity_record_id: entity_record.id,
      external_id: entity_record.external_id
    )
    
    source_result = case Ash.get(ExpenseCardTransaction, pr.source_resource_id,
      tenant: pr.workspace_id, authorize?: false
    ) do
      {:ok, txn} when not is_nil(txn) ->
        ExpenseCardTransaction.mark_erp_synced(txn, 
          %{erp_external_id: entity_record.external_id},
          tenant: pr.workspace_id, 
          authorize?: false
        )
      {:ok, nil} ->
        {:error, :source_not_found}
      error ->
        error
    end
    
    # Update entity record with source update status
    source_status = case source_result do
      {:ok, _} -> :updated
      {:error, _} -> :failed
    end
    
    Ash.update(entity_record, %{source_update_status: source_status},
      tenant: pr.workspace_id, authorize?: false)
    
    case source_result do
      {:ok, _updated} ->
        Logger.info("PushCardSpendReactor: Source transaction marked as synced")
        {:ok, :source_updated}
      {:error, reason} ->
        Logger.warning("PushCardSpendReactor: Failed to update source: #{inspect(reason)}")
        {:ok, :source_update_failed}  # Non-fatal
    end
  end
end
```

**Acceptance Criteria**:
- [ ] Step added after `create_bill_entity_record`
- [ ] Uses `ExpenseCardTransaction.mark_erp_synced` action
- [ ] Updates `PushEntityRecord.source_update_status`
- [ ] Non-fatal failure (returns `{:ok, ...}` even on error)
- [ ] Proper logging

---

### AI-003: Fix execute_push.ex to persist failure status

**Assignee**: Implementation Team  
**File**: `lib/flame_teampay_payables/ember_erp/resources/push_request/manual_actions/execute_push.ex`  
**Priority**: P0  
**Estimated Effort**: 45 minutes

**Task**:
Replace in-memory map manipulation with `Ash.update`:

1. Find the error handling section (around line 173-178)
2. Replace with proper database persistence
3. Add retry with backoff
4. Use `ErrorFormatter.format_for_storage/1`

```elixir
defp handle_reactor_failure(request, error, workspace_id) do
  alias FlameTeampayPayables.EmberErp.ErrorFormatter
  
  error_message = ErrorFormatter.format_for_storage(error)
  status = determine_failure_status(error)
  
  attrs = %{
    status: status,
    processed_at: DateTime.utc_now(),
    error_message: String.slice(error_message, 0, 1000),
    retry_count: (request.retry_count || 0) + 1
  }
  
  persist_failure_with_retry(request, attrs, workspace_id, 1)
end

defp persist_failure_with_retry(request, attrs, workspace_id, attempt) when attempt <= 3 do
  case Ash.update(request, attrs, 
    action: :update, 
    tenant: workspace_id, 
    authorize?: false
  ) do
    {:ok, updated} ->
      Logger.info("ExecutePush: Marked request #{request.id} as #{attrs.status}",
        push_request_id: request.id,
        status: attrs.status,
        error_message: attrs.error_message
      )
      {:error, %{request: updated, original_error: attrs.error_message}}
      
    {:error, update_error} when attempt < 3 ->
      Logger.warning("ExecutePush: Retry #{attempt} failed to persist status: #{inspect(update_error)}")
      Process.sleep(attempt * 100)
      persist_failure_with_retry(request, attrs, workspace_id, attempt + 1)
      
    {:error, update_error} ->
      Logger.error("CRITICAL: Could not persist failure status for PushRequest #{request.id}",
        push_request_id: request.id,
        update_error: inspect(update_error),
        original_error: attrs.error_message
      )
      {:error, %{request: request, original_error: attrs.error_message, persistence_failed: true}}
  end
end

defp determine_failure_status(error) do
  cond do
    match?(%{type: :blocked}, error) -> :blocked
    match?(%{type: :validation}, error) -> :failed
    match?(%{type: :rate_limited}, error) -> :failed
    true -> :failed
  end
end
```

**Acceptance Criteria**:
- [ ] Uses `Ash.update` instead of map manipulation
- [ ] Error message sanitized via `ErrorFormatter`
- [ ] Retry with backoff (3 attempts, 100/200/300ms)
- [ ] CRITICAL log on ultimate failure
- [ ] Status persisted to database

---

### AI-004: Update reconciliation services with erp_connection_id

**Assignee**: Implementation Team  
**Files**: 10 reconciliation services in `lib/flame_teampay_payables/ember_bridge/services/reconciliation/`  
**Priority**: P0  
**Estimated Effort**: 60 minutes (6 min per service)

**Task**:
Update `find_mirror_by_external_id` in each service:

**Pattern to find**:
```elixir
defp find_mirror_by_external_id(external_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(external_id == ^external_id))
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end
```

**Replace with**:
```elixir
defp find_mirror_by_external_id(external_id, erp_connection_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(
    external_id == ^external_id and 
    erp_connection_id == ^erp_connection_id
  ))
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end
```

**Also update all call sites** to pass `erp_connection_id`.

**Files to update**:
1. [ ] `bill_reconciliation_service.ex`
2. [ ] `expense_report_reconciliation_service.ex`
3. [ ] `ap_payment_reconciliation_service.ex`
4. [ ] `vendor_reconciliation_service.ex`
5. [ ] `journal_entry_reconciliation_service.ex`
6. [ ] `vendor_credit_reconciliation_service.ex`
7. [ ] `expense_line_item_reconciliation_service.ex`
8. [ ] `bill_line_item_reconciliation_service.ex`
9. [ ] `ap_payment_application_reconciliation_service.ex`
10. [ ] `expense_report_payment_reconciliation_service.ex`

**Acceptance Criteria**:
- [ ] All 10 services updated
- [ ] Function signature includes `erp_connection_id`
- [ ] Query filters by both `external_id` AND `erp_connection_id`
- [ ] All call sites updated to pass `erp_connection_id`

---

## Priority 1: Recovery & Monitoring

### AI-005: Add retry_source_update action to PushEntityRecord

**Assignee**: Implementation Team  
**File**: `lib/flame_teampay_payables/ember_erp/resources/push_request/push_entity_record.ex`  
**Priority**: P1  
**Estimated Effort**: 30 minutes

**Task**:
Add action to retry failed source updates:

```elixir
action :retry_source_update do
  description "Retry updating the source domain record after a failed attempt"
  
  run fn entity_record, _context ->
    # Only retry if status is :failed
    if entity_record.source_update_status != :failed do
      {:error, "Source update status is not :failed"}
    else
      # Determine source module based on entity_type
      case retry_source_update_for_entity(entity_record) do
        {:ok, _} ->
          Ash.update(entity_record, %{source_update_status: :updated},
            tenant: entity_record.workspace_id, authorize?: false)
        error ->
          error
      end
    end
  end
end

defp retry_source_update_for_entity(%{entity_type: :bill} = entity_record) do
  # Load push request to get source_resource_id
  {:ok, push_request} = Ash.get(PushRequest, entity_record.push_request_id,
    tenant: entity_record.workspace_id, authorize?: false)
  
  alias FlameTeampayPayables.EmberExpenseCard.Resources.ExpenseCardTransaction.ExpenseCardTransaction
  
  case Ash.get(ExpenseCardTransaction, push_request.source_resource_id,
    tenant: entity_record.workspace_id, authorize?: false
  ) do
    {:ok, txn} when not is_nil(txn) ->
      ExpenseCardTransaction.mark_erp_synced(txn,
        %{erp_external_id: entity_record.external_id},
        tenant: entity_record.workspace_id,
        authorize?: false
      )
    _ ->
      {:error, :source_not_found}
  end
end
```

**Acceptance Criteria**:
- [ ] Action only works when `source_update_status == :failed`
- [ ] Successfully updates source and changes status to `:updated`
- [ ] Handles different entity types appropriately

---

### AI-006: Add monitoring for failed source updates

**Assignee**: Implementation Team  
**File**: `lib/flame_teampay_payables/ember_erp/workers/monitor_sync_health_worker.ex`  
**Priority**: P1  
**Estimated Effort**: 30 minutes

**Task**:
Add check for failed source updates in health monitoring:

```elixir
defp check_failed_source_updates(workspace_id) do
  case PushEntityRecord
       |> Ash.Query.filter(expr(
         source_update_status == :failed and
         inserted_at > ago(24, :hour)
       ))
       |> Ash.read(tenant: workspace_id, authorize?: false) do
    {:ok, failed_records} when length(failed_records) > 0 ->
      Logger.warning("Found #{length(failed_records)} PushEntityRecords with failed source updates",
        workspace_id: workspace_id,
        count: length(failed_records),
        ids: Enum.map(failed_records, & &1.id)
      )
      
      # Optionally auto-retry
      Enum.each(failed_records, fn record ->
        PushEntityRecord.retry_source_update(record)
      end)
      
    _ ->
      :ok
  end
end
```

**Acceptance Criteria**:
- [ ] Queries for failed source updates in last 24 hours
- [ ] Logs warning with count and IDs
- [ ] Optionally auto-retries failed updates

---

## Priority 2: Follow-up Tasks

### AI-007: Extract shared ReconciliationQueryBuilder module

**Assignee**: Implementation Team  
**Priority**: P2  
**Estimated Effort**: 2 hours

**Task**:
Create shared module to DRY up reconciliation services:

```elixir
defmodule FlameTeampayPayables.EmberBridge.Services.Reconciliation.QueryBuilder do
  @moduledoc """
  Shared query building functions for reconciliation services.
  """
  
  require Ash.Query
  import Ash.Expr
  
  def find_mirror_by_external_id(mirror_module, external_id, erp_connection_id, workspace_id) do
    mirror_module
    |> Ash.Query.filter(expr(
      external_id == ^external_id and 
      erp_connection_id == ^erp_connection_id
    ))
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
  end
  
  def find_entity_record_by_external_id(external_id, erp_connection_id, entity_type, workspace_id) do
    PushEntityRecord
    |> Ash.Query.filter(expr(
      external_id == ^external_id and
      erp_connection_id == ^erp_connection_id and
      entity_type == ^entity_type
    ))
    |> Ash.read_one(tenant: workspace_id, authorize?: false)
  end
end
```

**Acceptance Criteria**:
- [ ] Shared module created
- [ ] All 10 reconciliation services refactored to use it
- [ ] Tests updated

---

## Implementation Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ORDER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Schema Changes                                        │
│  ├── AI-001: Add source_update_status to PushEntityRecord       │
│  └── Run migration                                               │
│                                                                  │
│  Phase 2: Core Fixes (can be parallel)                          │
│  ├── AI-002: Add update_source_transaction step                 │
│  ├── AI-003: Fix execute_push.ex persistence                    │
│  └── AI-004: Update 10 reconciliation services                  │
│                                                                  │
│  Phase 3: Recovery & Monitoring                                 │
│  ├── AI-005: Add retry_source_update action                     │
│  └── AI-006: Add monitoring for failed updates                  │
│                                                                  │
│  Phase 4: Cleanup (follow-up)                                   │
│  └── AI-007: Extract shared ReconciliationQueryBuilder          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

After implementation, verify:

- [ ] Card transaction shows correct sync status after push
- [ ] No duplicate records created with multiple ERP connections
- [ ] Failed pushes show `:failed` status with error message
- [ ] Failed pushes can be retried after fixing underlying issue
- [ ] `PushEntityRecord.source_update_status` is tracked
- [ ] Monitoring detects failed source updates

---

*"Action without planning is chaos; planning without action is futility."*
