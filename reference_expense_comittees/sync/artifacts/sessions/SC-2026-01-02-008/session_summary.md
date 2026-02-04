# Sync Committee Session SC-2026-01-02-008

> **Session ID:** SC-2026-01-02-008  
> **Date:** 2026-01-02  
> **Status:** APPROVED ✅  
> **Topic:** PushRequest AshOban Trigger Not Creating Oban Jobs

---

## Executive Summary

The Sync Committee identified and resolved a critical bug where `PushRequest` records were being created but never processed. The root cause was an incomplete AshOban trigger implementation: `scheduler_cron false` was set (indicating intent for immediate processing) but no `run_oban_trigger` was added to the create action.

---

## Problem Statement

When a user clicked "Sync to ERP" on the Reimbursements page:
1. A `PushRequest` record was created with `status: pending` ✅
2. No Oban job was created to process it ❌
3. The record remained in `pending` state forever ❌
4. No expense report appeared in NetSuite ❌

### Evidence

```sql
-- Push request created but stuck in pending
SELECT id, status, entity_type FROM ember_erp_push_requests 
ORDER BY inserted_at DESC LIMIT 1;

-- Result: acd3c199-c5ed-4a76-9ff7-bd7b1cd50f61 | pending | expense_report

-- No Oban jobs in the queue
SELECT * FROM oban_jobs WHERE queue = 'erp_push';
-- Result: 0 rows
```

---

## Root Cause Analysis

### The Bug

In `push_request.ex`:

```elixir
trigger :process_push do
  action :execute_push
  where expr(status == :pending)
  scheduler_cron false  # ← "Process immediately" per comment, but...
  queue :erp_push
  max_attempts 3
end

create :create do
  primary? true
  accept [...]
  # ← NO run_oban_trigger! Jobs are never created.
end
```

### Why This Happened

- `scheduler_cron false` means no cron scheduler polls for pending records
- Without `run_oban_trigger` in the create action, no immediate job is created
- The trigger definition exists but is never invoked

---

## Pattern Analysis

The committee analyzed three patterns used in the codebase:

| Pattern | Used In | Reliability | Latency |
|---------|---------|-------------|---------|
| Cron + Manual Trigger | ChannelDelivery | ⭐⭐⭐⭐⭐ | Immediate |
| Cron Only | DocumentInbox, SyncConfiguration | ⭐⭐⭐⭐ | ~1 min |
| Manual Trigger Only | (None) | ⭐⭐ | Immediate but risky |

### Key Learning (from document_inbox.ex)

> `# NOTE: scheduler_cron(false) only fires on INSERT, not UPDATE, so we MUST use cron`

---

## Decision

**Approved: Option B - Cron Fallback + Manual Trigger**

This follows the established `ChannelDelivery` pattern and provides:
- ✅ Immediate processing (user doesn't wait)
- ✅ Cron fallback (catches any edge cases)
- ✅ `worker_module_name` (prevents dangling jobs on refactor)
- ✅ Matches project best practices

---

## Implementation

### Changes to `push_request.ex`

**1. Update trigger configuration:**

```elixir
trigger :process_push do
  action :execute_push
  where expr(status == :pending)
  # SC-2026-01-02-008: Cron disabled for multi-tenant resource
  # Jobs created immediately via run_oban_trigger in create action
  scheduler_cron false
  queue :erp_push
  max_attempts 3
  worker_module_name FlameTeampayPayables.EmberErp.Workers.ProcessPushWorker
end
```

> **Note:** We initially tried `scheduler_cron "* * * * *"` but this caused
> `TenantRequired` errors because `PushRequest` is a multi-tenant resource.
> The cron scheduler cannot query across tenants without a `global? true` read action.
> Since `run_oban_trigger` creates jobs immediately, cron fallback isn't needed.

**2. Add immediate trigger to create action:**

```elixir
create :create do
  primary? true
  accept [...]
  
  # SC-2026-01-02-008: Trigger Oban job immediately on create
  change AshOban.Changes.BuiltinChanges.run_oban_trigger(:process_push)
end
```

---

## Session Participants

| Role | Persona | Contributions |
|------|---------|---------------|
| Chair | Committee Chair | Final recommendation |
| Scribe | Session Recorder | Documentation |
| Sync Architect | Technical Lead | Pattern analysis |
| Standards Enforcer | Best Practices | Pattern comparison |
| Precedent Keeper | Historical Context | Prior decisions |
| Dependency Guardian | Risk Assessment | Fallback analysis |

---

## Related Sessions

- **SC-2026-01-02-004**: Approved reimbursement sync implementation (this bug blocked it)
- **SC-2026-01-02-005**: PushConfiguration entity_type mismatch (related infrastructure)
- **SC-2026-01-02-007**: Binary UUID encoding fix (related push infrastructure)

---

## Follow-up Actions

1. ✅ Implement Option B fix
2. ⬜ Test sync flow end-to-end
3. ⬜ Verify expense report appears in NetSuite
4. ⬜ Monitor Oban job processing

---

## Artifacts

- **Session Summary:** This file
- **Engineering Handoff:** `ENGINEERING-HANDOFF.md`

