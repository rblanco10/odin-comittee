# Session SC-2026-01-14-001: ERP Disconnect Button & Seed Flow Optimization

## Session Overview

| Field | Value |
|-------|-------|
| **Session ID** | SC-2026-01-14-001 |
| **Date** | January 14, 2026 |
| **Status** | ✅ COMPLETED |
| **Focus** | UI-based ERP disconnection and demo seed optimization |
| **Gap IDs** | GAP-DISC-001, GAP-SEED-001, GAP-FK-001 |

---

## Executive Summary

Human Director requested a non-invasive UI button to disconnect ERP configuration and start fresh, plus improvements to the demo seed flow to prevent ERP auto-configuration by default.

### Problems Addressed

| Problem | Description | Impact |
|---------|-------------|--------|
| **No ERP Disconnect UI** | Users had to manually delete database tables to reconfigure ERP | Poor developer experience |
| **Seeds Pre-configure ERP** | Running `DEMO_SEEDS=true mix run priv/repo/seeds.exs` created ERP connections | Prevented manual ERP setup testing |
| **Timeout on Disconnect** | Existing `ErpConnectionNukeService` timed out with large datasets | Service unusable in practice |
| **FK Constraint Errors** | ERP cleanup scripts failed due to `workforce_employees.erp_employee_id` FK | Incomplete cleanup |

### Solutions Implemented

| Solution | Description |
|----------|-------------|
| **Disconnect Button** | Subtle "Disconnect" link next to "Re-test" button on ERP setup page |
| **Confirmation Modal** | Warning modal listing data to be deleted before disconnect |
| **Fast Disconnect Service** | New SQL-based service replacing slow Ash-based nuke |
| **Seed ERP Control** | `ERP_SEEDS=true` flag to opt-in to ERP seed creation |
| **FK Cleanup** | Pre-delete step to NULL out `erp_employee_id` references |

---

## Gap Analysis

### GAP-DISC-001: No UI Method to Disconnect ERP Connection

| Aspect | Before | After |
|--------|--------|-------|
| **Disconnect Method** | Manual SQL deletion | UI button with confirmation |
| **User Experience** | Requires database access | Self-service in browser |
| **Data Safety** | Risk of incomplete cleanup | Proper cascade deletion |

### GAP-SEED-001: Demo Seeds Auto-Configure ERP Connection

| Aspect | Before | After |
|--------|--------|-------|
| **Default Behavior** | ERP seeds run automatically | ERP seeds skipped by default |
| **Opt-in** | None | `ERP_SEEDS=true` environment variable |
| **Cleanup** | None | Always runs `99_clear_erp_tables.exs` at end |

### GAP-FK-001: ERP Cleanup Blocked by Foreign Key Constraints

| Aspect | Before | After |
|--------|--------|-------|
| **Constraint** | `workforce_employees.erp_employee_id` → `ember_erp_accounting_employees.id` | Pre-delete NULL update |
| **Error** | `violates foreign key constraint` | Clean deletion |
| **Transaction** | Aborts on first failure | Individual table deletions with error handling |

---

## Implementation Details

### Files Created

| File | Purpose |
|------|---------|
| `lib/flame_teampay_payables/ember_erp/services/erp_fast_disconnect_service.ex` | Fast SQL-based ERP disconnection service |

### Files Modified

| File | Changes |
|------|---------|
| `lib/flame_teampay_payables_web/components/expense_v2/setup/erp/erp_components.ex` | Added Disconnect button, confirmation modal |
| `lib/flame_teampay_payables_web/live/expense_v2/setup/erp_live.ex` | Added disconnect event handlers and state |
| `priv/repo/seeds/dev/demo/00_master.exs` | Added ERP_SEEDS flag, temporal logging, cleanup step |
| `priv/repo/seeds/dev/99_clear_erp_tables.exs` | Added FK cleanup, temporal logging, verification |

---

## Architecture Decisions

### ADR-001: Fast SQL-based Disconnect over Ash Destroy

**Context:** The existing `ErpConnectionNukeService` uses Ash's `destroy` action for each record individually, causing database connection timeouts (>15 seconds) with large datasets.

**Decision:** Create `ErpFastDisconnectService` using raw SQL `DELETE` statements.

**Rationale:**
- Bulk SQL DELETE completes in seconds regardless of data volume
- Individual table deletions allow graceful error handling
- No transaction wrapper prevents cascade abort on FK issues

**Consequences:**
- Bypasses Ash lifecycle callbacks (acceptable for bulk cleanup)
- Must maintain table order manually
- Logging is explicit rather than automatic

### ADR-002: ERP Seeds Opt-in by Default

**Context:** Demo seeds automatically created ERP connections, preventing users from testing manual ERP configuration flow.

**Decision:** Mark ERP-related seeds as `:erp_only` and skip unless `ERP_SEEDS=true`.

**Rationale:**
- Manual ERP setup is the primary workflow for demo/testing
- ERP sync is resource-intensive and not needed for all use cases
- Cleanup at end ensures clean state regardless of prior runs

**Skipped Seeds (by default):**
1. `../ember_erp/01_dimensions_test_data.exs`
2. `../06_erp_connections.exs`
3. `../ember_erp/06_erp_connections_auto_setup.exs`
4. `../ember_erp/16_dimension_subsidiary_sync.exs`

---

## UI Component Design

### Disconnect Button Placement

```
┌────────────────────────────────────────────────────────────────────┐
│  ✅ Connected & Healthy                                            │
│  NetSuite · Oracle NetSuite ERP                                    │
│                                                                     │
│  ... (status details) ...                                          │
│                                                                     │
│  ┌──────────────┐  ┌────────────┐              ┌────────────────┐  │
│  │ 🔄 Re-test   │  │ Disconnect │              │ Continue →     │  │
│  └──────────────┘  └────────────┘              └────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
         ↑                  ↑
    Primary action    Subtle secondary (gray → red on hover)
```

### Confirmation Modal Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  Disconnect NetSuite?                                          │
│                                                                     │
│  This will remove the ERP connection and all synced data including:│
│                                                                     │
│  ⊖ Vendors, employees, and expense categories                      │
│  ⊖ GL accounts and dimension mappings                              │
│  ⊖ Sync history and configurations                                 │
│                                                                     │
│  You can reconnect at any time by entering your credentials again. │
│                                                                     │
│                               ┌─────────┐  ┌─────────────────┐     │
│                               │ Cancel  │  │ 🗑 Disconnect   │     │
│                               └─────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Service Architecture

### ErpFastDisconnectService

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ErpFastDisconnectService                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Clear Foreign Key References                                │
│   UPDATE workforce_employees SET erp_employee_id = NULL             │
│   WHERE erp_employee_id IS NOT NULL                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Delete Tables by erp_connection_id                          │
│   - erp_sync_executions                                             │
│   - ember_erp_accounting_ap_payments                                │
│   - ember_erp_accounting_ap_bill_line_items                         │
│   - ember_erp_accounting_ap_bills                                   │
│   - ember_erp_accounting_customers                                  │
│   - ember_erp_accounting_vendors                                    │
│   - ember_erp_accounting_expense_categories                         │
│   - ember_erp_accounting_expense_reports                            │
│   - ember_erp_accounting_employees                                  │
│   - erp_entity_mappings                                             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Delete Tables by workspace_id                               │
│   - erp_push_configurations                                         │
│   - erp_sync_configurations                                         │
│   - coding_value_entities                                           │
│   - coding_dimension_values                                         │
│   - coding_dimension_types                                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Delete ERP Connection                                       │
│   DELETE FROM erp_connections WHERE id = $1 AND workspace_id = $2   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 5: Recreate Expense Cards (for webhook processing)            │
│   INSERT INTO expense_cards FROM payment_card_issuances             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Seed Flow Changes

### Before (ERP Auto-Configured)

```bash
DEMO_SEEDS=true mix run priv/repo/seeds.exs
  ├── 01_foundation.exs
  ├── ...
  ├── ../ember_erp/01_dimensions_test_data.exs  # ← ERP data created
  ├── ../06_erp_connections.exs                  # ← ERP connection created
  ├── ../ember_erp/06_erp_connections_auto_setup.exs  # ← Full sync triggered
  └── ../ember_erp/16_dimension_subsidiary_sync.exs
      └── 🔴 ERP pre-configured, cannot test manual setup
```

### After (ERP Manual Setup Ready)

```bash
DEMO_SEEDS=true mix run priv/repo/seeds.exs
  ├── 01_foundation.exs
  ├── ...
  ├── [SKIPPED] ../ember_erp/01_dimensions_test_data.exs
  ├── [SKIPPED] ../06_erp_connections.exs
  ├── [SKIPPED] ../ember_erp/06_erp_connections_auto_setup.exs
  ├── [SKIPPED] ../ember_erp/16_dimension_subsidiary_sync.exs
  └── 99_clear_erp_tables.exs  # ← Always runs to ensure clean slate
      └── ✅ ERP Setup page ready for manual configuration
```

### Opt-In for ERP Seeds

```bash
ERP_SEEDS=true DEMO_SEEDS=true mix run priv/repo/seeds.exs
  └── All ERP seeds included
```

---

## Validation Steps

### Disconnect Button

1. Navigate to `/expense/setup/erp/netsuite`
2. Verify "Disconnect" button appears next to "Re-test"
3. Click "Disconnect" → confirmation modal appears
4. Click "Cancel" → modal closes
5. Click "Disconnect" again → "Disconnect" → shows "Disconnecting..."
6. Page transitions to "CONFIGURING" state with empty credentials form

### Seed Flow

1. Run `DEMO_SEEDS=true mix run priv/repo/seeds.exs`
2. Verify seed output shows ERP seeds "SKIPPED"
3. Verify temporal logs show ERP cleanup executed
4. Navigate to `/expense/setup/erp/netsuite`
5. Verify page shows empty credential form (no pre-configured connection)

---

## Test Results

### Disconnect Feature - Validated

| Test | Result | Evidence |
|------|--------|----------|
| Button visibility | ✅ PASS | Screenshot shows "Disconnect" next to "Re-test" |
| Modal opens | ✅ PASS | Modal displays with warning content |
| Cancel closes modal | ✅ PASS | Modal dismisses on cancel |
| Disconnect executes | ✅ PASS | ~15,000 records deleted in seconds |
| Page resets | ✅ PASS | Returns to "CONFIGURING" state |

### Disconnect Performance

| Table | Records Deleted |
|-------|-----------------|
| `ember_erp_accounting_ap_bill_line_items` | 5,743 |
| `ember_erp_accounting_ap_bills` | 2,795 |
| `ember_erp_accounting_ap_payments` | 1,700 |
| `ember_erp_accounting_customers` | 1,076 |
| `ember_erp_accounting_vendors` | 1,108 |
| `ember_erp_accounting_employees` | 206 |
| `ember_erp_accounting_expense_reports` | 376 |
| `ember_erp_accounting_expense_categories` | 16 |
| `coding_value_entities` | 1,203 |
| `coding_dimension_values` | 306 |
| `coding_dimension_types` | 6 |
| **Total** | **~14,500 records in seconds** |

---

## Committee Members

| Member | Contributions |
|--------|---------------|
| Chair | Session management, requirements gathering |
| Sync Architect | Service design, architecture decisions |
| UI Expert | Button placement, modal design |
| Code Fidelity Verifier | Implementation validation |
| Scribe | Documentation |

---

## Related Sessions

| Session | Relationship |
|---------|--------------|
| SC-2026-01-13-003 | Added debug logger, informed service patterns |
| SC-2026-01-08-015 | Dimension mapping fixes, FK relationship context |

---

## Artifacts Created

| Artifact | Location |
|----------|----------|
| Session Summary | `artifacts/sessions/SC-2026-01-14-001/SESSION-SUMMARY.md` |
| Implementation Log | `artifacts/sessions/SC-2026-01-14-001/IMPLEMENTATION-LOG.md` |

---

**Session Status:** ✅ CLOSED  
**Date Closed:** 2026-01-14  
**Gaps Fixed:** GAP-DISC-001, GAP-SEED-001, GAP-FK-001  
**Committee:** Sync Committee
