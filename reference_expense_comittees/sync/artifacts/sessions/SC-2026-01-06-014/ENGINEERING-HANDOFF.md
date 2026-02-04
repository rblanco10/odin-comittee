# SC-2026-01-06-014: Engineering Handoff — Expense Category & Dimension Mapping

**Session:** SC-2026-01-06-014  
**Date:** 2026-01-06  
**Priority:** HIGH  
**Status:** Ready for Testing

---

## Quick Start

After applying the changes:

```bash
# 1. Ensure you're on the correct branch
git checkout reimbursements-sync/jan-05-2026

# 2. Compile to verify no errors
cd campsite/flames/flame_teampay_payables
mix compile

# 3. Sync expense categories from NetSuite
mix erp.sync_expense_categories

# 4. Link employees (if needed)
mix erp.link_employee --teampay-name "Finance Admin" --netsuite-name "Jan Bucoy"

# 5. Start server and test reimbursement push
mix phx.server
```

---

## Changes Applied

### 1. sync_config_setup_service.ex

**Location:** Lines 156-160

```elixir
# BEFORE:
# {:expense_categories, "expense", bidirectional_frequency},

# AFTER:
# SC-2026-01-06-014: Enable expense_categories to get correct NetSuite expense category IDs for push
{:expense_categories, "expense", pull_frequency},
```

### 2. push_reimbursement_complete_reactor.ex

**New Aliases:**

```elixir
alias FlameTeampayPayables.EmberCoding.Definitions.Resources.CodingValue
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseCategory
```

**New Functions:**

```elixir
# Convert Teampay CodingValue UUID to NetSuite external_id
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

# Map GL Account -> Expense Category for NetSuite
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
        Logger.warning("PushReimbursementCompleteReactor: No active ExpenseCategory found for GL Account external_id #{gl_account_external_id}. Ensure expense_categories entity type is enabled in sync config.")
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

**Modified `build_expense_report_data/4`:**

The function now accepts `workspace_id` as a 4th parameter and uses the resolvers:

```elixir
defp build_expense_report_data(reimbursement, line_items, employee_external_id, workspace_id) do
  %{
    report_number: reimbursement.request_number || "EXP-#{String.slice(reimbursement.id, 0..7)}",
    report_date: reimbursement.inserted_at && DateTime.to_date(reimbursement.inserted_at) || Date.utc_today(),
    employee_external_id: employee_external_id,
    # SC-2026-01-06-014: Convert Money struct to Decimal for NetSuite
    total_amount: extract_money_amount(reimbursement.total_amount) || Decimal.new(0),
    currency_code: "USD",
    description: reimbursement.description,
    expense_lines: Enum.map(line_items, fn item ->
      metadata = item.metadata || %{}
      gl_account_uuid = metadata["gl_account"]

      # SC-2026-01-06-014: Map GL Account to Expense Category for NetSuite
      category_external_id = resolve_expense_category_from_gl_account(gl_account_uuid, workspace_id)

      %{
        amount: extract_money_amount(item.amount),
        description: item.description || item.merchant,
        expense_date: item.expense_date || Date.utc_today(),
        category_id: category_external_id,
        department_id: resolve_coding_value_external_id(metadata["department"], workspace_id),
        class_id: resolve_coding_value_external_id(metadata["class"], workspace_id),
        location_id: resolve_coding_value_external_id(metadata["location"], workspace_id)
      }
    end)
  }
end
```

**New Helper Function: `extract_money_amount/1`**

Converts `Money` structs to `Decimal` for NetSuite's `format_decimal/1`:

```elixir
defp extract_money_amount(nil), do: nil
defp extract_money_amount(%Money{} = money), do: Money.to_decimal(money)
defp extract_money_amount(%Decimal{} = dec), do: dec
defp extract_money_amount(amount) when is_number(amount), do: amount
defp extract_money_amount(amount) when is_binary(amount), do: Decimal.new(amount)
```

**Refactored `build_adapter_config/1`:**

Properly builds NetSuite config from `ErpConnection.credentials`:

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

  FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Config.build_config(config_input)
end
```

### 3. New Mix Task: erp.sync_expense_categories.ex

**Location:** `lib/mix/tasks/erp.sync_expense_categories.ex`

Full implementation provides:
- `--status` flag to check current state without syncing
- `--force` flag to re-sync even if data exists
- `--workspace` option to specify workspace
- Automatic SyncConfiguration creation if missing
- Fetches from NetSuite and upserts to ExpenseCategory table

### 4. New Mix Task: erp.link_employee.ex

**Location:** `lib/mix/tasks/erp.link_employee.ex`

Manually link Teampay WorkforceEmployee to NetSuite ERP Employee:

```bash
# Link by name search
mix erp.link_employee --teampay-name "Finance Admin" --netsuite-name "Jan Bucoy"

# Link by UUID (most precise)
mix erp.link_employee --teampay-id <uuid> --netsuite-id <uuid>

# List unlinked Teampay employees
mix erp.link_employee --list-unlinked

# List available NetSuite employees
mix erp.link_employee --list-netsuite
```

This task was created because:
- GAP-EMP-001 removed the dangerous "fallback to first employee" logic
- Now if an employee isn't linked, push fails with a clear error
- Manual linking is needed when names/emails differ between systems

---

## Verification Steps

### 1. Check ExpenseCategory Data

After running the sync:

```elixir
# In IEx
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseCategory

ExpenseCategory
|> Ash.Query.select([:external_id, :category_code, :category_name, :gl_account_code])
|> Ash.Query.limit(10)
|> Ash.read!(authorize?: false)
|> Enum.each(fn cat ->
  IO.puts("#{cat.category_code} -> GL: #{cat.gl_account_code} (NS ID: #{cat.external_id})")
end)
```

Expected output:
```
ACCOUNTING -> GL: 185 (NS ID: 18)
TRAVEL -> GL: 190 (NS ID: 19)
MEALS -> GL: 192 (NS ID: 20)
...
```

### 2. Test Push with Logs

Watch for these log lines during push:

```
[debug] PushReimbursementCompleteReactor: Resolved CodingValue ff869e03-... -> external_id 185
[debug] PushReimbursementCompleteReactor: Resolved ExpenseCategory for GL Account 185 -> external_id 18
```

### 3. Verify NetSuite Payload

The expense line should have:
```json
{
  "category": {"id": "18"},
  "department": {"id": "7"},
  ...
}
```

NOT:
```json
{
  "category": {"id": "ff869e03-6498-4076-8cf8-8ec588c0c0fe"}  // ❌ UUID
}
```

---

## Fallback Behavior

If no matching ExpenseCategory is found:

1. **Warning logged:** `No active ExpenseCategory found for GL Account external_id X`
2. **`category_id: nil`** is returned
3. **NetSuite adapter's fallback** kicks in (fetches first available expenseCategory from NetSuite)

This ensures the push doesn't fail, but dimensions won't match user's selection.

---

## Restoration Errors Fixed (Post-Implementation)

During session restoration, several bugs were introduced and subsequently fixed:

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `KeyError{key: :merchant_name}` | Typo: `item.merchant_name` instead of `item.merchant` | Changed to `item.merchant` |
| `KeyError{key: :account_id}` | Incorrect access: `erp_connection.account_id` | Refactored `build_adapter_config` to use `credentials` map |
| `UndefinedFunctionError` for `FieldMapperService.map_fields/3` | Removed erroneous call | Pass `expense_report_data` directly to adapter |
| `FunctionClauseError` in `format_decimal/1` | `Money` struct passed instead of `Decimal` | Added `extract_money_amount/1` helper for both `total_amount` and line item `amount` |

---

## Gaps to Address Later

| Gap | Description | Priority |
|-----|-------------|----------|
| GL Account passthrough | Currently we map GL → Category, but don't send GL Account separately | Low |
| Currency mapping | Uses NetSuite fallback | Medium |
| Project dimension | Not extracted from CodingAssignment | Medium |

---

*Prepared by: Sync Committee — Session SC-2026-01-06-014*
*Last Updated: 2026-01-07 (Post-restoration fixes)*

