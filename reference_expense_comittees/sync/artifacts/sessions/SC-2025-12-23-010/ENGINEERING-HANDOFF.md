# Engineering Handoff: Vendor Credit / Refund Push Support

> **Session:** SC-2025-12-23-010
> **Date:** 2025-12-24
> **Status:** APPROVED — Ready for AI Execution
> **Executor:** Engineering Subcommittee (AI)

---

## Executive Summary

Implement full vendor credit push and sync capabilities across all ERP providers to support card transaction refunds. This enables Teampay to properly post refunds/reversals/credits to ERPs as VendorCredit objects (with Journal Entry fallback).

---

## Business Context

| Business Activity | ERP Object | Direction | Timing |
|-------------------|------------|-----------|--------|
| Refunds / Reversals / Credits | Vendor Credit (or JE fallback) | TP → ERP (Push) + Bi-directional sync | On settlement reversal |

**Key Requirements:**
- Refunds mapped to **original coding** (inherit from parent transaction)
- Maintains **audit consistency**
- Bi-directional sync **if period is open**

---

## Provider-Specific Mapping

| Provider | Primary Object | Fallback 1 | Final Fallback |
|----------|---------------|------------|----------------|
| **NetSuite** | VendorCredit | — | Journal Entry |
| **QuickBooks** | VendorCredit | Credit Memo / Negative Expense | Journal Entry |
| **Sage Intacct** | VendorCredit | — | Journal Entry |
| **Acumatica** | VendorCredit | — | Journal Entry |

**Universal Rule:** ALL providers MUST have Journal Entry as the final fallback.

---

## Current State (GAPS)

| Component | Status | Gap |
|-----------|--------|-----|
| `PushVendorCreditReactor` | ✅ EXISTS | Has fallback logic ready |
| `ReactorRegistry` | ✅ EXISTS | `:vendor_credit` registered |
| `Accounting.AP.VendorCredit` mirror | ❌ MISSING | Resource doesn't exist |
| NetSuite `push_vendor_credit` | ❌ MISSING | Not in capabilities |
| NetSuite `sync_vendor_credits` | ❌ MISSING | Not in capabilities |
| QBO `push_vendor_credit` | ❌ MISSING | Not in capabilities |
| QBO `sync_vendor_credits` | ❌ MISSING | Not in capabilities |
| Intacct `push_vendor_credit` | ❌ MISSING | Not in capabilities |
| Intacct `sync_vendor_credits` | ❌ MISSING | Not in capabilities |
| Acumatica `push_vendor_credit` | ❌ MISSING | Not in capabilities |
| Acumatica `sync_vendor_credits` | ❌ MISSING | Not in capabilities |
| `WorkspaceSyncReactor` | ❌ MISSING | `:vendor_credits` not in entity order |
| `BulkUpsertService.VendorCredits` | ❌ MISSING | No bulk upsert service |
| `VendorCreditReconciliationService` | ⚠️ WORKAROUND | Uses Bill mirror (incorrect) |

---

## Implementation Plan

### Phase 1: Infrastructure

#### 1.1 Create VendorCredit Mirror Resource

**File:** `lib/flame_teampay_payables/ember_erp/resources/accounting/ap/vendor_credit.ex`

```elixir
defmodule FlameTeampayPayables.EmberErp.Resources.Accounting.AP.VendorCredit do
  use Ash.Resource,
    domain: FlameTeampayPayables.EmberErp.Domains.Accounting,
    data_layer: AshPostgres.DataLayer

  postgres do
    table "ember_erp_vendor_credits"
    repo FlameTeampayPayables.Repo
  end

  attributes do
    uuid_primary_key :id
    
    # Core identification
    attribute :external_id, :string, allow_nil?: false
    attribute :display_id, :string
    
    # Relationships
    attribute :workspace_id, :uuid, allow_nil?: false
    attribute :entity_id, :uuid
    attribute :erp_connection_id, :uuid, allow_nil?: false
    attribute :vendor_external_id, :string
    
    # Financial data
    attribute :total_amount, :decimal
    attribute :currency, :string, default: "USD"
    attribute :credit_date, :date
    attribute :memo, :string
    
    # Status
    attribute :status, :atom, constraints: [one_of: [:open, :applied, :closed]]
    
    # Coding (inherited from parent transaction)
    attribute :gl_account_external_id, :string
    attribute :department_external_id, :string
    attribute :class_external_id, :string
    attribute :location_external_id, :string
    attribute :project_external_id, :string
    
    # Line items (denormalized for efficiency)
    attribute :line_items, {:array, :map}, default: []
    
    # ERP timestamps
    attribute :erp_created_at, :utc_datetime
    attribute :erp_updated_at, :utc_datetime
    
    # Bridge tracking
    attribute :bridged_at, :utc_datetime
    
    timestamps()
  end

  identities do
    identity :unique_per_connection, [:erp_connection_id, :external_id]
  end

  actions do
    defaults [:read, :destroy]
    
    create :create do
      accept [:external_id, :display_id, :workspace_id, :entity_id, :erp_connection_id,
              :vendor_external_id, :total_amount, :currency, :credit_date, :memo, :status,
              :gl_account_external_id, :department_external_id, :class_external_id,
              :location_external_id, :project_external_id, :line_items,
              :erp_created_at, :erp_updated_at, :bridged_at]
    end
    
    update :update do
      accept [:display_id, :vendor_external_id, :total_amount, :currency, :credit_date,
              :memo, :status, :gl_account_external_id, :department_external_id,
              :class_external_id, :location_external_id, :project_external_id,
              :line_items, :erp_created_at, :erp_updated_at, :bridged_at]
    end
    
    update :mark_bridged do
      accept []
      change set_attribute(:bridged_at, &DateTime.utc_now/0)
    end
  end
end
```

#### 1.2 Create Migration

**File:** `priv/repo/migrations/YYYYMMDDHHMMSS_create_ember_erp_vendor_credits.exs`

```elixir
defmodule FlameTeampayPayables.Repo.Migrations.CreateEmberErpVendorCredits do
  use Ecto.Migration

  def change do
    create table(:ember_erp_vendor_credits, primary_key: false) do
      add :id, :uuid, primary_key: true
      
      # Core identification
      add :external_id, :string, null: false
      add :display_id, :string
      
      # Relationships
      add :workspace_id, :uuid, null: false
      add :entity_id, :uuid
      add :erp_connection_id, references(:ember_erp_connections, type: :uuid), null: false
      add :vendor_external_id, :string
      
      # Financial data
      add :total_amount, :decimal
      add :currency, :string, default: "USD"
      add :credit_date, :date
      add :memo, :text
      
      # Status
      add :status, :string
      
      # Coding
      add :gl_account_external_id, :string
      add :department_external_id, :string
      add :class_external_id, :string
      add :location_external_id, :string
      add :project_external_id, :string
      
      # Line items
      add :line_items, :jsonb, default: "[]"
      
      # ERP timestamps
      add :erp_created_at, :utc_datetime
      add :erp_updated_at, :utc_datetime
      
      # Bridge tracking
      add :bridged_at, :utc_datetime

      timestamps()
    end

    create unique_index(:ember_erp_vendor_credits, [:erp_connection_id, :external_id])
    create index(:ember_erp_vendor_credits, [:workspace_id])
    create index(:ember_erp_vendor_credits, [:erp_connection_id])
    create index(:ember_erp_vendor_credits, [:vendor_external_id])
    create index(:ember_erp_vendor_credits, [:bridged_at])
  end
end
```

#### 1.3 Create BulkUpsertService

**File:** `lib/flame_teampay_payables/ember_erp/services/bulk_upsert/vendor_credits.ex`

Follow the pattern from `BulkUpsertService.Bills` but for VendorCredit.

#### 1.4 Add to Domain Registry

Update `Accounting` domain to include `VendorCredit` resource.

---

### Phase 2: Sync Capabilities

#### 2.1 NetSuite sync_vendor_credits

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/sync/ap/vendor_credits.ex`

```elixir
defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Capabilities.Sync.AP.VendorCredits do
  @moduledoc """
  NetSuite VendorCredit sync capability.
  
  Uses SuiteQL to fetch vendor credits with full datetime precision.
  """
  
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.{Client, QueryBuilder}
  
  @doc """
  Fetch vendor credits from NetSuite.
  
  ## Options
  - `:since` - DateTime for incremental sync
  - `:page` - Page number (1-indexed)
  - `:page_size` - Records per page (default 500)
  """
  def fetch(config, opts \\ []) do
    query = build_query(opts)
    
    case Client.execute_suiteql(config, query) do
      {:ok, %{"items" => items}} -> {:ok, transform_items(items)}
      {:ok, %{"items" => nil}} -> {:ok, []}
      error -> error
    end
  end
  
  defp build_query(opts) do
    since = Keyword.get(opts, :since)
    page = Keyword.get(opts, :page, 1)
    page_size = Keyword.get(opts, :page_size, 500)
    offset = (page - 1) * page_size
    
    base = """
    SELECT
      VendorCredit.id AS external_id,
      VendorCredit.tranid AS display_id,
      VendorCredit.entity AS vendor_external_id,
      VendorCredit.total AS total_amount,
      VendorCredit.currency AS currency,
      TO_CHAR(VendorCredit.trandate, 'YYYY-MM-DD') AS credit_date,
      VendorCredit.memo AS memo,
      VendorCredit.status AS status,
      TO_CHAR(VendorCredit.createddate, 'YYYY-MM-DD"T"HH24:MI:SS') AS erp_created_at,
      TO_CHAR(VendorCredit.lastmodifieddate, 'YYYY-MM-DD"T"HH24:MI:SS') AS erp_updated_at
    FROM VendorCredit
    """
    
    where_clause = if since do
      formatted = QueryBuilder.format_datetime_for_where(since)
      "WHERE TO_CHAR(VendorCredit.lastmodifieddate, 'YYYY-MM-DD\"T\"HH24:MI:SS') > '#{formatted}'"
    else
      ""
    end
    
    "#{base} #{where_clause} ORDER BY VendorCredit.id OFFSET #{offset} ROWS FETCH NEXT #{page_size} ROWS ONLY"
  end
  
  defp transform_items(items) do
    Enum.map(items, fn item ->
      %{
        external_id: to_string(item["external_id"]),
        display_id: item["display_id"],
        vendor_external_id: to_string(item["vendor_external_id"]),
        total_amount: parse_decimal(item["total_amount"]),
        currency: item["currency"],
        credit_date: parse_date(item["credit_date"]),
        memo: item["memo"],
        status: parse_status(item["status"]),
        erp_created_at: parse_datetime(item["erp_created_at"]),
        erp_updated_at: parse_datetime(item["erp_updated_at"])
      }
    end)
  end
  
  # ... helper functions for parsing
end
```

#### 2.2-2.4 Other Providers

Create similar sync capabilities for QuickBooks, Intacct, and Acumatica following their respective API patterns.

#### 2.5 Add to WorkspaceSyncReactor

Update `@entity_order` and `@entity_tiers`:

```elixir
@entity_order [
  # ... existing entities ...
  :vendor_credits  # After ap_payments
]

@entity_tiers %{
  # ... existing tiers ...
  vendor_credits: :warm  # Every 16 min
}
```

---

### Phase 3: Push Capabilities

#### 3.1 NetSuite push_vendor_credit

**File:** `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/push/vendor_credits.ex`

```elixir
defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Capabilities.Push.VendorCredits do
  @moduledoc """
  Push vendor credits to NetSuite.
  
  Primary: POST to /services/rest/record/v1/vendorCredit
  Fallback: Convert to Journal Entry and push via existing JE capability
  """
  
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.{Client, Capabilities.Push.JournalEntry}
  
  require Logger
  
  def push(config, data, opts \\ []) do
    case push_vendor_credit(config, data) do
      {:ok, result} -> {:ok, result}
      {:error, reason} ->
        Logger.warning("VendorCredit push failed, falling back to JournalEntry: #{inspect(reason)}")
        push_as_journal_entry(config, data, opts)
    end
  end
  
  defp push_vendor_credit(config, data) do
    payload = build_vendor_credit_payload(data)
    
    case Client.post(config, "/services/rest/record/v1/vendorCredit", payload) do
      {:ok, %{"id" => id}} ->
        {:ok, %{external_id: to_string(id), status: :created, object_type: :vendor_credit}}
      error -> error
    end
  end
  
  defp push_as_journal_entry(config, data, _opts) do
    je_data = transform_to_journal_entry(data)
    
    case JournalEntry.push(config, je_data) do
      {:ok, result} ->
        {:ok, Map.put(result, :fallback_used, :journal_entry)}
      error -> error
    end
  end
  
  defp build_vendor_credit_payload(data) do
    %{
      "entity" => %{"id" => data.vendor_internal_id},
      "tranDate" => format_date(data.credit_date),
      "memo" => data.memo || "Card refund",
      "item" => build_line_items(data.line_items)
    }
  end
  
  defp transform_to_journal_entry(data) do
    # Credit: AP account (increases credit balance)
    # Debit: Expense account (reduces expense)
    %{
      tran_date: data.credit_date,
      memo: "Vendor Credit (JE Fallback): #{data.memo}",
      lines: [
        %{
          account_id: data.ap_account_id,
          credit: data.total_amount,
          debit: Decimal.new(0),
          memo: "AP Credit"
        },
        %{
          account_id: data.expense_account_id,
          credit: Decimal.new(0),
          debit: data.total_amount,
          memo: "Expense Reversal"
        }
      ]
    }
  end
  
  # ... helper functions
end
```

#### 3.2-3.4 Other Providers

Create similar push capabilities with JE fallback for all providers.

#### 3.5 Update Adapter Capabilities Lists

Add `:vendor_credit` to push capabilities for all adapters:

```elixir
# Each adapter.ex
push: [
  # ... existing ...
  :vendor_credit
]

sync: [
  # ... existing ...
  :vendor_credits
]
```

---

### Phase 4: Bridge & Reconciliation

#### 4.1 Fix VendorCreditReconciliationService

Update to use correct mirror:

```elixir
# FROM:
@mirror_module FlameTeampayPayables.EmberErp.Resources.Accounting.AP.Bill

# TO:
@mirror_module FlameTeampayPayables.EmberErp.Resources.Accounting.AP.VendorCredit
```

#### 4.2 Add Source Linking

Add column to ExpenseCardTransaction for linking to VendorCredit mirror:

```elixir
# Migration
add :erp_vendor_credit_id, references(:ember_erp_vendor_credits, type: :uuid)
```

---

## Verification Checklist

After implementation:

- [ ] `mix compile` — No compilation errors
- [ ] `mix ash.codegen` — Resources properly generated
- [ ] `mix ecto.migrate` — Migration runs successfully
- [ ] Capability lists updated for all 4 providers
- [ ] Push fallback to JE works for all providers
- [ ] VendorCreditReconciliationService uses correct mirror
- [ ] BridgeReactor step ordering verified

---

## Files to Create/Modify

### New Files
1. `resources/accounting/ap/vendor_credit.ex`
2. `migrations/YYYYMMDDHHMMSS_create_ember_erp_vendor_credits.exs`
3. `services/bulk_upsert/vendor_credits.ex`
4. `adapters/providers/netsuite/capabilities/sync/ap/vendor_credits.ex`
5. `adapters/providers/netsuite/capabilities/push/vendor_credits.ex`
6. `adapters/providers/quickbooks/capabilities/sync/ap/vendor_credits.ex`
7. `adapters/providers/quickbooks/capabilities/push/vendor_credits.ex`
8. `adapters/providers/sage_intacct/capabilities/sync/ap/vendor_credits.ex`
9. `adapters/providers/sage_intacct/capabilities/push/vendor_credits.ex`
10. `adapters/providers/acumatica/capabilities/sync/ap/vendor_credits.ex`
11. `adapters/providers/acumatica/capabilities/push/vendor_credits.ex`

### Modified Files
1. `adapters/providers/netsuite/adapter.ex` — Add capabilities
2. `adapters/providers/quickbooks/adapter.ex` — Add capabilities
3. `adapters/providers/sage_intacct/adapter.ex` — Add capabilities
4. `adapters/providers/acumatica/adapter.ex` — Add capabilities
5. `domains/accounting.ex` — Add VendorCredit resource
6. `reactors/workspace_sync_reactor.ex` — Add to entity_order
7. `services/entity_sync_service.ex` — Add vendor_credits route
8. `services/reconciliation/vendor_credit_reconciliation_service.ex` — Fix mirror module

---

## Handoff Complete

**Status:** Ready for Engineering Subcommittee execution

**Directive:** Execute all phases in this session, keep session open after completion.

