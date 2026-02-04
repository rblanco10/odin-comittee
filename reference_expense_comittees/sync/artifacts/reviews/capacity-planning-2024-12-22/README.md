# Capacity Planning Review: SC-2025-12-22-001

> **Status:** ✅ SESSION COMPLETE
> **Date:** 2025-12-22
> **Goal:** Verify and document capacity planning for 2-minute sync SLA

---

## Quick Summary

**Question:** Can we tell customers to expect sync within 2 minutes?

**Answer:** ✅ **YES** — with the counter/modulo tiered sync approach.

---

## Key Findings

| Finding | Details |
|---------|---------|
| **Current approach won't scale** | All 12 entities every sync = 30-60s = need 250-500 workers |
| **Tiered approach works** | Hot entities only most runs = 1.75s avg = need 15-25 workers |
| **Queue is misconfigured** | `:erp_sync` not in config — CRITICAL fix needed |
| **Worker→Reactor flow is correct** | Connection selection works properly |

---

## The Solution: Counter/Modulo Tiered Sync

```
Every 2 minutes, sync only entities whose tier modulo matches:

HOT (every run):       expense_reports, bills, ap_payments
WARM (every 8th):      vendors, employees, projects  
COLD (every 30th):     gl_accounts, departments, etc.
STATIC (every 720th):  currencies, subsidiaries, etc.

Result: 87.5% of syncs take only ~1.5 seconds
```

---

## Capacity Math

| Workspaces | global_limit | Nodes | SLA Met? |
|------------|--------------|-------|----------|
| 100 | 5 | 1 | ✅ |
| 500 | 15 | 3 | ✅ |
| 1,000 | 25 | 5 | ✅ |
| 2,000 | 40 | 8 | ✅ |

---

## Artifacts in This Review

| File | Purpose |
|------|---------|
| `IMPLEMENTATION-SPEC.md` | Complete implementation guide with code examples |
| `GAPS.md` | Identified gaps with priorities |
| `README.md` | This summary |

---

## Implementation Effort

**Total estimated time:** ~2.5 hours

| Priority | Task | Time |
|----------|------|------|
| 1 | Fix queue config | 5 min |
| 2 | Add run_number attribute | 25 min |
| 3 | Implement tiered sync | 60 min |
| 4 | Update worker | 20 min |
| 5 | Add periodic trigger | 30 min |

---

## Committee Members Active

- Intake Coordinator — Material gathering
- Sync Architect — Capacity analysis
- Standards Enforcer — Queue audit
- AP Domain Expert — Tier prioritization
- Evaluation Subcommittee — Goal assessment

---

*Session completed 2025-12-22*

