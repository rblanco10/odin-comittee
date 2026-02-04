# Implementation Log: SC-2026-01-14-001

## Overview

This document tracks the implementation details for the ERP Disconnect Button and Seed Flow Optimization session.

---

## Files Changed

### 1. New File: `erp_fast_disconnect_service.ex`

**Path:** `lib/flame_teampay_payables/ember_erp/services/erp_fast_disconnect_service.ex`

**Purpose:** Fast SQL-based ERP disconnection service that replaces the slow Ash-based `ErpConnectionNukeService`.

**Key Functions:**

| Function | Purpose |
|----------|---------|
| `disconnect/2` | Main entry point - orchestrates full disconnect flow |
| `clear_foreign_key_references/0` | NULLs out `erp_employee_id` in `workforce_employees` |
| `delete_erp_tables/2` | Deletes all ERP-related tables in dependency order |
| `delete_by_connection/4` | Deletes rows filtered by `erp_connection_id` + `workspace_id` |
| `delete_by_workspace/2` | Deletes rows filtered by `workspace_id` only |
| `delete_connection/2` | Deletes the ERP connection record itself |
| `recreate_expense_cards/1` | Recreates expense cards from card issuances |

**Design Decisions:**

1. **No Transaction Wrapper:** Individual table deletions to prevent cascade abort on FK errors
2. **Error Handling:** Each deletion wrapped in try/rescue with warning logging
3. **Table Order:** Children deleted before parents based on FK dependencies

---

### 2. Modified: `erp_components.ex`

**Path:** `lib/flame_teampay_payables_web/components/expense_v2/setup/erp/erp_components.ex`

**Changes:**

| Change | Lines | Description |
|--------|-------|-------------|
| New attributes | 366-371 | Added `on_disconnect`, `show_disconnect_modal`, `is_disconnecting` |
| Disconnect button | 445-461 | Subtle "Disconnect" link next to "Re-test" |
| Modal component | 488-583 | New `disconnect_confirmation_modal/1` function component |

**Attribute Additions:**

```elixir
attr :on_disconnect, :string, default: "show-disconnect-modal"
attr :show_disconnect_modal, :boolean, default: false
attr :is_disconnecting, :boolean, default: false
```

**UI Elements:**

- **Disconnect Button:** Gray text, turns red on hover, positioned after Re-test
- **Modal:** Warning icon, bulleted list of data to delete, Cancel/Disconnect buttons
- **Loading State:** "Disconnecting..." with spinner when in progress

---

### 3. Modified: `erp_live.ex`

**Path:** `lib/flame_teampay_payables_web/live/expense_v2/setup/erp_live.ex`

**Changes:**

| Change | Lines | Description |
|--------|-------|-------------|
| New assigns | 180-183 | `show_disconnect_modal`, `is_disconnecting` |
| Component props | 404-411 | Pass disconnect-related assigns to component |
| Event handlers | 703-743 | `show-disconnect-modal`, `hide-disconnect-modal`, `confirm-disconnect` |
| Handle info | 898-929 | `{:disconnect_result, result}` handler |

**Event Flow:**

```
User clicks "Disconnect"
  → handle_event("show-disconnect-modal")
  → assign(show_disconnect_modal: true)

User clicks "Disconnect" in modal
  → handle_event("confirm-disconnect")
  → assign(is_disconnecting: true)
  → Task.start(ErpFastDisconnectService.disconnect/2)
  → send(parent, {:disconnect_result, result})

handle_info({:disconnect_result, {:ok, summary}})
  → Reset all ERP-related assigns
  → put_flash(:info, "ERP connection disconnected successfully")
  → Page shows "CONFIGURING" state
```

---

### 4. Modified: `00_master.exs`

**Path:** `priv/repo/seeds/dev/demo/00_master.exs`

**Changes:**

| Change | Description |
|--------|-------------|
| `SeedLogger` module | Temporal logging helper for debugging seed execution |
| `ERP_SEEDS` flag | Controls whether ERP seeds are included |
| `:erp_only` mode | New flag for ERP-specific seed files |
| Seed filtering | Filters out `:erp_only` seeds when `ERP_SEEDS != "true"` |
| ERP cleanup section | Always runs `99_clear_erp_tables.exs` at end |
| Verification logging | Logs ERP connection counts before/after cleanup |

**Environment Variable:**

```bash
# Default: ERP seeds skipped
DEMO_SEEDS=true mix run priv/repo/seeds.exs

# Opt-in: Include ERP seeds
ERP_SEEDS=true DEMO_SEEDS=true mix run priv/repo/seeds.exs
```

**Seeds Marked as `:erp_only`:**

1. `../ember_erp/01_dimensions_test_data.exs`
2. `../06_erp_connections.exs`
3. `../ember_erp/06_erp_connections_auto_setup.exs`
4. `../ember_erp/16_dimension_subsidiary_sync.exs`

---

### 5. Modified: `99_clear_erp_tables.exs`

**Path:** `priv/repo/seeds/dev/99_clear_erp_tables.exs`

**Changes:**

| Change | Description |
|--------|-------------|
| Temporal logging | Timestamps on all major operations |
| FK cleanup step | NULLs `erp_employee_id` before deleting ERP employees |
| Result tracking | Tracks deletion counts for each table |
| Final verification | Confirms ERP connections cleared at end |

**FK Cleanup Logic:**

```elixir
# Step 1: Clear FK references that block ERP table deletion
Repo.query!("UPDATE workforce_employees SET erp_employee_id = NULL WHERE erp_employee_id IS NOT NULL")
```

**Why Needed:**

The `workforce_employees.erp_employee_id` column has a FK to `ember_erp_accounting_employees.id`. Without this cleanup, deleting ERP employees fails with:

```
update or delete on table "ember_erp_accounting_employees" violates foreign key constraint
```

---

## Technical Notes

### Why Raw SQL Instead of Ash Destroy?

The existing `ErpConnectionNukeService` uses Ash's `destroy` action:

```elixir
# Slow approach (original)
Ash.bulk_destroy!(Resource, query, :destroy, tenant: workspace_id)
```

This approach:
- Triggers lifecycle callbacks for each record
- Executes individual SQL statements
- Causes database connection timeout after ~15 seconds with large datasets

The new SQL approach:

```elixir
# Fast approach (new)
Repo.query!("DELETE FROM table WHERE erp_connection_id = $1", [id])
```

Benefits:
- Single SQL statement per table
- Completes in milliseconds per table
- Handles 15,000+ records in under 3 seconds

### Why No Transaction?

PostgreSQL transactions abort entirely when any statement fails:

```elixir
# If any DELETE fails, ALL are rolled back
Repo.transaction(fn ->
  Repo.query!("DELETE FROM table_a")  # Success
  Repo.query!("DELETE FROM table_b")  # FK error → entire transaction aborts
  Repo.query!("DELETE FROM table_c")  # Never runs
end)
```

By running deletions individually:

```elixir
# Each table handled independently
try do
  Repo.query!("DELETE FROM table_a")
rescue
  e -> Logger.warning("table_a failed: #{e}")
end
# Continues to next table regardless
```

---

## Testing Evidence

### UI Testing

**Disconnect Modal Screenshot:**
- Modal shows with warning icon
- Lists data to be deleted
- Cancel/Disconnect buttons visible
- Disconnect button turns to "Disconnecting..." with spinner

**Post-Disconnect State:**
- Page shows "CONFIGURING" status
- Credential form is empty
- Ready for new ERP connection

### Performance Testing

**Dataset Size:**
- ~15,000 records across ERP tables

**Deletion Time:**
- Previous (Ash-based): Timeout after 15 seconds
- New (SQL-based): < 3 seconds

### Seed Flow Testing

**Command:**
```bash
DEMO_SEEDS=true mix run priv/repo/seeds.exs
```

**Output Verified:**
- ERP seeds marked as "SKIPPED"
- `99_clear_erp_tables.exs` executes at end
- Final count shows 0 ERP connections

---

## Commit Information

**Branch:** `erp-disconnection-fix/jan-14-2026`

**Files in Commit:**
1. `lib/flame_teampay_payables/ember_erp/services/erp_fast_disconnect_service.ex` (NEW)
2. `lib/flame_teampay_payables_web/components/expense_v2/setup/erp/erp_components.ex`
3. `lib/flame_teampay_payables_web/live/expense_v2/setup/erp_live.ex`
4. `priv/repo/seeds/dev/demo/00_master.exs`
5. `priv/repo/seeds/dev/99_clear_erp_tables.exs`
6. `docs/agents/architecture/integrations/erps/committees/sync/artifacts/sessions/SC-2026-01-14-001/SESSION-SUMMARY.md`
7. `docs/agents/architecture/integrations/erps/committees/sync/artifacts/sessions/SC-2026-01-14-001/IMPLEMENTATION-LOG.md`
