# Bank Mapping Filter Design — Session SC-2026-01-13-003

## Problem Statement

Human Director reports that the ACH Funding Account dropdown in ERP Setup shows ALL GL accounts, but:

1. **Account Type Mismatch**: Users can select non-Bank accounts (e.g., Liability accounts) which NetSuite rejects
2. **Subsidiary Mismatch**: Users can select Bank accounts from the wrong subsidiary, which NetSuite also rejects

## Evidence from NetSuite Logs

| Timestamp | accountId | Account Name | Account Type | Subsidiary | Result |
|-----------|-----------|--------------|--------------|------------|--------|
| 02:12:19 | 187 | 1 Test Nick | **LIABILITY** | N/A | ❌ INVALID_FLD_VALUE |
| 02:18:06 | 187 | 1 Test Nick | **LIABILITY** | N/A | ❌ INVALID_FLD_VALUE |
| 02:33:13 | 1 | 1000 Checking | Asset/Bank | **1** (Parent) | ❌ INVALID_FLD_VALUE |

**Employee 1644 (Terry Chan)** belongs to **Subsidiary 3** (Honeycomb Holdings Inc.)

**Account 1 (1000 Checking)** belongs to **Subsidiary 1** (Parent Company)

## Database Analysis

### Valid Bank Accounts for Subsidiary 3

```sql
SELECT external_id, account_code, account_name, ns_account_type, subsidiary_raw
FROM ember_erp_accounting_gl_accounts 
WHERE account_type = 'asset' 
  AND erp_metadata->>'accttype' = 'Bank'
  AND erp_metadata->>'subsidiary_raw' LIKE '%3%';
```

| external_id | account_code | account_name | ns_account_type | subsidiary |
|-------------|--------------|--------------|-----------------|------------|
| **186** | **111** | **111 Another Account** | Bank | 3 |
| 208 | 1234 | 1234 Teampay Holding Ru Shan | Bank | 3 |
| 194 | 12345 | 12345 US Sub Pound Account | Bank | 3 |
| 215 | 192837465 | 192837465 Teampay Holding | Bank | 3 |

**Note:** "111 Another Account" (external_id 186) is why the RESTlet fallback worked — it's the correct Bank account for subsidiary 3!

---

## Design Proposal: Filtered Bank Account Dropdown

### Requirements

| Requirement | Description |
|-------------|-------------|
| **R1** | ACH Funding Account dropdown should ONLY show Bank-type accounts |
| **R2** | Accounts should be filtered by the configured subsidiary |
| **R3** | Other funding account dropdowns (Wire, Check) should follow the same pattern |
| **R4** | Configuration should be validated before saving |

### Implementation Approach

#### Option A: Filter in `AccountMappingService.get_available_accounts/2`

Add optional parameters for filtering:

```elixir
@spec get_available_accounts(binary(), binary(), keyword()) :: {:ok, list()} | {:error, term()}
def get_available_accounts(erp_connection_id, workspace_id, opts \\ []) do
  account_types = Keyword.get(opts, :account_types, nil)  # e.g., ["Bank"]
  subsidiary_id = Keyword.get(opts, :subsidiary_id, nil)   # e.g., "3"
  
  query = GLAccount
    |> Ash.Query.filter(erp_connection_id == ^erp_connection_id and active == true)
  
  # Filter by account type (NetSuite accttype in metadata)
  query = if account_types do
    Ash.Query.filter(query, fragment("erp_metadata->>'accttype' = ANY(?)", ^account_types))
  else
    query
  end
  
  # Filter by subsidiary
  query = if subsidiary_id do
    Ash.Query.filter(query, fragment("erp_metadata->>'subsidiary_raw' LIKE ?", ^"%#{subsidiary_id}%"))
  else
    query
  end
  
  # ... rest of function
end
```

**Pros:** Clean, reusable, testable  
**Cons:** Requires UI to know the subsidiary context

#### Option B: Configuration Item-Specific Filters

Define filter rules per configuration item:

```elixir
@configuration_item_filters %{
  ach_funding_account: %{account_types: ["Bank"], require_subsidiary: true},
  wire_funding_account: %{account_types: ["Bank"], require_subsidiary: true},
  check_funding_account: %{account_types: ["Bank"], require_subsidiary: true},
  good_funds_card_funding: %{account_types: ["Bank", "OthCurrAsset"], require_subsidiary: true},
  teampay_ap_control: %{account_types: ["AcctPay"], require_subsidiary: false}
}
```

**Pros:** Business logic centralized, self-documenting  
**Cons:** More complex, may over-engineer

#### Option C: Validation Only (No UI Filter)

Keep dropdown showing all accounts, but validate on save:

```elixir
def validate_account_for_configuration_item(configuration_item, gl_account, subsidiary_id) do
  case configuration_item do
    item when item in [:ach_funding_account, :wire_funding_account, :check_funding_account] ->
      cond do
        gl_account.erp_metadata["accttype"] != "Bank" ->
          {:error, "#{item} must be a Bank account, not #{gl_account.erp_metadata["accttype"]}"}
        
        not String.contains?(gl_account.erp_metadata["subsidiary_raw"] || "", subsidiary_id) ->
          {:error, "Account #{gl_account.account_code} is not available for the configured subsidiary"}
        
        true ->
          :ok
      end
    
    _ ->
      :ok
  end
end
```

**Pros:** Simplest implementation, clear error messages  
**Cons:** Poor UX (users see error after selecting)

---

## Committee Recommendation

### Recommended: Option A + C (Hybrid)

1. **UI Filtering (Option A)**: Filter dropdown to only show valid accounts
2. **Backend Validation (Option C)**: Validate on save as safety net

### Implementation Files

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Add `get_bank_accounts_for_subsidiary/3` function |
| `bank_mapping_tab.ex` | Use filtered function for funding account dropdowns |
| `erp_live.ex` | Pass subsidiary context to bank mapping tab |

### Required Context

The UI needs to know the **configured subsidiary** to filter accounts. This is stored in:
- `EntityMapping.erp_subsidiary_id` — The subsidiary selected during ERP wizard setup

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No subsidiary configured | Show all Bank accounts with warning |
| No Bank accounts for subsidiary | Show empty dropdown with helpful message |
| Account becomes inactive after selection | Validate on save, show warning |
| Multiple subsidiaries per account | Match if ANY subsidiary matches |

---

## Next Steps

1. **Human Director Approval** — Approve recommended approach
2. **Implementation** — Add filtering to AccountMappingService
3. **UI Update** — Pass subsidiary context to BankMappingTab
4. **Testing** — Verify filtering works correctly
5. **Documentation** — Update session artifacts

---

## Implementation (Turn 6)

### Files Modified

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Added `get_bank_accounts_for_subsidiary/3`, `get_bank_accounts/2`, `bank_funding_items/0` |
| `erp_live.ex` | Added `get_configured_subsidiary_id/2`, updated `load_tab_data(:bank_mapping)` to load bank accounts |
| `bank_mapping_tab.ex` | Added `@bank_funding_items`, updated render to use filtered accounts for funding items |

### New Functions

#### AccountMappingService

```elixir
# Get Bank accounts filtered by subsidiary (for NetSuite)
@spec get_bank_accounts_for_subsidiary(binary(), binary() | nil, binary()) :: {:ok, list()} | {:error, term()}
def get_bank_accounts_for_subsidiary(erp_connection_id, subsidiary_id, workspace_id)

# Get all Bank accounts without subsidiary filtering
@spec get_bank_accounts(binary(), binary()) :: {:ok, list()} | {:error, term()}
def get_bank_accounts(erp_connection_id, workspace_id)

# List of configuration items requiring Bank filtering
@spec bank_funding_items() :: [atom()]
def bank_funding_items
```

#### ErpLive

```elixir
# Get configured subsidiary ID from EntityMapping
defp get_configured_subsidiary_id(connection_id, workspace_id)
```

### UI Changes

- Bank funding items (ACH, Wire, Check) now have a blue icon background to visually distinguish them
- Dropdowns for funding items only show Bank-type accounts from the configured subsidiary
- Warning message displayed when no Bank accounts are available for the subsidiary

### Data Flow

```
ErpLive.load_tab_data(:bank_mapping)
  ├── get_configured_subsidiary_id(connection_id, workspace_id)
  │     └── EntityMapping.by_connection → erp_location_id
  ├── AccountMappingService.get_available_accounts (all GL accounts)
  └── AccountMappingService.get_bank_accounts_for_subsidiary (filtered Bank accounts)
        └── GLAccount filtered by:
              - erp_metadata->>'accttype' = 'Bank'
              - erp_metadata->>'subsidiary_raw' LIKE '%{subsidiary_id}%'

BankMappingTab.render
  └── for each mapping:
        if mapping.id in @bank_funding_items:
          use @bank_accounts
        else:
          use @available_accounts
```

---

## Turn 7: Bug Fix — Missing `import Ash.Expr`

**Issue:** After implementation, navigating to Bank Mapping tab failed silently.

**Root Cause:** The `fragment/2` function used in the new queries requires `import Ash.Expr`, which was not included.

**Fix:**

```elixir
# In account_mapping_service.ex
require Logger
require Ash.Query
import Ash.Expr  # <-- Added this import
```

**Lesson Learned:** When using Ash query fragments (for raw SQL in filters), always ensure `import Ash.Expr` is present in the module.

---

## Turn 8: Bug Fix — EntityMapping.by_connection/2 Undefined

**Issue:** After previous fix, Bank Mapping tab crashed with:

```
** (UndefinedFunctionError) function FlameTeampayPayables.EmberErp.Resources.Connection.EntityMapping.by_connection/2 is undefined or private
```

**Root Cause:** The `EntityMapping` resource defines `by_connection` as a read action, but does NOT have a `code_interface` block to expose it as a callable function.

**Fix:**

```elixir
# Before (WRONG - by_connection/2 doesn't exist as code interface)
case EntityMapping.by_connection(connection_id, tenant: workspace_id, authorize?: false) do

# After (CORRECT - use Ash.Query directly)
query =
  EntityMapping
  |> Ash.Query.filter(erp_connection_id == ^connection_id)

case Ash.read(query, tenant: workspace_id, authorize?: false) do
```

**Lesson Learned:** Always check if Ash resources have `code_interface` blocks before calling action functions directly. If not, use `Ash.Query` + `Ash.read/2` instead.

---

*Design proposal created: 2026-01-14*
*Implementation completed: 2026-01-14*
*Bug fixes applied: 2026-01-14 (Turns 7-8)*
*Session: SC-2026-01-13-003 Turns 4-8*
