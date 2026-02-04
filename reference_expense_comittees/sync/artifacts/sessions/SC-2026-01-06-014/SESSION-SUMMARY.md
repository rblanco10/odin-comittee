# SC-2026-01-06-014: Expense Category Sync & Dimension Mapping Fix

**Session:** SC-2026-01-06-014  
**Date:** 2026-01-06  
**Priority:** HIGH — Affects data integrity in NetSuite  
**Status:** ✅ IMPLEMENTED

---

## Executive Summary

This session addressed the root cause of NetSuite push failures where expense report line items were rejected with "Invalid Field Value" errors for the `category` field. The issue stemmed from:

1. **Teampay UUIDs being sent instead of NetSuite internal IDs** for dimension fields
2. **GL Account IDs being used for Expense Category** (NetSuite has separate `account` and `expenseCategory` entities)
3. **`expense_categories` sync being disabled** for NetSuite, preventing lookup of valid category IDs

---

## Problem Statement

### User-Reported Error

```
[error] [NetSuite Push] ExpenseReports - HTTP 400: "You have entered an Invalid Field Value ff869e03-6498-4076-8cf8-8ec588c0c0fe for the following field: category."
```

### Root Cause Analysis

#### Issue 1: Teampay UUIDs vs NetSuite IDs

The `build_expense_report_data/4` function was passing raw Teampay `CodingValue` UUIDs as dimension IDs:

```elixir
# BEFORE (incorrect)
category_id: metadata["gl_account"],  # UUID: ff869e03-6498-4076-8cf8-8ec588c0c0fe
department_id: metadata["department"], # UUID: 1dd69e60-1a9a-4f44-b7b5-a807a59f5d07
```

NetSuite requires its internal numeric IDs (e.g., `185`, `7`), not Teampay UUIDs.

#### Issue 2: GL Account vs Expense Category Confusion

In Teampay's UI, users select from a "Category" dropdown which is populated by GL Accounts (via `CategoryGLLoaderService`). However, NetSuite's expense line item `category` field expects an **Expense Category** ID (from the `expenseCategory` table), not a GL Account ID.

```
NetSuite Entity Hierarchy:
├── account (GL Accounts) → Used for header-level "account" field
└── expenseCategory → Used for line-level "category" field
                      Has gl_account_code linking back to account
```

#### Issue 3: Expense Categories Not Synced

The `expense_categories` entity type was **commented out** in `sync_config_setup_service.ex` for NetSuite:

```elixir
# Expense entities - 5 minute bi-directional sync
# {:expense_categories, "expense", bidirectional_frequency},  # ← DISABLED
```

Without synced ExpenseCategory records, there was no way to look up valid NetSuite category IDs.

---

## Solution Implemented

### 1. Enable Expense Categories Sync for NetSuite

**File:** `sync_config_setup_service.ex`

```elixir
# Expense entities - 15 minute pull sync
# SC-2026-01-06-014: Enable expense_categories to get correct NetSuite expense category IDs for push
{:expense_categories, "expense", pull_frequency},
```

### 2. Add UUID-to-External-ID Resolution

**File:** `push_reimbursement_complete_reactor.ex`

Added `resolve_coding_value_external_id/2` to convert Teampay `CodingValue` UUIDs to NetSuite `external_id`s:

```elixir
defp resolve_coding_value_external_id(nil, _workspace_id), do: nil
defp resolve_coding_value_external_id("", _workspace_id), do: nil
defp resolve_coding_value_external_id(coding_value_uuid, workspace_id) do
  case Ash.get(CodingValue, coding_value_uuid, authorize?: false, tenant: workspace_id) do
    {:ok, %CodingValue{external_id: ext_id}} when not is_nil(ext_id) ->
      Logger.debug("PushReimbursementCompleteReactor: Resolved CodingValue #{coding_value_uuid} -> external_id #{ext_id}")
      ext_id
    {:ok, %CodingValue{external_id: nil}} ->
      Logger.warning("PushReimbursementCompleteReactor: CodingValue #{coding_value_uuid} has no external_id")
      nil
    {:ok, nil} ->
      Logger.warning("PushReimbursementCompleteReactor: CodingValue #{coding_value_uuid} not found")
      nil
    {:error, reason} ->
      Logger.warning("PushReimbursementCompleteReactor: Failed to lookup CodingValue #{coding_value_uuid}: #{inspect(reason)}")
      nil
  end
end
```

### 3. Add GL Account → Expense Category Mapping

**File:** `push_reimbursement_complete_reactor.ex`

Added `resolve_expense_category_from_gl_account/2` to find the NetSuite Expense Category linked to a GL Account:

```elixir
defp resolve_expense_category_from_gl_account(nil, _workspace_id), do: nil
defp resolve_expense_category_from_gl_account("", _workspace_id), do: nil
defp resolve_expense_category_from_gl_account(gl_account_uuid, workspace_id) do
  gl_account_external_id = resolve_coding_value_external_id(gl_account_uuid, workspace_id)

  if gl_account_external_id do
    query =
      ExpenseCategory
      |> Ash.Query.filter(expr(gl_account_code == ^gl_account_external_id and active == true))

    case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
      {:ok, %ExpenseCategory{external_id: ext_id}} when not is_nil(ext_id) ->
        Logger.debug("PushReimbursementCompleteReactor: Resolved ExpenseCategory for GL Account #{gl_account_external_id} -> external_id #{ext_id}")
        ext_id
      {:ok, nil} ->
        Logger.warning("PushReimbursementCompleteReactor: No active ExpenseCategory found for GL Account external_id #{gl_account_external_id}")
        nil
      {:error, reason} ->
        Logger.warning("PushReimbursementCompleteReactor: Failed to lookup ExpenseCategory for GL Account external_id #{gl_account_external_id}: #{inspect(reason)}")
        nil
    end
  else
    nil
  end
end
```

### 4. Update Expense Line Item Building

**File:** `push_reimbursement_complete_reactor.ex`

Updated `build_expense_report_data/4` to use the new resolvers:

```elixir
expense_lines: Enum.map(line_items, fn item ->
  metadata = item.metadata || %{}
  gl_account_uuid = metadata["gl_account"]

  # SC-2026-01-06-014: Map GL Account to Expense Category for NetSuite
  category_external_id = resolve_expense_category_from_gl_account(gl_account_uuid, workspace_id)

  %{
    amount: extract_money_amount(item.amount),
    description: item.description || item.merchant,
    expense_date: item.expense_date || Date.utc_today(),
    # Use Expense Category external_id, not GL Account UUID
    category_id: category_external_id,
    # Convert dimension UUIDs to external_ids
    department_id: resolve_coding_value_external_id(metadata["department"], workspace_id),
    class_id: resolve_coding_value_external_id(metadata["class"], workspace_id),
    location_id: resolve_coding_value_external_id(metadata["location"], workspace_id)
  }
end)
```

### 5. Add Money-to-Decimal Conversion Helper

**File:** `push_reimbursement_complete_reactor.ex`

Added `extract_money_amount/1` to convert `Money` structs to `Decimal` values. This is required because:
- `ReimbursementRequest.total_amount` is a `Money` struct
- `ReimbursementItem.amount` is a `Money` struct
- NetSuite adapter's `format_decimal/1` expects `Decimal` or numeric values

```elixir
defp extract_money_amount(nil), do: nil
defp extract_money_amount(%Money{} = money), do: Money.to_decimal(money)
defp extract_money_amount(%Decimal{} = dec), do: dec
defp extract_money_amount(amount) when is_number(amount), do: amount
defp extract_money_amount(amount) when is_binary(amount), do: Decimal.new(amount)
```

Both `total_amount` and line item `amount` fields now use this helper:

```elixir
# Header level
total_amount: extract_money_amount(reimbursement.total_amount) || Decimal.new(0),

# Line item level
amount: extract_money_amount(item.amount),
```

### 6. Refactor Adapter Config Building

**File:** `push_reimbursement_complete_reactor.ex`

The `build_adapter_config/1` function was refactored to correctly build the NetSuite config from `ErpConnection` credentials:

```elixir
defp build_adapter_config(erp_connection) do
  credentials = erp_connection.credentials || %{}
  configuration = erp_connection.configuration || %{}

  environment = Map.get(configuration, "environment") ||
                Map.get(configuration, :environment) ||
                "production"

  config_input =
    credentials
    |> Map.put("environment", environment)

  # Use the NetSuite Config module to build the proper config struct
  FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Config.build_config(config_input)
end
```

This was necessary because `ErpConnection` stores credentials in a nested map, not as direct attributes.

### 7. Created Mix Task for Manual Sync

**File:** `lib/mix/tasks/erp.sync_expense_categories.ex`

Created a Mix task to manually sync expense categories:

```bash
# Check current state
mix erp.sync_expense_categories --status

# Sync expense categories from NetSuite
mix erp.sync_expense_categories

# Force re-sync
mix erp.sync_expense_categories --force
```

**Note:** This task is optional for development/debugging. During normal ERP wizard setup, expense categories are synced automatically when `expense_categories` is enabled in `sync_config_setup_service.ex`.

---

## Data Flow After Fix

```
User Selects:
  └── GL Account (from CategoryGLLoaderService)
       └── CodingValue UUID: ff869e03-6498-4076-8cf8-8ec588c0c0fe
            └── external_id: 185 (NetSuite account ID)

Push Reactor Resolves:
  └── GL Account external_id (185)
       └── Look up ExpenseCategory WHERE gl_account_code = "185"
            └── ExpenseCategory.external_id: 18 (NetSuite expenseCategory ID)

NetSuite Receives:
  └── expense.items[].category = {"id": "18"}  ✅ Valid
```

---

## Files Modified

| File | Changes |
|------|---------|
| `sync_config_setup_service.ex` | Enabled `expense_categories` for NetSuite |
| `push_reimbursement_complete_reactor.ex` | Added `resolve_coding_value_external_id/2`, `resolve_expense_category_from_gl_account/2`, `extract_money_amount/1`, updated `build_expense_report_data/4`, refactored `build_adapter_config/1` |
| `erp.sync_expense_categories.ex` | **NEW** — Mix task for manual expense category sync (optional) |
| `erp.link_employee.ex` | **NEW** — Mix task for manual employee linking (GAP-EMP-001 fix) |

---

## Dependencies

- **ExpenseCategory** resource must have:
  - `external_id` (NetSuite internal ID)
  - `gl_account_code` (links to GL Account)
  - `active` (boolean)

- **CodingValue** resource must have:
  - `external_id` (NetSuite internal ID)
  - Proper linking to ERP mirror tables

---

## Testing Checklist

- [ ] Run `mix erp.sync_expense_categories` to populate ExpenseCategory table
- [ ] Verify ExpenseCategory records have `gl_account_code` populated
- [ ] Link employees: `mix erp.link_employee --teampay-name "Finance Admin" --netsuite-name "Jan Bucoy"`
- [ ] Push a reimbursement with a GL Account selected
- [ ] Verify NetSuite receives valid `category` ID (not UUID)
- [ ] Verify department/class/location are sent as external_ids

---

## Related Sessions

| Session | Relationship |
|---------|--------------|
| SC-2026-01-06-012 | Initial UUID → external_id fix (partial) |
| SC-2026-01-06-013 | Temporary nil fix (rejected by user) |
| SC-2026-01-05-005 | GAP-CAT-001 identified category lookup issue |

---

*Prepared by: Sync Committee — Session SC-2026-01-06-014*

