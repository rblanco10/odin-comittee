# Bridge Design Proposal

> **Session:** SC-2025-12-22-002
> **Date:** 2025-12-22
> **Status:** APPROVED
> **Topic:** Cross-Workspace Bridge for ERP Mirror → Business Layer

---

## Executive Summary

This document proposes a new **Bridge** system that creates business layer records (CodingCategory/CodingValue) from ERP mirror tables. The Bridge is:

- **Decoupled from Sync** — Sync "wins its game" independently
- **Cross-Workspace** — Operates across all workspaces efficiently
- **Cursor-Based** — Only processes records changed since last run
- **Resilient** — Each entity type has independent failure handling

---

## Problem Statement

### Current State

```
SYNC (per workspace, every 2 min)
═══════════════════════════════════════════════════════════════════

WorkspaceSyncWorker 
         │
         ▼
ERP Mirror Tables (Departments, Locations, GL Accounts, etc.)
         │
         ▼ (COUPLED - called inside sync)
UnifiedDimensionBridgeService
         │
         ▼
CodingCategory / CodingValue
```

### Problems with Current Approach

| Problem | Impact |
|---------|--------|
| **Coupling** | Business logic failures can poison sync reliability |
| **Per-Workspace** | Overhead when most workspaces have no changes |
| **No Cursor** | Reprocesses all records each run |
| **Entity Scoping Gap** | ERP allows `entity_id = NULL`, business layer doesn't |

### 80% of Support Tickets

> *"80% of our support tickets come from ERP syncing issues... having a reactor only dedicated to syncing with no path to business logic failure is ideal."*

---

## Proposed Solution

### Architecture

```
SYNC (unchanged, per workspace)
═══════════════════════════════════════════════════════════════════
WorkspaceSyncWorker → ERP Mirror Tables
  • NO business logic
  • NO path to business layer failure
  • Wins or loses its own game


BRIDGE (NEW, cross-workspace)
═══════════════════════════════════════════════════════════════════
BridgeWorker (Oban, :bridge queue, every 2 min)
         │
         ▼
BridgeReactor (8 steps, one per entity type)
         │
         ▼
DimensionBridgeService
         │
         ▼
For each ERP record WHERE bridged_at IS NULL OR updated_at > bridged_at:
  1. Ensure CodingCategory exists
  2. Upsert CodingValue
  3. Link mirror ↔ CodingValue (bidirectional)
  4. Set bridged_at = now()
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Trigger** | Timer (every 2 min) | Simple, predictable, matches sync cadence |
| **Scope** | Cross-workspace | Efficiency — one worker processes all changes |
| **Cursor** | Per-record `bridged_at` | Most resilient, record-level precision |
| **Entity Scoping** | Support `entity_id = NULL` | Workspace-wide dimensions |
| **Failure Handling** | Per-step compensation | One entity type failing doesn't block others |

---

## Latency Analysis

```
Timeline (both running every 2 min)
════════════════════════════════════════════════════════════════════

T+0:00  Sync runs for Workspace A
T+0:30  Sync completes, ERP mirrors updated
        
T+1:00  Bridge runs (cursor was T-2:00)
        → Picks up Workspace A's changes
        → Creates CodingValues

ACTUAL DELAY: 30 seconds to 2 minutes (average ~1 min)
════════════════════════════════════════════════════════════════════

WORST CASE:
T+0:00  Bridge runs
T+0:01  Sync completes
T+2:00  Bridge runs again → picks up changes

WORST CASE DELAY: ~2 minutes
════════════════════════════════════════════════════════════════════
```

---

## Entity Scoping Gap Resolution

### The Gap

| Layer | `entity_id` | Support for Workspace-Wide |
|-------|-------------|---------------------------|
| **ERP Mirror** | Optional (NULL allowed) | ✅ Yes |
| **Business Layer** | Required (NOT NULL) | ❌ No |

### Resolution

Make `entity_id` optional on CodingCategory and CodingValue:

```elixir
# BEFORE
attribute :entity_id, :uuid, allow_nil?: false

# AFTER
attribute :entity_id, :uuid, allow_nil?: true
# NULL = workspace-wide (available to all entities)
# UUID = entity-scoped
```

### Identity Handling

PostgreSQL: `NULL != NULL`, so standard unique indexes don't work.

**Solution:** Partial indexes

```sql
-- For workspace-wide (entity_id IS NULL)
CREATE UNIQUE INDEX ... WHERE entity_id IS NULL;

-- For entity-scoped (entity_id IS NOT NULL)
CREATE UNIQUE INDEX ... WHERE entity_id IS NOT NULL;
```

---

## Components

### 1. BridgeWorker

- **Queue:** `:bridge`
- **Schedule:** Every 2 minutes
- **Responsibility:** Invoke BridgeReactor

### 2. BridgeReactor

- **Pattern:** Ash.Reactor with steps + compensations
- **Steps:** 8 (one per entity type)
- **Failure Mode:** Per-step (one failing doesn't block others)

| Step | Entity Type | Category Code |
|------|-------------|---------------|
| 1 | Department | DEPARTMENT |
| 2 | Location | LOCATION |
| 3 | Class | CLASS |
| 4 | Project | PROJECT |
| 5 | GL Account | GL-ACCOUNT |
| 6 | Job | JOB |
| 7 | Expense Category | CATEGORY |
| 8 | Custom Dimensions | UDD-{name} |

### 3. DimensionBridgeService

Core logic:

```
For each ERP mirror record:
─────────────────────────────────────────────────────────────────────

1. ENSURE CATEGORY
   └── Find or create CodingCategory for this workspace/entity/code

2. UPSERT CODING VALUE
   └── Create or update CodingValue by external_id

3. RESOLVE HIERARCHY
   └── Set parent_id based on parent_code relationships

4. BIDIRECTIONAL LINK
   ├── Set mirror.coding_value_id = coding_value.id
   └── Set coding_value.erp_mirror_id = mirror.id

5. MARK BRIDGED
   └── Set mirror.bridged_at = now()
```

---

## Schema Changes

### Migration 1: Make entity_id Optional

**Affected Tables:**
- `coding_dimension_types` (CodingCategory)
- `coding_dimension_values` (CodingValue)

**Changes:**
- `entity_id` column: NOT NULL → NULL allowed
- New partial indexes for uniqueness

### Migration 2: Add bridged_at to ERP Mirrors

**Affected Tables:**
- `ember_erp_accounting_departments`
- `ember_erp_accounting_locations`
- `ember_erp_accounting_classes`
- `ember_erp_accounting_projects`
- `ember_erp_accounting_gl_accounts`
- `ember_erp_accounting_jobs`
- `ember_erp_accounting_expense_categories`
- `ember_erp_accounting_custom_dimension_values`

**Changes:**
- Add `bridged_at :utc_datetime_usec` column
- Add indexes for efficient "needs bridging" queries

---

## File Structure

```
lib/flame_teampay_payables/
├── ember_bridge/
│   ├── domain.ex
│   ├── workers/
│   │   └── bridge_worker.ex
│   ├── reactors/
│   │   └── bridge_reactor.ex
│   └── services/
│       └── dimension_bridge_service.ex
```

---

## Implementation Order

1. **Migration 1:** entity_id optional
2. **Migration 2:** bridged_at columns
3. **Resource Changes:** CodingCategory, CodingValue, ERP mirrors
4. **Domain:** ember_bridge domain
5. **Service:** DimensionBridgeService
6. **Reactor:** BridgeReactor
7. **Worker:** BridgeWorker
8. **Config:** Oban :bridge queue
9. **Tests:** Unit + integration

---

## Committee Approval

| Member | Role | Approval |
|--------|------|----------|
| Chair | Convener | ✅ Approved |
| Sync Architect | Technical Lead | ✅ Approved |
| Data Mapping Specialist | Mapping Logic | ✅ Approved |
| Edge Case Hunter | Edge Cases | ✅ Approved |
| Standards Enforcer | Patterns | ✅ Approved |
| Dependency Analyst | Migrations | ✅ Approved |

---

*Document created: 2025-12-22 by Sync Committee*

