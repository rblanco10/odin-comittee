# Legacy Sync System Removal

> **Session:** SC-2025-12-23-009  
> **Date:** 2025-12-23  
> **Status:** APPROVED by Sync Committee  
> **Topic:** Remove Parallel Legacy Sync System

---

## Problem Statement

The codebase has TWO parallel sync-to-bridge paths:

### System 1: WorkspaceSyncReactor (CORRECT - Keep)
```
WorkspaceSyncReactor
    └─► EntitySyncService
          └─► BulkUpsertService
                └─► Direct write to ERP mirror tables
```

### System 2: SyncRecord + DomainSyncTask (LEGACY - Remove)
```
SyncExecution.sync_entity_type
    └─► Creates SyncRecord
          └─► AshOban triggers fire:
                ├─► write_to_accounting (duplicates BulkUpsertService)
                ├─► project_to_coding (duplicates DimensionBridgeService)
                └─► route_to_domains
                      └─► Creates DomainSyncTask
                            └─► ExecuteTask handler
                                  ├─► VendorWrapperService (needs to move)
                                  └─► EmployeeLinkingService (needs to move)
```

---

## Architectural Principle (CRITICAL)

**SYNC = Mirror only.** WorkspaceSyncReactor writes to ERP mirror tables. Period.

**BRIDGE = All bridging.** BridgeReactor is the single path for ALL domain integration.

---

## Migration Plan

### Step 1: Add to BridgeReactor

Move vendor wrapping and employee linking into BridgeReactor as new steps.

**New Steps:**
- `step :wrap_vendors` - VendorWrapperService for unbridged ERP vendors
- `step :link_employees` - EmployeeLinkingService for unbridged ERP employees

### Step 2: Delete Legacy System

**Files to Delete:**
```
lib/flame_teampay_payables/ember_erp/resources/
├── sync_log/
│   ├── sync_record.ex                                    # DELETE
│   └── sync_record/
│       └── manual_actions/
│           ├── route_to_domains.ex                       # DELETE
│           ├── project_to_coding.ex                      # DELETE
│           └── write_to_accounting.ex                    # DELETE
└── domain_sync_task/
    ├── domain_sync_task.ex                               # DELETE
    └── manual_actions/
        └── execute_task.ex                               # DELETE

lib/flame_teampay_payables/ember_erp/resources/sync_log/
└── sync_execution/
    └── manual_actions/
        └── sync_entity_type.ex                           # DELETE (creates SyncRecords)
```

### Step 3: Update Domain Registration

Remove from `ember_erp/domain.ex`:
```elixir
# REMOVE these lines:
resource FlameTeampayPayables.EmberErp.Resources.SyncLog.SyncRecord
resource FlameTeampayPayables.EmberErp.Resources.DomainSyncTask
```

---

## Verification

After removal, confirm:
1. `WorkspaceSyncReactor` still works (direct mirror writes)
2. `BridgeReactor` handles all bridging (dimensions, vendors, employees, reconciliation)
3. No orphaned references to deleted modules

---

## Session Reference

- Identified in: SC-2025-12-23-009 Turn 7
- Approved: Same session
- Related: Memory ID 12552562 (Sync/Bridge Architecture)

