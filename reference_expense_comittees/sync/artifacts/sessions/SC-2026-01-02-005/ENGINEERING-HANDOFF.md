# Engineering Handoff: Missing PushConfiguration for Reimbursement Entity Types

**Session:** SC-2026-01-02-005  
**Date:** 2026-01-02  
**Status:** ✅ IMPLEMENTED  
**Confidence:** HIGH

---

## Executive Summary

During testing of the reimbursement sync feature (Session SC-2026-01-02-004), we discovered that `ManualSyncService.sync_reimbursement_report/2` was failing with `{:error, :push_config_not_found}`. The Sync Committee identified a mismatch between entity types used when:

1. **Creating** `PushConfiguration` records (in `ConfigurationSaveService`)
2. **Looking up** `PushConfiguration` records (in `PushOrchestrator`)

---

## Problem Analysis

### Root Cause

`ConfigurationSaveService.save_push_configuration/4` creates `PushConfiguration` records with the following entity types:

- `:expense` (general expense config)
- `:card_spend` (card transactions → Vendor Bill + Payment)
- `:vendor_credit` (refunds → Vendor Credit)

However, `ManualSyncService` pushes reimbursements using:

- `entity_type: :expense_report` (for reimbursement reports)
- `entity_type: :expense_report_payment` (for reimbursement payments)

`PushOrchestrator.load_push_config/4` filters by exact match on `entity_type`:

```elixir
# PushOrchestrator (line 201-215)
PushConfiguration
|> Ash.Query.filter(
  expr(
    erp_connection_id == ^conn_id and
      domain == ^dom and
      entity_type == ^ent_type   # ← Exact match required
  )
)
|> Ash.read_one(...)
```

Since there are no `PushConfiguration` records for `:expense_report` or `:expense_report_payment`, the lookup fails.

### Evidence

```
[info] ManualSyncService: Starting manual sync for reimbursement report
[debug] Loading push config: connection=XXX, domain="expense", entity_type=expense_report
[warning] No push config found for entity_type: expense_report
[error] Failed to queue push: {:error, :push_config_not_found}
```

---

## Solution Implemented

### Option Selected: A - Add Missing PushConfiguration Records

Modified `ConfigurationSaveService` to create additional `PushConfiguration` records for `:expense_report` and `:expense_report_payment` when saving configuration.

### Changes Made

**File:** `lib/flame_teampay_payables/ember_erp/services/configuration_save_service.ex`

1. Added two new helper functions:
   - `save_expense_report_push_configuration/5`
   - `save_expense_report_payment_push_configuration/5`

2. Modified `save_push_configuration/4` to call these new functions in the `with` chain

```elixir
# SC-2026-01-02-005: Add push configs for reimbursement entity types
with {:ok, _expense_config} <- PushConfiguration.upsert(expense_attrs, ...),
     {:ok, _card_txn_config} <- save_card_transaction_push_configuration(...),
     {:ok, _vendor_credit_config} <- save_vendor_credit_push_configuration(...),
     # NEW:
     {:ok, _expense_report_config} <- save_expense_report_push_configuration(...),
     {:ok, _expense_report_payment_config} <- save_expense_report_payment_push_configuration(...) do
  {:ok, :all_push_configurations_saved}
end
```

### New Functions Added

```elixir
# SC-2026-01-02-005: Create PushConfiguration for :expense_report entity type
# Used by ManualSyncService.sync_reimbursement_report/2 to push expense reports to ERP
defp save_expense_report_push_configuration(erp_connection_id, config_data, workspace_id, entity_id, expense_config) do
  sync_prefs = Map.get(config_data, :sync_preferences, %{})

  reimbursement_sync_status =
    Map.get(sync_prefs, :reimbursement_sync_status) ||
    (expense_config && expense_config.reimbursement_sync_status) ||
    :paid

  attrs = %{
    workspace_id: workspace_id,
    entity_id: entity_id,
    erp_connection_id: erp_connection_id,
    entity_type: :expense_report,
    domain: @default_domain,
    enabled: true,
    reimbursement_sync_status: reimbursement_sync_status
  }

  Logger.debug("[ConfigurationSaveService] Saving PushConfiguration for :expense_report entity type")
  PushConfiguration.upsert(attrs, tenant: workspace_id, authorize?: false)
end

# SC-2026-01-02-005: Create PushConfiguration for :expense_report_payment entity type
# Used by ManualSyncService.sync_reimbursement_payment/2 to push expense report payments to ERP
defp save_expense_report_payment_push_configuration(erp_connection_id, config_data, workspace_id, entity_id, expense_config) do
  sync_prefs = Map.get(config_data, :sync_preferences, %{})

  reimbursement_sync_status =
    Map.get(sync_prefs, :reimbursement_sync_status) ||
    (expense_config && expense_config.reimbursement_sync_status) ||
    :paid

  attrs = %{
    workspace_id: workspace_id,
    entity_id: entity_id,
    erp_connection_id: erp_connection_id,
    entity_type: :expense_report_payment,
    domain: @default_domain,
    enabled: true,
    reimbursement_sync_status: reimbursement_sync_status
  }

  Logger.debug("[ConfigurationSaveService] Saving PushConfiguration for :expense_report_payment entity type")
  PushConfiguration.upsert(attrs, tenant: workspace_id, authorize?: false)
end
```

---

## Impact Analysis

### Affected Flows

| Flow | Impact |
|------|--------|
| `ManualSyncService.sync_reimbursement_report/2` | ✅ Will now find PushConfiguration |
| `ManualSyncService.sync_reimbursement_payment/2` | ✅ Will now find PushConfiguration |
| Existing card spend flows | ✅ No change (uses `:card_spend` entity_type) |
| Existing vendor credit flows | ✅ No change (uses `:vendor_credit` entity_type) |

### For Existing Connections

**Important:** This fix only applies to **new** ERP configurations or when existing configurations are **re-saved**. Existing connections will need to:

1. Re-run the configuration wizard, OR
2. Manually create the `PushConfiguration` records via IEx/migration

For existing connections, you can run:

```elixir
# IEx one-liner to add missing configs for an existing connection
FlameTeampayPayables.EmberErp.Services.ConfigurationSaveService.save_all_configuration(
  erp_connection_id,
  :netsuite,
  %{sync_preferences: %{}},
  workspace_id,
  entity_id
)
```

---

## Verification Steps

1. **Reset database** (or re-run configuration wizard for existing connection)
2. **Connect ERP** through Setup wizard
3. **Navigate to Reimbursements page**
4. **Click "Sync" button** on an approved reimbursement
5. **Expected:** Push request created, no `:push_config_not_found` error

### Database Verification

```sql
-- Check that new entity_types exist
SELECT entity_type, domain, enabled 
FROM erp_push_configurations 
WHERE entity_type IN ('expense_report', 'expense_report_payment');
```

---

## Alternatives Considered

### Option B: Fallback to `:expense` Config

Modify `PushOrchestrator.load_push_config/4` to fall back to `:expense` entity_type if specific config not found.

**Rejected:** Would mask configuration issues and make debugging harder.

### Option C: Use `:expense` Entity Type in ManualSyncService

Change `ManualSyncService` to use `entity_type: :expense` instead of `:expense_report`.

**Rejected:** Would break the separation of concerns and make it harder to configure different push settings for reports vs. payments.

---

## Committee Sign-off

| Member | Role | Approval |
|--------|------|----------|
| Committee Chair | Process | ✅ |
| Intake Coordinator | Process | ✅ |
| NetSuite Domain Expert | ERP Domain | ✅ |
| Dependency Guardian | Technical | ✅ |
| Standards Enforcer | Verification | ✅ |

**Approved by Human:** 2026-01-02

---

## Related Sessions

- **SC-2026-01-02-004**: Original implementation handoff for reimbursement sync
- **SC-2025-12-23-009**: First introduced `:card_spend` entity_type pattern

---

*Document generated by Sync Committee Session SC-2026-01-02-005*

