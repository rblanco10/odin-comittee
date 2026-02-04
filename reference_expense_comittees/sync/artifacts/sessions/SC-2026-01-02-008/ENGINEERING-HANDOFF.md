# Engineering Handoff: SC-2026-01-02-008

> **Session:** SC-2026-01-02-008  
> **Priority:** P1 (Critical Bug Fix)  
> **Status:** Ready for Implementation

---

## Summary

Fix the `PushRequest` AshOban trigger to actually create Oban jobs when push requests are created.

---

## The Bug

```
User clicks "Sync to ERP" → PushRequest created → NO Oban job → Nothing happens
```

---

## The Fix

### File: `lib/flame_teampay_payables/ember_erp/resources/push_request/push_request.ex`

### Change 1: Update Trigger Configuration

**Before:**
```elixir
trigger :process_push do
  action :execute_push
  where expr(status == :pending)
  scheduler_cron false  # Process immediately
  queue :erp_push
  max_attempts 3
end
```

**After:**
```elixir
trigger :process_push do
  action :execute_push
  where expr(status == :pending)
  # SC-2026-01-02-008: Changed from false to cron fallback
  # Immediate processing via run_oban_trigger in create action
  # Cron serves as fallback for any missed triggers
  scheduler_cron "* * * * *"
  queue :erp_push
  max_attempts 3
  # SC-2026-01-02-008: Explicit worker module name prevents dangling jobs on refactor
  worker_module_name FlameTeampayPayables.EmberErp.Workers.ProcessPushWorker
end
```

### Change 2: Add Immediate Trigger to Create Action

**Before:**
```elixir
create :create do
  primary? true
  accept [
    :workspace_id,
    :erp_connection_id,
    :entity_type,
    # ... other fields
  ]
  # Default requested_at to now if not provided
  change set_attribute(:requested_at, &DateTime.utc_now/0)
end
```

**After:**
```elixir
create :create do
  primary? true
  accept [
    :workspace_id,
    :erp_connection_id,
    :entity_type,
    # ... other fields
  ]
  # Default requested_at to now if not provided
  change set_attribute(:requested_at, &DateTime.utc_now/0)
  
  # SC-2026-01-02-008: Trigger Oban job immediately on create
  # This follows the ChannelDelivery pattern for immediate processing
  # Cron schedule in trigger serves as fallback for any missed triggers
  change AshOban.Changes.BuiltinChanges.run_oban_trigger(:process_push)
end
```

---

## Verification Steps

1. **Restart Phoenix server** to pick up changes
2. **Navigate to** `/expense/reimbursements`
3. **Click "Sync to ERP"** on any reimbursement
4. **Check terminal logs** for:
   ```
   [info] Created push request XXX for expense/expense_report
   [info] AshOban trigger starting: process_push
   [info] ExecutePush: Push reactor completed successfully
   ```
5. **Check NetSuite** for new expense report

---

## Why This Pattern?

Following the `ChannelDelivery` pattern (most mature in codebase):

1. **`run_oban_trigger` in create** = Immediate processing
2. **Cron fallback** = Catches any edge cases (direct DB inserts, failed triggers)
3. **`worker_module_name`** = Safe refactoring (per best practices doc)

---

## Related Commits

- `SC-2026-01-02-005`: Added PushConfiguration for expense_report entity type
- `SC-2026-01-02-007`: Fixed binary UUID encoding in workspace_id



