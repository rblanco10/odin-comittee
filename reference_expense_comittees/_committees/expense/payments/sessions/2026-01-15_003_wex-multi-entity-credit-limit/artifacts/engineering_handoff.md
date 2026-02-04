# Engineering Handoff: Multi-Entity Credit Limit Fix

> **Session**: 2026-01-15_003_wex-multi-entity-credit-limit  
> **Status**: Ready for Implementation  
> **Priority**: High

---

## Summary

The Card Funding page currently shows the same WEX credit limit ($200) for all entities because the account lookup is hardcoded. This document provides the exact code changes needed to make credit limits entity-aware.

---

## Problem Statement

**Current Behavior**:
- `card_funding_live.ex` calls `WexFundingService.get_corporate_credit_limits/0`
- This function has a hardcoded `@primary_account_name "WB Paystand 81134671"`
- Every entity sees $200 credit limit regardless of their actual WEX account

**Expected Behavior**:
- Each entity should see their own WEX corporate account's credit limit
- "Imageworks Display" entity should see $150,000
- "Paystand, Inc." entity should see $5,000

---

## Solution Overview

Use the existing `WexAccountBalanceService` (which is entity-aware) instead of `WexFundingService` (which is not).

---

## Code Changes

### File 1: card_funding_live.ex

**Location**: `lib/flame_teampay_payables_web/live/expense_v2/card_funding_live.ex`

#### Change 1.1: Add Alias (around line 19)

```elixir
alias FlameTeampayPayables.EmberPayments.Services.WexAccountBalanceService
```

#### Change 1.2: Update load_funding_data (line 869)

**Before**:
```elixir
credit_limit = fetch_wex_credit_limit(round(total_limits))
```

**After**:
```elixir
entity_id = if entity, do: entity.id, else: nil
credit_limit = fetch_wex_credit_limit(entity_id, round(total_limits))
```

#### Change 1.3: Replace fetch_wex_credit_limit function (lines 901-914)

**Delete existing function and replace with**:

```elixir
# Fetch the credit limit from WEX using entity-aware service
# Returns credit_limit (uses fallback_limit if lookup fails)
defp fetch_wex_credit_limit(entity_id, fallback_limit) do
  case WexAccountBalanceService.get_credit_limit(entity_id) do
    {:ok, limit} when limit > 0 ->
      Logger.info("[CardFunding] WEX credit limit for entity #{entity_id}: $#{limit}")
      limit

    {:ok, _} ->
      Logger.debug("[CardFunding] No cached credit limit for entity #{entity_id}, trying sync")
      try_sync_and_get_limit(entity_id, fallback_limit)

    {:error, :no_wex_account} ->
      Logger.warning("[CardFunding] No WEX account for entity #{entity_id}. Using fallback: $#{fallback_limit}")
      fallback_limit

    {:error, :no_credit_limit} ->
      try_sync_and_get_limit(entity_id, fallback_limit)

    {:error, reason} ->
      Logger.warning("[CardFunding] Error getting credit limit: #{inspect(reason)}. Using fallback: $#{fallback_limit}")
      fallback_limit
  end
end

defp try_sync_and_get_limit(nil, fallback_limit), do: fallback_limit
defp try_sync_and_get_limit(entity_id, fallback_limit) do
  case WexAccountBalanceService.sync_balance(entity_id) do
    {:ok, %{credit_limit: limit}} when limit > 0 ->
      Logger.info("[CardFunding] Synced WEX credit limit for entity: $#{limit}")
      limit
    _ ->
      Logger.warning("[CardFunding] Sync failed for entity #{entity_id}. Using fallback: $#{fallback_limit}")
      fallback_limit
  end
end
```

---

### File 2: wex_account_balance_service.ex

**Location**: `lib/flame_teampay_payables/ember_payments/services/wex_account_balance_service.ex`

#### Change 2.1: Add find_matching_account/3 helper (add as private function)

```elixir
# Helper to find the matching WEX corporate account from API response
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

#### Change 2.2: Update fetch_balance_from_wex/2 to use account matching

In the `fetch_balance_from_wex/2` function, extract `wex_account_name` from metadata and use it to filter:

```elixir
defp fetch_balance_from_wex(connection, account) do
  metadata = account.provider_metadata || %{}
  
  # Get the WEX account identifier for matching
  wex_account_name = metadata["wex_account_name"]
  wex_account_number = metadata["wex_account_number"]

  params = %{
    bank_number: metadata["bank_number"] || System.get_env("WEX_FLEET_BANK_NUMBER"),
    company_number: metadata["company_number"] || System.get_env("WEX_FLEET_COMPANY_NUMBER")
  }

  Logger.debug("GAP-WEX-BALANCE-001: Fetching balance from WEX API", 
    params: inspect(params),
    wex_account_name: wex_account_name
  )

  case AccountManagement.get_corporate_available(connection, params) do
    {:ok, result} ->
      # Handle both single account and list of accounts
      accounts = cond do
        is_list(result[:accounts]) -> result[:accounts]
        is_list(result) -> result
        true -> [result]
      end
      
      # Find the matching account
      matching_account = if wex_account_name || wex_account_number do
        find_matching_account(accounts, wex_account_name, wex_account_number)
      else
        # No filter - use first account (legacy behavior)
        List.first(accounts)
      end
      
      case matching_account do
        nil ->
          Logger.warning("GAP-WEX-BALANCE-001: No matching WEX account found",
            wex_account_name: wex_account_name,
            available_accounts: Enum.map(accounts, & &1[:account_name])
          )
          {:error, :account_not_found}
          
        account ->
          balance_data = %{
            available_balance: extract_balance_value(account[:available_balance] || account["available_balance"]),
            credit_limit: extract_balance_value(account[:credit_limit] || account["credit_limit"]),
            current_balance: extract_balance_value(account[:current_balance] || account["current_balance"]),
            synced_at: DateTime.utc_now() |> DateTime.to_iso8601()
          }

          Logger.info("GAP-WEX-BALANCE-001: Found matching account",
            account_name: account[:account_name],
            credit_limit: balance_data.credit_limit
          )

          {:ok, balance_data}
      end

    {:error, reason} ->
      # ... keep existing error handling ...
  end
end
```

---

### File 3: WEX Seed

**Location**: `priv/repo/seeds/dev/wex/01_wex_payment_connection.exs`

#### Change 3.1: Add wex_account_name to provider_metadata (around line 180)

```elixir
# Add before EntityProviderAccount.create
wex_account_name = System.get_env("WEX_FLEET_ACCOUNT_NAME") || "WB Paystand 81134671"

# In provider_metadata map, add:
"wex_account_name" => wex_account_name,
"wex_account_number" => nil,  # Set if known
```

---

## Data Migration

For existing `EntityProviderAccount` records, run in IEx:

```elixir
alias FlameTeampayPayables.EmberPayments.Resources.Account.EntityProviderAccount
require Ash.Query

# Update all WEX accounts with the account name
{:ok, accounts} = EntityProviderAccount
  |> Ash.Query.filter(provider == :wex_fleet)
  |> Ash.read(authorize?: false)

Enum.each(accounts, fn account ->
  new_metadata = Map.merge(account.provider_metadata || %{}, %{
    "wex_account_name" => "WB Paystand 81134671"  # Adjust per entity
  })
  
  account
  |> Ash.Changeset.for_update(:update, %{provider_metadata: new_metadata})
  |> Ash.update(authorize?: false)
  |> IO.inspect(label: "Updated")
end)
```

---

## Environment Variables

Add to `.env`:

```bash
# WEX account name for entity mapping
WEX_FLEET_ACCOUNT_NAME="WB Paystand 81134671"
```

---

## Testing Checklist

- [ ] Card Funding page loads without errors
- [ ] Credit limit displays correct value for entity
- [ ] Fallback works when no WEX account configured
- [ ] Fallback works when WEX API fails
- [ ] Multiple entities show different credit limits
- [ ] Sync triggers when cached value is stale

---

## WEX Account Reference

| Account Name | Account Number | Credit Limit | Notes |
|--------------|----------------|--------------|-------|
| Paystand DEV ACCT | 9000000000011267 | $200 | Dev testing |
| Imageworks Display | 9000000000011348 | $150,000 | Demo entity |
| Paystand, Inc. | 9000000000011352 | $5,000 | Demo entity |
| WB Paystand 81134671 | (nil) | $200 | Primary dev |

---

## Related Files

- Analysis: `docs/agents/architecture/integrations/payments/providers/cards/wex/GET_CORPORATE_AVAILABLE_ANALYSIS.md`
- WexFundingService (old): `lib/.../services/wex_funding_service.ex`
- WexAccountBalanceService (new): `lib/.../services/wex_account_balance_service.ex`
- EntityProviderAccount: `lib/.../resources/account/entity_provider_account.ex`

---

## Questions?

Contact the Ember Payments Committee via `/invoke-expense-payments`.
