# Sync Committee Session SC-2026-01-05-001

## Session Metadata

| Field | Value |
|-------|-------|
| **Session ID** | SC-2026-01-05-001 |
| **Date** | 2026-01-05 |
| **Status** | PAUSED (Pending Implementation) |
| **Topic** | PushConfiguration Creation Timing Gap |
| **Outcome** | UNANIMOUSLY APPROVED — Implementation Pending |

---

## Executive Summary

External review identified a timing gap in the ERP setup flow where `PushConfiguration` records are created too late, causing silent push failures when auto-push triggers before configuration exists.

**Verdict:** The concern is **100% valid** and the committee unanimously approved the recommended fix.

---

## Problem Statement

### Current Flow (Verified from Code)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Initial Connection Setup (create_connection_and_sync)  │
│                                                                  │
│  Creates:                                                        │
│  ✅ ErpConnection                                                │
│  ✅ EntityMapping                                                │
│  ✅ SyncConfiguration (via SyncConfigSetupService)              │
│  ✅ DimensionMappings (for NetSuite)                            │
│  ✅ AccountMappings (for NetSuite)                              │
│                                                                  │
│  ❌ PushConfiguration (NOT created here)                        │
│  ❌ VendorPolicy (NOT created here)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2-3: User Navigates Wizard Tabs                           │
│                                                                  │
│  ❌ PushConfiguration still does not exist                      │
│  ⚠️  If auto-push triggers NOW → load_push_config fails         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: User Saves "Vendors & Sync" Tab                        │
│                                                                  │
│  Calls: ConfigurationSaveService.save_all_configuration()       │
│  Creates:                                                        │
│  ✅ PushConfiguration (all 5 entity types)                      │
│  ✅ VendorPolicy                                                │
│                                                                  │
│  🎉 NOW auto-push can work                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Impact

When `PushConfiguration` doesn't exist and auto-push triggers:

1. `PushOrchestrator.load_push_config/4` returns `{:error, :push_config_not_found}`
2. Push fails with `:push_disabled` status
3. **Silent failure** — user sees no error, data never syncs to ERP

---

## Edge Cases Identified

| Scenario | What Happens | User Impact |
|----------|--------------|-------------|
| User completes setup wizard, leaves before saving "Vendors & Sync" | No PushConfiguration exists | All auto-pushes silently fail |
| Card txn approved before any tab saved | No PushConfiguration exists | Transaction approved but never synced |
| User navigates directly to Posting Behavior, saves, never visits Vendors | No PushConfiguration exists | Same silent failure |
| User uses API to create connection programmatically | No PushConfiguration exists | All pushes fail |

---

## Committee Decision

### Unanimously Approved Solution

| Step | Action |
|------|--------|
| 1 | Create `PushConfiguration` (all 5 entity types) during initial connection setup |
| 2 | Create `VendorPolicy` with safe defaults during initial connection setup |
| 3 | Use safe defaults that enable basic functionality |
| 4 | User can customize later via "Save Changes" |

### Recommended Safe Defaults

**PushConfiguration:**

| Field | Default | Rationale |
|-------|---------|-----------|
| `enabled` | `true` | User expects push to work after setup |
| `entity_type` | All 5 types | Create all needed configs upfront |
| `card_sync_date` | `:cleared` | Conservative - sync after settlement |
| `reimbursement_sync_status` | `:paid` | Conservative - sync after payment |

**VendorPolicy:**

| Field | Default | Rationale |
|-------|---------|-----------|
| `creation_mode` | `:auto_create` | Most common customer preference |
| `threshold` | `nil` | No threshold for auto-create mode |

---

## Implementation Location

**File:** `lib/flame_teampay_payables_web/live/expense_v2/setup/erp_live.ex`

**Location:** After line 811 in `:create_connection_and_sync` handler

**Code:**

```elixir
case SyncConfigSetupService.setup_sync_configs(connection_id, default_entity_types, workspace_id) do
  {:ok, configs} ->
    Logger.info("[ErpLive] Created #{length(configs)} sync configurations")
    
    # NEW: SC-2026-01-05-001 - Create PushConfiguration with safe defaults
    # Fix timing gap - create push configs immediately after sync configs
    # This ensures auto-push works even before user visits "Vendors & Sync" tab
    case ConfigurationSaveService.save_all_configuration(
           connection_id,
           provider_config.atom,
           %{},  # Empty config_data - use all defaults
           workspace_id,
           entity_id
         ) do
      {:ok, _} ->
        Logger.info("[ErpLive] Created push and vendor configurations with safe defaults")
      {:error, reason} ->
        Logger.warning("[ErpLive] Failed to create push/vendor configs: #{inspect(reason)}")
    end
    
    # ... rest of existing code
```

---

## Dependency Analysis

| Configuration | Can Be Created Early? | Notes |
|---------------|----------------------|-------|
| `SyncConfiguration` | ✅ Yes | Already done |
| `PushConfiguration` | ✅ Yes | Only needs `connection_id` |
| `VendorPolicy` | ✅ Yes | Only needs `connection_id` |
| `DimensionTypeConfig` | ⚠️ Needs data | Requires synced dimension data |
| `DimensionMapping` | ⚠️ Needs data | Requires synced dimension data |

---

## Committee Participants

| Role | Contribution |
|------|--------------|
| **Committee Chair** | Convened session, verified issue, final ruling |
| **Sync Architect** | Technical impact assessment |
| **Edge Case Hunter** | Identified failure scenarios |
| **Dependency Guardian** | Verified early creation is safe |
| **Implementation Consultant** | Validated safe defaults |
| **Standards Enforcer** | Reviewed code location and idempotency |

---

## Next Steps (When Session Resumes)

1. [ ] Implement the fix in `erp_live.ex`
2. [ ] Add integration test for early push config creation
3. [ ] Verify existing connections don't break (upsert handles this)
4. [ ] Test card transaction auto-push immediately after connection setup

---

## Related Sessions

- **SC-2026-01-02-005**: Similar issue with missing `PushConfiguration` for reimbursement entity types
- **SC-2025-12-23-009**: First introduced `:card_spend` entity type pattern

---

*Document generated by Sync Committee Session SC-2026-01-05-001*
*Session paused at user request — pending implementation*

