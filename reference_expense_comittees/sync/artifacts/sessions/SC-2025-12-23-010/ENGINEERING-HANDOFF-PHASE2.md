# Engineering Handoff: Phase 2 - Matrix Gap Resolution

**Session:** SC-2025-12-23-010  
**Date:** 2025-12-24  
**Phase:** Matrix Compliance Implementation  
**Status:** READY FOR ENGINEERING

---

## Executive Summary

Following the comprehensive ERP Object Mapping Matrix audit, the committee identified three actionable gaps that require implementation to achieve matrix compliance. This document provides the engineering specification for resolving these gaps.

---

## Gap Specifications

### GAP G-9: Expense Report Payment (P1 - HIGH)

#### Problem Statement
The ERP Object Mapping Matrix specifies that Reimbursement Payments should be pushed to ERPs as:
- **NetSuite:** Expense Report Payment
- **Sage Intacct:** Expense Payment (Cash Mgmt)
- **Acumatica:** Worker Payment
- **QuickBooks:** Embedded in Expense/Check (already handled via Bills)

Currently, there is **no reactor, no push capabilities, and no mirror resource** for expense report payments.

#### Matrix Requirements
| Provider | ERP Object | Direction | Timing |
|----------|-----------|-----------|--------|
| NetSuite | Expense Report Payment | TP → ERP | On payout |
| Sage Intacct | Expense Payment (Cash Mgmt) | TP → ERP | On payout |
| Acumatica | Worker Payment | TP → ERP | On payout |

#### Implementation Plan

##### 1. Mirror Resource: `Accounting.Expense.ExpenseReportPayment`

```elixir
# Location: lib/flame_teampay_payables/ember_erp/resources/accounting/expense/expense_report_payment.ex

defmodule FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReportPayment do
  use Ash.Resource,
    otp_app: :flame_teampay_payables,
    domain: FlameTeampayPayables.EmberErp,
    data_layer: AshPostgres.DataLayer,
    extensions: [AshOban]

  @moduledoc """
  Mirrors Expense Report Payment records from ERPs.
  
  Maps to:
  - NetSuite: Expense Report Payment
  - Sage Intacct: Expense Payment (Cash Management)
  - Acumatica: Worker Payment (Paycheck)
  """

  attributes do
    uuid_primary_key :id
    
    # Multi-tenancy
    attribute :workspace_id, :uuid, allow_nil?: false
    attribute :entity_id, :uuid, allow_nil?: false
    attribute :erp_connection_id, :uuid, allow_nil?: false
    
    # ERP identification
    attribute :external_id, :string, allow_nil?: false
    attribute :erp_system, :atom, constraints: [one_of: [:netsuite, :sage_intacct, :acumatica]]
    
    # Payment details
    attribute :payment_number, :string
    attribute :payment_date, :date, allow_nil?: false
    attribute :employee_id, :string  # External ID of employee
    attribute :expense_report_id, :string  # External ID of expense report being paid
    attribute :total_amount, :decimal, allow_nil?: false
    attribute :currency_code, :string, default: "USD"
    attribute :payment_method, :string  # Check, ACH, Wire, etc.
    attribute :bank_account_id, :string  # External ID of bank account
    attribute :check_number, :string
    attribute :status, :atom, constraints: [one_of: [:pending, :approved, :paid, :voided]]
    
    # Memo/notes
    attribute :memo, :string
    
    # Sync metadata
    attribute :erp_metadata, :map, default: %{}
    attribute :last_synced_at, :utc_datetime_usec
    attribute :sync_version, :integer, default: 1
    
    # Bridge tracking
    attribute :bridged_at, :utc_datetime_usec
    attribute :origin_push_request_id, :uuid
    
    timestamps()
  end

  identities do
    identity :unique_erp_payment, [:workspace_id, :erp_connection_id, :external_id]
  end

  postgres do
    table "ember_erp_expense_report_payments"
    repo FlameTeampayPayables.Repo

    custom_indexes do
      index [:workspace_id, :erp_connection_id]
      index [:expense_report_id]
      index [:employee_id]
      index [:payment_date]
    end
  end

  multitenancy do
    strategy :attribute
    attribute :workspace_id
  end
end
```

##### 2. Push Capabilities

**NetSuite - Expense Report Payment:**
```elixir
# Location: adapters/providers/netsuite/capabilities/push/expense_report_payments.ex

defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Capabilities.Push.ExpenseReportPayments do
  @moduledoc """
  Push Expense Report Payments to NetSuite.
  
  NetSuite Expense Report Payment:
  - Record type: expensereportpayment
  - Links to expense report via `expensereport` field
  - Payment method via `paymentmethod`
  - Bank account via `account`
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Capabilities.Push.Behavior
  
  @impl true
  def push(config, data, opts \\ []) do
    # Build SuiteQL or REST payload for expense report payment
    # POST to /record/v1/expensereportpayment
  end
  
  @impl true
  def update(config, external_id, data, opts \\ []) do
    # PATCH to /record/v1/expensereportpayment/{id}
  end
  
  @impl true
  def delete(config, external_id) do
    # DELETE /record/v1/expensereportpayment/{id}
  end
end
```

**Sage Intacct - Expense Payment (Cash Management):**
```elixir
# Location: adapters/providers/sage_intacct/capabilities/push/expense_payments.ex

defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.SageIntacct.Capabilities.Push.ExpensePayments do
  @moduledoc """
  Push Expense Payments to Sage Intacct via Cash Management module.
  
  Intacct uses the Cash Management module for expense payments:
  - Function: create_cmpayment (Cash Management Payment)
  - Links to expense report via RECORDKEY
  - Payment method via PAYMENTMETHOD
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Capabilities.Push.Behavior
  
  @impl true
  def push(config, data, opts \\ []) do
    # Build XML payload for <create><CMPAYMENT>...</CMPAYMENT></create>
  end
end
```

**Acumatica - Worker Payment:**
```elixir
# Location: adapters/providers/acumatica/capabilities/push/worker_payments.ex

defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Capabilities.Push.WorkerPayments do
  @moduledoc """
  Push Worker Payments to Acumatica.
  
  Acumatica uses the Payroll module for worker payments:
  - Endpoint: /entity/Default/24.200.001/Paycheck
  - Links to expense claim via reference
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Capabilities.Push.Behavior
  
  @impl true
  def push(config, data, opts \\ []) do
    # POST to Paycheck endpoint
  end
end
```

##### 3. Reactor: `PushExpenseReportPaymentReactor`

```elixir
# Location: resources/reactors/expense/push_expense_report_payment_reactor.ex

defmodule FlameTeampayPayables.EmberErp.Resources.Reactors.Expense.PushExpenseReportPaymentReactor do
  @moduledoc """
  Reactor for pushing expense report payments to ERPs.
  
  Handles:
  - NetSuite: Expense Report Payment
  - Sage Intacct: Cash Management Payment
  - Acumatica: Worker Payment
  """
  
  use Reactor, extensions: [Ash.Reactor]
  
  input :workspace_id
  input :entity_id
  input :expense_report_payment_data
  input :erp_connection_id
  
  # Steps: resolve_adapter, push_to_erp, create_mirror, handle_errors
end
```

##### 4. Registry Updates

```elixir
# In reactor_registry.ex, add:
register(:expense_report_payment,
  FlameTeampayPayables.EmberErp.Resources.Reactors.Expense.PushExpenseReportPaymentReactor)
```

##### 5. Adapter Updates

Each adapter needs:
- Add `:expense_report_payment` to `push:` capabilities list
- Add `def push_expense_report_payment(config, data, opts)` dispatch function
- Add `def delete_expense_report_payment(config, external_id)` function

---

### GAP G-7: Sage Intacct push_vendor (P2 - MEDIUM)

#### Problem Statement
The matrix specifies vendors should be auto-created from Teampay to ERPs. Currently, Sage Intacct's `push_vendor` function is a stub that returns an error.

**Current Implementation:**
```elixir
# sage_intacct/adapter.ex:174
def push_vendor(_config, _data, _opts) do
  {:error, "Vendor push to Sage Intacct is not yet implemented"}
end
```

#### Implementation Plan

##### 1. Create Push Capability

```elixir
# Location: adapters/providers/sage_intacct/capabilities/push/vendors.ex

defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.SageIntacct.Capabilities.Push.Vendors do
  @moduledoc """
  Push Vendors to Sage Intacct.
  
  Creates vendors using the <create><VENDOR>...</VENDOR></create> API.
  
  Required fields:
  - VENDORID: Vendor ID (auto-generated or provided)
  - NAME: Vendor name
  
  Optional fields:
  - DISPLAYCONTACT: Contact info
  - STATUS: active/inactive
  - TAXID: Tax identification number
  - ONETIME: One-time vendor flag
  - PAYMENTPRIORITY: Payment priority
  - TERMNAME: Payment terms
  - CURRENCY: Default currency
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Capabilities.Push.Behavior
  
  require Logger
  
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.SageIntacct.{
    Client,
    XmlBuilder
  }
  
  @impl true
  def push(config, data, opts \\ []) do
    Logger.info("Pushing vendor to Sage Intacct", vendor_name: data[:name])
    
    xml_payload = build_create_vendor_xml(data, opts)
    
    case Client.execute(config, xml_payload) do
      {:ok, response} ->
        external_id = extract_vendor_id(response)
        {:ok, %{external_id: external_id, status: :success, erp_response: response}}
        
      {:error, reason} ->
        Logger.error("Failed to push vendor to Sage Intacct", error: reason)
        {:error, reason}
    end
  end
  
  @impl true
  def update(config, external_id, data, opts \\ []) do
    xml_payload = build_update_vendor_xml(external_id, data, opts)
    Client.execute(config, xml_payload)
  end
  
  @impl true
  def delete(config, external_id) do
    xml_payload = build_delete_vendor_xml(external_id)
    Client.execute(config, xml_payload)
  end
  
  defp build_create_vendor_xml(data, _opts) do
    """
    <create>
      <VENDOR>
        <NAME>#{escape_xml(data[:name])}</NAME>
        #{if data[:vendor_id], do: "<VENDORID>#{data[:vendor_id]}</VENDORID>", else: ""}
        #{if data[:status], do: "<STATUS>#{data[:status]}</STATUS>", else: "<STATUS>active</STATUS>"}
        #{build_contact_xml(data)}
        #{if data[:tax_id], do: "<TAXID>#{data[:tax_id]}</TAXID>", else: ""}
        #{if data[:currency], do: "<CURRENCY>#{data[:currency]}</CURRENCY>", else: ""}
      </VENDOR>
    </create>
    """
  end
  
  defp build_contact_xml(data) do
    if data[:email] || data[:phone] do
      """
      <DISPLAYCONTACT>
        #{if data[:email], do: "<EMAIL1>#{data[:email]}</EMAIL1>", else: ""}
        #{if data[:phone], do: "<PHONE1>#{data[:phone]}</PHONE1>", else: ""}
      </DISPLAYCONTACT>
      """
    else
      ""
    end
  end
  
  defp escape_xml(nil), do: ""
  defp escape_xml(text), do: text |> to_string() |> String.replace("&", "&amp;") |> String.replace("<", "&lt;")
  
  defp extract_vendor_id(response) do
    # Parse XML response to extract VENDORID
    response["VENDORID"] || response["key"] || "unknown"
  end
end
```

##### 2. Update Adapter

```elixir
# In sage_intacct/adapter.ex, replace the stub:

# OLD:
def push_vendor(_config, _data, _opts) do
  {:error, "Vendor push to Sage Intacct is not yet implemented"}
end

# NEW:
def push_vendor(config, data, opts), do: Push.Vendors.push(config, data, opts)
def delete_vendor(config, external_id), do: Push.Vendors.delete(config, external_id)
```

##### 3. Add to Capabilities

```elixir
# In capabilities/0, add :vendor to push list:
push: [
  :bill, :bill_line_item, :ap_payment, :ap_payment_application, :vendor_credit,
  :expense_report, :expense_line_item,
  :vendor  # ADD THIS
],
```

---

### GAP G-8: Acumatica push_vendor (P2 - MEDIUM)

#### Problem Statement
The matrix specifies vendors should be auto-created from Teampay to ERPs. Currently, Acumatica has **no** `push_vendor` capability at all.

#### Implementation Plan

##### 1. Create Push Capability

```elixir
# Location: adapters/providers/acumatica/capabilities/push/vendors.ex

defmodule FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.Capabilities.Push.Vendors do
  @moduledoc """
  Push Vendors to Acumatica.
  
  Creates vendors using the REST API:
  - Endpoint: PUT /entity/Default/{version}/Vendor
  
  Required fields:
  - VendorID: Vendor identifier
  - VendorName: Display name
  
  Optional fields:
  - Status: Active/Inactive
  - VendorClass: Classification
  - Terms: Payment terms
  - CurrencyID: Default currency
  - PaymentMethod: Default payment method
  """
  
  @behaviour FlameTeampayPayables.EmberErp.Capabilities.Push.Behavior
  
  require Logger
  
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.Acumatica.{
    Client,
    JsonBuilder
  }
  
  @impl true
  def push(config, data, opts \\ []) do
    Logger.info("Pushing vendor to Acumatica", vendor_name: data[:name])
    
    payload = build_vendor_payload(data, opts)
    
    case Client.put(config, "Vendor", payload) do
      {:ok, response} ->
        external_id = response["VendorID"]["value"] || response["id"]
        {:ok, %{external_id: external_id, status: :success, erp_response: response}}
        
      {:error, reason} ->
        Logger.error("Failed to push vendor to Acumatica", error: reason)
        {:error, reason}
    end
  end
  
  @impl true
  def update(config, external_id, data, opts \\ []) do
    payload = build_vendor_payload(data, opts)
    |> Map.put("VendorID", %{"value" => external_id})
    
    Client.put(config, "Vendor", payload)
  end
  
  @impl true
  def delete(config, external_id) do
    Client.delete(config, "Vendor/#{external_id}")
  end
  
  defp build_vendor_payload(data, _opts) do
    %{
      "VendorName" => %{"value" => data[:name]},
      "Status" => %{"value" => data[:status] || "Active"}
    }
    |> maybe_add("VendorID", data[:vendor_id])
    |> maybe_add("VendorClass", data[:vendor_class])
    |> maybe_add("Terms", data[:payment_terms])
    |> maybe_add("CurrencyID", data[:currency])
    |> maybe_add("PaymentMethod", data[:payment_method])
    |> maybe_add_contact(data)
  end
  
  defp maybe_add(map, _key, nil), do: map
  defp maybe_add(map, key, value), do: Map.put(map, key, %{"value" => value})
  
  defp maybe_add_contact(map, data) do
    if data[:email] || data[:phone] do
      contact = %{}
      |> maybe_add("Email", data[:email])
      |> maybe_add("Phone1", data[:phone])
      
      Map.put(map, "MainContact", contact)
    else
      map
    end
  end
end
```

##### 2. Update Adapter

```elixir
# In acumatica/adapter.ex, add:

def push_vendor(config, data, opts), do: Push.Vendors.push(config, data, opts)
def delete_vendor(config, external_id), do: Push.Vendors.delete(config, external_id)
```

##### 3. Add to Capabilities

```elixir
# In capabilities/0, add :vendor to push list:
push: [
  :bill, :bill_line_item, :ap_payment, :ap_payment_application, :vendor_credit,
  :expense_report, :expense_line_item,
  :vendor  # ADD THIS
],
```

---

## Implementation Checklist

### Phase 2A: Vendor Push Capabilities (G-7, G-8)
- [ ] Create `sage_intacct/capabilities/push/vendors.ex`
- [ ] Update `sage_intacct/adapter.ex` - replace stub with real implementation
- [ ] Add `:vendor` to Sage Intacct push capabilities
- [ ] Create `acumatica/capabilities/push/vendors.ex`
- [ ] Update `acumatica/adapter.ex` - add push_vendor function
- [ ] Add `:vendor` to Acumatica push capabilities
- [ ] Verify compilation

### Phase 2B: Expense Report Payment (G-9)
- [ ] Create `resources/accounting/expense/expense_report_payment.ex` mirror resource
- [ ] Register resource in `domain.ex`
- [ ] Run `mix ash.codegen` for migration
- [ ] Create `netsuite/capabilities/push/expense_report_payments.ex`
- [ ] Create `sage_intacct/capabilities/push/expense_payments.ex`
- [ ] Create `acumatica/capabilities/push/worker_payments.ex`
- [ ] Update all three adapters with new capabilities
- [ ] Create `PushExpenseReportPaymentReactor`
- [ ] Register `:expense_report_payment` in ReactorRegistry
- [ ] Verify compilation

---

## Estimated Effort

| Task | Complexity | Time Estimate |
|------|------------|---------------|
| G-7: Sage Intacct push_vendor | Low | 15 min |
| G-8: Acumatica push_vendor | Low | 15 min |
| G-9: ExpenseReportPayment resource | Medium | 20 min |
| G-9: NetSuite push capability | Medium | 20 min |
| G-9: Sage Intacct push capability | Medium | 20 min |
| G-9: Acumatica push capability | Medium | 20 min |
| G-9: Reactor | Medium | 15 min |
| G-9: Registry + Adapter updates | Low | 10 min |
| **Total** | | **~2.25 hours** |

---

## Success Criteria

1. ✅ `mix compile` succeeds with no errors
2. ✅ All adapters have `push_vendor` capability
3. ✅ ExpenseReportPayment resource exists and migrated
4. ✅ ReactorRegistry has `:expense_report_payment` registered
5. ✅ All three ERPs have expense payment push capabilities

---

## Handoff Complete

**Committee Chair:** Approved for engineering execution  
**Priority:** P1/P2 gaps - execute in session  
**Constraint:** Keep session open after completion

