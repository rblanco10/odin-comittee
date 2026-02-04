# Engineering Handoff: SC-2026-01-02-011

## AshOban Multitenancy Fix for PushRequest

### Quick Reference

| Item | Value |
|------|-------|
| **Session** | SC-2026-01-02-011 |
| **Priority** | P1 - Blocker |
| **Status** | ✅ IMPLEMENTED |
| **Commit** | `b7aff3db0` (combined with SC-008/009) |

---

## The Bug

**Symptom**: Oban jobs created but immediately discarded with `trigger_no_longer_applies`

**Root Cause**: The `pending_push_requests` read action lacked `multitenancy :allow_global`, causing the query to fail when AshOban's worker tried to read the push request before setting tenant context.

---

## The Fix

```elixir
# lib/flame_teampay_payables/ember_erp/resources/push_request/push_request.ex

read :pending_push_requests do
  description "Find pending push requests for AshOban trigger"
  multitenancy :allow_global  # SC-2026-01-02-011
  pagination keyset?: true, required?: false
  filter expr(status == :pending)
end
```

---

## Why `multitenancy :allow_global` Is Required

### AshOban Worker Processing Order

1. Oban picks up job from `oban_jobs` table
2. Worker's `perform/1` is called
3. **AshOban reads record using `worker_read_action`** ← No tenant yet!
4. Tenant context is extracted from the loaded record
5. Subsequent operations use that tenant

At step 3, there's no tenant context available. Without `allow_global`, the query fails.

### Pattern Reference

This follows the established `ChannelDelivery` pattern:

```elixir
# ChannelDelivery uses identical configuration
read :pending_deliveries do
  multitenancy :allow_global
  pagination keyset?: true, required?: false
  filter expr(status == :pending)
end
```

---

## Security Assessment

| Concern | Assessment |
|---------|------------|
| **Tenant Isolation** | ✅ Safe - Read-only, internal worker use only |
| **Data Access** | ✅ Safe - Filtered to `pending` status only |
| **Authorization** | ✅ Safe - Worker uses `authorize?: false` appropriately |
| **Subsequent Ops** | ✅ Safe - Use record's workspace_id as tenant |

---

## Testing

### SQL Verification

After clicking "Sync to ERP":

```sql
-- Check push request was created
SELECT id, status, entity_type FROM ember_erp_push_requests 
ORDER BY inserted_at DESC LIMIT 1;

-- Check Oban job was created and completed
SELECT id, state, worker, completed_at FROM oban_jobs 
WHERE queue = 'erp_push' ORDER BY inserted_at DESC LIMIT 1;
```

**Expected**: Push request status = `completed`, Oban job state = `completed`

---

## Complete Fix Summary (SC-008 + SC-009 + SC-011)

All three sessions were required to fix push request processing:

| Session | Fix | Purpose |
|---------|-----|---------|
| SC-008 | `run_oban_trigger(:process_push)` | Create Oban job on insert |
| SC-009 | `worker_read_action :pending_push_requests` | Tell worker which action to use |
| SC-011 | `multitenancy :allow_global` | Allow worker to read before tenant set |

