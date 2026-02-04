# Session Decisions

> **Session ID**: 2026-01-13_001_sync-state-machine-audit  
> **Decision Date**: 2026-01-13  
> **Vote**: Unanimous (all critics satisfied)

---

## Decision 1: Fix GAP-SYNC-STATUS-001 (Card Transaction Source Update)

### Approved Change

Add step to `PushCardSpendReactor` to update source `ExpenseCardTransaction` after successful push.

### Implementation Details

1. **Add attribute to `PushEntityRecord`**:
```elixir
attribute :source_update_status, :atom do
  constraints [one_of: [:pending, :updated, :failed]]
  default :pending
end
```

2. **Add step to `push_card_spend_reactor.ex`**:
```elixir
step :update_source_transaction do
  argument :push_request, result(:validate_push_request)
  argument :bill_entity_record, result(:create_bill_entity_record)

  run fn %{push_request: pr, bill_entity_record: entity_record}, _context ->
    case ExpenseCardTransaction.mark_erp_synced(
      pr.source_resource_id,
      %{erp_external_id: entity_record.external_id},
      tenant: pr.workspace_id,
      authorize?: false
    ) do
      {:ok, _updated} ->
        Ash.update(entity_record, %{source_update_status: :updated}, 
          tenant: pr.workspace_id, authorize?: false)
        {:ok, :source_updated}
      {:error, reason} ->
        Logger.warning("Failed to update source: #{inspect(reason)}")
        Ash.update(entity_record, %{source_update_status: :failed},
          tenant: pr.workspace_id, authorize?: false)
        {:ok, :source_update_failed}
    end
  end
end
```

3. **Add recovery action to `PushEntityRecord`**:
```elixir
action :retry_source_update do
  description "Retry updating the source transaction after a failed attempt"
  # Implementation details in action_items.md
end
```

### Rationale

- Uses existing `mark_erp_synced` action
- Non-fatal failure (push succeeded)
- Tracks failure state for monitoring and recovery
- Follows established patterns in codebase

### Dissenting Opinions

None. All critics satisfied after revisions.

---

## Decision 2: Fix GAP-DUPLICATE-001 (erp_connection_id in Reconciliation)

### Approved Change

Update all 10 reconciliation services to include `erp_connection_id` in mirror lookup queries.

### Implementation Details

**Update function signature and query**:
```elixir
# BEFORE
defp find_mirror_by_external_id(external_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(external_id == ^external_id))
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end

# AFTER
defp find_mirror_by_external_id(external_id, erp_connection_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(
    external_id == ^external_id and 
    erp_connection_id == ^erp_connection_id
  ))
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end
```

**Affected Files** (10 total):
1. `bill_reconciliation_service.ex`
2. `expense_report_reconciliation_service.ex`
3. `ap_payment_reconciliation_service.ex`
4. `vendor_reconciliation_service.ex`
5. `journal_entry_reconciliation_service.ex`
6. `vendor_credit_reconciliation_service.ex`
7. `expense_line_item_reconciliation_service.ex`
8. `bill_line_item_reconciliation_service.ex`
9. `ap_payment_application_reconciliation_service.ex`
10. `expense_report_payment_reconciliation_service.ex`

### Rationale

- `external_id` is only unique within an ERP connection
- Multi-connection workspaces need connection-scoped queries
- Matches identity constraints on mirror resources
- Prevents duplicate records and incorrect linkages

### Follow-up Task

Extract shared `ReconciliationQueryBuilder` module to DRY up the 10 services.

### Dissenting Opinions

None. Integration Pessimist accepted individual updates with documented follow-up.

---

## Decision 3: Fix GAP-RETRY-001 (Persist Failed Status)

### Approved Change

Replace in-memory map manipulation with explicit `Ash.update` to persist failure status to database.

### Implementation Details

**Update `execute_push.ex` error handling**:
```elixir
defp handle_reactor_failure(request, error) do
  error_message = ErrorFormatter.format_for_storage(error)
  status = determine_failure_status(error)
  
  # Retry persistence up to 3 times with backoff
  persist_with_retry(request, %{
    status: status,
    processed_at: DateTime.utc_now(),
    error_message: error_message,
    retry_count: request.retry_count + 1
  })
end

defp persist_with_retry(request, attrs, attempt \\ 1) do
  case Ash.update(request, attrs, 
    action: :update, 
    tenant: request.workspace_id, 
    authorize?: false
  ) do
    {:ok, updated} ->
      Logger.info("ExecutePush: Marked request #{request.id} as #{attrs.status}")
      {:error, %{request: updated, error: attrs.error_message}}
      
    {:error, _} when attempt < 3 ->
      Process.sleep(attempt * 100)
      persist_with_retry(request, attrs, attempt + 1)
      
    {:error, update_error} ->
      Logger.error("CRITICAL: Could not persist failure status for #{request.id}: #{inspect(update_error)}")
      {:error, %{request: request, error: attrs.error_message, persistence_failed: true}}
  end
end

defp determine_failure_status(error) do
  case error do
    %{type: :blocked} -> :blocked
    %{type: :validation} -> :failed
    %{type: :rate_limited} -> :failed  # Can retry
    _ -> :failed
  end
end
```

### Rationale

- Explicit `Ash.update` persists to database
- `ErrorFormatter.format_for_storage/1` sanitizes sensitive data
- Retry with backoff handles transient DB issues
- CRITICAL log for ultimate failure enables alerting
- Allows proper retry after fixing underlying issue

### Dissenting Opinions

None. Security Adversary satisfied with error sanitization. Failure Advocate satisfied with retry mechanism.

---

## Summary

| Decision | Status | Vote |
|----------|--------|------|
| GAP-SYNC-STATUS-001 Fix | ✅ Approved | Unanimous |
| GAP-DUPLICATE-001 Fix | ✅ Approved | Unanimous |
| GAP-RETRY-001 Fix | ✅ Approved | Unanimous |

---

*"Good decisions emerge from rigorous challenge and thoughtful response."*
