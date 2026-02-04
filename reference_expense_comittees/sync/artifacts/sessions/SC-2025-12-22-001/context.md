# Session SC-2025-12-22-001 — Context Archive

> **Session Focus:** Capacity Planning for 2-Minute Sync SLA

---

## Session Summary

This session focused on verifying the sync architecture could scale to 1000+ workspaces while maintaining a 2-minute incremental sync SLA.

---

## Key Discussions

### Turn 1-3: Capacity Analysis

**Problem Identified:**
- Initial analysis showed 6-13x capacity shortfall if syncing all 12 entity types every 2 minutes
- 12 entities × 5s each = 60s per sync
- At 1000 workspaces: would need 500 workers

**User Insight:**
- Not all entities need 2-minute freshness
- Slower-moving data (currencies, GL accounts) can sync less frequently

### Turn 4-6: Counter/Modulo Design

**Solution Proposed:**
- Use a `sync_run_number` counter on `ErpConnection`
- Different entity tiers sync at different modulos:
  - HOT (mod 1): Every run — expense_reports, bills, ap_payments
  - WARM (mod 8): Every 8th run — vendors, employees, projects
  - COLD (mod 30): Every 30th run — gl_accounts, departments, etc.
  - STATIC (mod 720): Daily — currencies, subsidiaries, etc.

**Capacity Math:**
- Average entities per sync: ~3.5 (vs 12)
- Average duration: ~1.75s (vs 60s)
- Workers needed for 1000 workspaces: 15-25 (vs 500)

### Turn 7-10: Queue Configuration Audit

**Gap Found:**
- `WorkspaceSyncWorker` uses `:erp_sync` queue
- But `config.exs` only defines queues in `DynamicQueues` plugin
- Queue was running unthrottled in production config

**Fix Applied:**
- Added `:erp_sync` queue to both `config.exs` and `dev.exs`

### Turn 11-14: Implementation

**Engineering Subcommittee Tasks:**
1. Add `sync_run_number` attribute to `ErpConnection`
2. Create database migration
3. Implement `entities_for_run/1` and `tier_breakdown/1` in reactor
4. Update `init_execution` step for tiered sync
5. Update `finalize` step to increment run_number
6. Add `force_full_sync` support
7. Update worker with `schedule_full_sync/3`

**All tasks completed and verified with tests.**

### Turn 15-16: Testing

**Tests Run:**
- Unit test: `workspace_sync_reactor_tiering_test.exs` — ✅ PASS
- Integration test: `tiered_sync_test.exs` — ✅ PASS

**Bug Fixed During Testing:**
- `increment_sync_run_number` action failed due to non-atomic function change
- Fixed by using `atomic_update(:sync_run_number, expr((sync_run_number || 0) + 1))`

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where to store run_number | `ErpConnection.sync_run_number` | Persistent, survives restarts |
| Tier modulos | 1/8/30/720 | Balances freshness vs load |
| Default global_limit | 25 | Supports 1,700 workspaces with headroom |
| Atomic increment | `expr()` based | Required for Ash atomic mode |

---

## Gaps Identified & Resolved

| Gap | Description | Resolution |
|-----|-------------|------------|
| GAP-CAP-001 | `:erp_sync` queue not in config | Added to config.exs and dev.exs |
| GAP-CAP-002 | Tiered sync not implemented | Implemented with modulo logic |
| GAP-CAP-003 | Missing `run_number` attribute | Added to ErpConnection with migration |

---

## Files Created/Modified

| File | Change |
|------|--------|
| `config/config.exs` | Added `:erp_sync` queue |
| `config/dev.exs` | Added `:erp_sync` queue |
| `erp_connection.ex` | Added `sync_run_number`, `increment_sync_run_number` |
| `workspace_sync_reactor.ex` | Added tier constants, functions, updated steps |
| `workspace_sync_worker.ex` | Added `force_full_sync`, `schedule_full_sync/3` |
| `priv/repo/migrations/...` | New migration for `sync_run_number` |
| `priv/scripts/tiered_sync_test.exs` | Integration test script |
| `test/.../workspace_sync_reactor_tiering_test.exs` | Unit tests |

---

## Committee Members Active

- **Intake Coordinator** — Material gathering
- **Sync Architect** — Capacity analysis and tiered design
- **Standards Enforcer** — Queue configuration audit
- **AP Domain Expert** — Entity tier prioritization
- **Evaluation Subcommittee** — Goal assessment
- **Engineering Subcommittee** — Implementation

---

*Archived by Sync Committee Chair, 2025-12-22*

