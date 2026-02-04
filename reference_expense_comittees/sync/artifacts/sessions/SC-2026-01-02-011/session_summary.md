# Sync Committee Session SC-2026-01-02-011

## Session Metadata

| Field | Value |
|-------|-------|
| **Session ID** | SC-2026-01-02-011 |
| **Date** | 2026-01-02 |
| **Status** | COMPLETED |
| **Topic** | AshOban Worker Multitenancy Configuration |
| **Outcome** | APPROVED & IMPLEMENTED |

---

## Problem Statement

After fixing the AshOban trigger configuration in SC-2026-01-02-008 and SC-2026-01-02-009, Oban jobs were being created but immediately discarded with:

```
[debug] FlameTeampayPayables.EmberErp.Resources.PushRequest.pending_push_requests: 
  skipped query run due to filter being false
```

The push request remained in `pending` status and was never processed.

---

## Root Cause Analysis

### Investigation Steps

1. **Job Created**: Oban job was successfully inserted into `oban_jobs` table
2. **Worker Started**: `ProcessPushWorker` was invoked by Oban
3. **Query Failed**: The `pending_push_requests` read action returned no results
4. **Job Discarded**: AshOban reported `:trigger_no_longer_applies`

### Root Cause

The `pending_push_requests` read action was missing `multitenancy :allow_global`:

```elixir
# BEFORE - Would fail
read :pending_push_requests do
  filter expr(status == :pending)
end
```

**Why This Fails:**

1. `PushRequest` is a multi-tenant resource (has `multitenancy` configuration)
2. When AshOban's worker calls the read action, it does so **before** setting tenant context
3. Without `allow_global`, Ash requires a tenant and the query fails
4. The filter evaluates to `false` because no tenant = no matching records

### AshOban Processing Flow

```
Oban picks up job
  └── ProcessPushWorker.perform/1 called
      └── AshOban reads record using worker_read_action
          └── pending_push_requests (NO TENANT YET!)
              └── Query requires tenant → returns empty
                  └── AshOban: "trigger_no_longer_applies"
                      └── Job discarded
```

---

## Solution

### Approved Fix

Add `multitenancy :allow_global` to the `pending_push_requests` read action:

```elixir
read :pending_push_requests do
  description "Find pending push requests for AshOban trigger"
  multitenancy :allow_global  # SC-2026-01-02-011: Required for AshOban worker
  pagination keyset?: true, required?: false  # AshOban best practice
  filter expr(status == :pending)
end
```

### Why This Is Safe

1. **Read-Only Operation**: This action only reads, doesn't modify data
2. **Internal Use Only**: Called by AshOban worker, not exposed to users
3. **Filtered by Status**: Only returns `pending` records, limited scope
4. **Pattern Established**: Follows `ChannelDelivery` which uses the same pattern
5. **Tenant Context Applied Later**: Once record is loaded, subsequent operations use the record's `workspace_id` as tenant

---

## Committee Discussion

### Security Considerations

**Q: Does `allow_global` bypass tenant isolation?**

A: Only for this specific read action. The read returns records across all tenants, but:
- The action is internal (used by background workers)
- Once loaded, the push request's `workspace_id` provides tenant context for all subsequent operations
- Authorization still applies via `authorize?: false` (controlled by worker)

### Architecture Alignment

**Q: Does this follow established patterns?**

A: Yes. The `ChannelDelivery` resource (considered most mature for AshOban patterns) uses identical configuration:

```elixir
# From ChannelDelivery (existing pattern)
read :pending_deliveries do
  multitenancy :allow_global
  pagination keyset?: true, required?: false
  filter expr(status == :pending)
end
```

### Idempotency Verification

**Q: Does this maintain idempotency requirements?**

A: Yes. The fix is purely about reading the record. Idempotency is enforced by:
- Unique constraint on `PushRequest` (workspace_id + entity_type + source_resource_id)
- Status transitions (pending → processing → completed/failed)
- `erp_expense_report_id` / `erp_ap_payment_id` tracking on source records

---

## Files Changed

| File | Change |
|------|--------|
| `lib/flame_teampay_payables/ember_erp/resources/push_request/push_request.ex` | Added `multitenancy :allow_global` to `pending_push_requests` |

---

## Validation

### Before Fix
```
[debug] pending_push_requests: skipped query run due to filter being false
[info] Job discarded: trigger_no_longer_applies
```

### After Fix
```
[info] AshOban trigger starting: process_push
[info] Executing push for expense_report...
[info] Push completed successfully
```

---

## Committee Approval

| Role | Decision | Notes |
|------|----------|-------|
| **Committee Chair** | ✅ Approved | Standard AshOban pattern |
| **Sync Architect** | ✅ Approved | Follows ChannelDelivery precedent |
| **Standards Enforcer** | ✅ Approved | No security concerns |
| **Data Mapping Specialist** | ✅ Approved | No data integrity impact |
| **Dependency Guardian** | ✅ Approved | Required for async processing |

---

## Related Sessions

- **SC-2026-01-02-008**: Added `run_oban_trigger` to create action
- **SC-2026-01-02-009**: Added `worker_read_action` configuration

These three sessions (008, 009, 011) together form the complete fix for AshOban push request processing.

---

## Lessons Learned

1. **Multi-tenant resources need special handling for background jobs** - Workers run without initial tenant context
2. **`multitenancy :allow_global` is the standard pattern** - Not a workaround, but the intended solution
3. **Always check existing patterns first** - `ChannelDelivery` provided the template
4. **AshOban triggers have a specific initialization order** - Read happens before tenant is set from job args

