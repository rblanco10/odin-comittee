# Session Transcript

> **Session ID**: 2026-01-13_001_sync-state-machine-audit  
> **Type**: Deliberative Session  
> **Status**: ACTIVE  
> **Recording Clerk**: Emily Watson

---

## Session Opening

**Victoria Sterling (Chair)**: This is Victoria Sterling, Chair. I call this session to order.

Our goal today is to audit and fix three critical production issues in the sync/push state machine that the Human Director has personally experienced:

1. Card transactions showing "Pending" forever after successful push
2. Duplicate records being created during sync
3. Failed pushes staying "Pending" and blocking retries

I have activated the following members based on this topic:
- **Domain Expert**: Linda Tran (Financial Reconciliation)
- **Critics**: Dr. Eleanor Vance (Security), Priya Sharma (Integration), Elena Rodriguez (Failure), Gregory Stein (Consistency)
- **Technical**: Brandon Taylor (Ash), James Wright (Reactors)
- **Vice Chair**: Adrian Cross for integration concerns

Recording Clerk, please begin transcript. I will now present the findings from our prior analysis.

---

## Part 1: Findings Presentation

**Victoria Sterling (Chair)**: Based on our investigation, we have identified three distinct gaps causing the reported issues. Let me present each.

### GAP-SYNC-STATUS-001: Card Transaction Source Not Updated

**Location**: `push_card_spend_reactor.ex`

**The Problem**: When a card transaction is successfully pushed to the ERP as a bill, the reactor:
1. ✅ Creates the bill in the ERP
2. ✅ Creates a `PushEntityRecord` with the external_id
3. ✅ Updates the `PushRequest` status to `:pushed`
4. ❌ **NEVER** updates `ExpenseCardTransaction.erp_synced_at`

**Impact**: The UI queries `erp_synced_at` to show sync status. Since it's never set, the transaction perpetually shows "Pending" or "Ready to Sync" even though it was successfully pushed.

**Contrast with Expense Reports**: The `PushReconciliationService.update_expense_erp_link()` correctly updates `ReimbursementRequest.erp_expense_report_id` after sync. Card transactions lack this equivalent step.

---

### GAP-DUPLICATE-001: Missing erp_connection_id in Reconciliation

**Location**: All reconciliation services in `ember_bridge/services/reconciliation/`

**The Problem**: The `find_mirror_by_external_id` function queries:

```elixir
# CURRENT (BROKEN)
defp find_mirror_by_external_id(external_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(external_id == ^external_id))  # ← Missing erp_connection_id!
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end
```

**Impact**: If two ERP connections exist (e.g., sandbox and production), and both have a bill with `external_id = "BILL-123"`, the query returns the wrong one or creates a duplicate.

**Affected Services** (10 total):
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

---

### GAP-RETRY-001: Failed Status Not Persisted

**Location**: `execute_push.ex` (manual action)

**The Problem**: When a push reactor fails, the error handling does:

```elixir
# CURRENT (BROKEN) - Line ~173-178
updated_record =
  request
  |> Map.put(:status, status)  # ← Just a map update, NOT database!
  |> Map.put(:processed_at, now)
  |> Map.put(:error_message, error_message)
  |> Map.put(:retry_count, request.retry_count + 1)
{:ok, updated_record}  # ← Returns modified struct, Ash doesn't persist it
```

**Impact**: 
1. The `PushRequest` remains `:pending` in the database
2. User sees "Pending" status even though push failed
3. Retry attempts fail with "already synced" because the identity constraint sees an existing `:pending` request
4. No error message is visible to diagnose the failure

---

## Part 2: Proposed Fix Plan

**Victoria Sterling (Chair)**: I now present the proposed fixes for committee review.

### Fix 1: GAP-SYNC-STATUS-001 - Update Source Transaction

**File**: `push_card_spend_reactor.ex`

**Change**: Add new step after `create_bill_entity_record`:

```elixir
# NEW STEP: Update source transaction with sync status
step :update_source_transaction do
  argument :push_request, result(:validate_push_request)
  argument :bill_entity_record, result(:create_bill_entity_record)

  run fn %{push_request: pr, bill_entity_record: entity_record}, _context ->
    Logger.info("PushCardSpendReactor: Updating source transaction #{pr.source_resource_id}")
    
    case ExpenseCardTransaction.mark_erp_synced(
      pr.source_resource_id,
      %{erp_external_id: entity_record.external_id},
      tenant: pr.workspace_id,
      authorize?: false
    ) do
      {:ok, _updated} ->
        Logger.info("PushCardSpendReactor: Source transaction marked as synced")
        {:ok, :source_updated}
      {:error, reason} ->
        # Non-fatal - log but continue
        Logger.warning("PushCardSpendReactor: Failed to update source: #{inspect(reason)}")
        {:ok, :source_update_failed}
    end
  end
end
```

**Rationale**: 
- Uses existing `mark_erp_synced` action on `ExpenseCardTransaction`
- Non-fatal failure (push succeeded, just tracking failed)
- Follows same pattern as expense report reconciliation

---

### Fix 2: GAP-DUPLICATE-001 - Add erp_connection_id to Queries

**Files**: All 10 reconciliation services

**Change**: Update `find_mirror_by_external_id` signature and query:

```elixir
# FIXED
defp find_mirror_by_external_id(external_id, erp_connection_id, workspace_id) do
  @mirror_module
  |> Ash.Query.filter(expr(
    external_id == ^external_id and 
    erp_connection_id == ^erp_connection_id
  ))
  |> Ash.read_one(tenant: workspace_id, authorize?: false)
end
```

**Callers**: Update all call sites to pass `erp_connection_id`:

```elixir
# Before
find_mirror_by_external_id(external_id, workspace_id)

# After
find_mirror_by_external_id(external_id, entity_record.erp_connection_id, workspace_id)
```

**Rationale**:
- `external_id` is only unique within an ERP connection
- Multi-connection workspaces need connection-scoped queries
- Matches the identity constraint on mirror resources

---

### Fix 3: GAP-RETRY-001 - Persist Failed Status

**File**: `execute_push.ex`

**Change**: Replace map manipulation with `Ash.update`:

```elixir
# FIXED - Error handling path
defp handle_reactor_failure(request, error) do
  error_message = format_error_message(error)
  status = determine_failure_status(error)
  
  case Ash.update(request, %{
    status: status,
    processed_at: DateTime.utc_now(),
    error_message: error_message,
    retry_count: request.retry_count + 1
  }, action: :update, tenant: request.workspace_id, authorize?: false) do
    {:ok, updated} ->
      Logger.info("ExecutePush: Marked request #{request.id} as #{status}")
      {:error, %{request: updated, error: error}}
    {:error, update_error} ->
      Logger.error("ExecutePush: Failed to persist failure status: #{inspect(update_error)}")
      {:error, %{request: request, error: error, persistence_failed: true}}
  end
end

defp determine_failure_status(error) do
  case error do
    %{type: :blocked} -> :blocked
    %{type: :validation} -> :failed
    _ -> :failed
  end
end
```

**Rationale**:
- Explicit `Ash.update` persists to database
- Preserves error message for debugging
- Allows proper retry after fixing underlying issue

---

## Part 3: Critic Challenge Round

**Victoria Sterling (Chair)**: I now call for critic challenges. Dr. Vance, please begin.

---

### Security Adversary Challenge

**Dr. Eleanor Vance (Security Adversary)**: This is Dr. Eleanor Vance, Security Adversary. I have concerns about Fix 1.

**Challenge 1: Non-Fatal Failure Masking**

The proposed fix treats source update failure as non-fatal:

```elixir
{:error, reason} ->
  Logger.warning("...")
  {:ok, :source_update_failed}  # ← Swallows error
```

**Concern**: If `mark_erp_synced` consistently fails (e.g., permission issue, missing action), we'll have:
- Bills in ERP ✅
- PushEntityRecord created ✅
- Source transaction NOT updated ❌
- No alerting, just warnings in logs

**Question**: Should we track this failure state somewhere queryable? Perhaps a new status on PushEntityRecord like `:pushed_source_update_failed`?

**Challenge 2: Error Message Exposure (Fix 3)**

The error message is stored directly:

```elixir
error_message: format_error_message(error)
```

**Question**: Does `format_error_message` sanitize sensitive data? Could ERP API errors contain credentials or PII?

---

### Integration Pessimist Challenge

**Priya Sharma (Integration Pessimist)**: This is Priya Sharma, Integration Pessimist. I have integration concerns.

**Challenge 1: Cross-Domain Dependency (Fix 1)**

The reactor in `ember_erp` is now directly calling `ExpenseCardTransaction.mark_erp_synced` from `ember_expense_card`.

**Concern**: This creates a hard dependency:
- `ember_erp` → `ember_expense_card`

**Question**: Is this the correct dependency direction? Should `ember_expense_card` be notified via event/callback instead?

**Challenge 2: Reconciliation Service Consistency (Fix 2)**

We're updating 10 reconciliation services. 

**Question**: 
1. Are all 10 services structured identically? 
2. Could we miss one?
3. Should this be a shared function in a base module?

---

### Failure Advocate Challenge

**Elena Rodriguez (Failure Advocate)**: This is Elena Rodriguez, Failure Advocate. I challenge the failure scenarios.

**Challenge 1: Partial Success State (Fix 1)**

If `update_source_transaction` fails but everything else succeeds:

```
PushRequest: :pushed ✅
PushEntityRecord: :pushed ✅
ExpenseCardTransaction.erp_synced_at: nil ❌
```

**Question**: How does the user retry just the source update? They can't re-push (already pushed). They can't manually update (no UI). Is there a recovery path?

**Challenge 2: Database Transaction Boundary (Fix 3)**

The `Ash.update` in error handling is outside the reactor's transaction.

**Question**: If the database is temporarily unavailable when we try to persist the failure:
1. The push already failed
2. We can't record that it failed
3. What state are we in?

Should we wrap this in a retry with backoff?

---

### Consistency Challenger Challenge

**Gregory Stein (Consistency Challenger)**: This is Gregory Stein, Consistency Challenger. I challenge consistency.

**Challenge 1: Inconsistent Source Update Patterns**

Currently:
- **Expense Reports**: Updated via `PushReconciliationService` (after sync)
- **Card Transactions**: Proposed to update in reactor (during push)

**Question**: Why different patterns? Should we standardize on one approach?

**Challenge 2: Error Message Format Consistency**

Fix 3 introduces `format_error_message(error)`. 

**Question**: Is this consistent with how other error messages are formatted in the codebase? Do we have a standard error formatting utility?

---

## Part 4: Response to Challenges

**Victoria Sterling (Chair)**: Thank you, critics. I now call on our technical specialists to respond.

---

### Response to Security Challenges

**Brandon Taylor (Ash Framework Expert)**: This is Brandon Taylor, Ash Framework Expert. Responding to Dr. Vance's challenges.

**Re: Non-Fatal Failure Masking**

Dr. Vance raises a valid point. I propose we:

1. Add a `source_update_status` field to `PushEntityRecord`:
```elixir
attribute :source_update_status, :atom do
  constraints [one_of: [:pending, :updated, :failed]]
  default :pending
end
```

2. Update the step to record the outcome:
```elixir
case ExpenseCardTransaction.mark_erp_synced(...) do
  {:ok, _} ->
    Ash.update(entity_record, %{source_update_status: :updated}, ...)
    {:ok, :source_updated}
  {:error, reason} ->
    Ash.update(entity_record, %{source_update_status: :failed}, ...)
    {:ok, :source_update_failed}
end
```

3. Add a monitoring query for failed source updates:
```elixir
PushEntityRecord
|> Ash.Query.filter(source_update_status == :failed)
|> Ash.read(...)
```

**Re: Error Message Sanitization**

Good catch. We should use the existing `ErrorFormatter` module:

```elixir
error_message = ErrorFormatter.sanitize_for_storage(error)
```

This strips:
- API keys/tokens
- Full stack traces
- PII from error context

---

### Response to Integration Challenges

**James Wright (Reactor Specialist)**: This is James Wright, Reactor Specialist. Responding to Priya's challenges.

**Re: Cross-Domain Dependency**

The dependency direction is actually correct:
- `ember_erp` is the orchestrator for ERP operations
- `ember_expense_card` is the source domain
- The push reactor needs to update the source after push

However, I agree we should consider decoupling. Options:

1. **Direct call** (proposed): Simple, synchronous, guaranteed
2. **Event-based**: `ember_erp` emits event, `ember_expense_card` listens
3. **Callback pattern**: Source domain registers callback

**Recommendation**: Keep direct call for now. It's simpler and the dependency already exists (reactor loads `ExpenseCardTransaction` to build the bill). We can refactor to events later if needed.

**Re: Reconciliation Service Consistency**

I've audited all 10 services. They follow the same pattern but are copy-pasted, not shared.

**Recommendation**: 
1. For this fix: Update all 10 individually (lower risk)
2. Follow-up task: Extract shared `ReconciliationQueryBuilder` module

---

### Response to Failure Challenges

**Brandon Taylor (Ash Framework Expert)**: Responding to Elena's challenges.

**Re: Partial Success Recovery**

With the `source_update_status` field proposed above, we can:

1. Query for failed source updates:
```elixir
PushEntityRecord
|> Ash.Query.filter(status == :pushed and source_update_status == :failed)
```

2. Add a `retry_source_update` action:
```elixir
action :retry_source_update do
  run fn entity_record, _context ->
    # Re-attempt the source update
    ExpenseCardTransaction.mark_erp_synced(...)
  end
end
```

3. Add to `MonitorSyncHealthWorker` to auto-retry failed source updates.

**Re: Database Unavailability During Failure Persistence**

Valid edge case. Proposal:

```elixir
defp handle_reactor_failure(request, error) do
  # Retry persistence up to 3 times with backoff
  Enum.reduce_while(1..3, nil, fn attempt, _acc ->
    case persist_failure(request, error) do
      {:ok, updated} -> {:halt, {:ok, updated}}
      {:error, _} ->
        Process.sleep(attempt * 100)  # 100ms, 200ms, 300ms
        {:cont, nil}
    end
  end)
  |> case do
    {:ok, updated} -> {:error, %{request: updated, error: error}}
    nil -> 
      # Last resort: log and return original error
      Logger.error("CRITICAL: Could not persist failure status for #{request.id}")
      {:error, %{request: request, error: error, persistence_failed: true}}
  end
end
```

---

### Response to Consistency Challenges

**James Wright (Reactor Specialist)**: Responding to Gregory's challenges.

**Re: Inconsistent Source Update Patterns**

The difference is intentional:

| Entity | Update Timing | Reason |
|--------|---------------|--------|
| Expense Report | After sync (reconciliation) | Needs mirror ID to link |
| Card Transaction | During push | Only needs external_id |

For expense reports, we link `ReimbursementRequest.erp_expense_report_id` to the **mirror** record (our local copy). This requires sync to create the mirror first.

For card transactions, we set `erp_synced_at` and `erp_external_id` which are just timestamps and the ERP's ID. No mirror needed.

**Recommendation**: Keep different patterns, they serve different purposes. Document the distinction.

**Re: Error Message Format**

We have `FlameTeampayPayables.EmberErp.ErrorFormatter` with:
- `format_for_logging/1` - Full details for logs
- `format_for_storage/1` - Sanitized for database
- `format_for_user/1` - Human-readable for UI

We should use `format_for_storage/1` in Fix 3.

---

## Part 5: Revised Plan

**Victoria Sterling (Chair)**: Based on critic feedback, here is the revised plan.

### Revised Fix 1: GAP-SYNC-STATUS-001

**Changes from original**:
1. Add `source_update_status` attribute to `PushEntityRecord`
2. Record success/failure of source update
3. Add `retry_source_update` action for recovery
4. Add monitoring for failed source updates

### Revised Fix 2: GAP-DUPLICATE-001

**Changes from original**:
1. Update all 10 reconciliation services (no change)
2. **Follow-up task**: Extract shared `ReconciliationQueryBuilder` module

### Revised Fix 3: GAP-RETRY-001

**Changes from original**:
1. Use `ErrorFormatter.format_for_storage/1` for sanitization
2. Add retry with backoff for persistence failures
3. Log CRITICAL if persistence ultimately fails

---

## Part 6: Final Vote

**Victoria Sterling (Chair)**: Discussion appears complete. The proposal before us is the revised three-fix plan as documented.

Are there any final considerations? 

*[Pause]*

Critics, any remaining challenges?

**Dr. Eleanor Vance**: Security Adversary is satisfied with the revisions.

**Priya Sharma**: Integration Pessimist accepts the direct call approach with documented follow-up.

**Elena Rodriguez**: Failure Advocate is satisfied with recovery paths.

**Gregory Stein**: Consistency Challenger accepts the documented pattern differences.

**Victoria Sterling (Chair)**: I now call the question. All in favor?

*[Unanimous approval]*

**Victoria Sterling (Chair)**: The motion passes unanimously. Decision is recorded.

---

## Session Close

**Victoria Sterling (Chair)**: This session is now closed.

**Summary**:
- 3 fixes approved with revisions
- 1 follow-up task identified (shared reconciliation module)
- Implementation to proceed immediately

Session Historian has recorded all decisions. Action items are documented in `action_items.md`.

STATUS.md will be updated. Thank you all.

---

*Session ended: 2026-01-13*
