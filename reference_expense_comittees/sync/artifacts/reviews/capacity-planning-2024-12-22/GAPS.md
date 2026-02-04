# Capacity Planning Session: Identified Gaps

> **Session:** SC-2025-12-22-001
> **Created:** 2025-12-22

---

## Critical Gaps (Must Fix)

### GAP-CAP-001: Queue Configuration Mismatch

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Status** | ❌ OPEN |
| **Component** | WorkspaceSyncWorker / Oban Config |

**Problem:**
- `WorkspaceSyncWorker` declares `queue: :erp_sync`
- `config.exs` defines `erp_sync_default`, NOT `erp_sync`
- Jobs run with no global limit or partitioning

**Impact:**
- No protection against thundering herd
- No fair scheduling across workspaces
- Could overwhelm ERP APIs

**Fix:**
```elixir
# Add to config.exs DynamicQueues:
erp_sync: [limit: 10, global_limit: 25, partition: [:args, "workspace_id"]],
```

**Files:** `config/config.exs`

---

### GAP-CAP-002: No Tiered Sync Implementation

| Field | Value |
|-------|-------|
| **Severity** | 🔴 CRITICAL |
| **Status** | ❌ OPEN |
| **Component** | WorkspaceSyncReactor |

**Problem:**
- Reactor syncs all 12 entities every run
- Average duration: 30-60 seconds
- Cannot meet 2-minute SLA at scale

**Impact:**
- 250-500 workers needed for 1,000 workspaces
- Excessive infrastructure cost
- Cannot guarantee 2-min SLA

**Fix:**
- Implement counter/modulo tiered sync
- See IMPLEMENTATION-SPEC.md for details

**Files:** `workspace_sync_reactor.ex`, `erp_connection.ex`

---

## Medium Gaps

### GAP-CAP-003: No Periodic Scheduling Trigger

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ❌ OPEN |
| **Component** | WorkspaceSyncWorker |

**Problem:**
- No AshOban trigger or cron for `WorkspaceSyncWorker`
- Must be manually scheduled

**Impact:**
- Syncs don't happen automatically
- Operational burden to trigger syncs

**Fix Options:**
1. Add AshOban trigger on ErpConnection
2. Add cron job to call `schedule_all_connections/0`
3. External scheduler (Kubernetes CronJob, etc.)

**Files:** `workspace_sync_worker.ex` or external config

---

### GAP-CAP-004: Missing run_number Attribute

| Field | Value |
|-------|-------|
| **Severity** | 🟡 MEDIUM |
| **Status** | ❌ OPEN |
| **Component** | ErpConnection |

**Problem:**
- No `sync_run_number` attribute on ErpConnection
- Cannot track which tier to sync next

**Impact:**
- Tiered sync cannot be implemented without this

**Fix:**
- Add attribute and migration
- See IMPLEMENTATION-SPEC.md for details

**Files:** `erp_connection.ex`, new migration

---

## Low Gaps

### GAP-CAP-005: Legacy SyncConfiguration Still Active

| Field | Value |
|-------|-------|
| **Severity** | 🟢 LOW |
| **Status** | ℹ️ INFORMATIONAL |
| **Component** | SyncConfiguration / SyncReactor |

**Problem:**
- Old per-entity-type scheduling still exists
- `SyncConfiguration` AshOban triggers `SyncReactor`

**Impact:**
- Potential duplicate syncs
- Confusion about which system is active

**Fix:**
- Deprecate after WorkspaceSyncReactor is stable
- Or keep for backwards compatibility

**Files:** `sync_configuration.ex`, `sync_reactor.ex`

---

## Summary

| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| GAP-CAP-001 | 🔴 Critical | ❌ Open | Queue mismatch |
| GAP-CAP-002 | 🔴 Critical | ❌ Open | No tiered sync |
| GAP-CAP-003 | 🟡 Medium | ❌ Open | No periodic trigger |
| GAP-CAP-004 | 🟡 Medium | ❌ Open | Missing run_number |
| GAP-CAP-005 | 🟢 Low | ℹ️ Info | Legacy still active |

---

## Implementation Order

1. **GAP-CAP-001** — Fix queue config (5 min, unlocks safe testing)
2. **GAP-CAP-004** — Add run_number attribute (25 min)
3. **GAP-CAP-002** — Implement tiered sync (45 min)
4. **GAP-CAP-003** — Add periodic trigger (30 min)
5. **GAP-CAP-005** — Evaluate legacy deprecation (later)

---

*Gaps documented by Sync Committee on 2025-12-22*

