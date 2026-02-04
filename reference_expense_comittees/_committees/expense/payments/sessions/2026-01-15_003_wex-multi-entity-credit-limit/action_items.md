# Action Items

> **Session**: 2026-01-15_003_wex-multi-entity-credit-limit

---

## Open Items

| ID | Action | Assigned To | Due | Priority |
|----|--------|-------------|-----|----------|
| AI-001 | Add WexAccountBalanceService alias to card_funding_live.ex | Engineering | Next PR | High |
| AI-002 | Modify fetch_wex_credit_limit to accept entity_id parameter | Engineering | Next PR | High |
| AI-003 | Pass entity.id to fetch_wex_credit_limit in load_funding_data | Engineering | Next PR | High |
| AI-004 | Add find_matching_account/3 helper to wex_account_balance_service.ex | Engineering | Next PR | High |
| AI-005 | Update fetch_balance_from_wex/2 to use account matching | Engineering | Next PR | High |
| AI-006 | Add wex_account_name to WEX seed provider_metadata | Engineering | Next PR | Medium |
| AI-007 | Update existing EntityProviderAccount records with wex_account_name | Engineering | After seed update | Medium |
| AI-008 | Add WEX_FLEET_ACCOUNT_NAME env var to deployment config | Engineering | Before deploy | Medium |

---

## Item Details

### AI-001: Add WexAccountBalanceService Alias

**Description**: Add the alias for `WexAccountBalanceService` to the top of `card_funding_live.ex` to enable entity-aware credit limit lookups.

**Assigned To**: Engineering

**File**: `lib/flame_teampay_payables_web/live/expense_v2/card_funding_live.ex`

**Code Change**:
```elixir
# Add around line 19
alias FlameTeampayPayables.EmberPayments.Services.WexAccountBalanceService
```

**Acceptance Criteria**:
- [ ] Alias added to imports section
- [ ] No compilation errors

---

### AI-002: Modify fetch_wex_credit_limit Function Signature

**Description**: Change `fetch_wex_credit_limit/1` to `fetch_wex_credit_limit/2` to accept entity_id as first parameter.

**Assigned To**: Engineering

**File**: `lib/flame_teampay_payables_web/live/expense_v2/card_funding_live.ex`

**Current** (line 901):
```elixir
defp fetch_wex_credit_limit(fallback_limit) do
```

**New**:
```elixir
defp fetch_wex_credit_limit(entity_id, fallback_limit) do
  case WexAccountBalanceService.get_credit_limit(entity_id) do
    {:ok, limit} when limit > 0 ->
      Logger.info("[CardFunding] WEX credit limit for entity #{entity_id}: $#{limit}")
      limit

    {:ok, _} ->
      Logger.debug("[CardFunding] No cached credit limit, trying sync")
      try_sync_and_get_limit(entity_id, fallback_limit)

    {:error, :no_wex_account} ->
      Logger.warning("[CardFunding] No WEX account for entity. Using fallback: $#{fallback_limit}")
      fallback_limit

    {:error, :no_credit_limit} ->
      try_sync_and_get_limit(entity_id, fallback_limit)

    {:error, reason} ->
      Logger.warning("[CardFunding] Error: #{inspect(reason)}. Using fallback: $#{fallback_limit}")
      fallback_limit
  end
end

defp try_sync_and_get_limit(nil, fallback_limit), do: fallback_limit
defp try_sync_and_get_limit(entity_id, fallback_limit) do
  case WexAccountBalanceService.sync_balance(entity_id) do
    {:ok, %{credit_limit: limit}} when limit > 0 -> limit
    _ -> fallback_limit
  end
end
```

**Acceptance Criteria**:
- [ ] Function accepts entity_id as first parameter
- [ ] Uses WexAccountBalanceService.get_credit_limit/1
- [ ] Falls back appropriately on errors
- [ ] Attempts sync when no cached value exists

---

### AI-003: Pass entity.id to fetch_wex_credit_limit

**Description**: Update the call site in `load_funding_data/3` to pass the entity ID.

**Assigned To**: Engineering

**File**: `lib/flame_teampay_payables_web/live/expense_v2/card_funding_live.ex`

**Current** (line 869):
```elixir
credit_limit = fetch_wex_credit_limit(round(total_limits))
```

**New**:
```elixir
entity_id = if entity, do: entity.id, else: nil
credit_limit = fetch_wex_credit_limit(entity_id, round(total_limits))
```

**Acceptance Criteria**:
- [ ] Entity ID extracted safely (handles nil entity)
- [ ] Passed as first parameter to fetch_wex_credit_limit

---

### AI-004: Add find_matching_account/3 Helper

**Description**: Add a helper function to `wex_account_balance_service.ex` that finds the matching WEX corporate account from the API response.

**Assigned To**: Engineering

**File**: `lib/flame_teampay_payables/ember_payments/services/wex_account_balance_service.ex`

**Code**:
```elixir
# Add as private function
defp find_matching_account(accounts, wex_account_name, wex_account_number) when is_list(accounts) do
  Enum.find(accounts, fn account ->
    cond do
      # Prefer matching by account_number if available (most reliable)
      wex_account_number && account[:account_number] == wex_account_number ->
        true
      
      # Fall back to matching by account_name
      wex_account_name && 
        (account[:account_name] == wex_account_name ||
         account[:organization_name] == wex_account_name ||
         account[:company_name] == wex_account_name) ->
        true
      
      true ->
        false
    end
  end)
end

defp find_matching_account(_accounts, _name, _number), do: nil
```

**Acceptance Criteria**:
- [ ] Function handles list of accounts
- [ ] Prefers account_number match
- [ ] Falls back to account_name match
- [ ] Returns nil if no match found

---

### AI-005: Update fetch_balance_from_wex to Use Account Matching

**Description**: Modify `fetch_balance_from_wex/2` to extract `wex_account_name` from provider_metadata and use it to filter the API response.

**Assigned To**: Engineering

**File**: `lib/flame_teampay_payables/ember_payments/services/wex_account_balance_service.ex`

**Key Changes**:
1. Extract `wex_account_name` and `wex_account_number` from `account.provider_metadata`
2. Call `find_matching_account/3` on the API response
3. Return credit_limit from the matched account

**Acceptance Criteria**:
- [ ] Reads wex_account_name from provider_metadata
- [ ] Reads wex_account_number from provider_metadata (optional)
- [ ] Filters API response to matching account
- [ ] Returns error if no matching account found
- [ ] Updates provider_metadata with correct credit_limit

---

### AI-006: Add wex_account_name to WEX Seed

**Description**: Update the WEX seed to include `wex_account_name` in the `EntityProviderAccount.provider_metadata`.

**Assigned To**: Engineering

**File**: `priv/repo/seeds/dev/wex/01_wex_payment_connection.exs`

**Location**: Lines 180-191

**Add**:
```elixir
wex_account_name = System.get_env("WEX_FLEET_ACCOUNT_NAME") || "WB Paystand 81134671"

# In provider_metadata map:
"wex_account_name" => wex_account_name,
"wex_account_number" => nil,  # Set if known
```

**Acceptance Criteria**:
- [ ] wex_account_name added to provider_metadata
- [ ] Reads from WEX_FLEET_ACCOUNT_NAME env var
- [ ] Has sensible default for dev environment

---

### AI-007: Update Existing EntityProviderAccount Records

**Description**: For any existing EntityProviderAccount records for WEX, update provider_metadata to include the wex_account_name.

**Assigned To**: Engineering

**Method**: IEx script or migration

**Script**:
```elixir
alias FlameTeampayPayables.EmberPayments.Resources.Account.EntityProviderAccount
require Ash.Query

# Find all WEX EntityProviderAccounts
{:ok, accounts} = EntityProviderAccount
  |> Ash.Query.filter(provider == :wex_fleet)
  |> Ash.read(authorize?: false)

# Update each with wex_account_name
Enum.each(accounts, fn account ->
  new_metadata = Map.merge(account.provider_metadata || %{}, %{
    "wex_account_name" => "WB Paystand 81134671"  # Adjust per entity
  })
  
  account
  |> Ash.Changeset.for_update(:update, %{provider_metadata: new_metadata})
  |> Ash.update(authorize?: false)
end)
```

**Acceptance Criteria**:
- [ ] All WEX EntityProviderAccount records have wex_account_name
- [ ] Each entity mapped to correct WEX account

---

### AI-008: Add WEX_FLEET_ACCOUNT_NAME to Deployment Config

**Description**: Add the WEX_FLEET_ACCOUNT_NAME environment variable to deployment configuration.

**Assigned To**: Engineering

**Files**: `.env`, deployment configs

**Acceptance Criteria**:
- [ ] Variable documented in environment variable guide
- [ ] Set in dev environment
- [ ] Set in staging/production as appropriate

---

## Notes

**Implementation Order**:
1. AI-001, AI-002, AI-003 (card_funding_live.ex changes)
2. AI-004, AI-005 (wex_account_balance_service.ex changes)
3. AI-006 (seed update)
4. AI-007 (data update)
5. AI-008 (deployment config)

**Testing Strategy**:
- Unit tests for `find_matching_account/3`
- Integration test for entity-aware credit limit lookup
- Manual verification in dev environment with multiple entities
