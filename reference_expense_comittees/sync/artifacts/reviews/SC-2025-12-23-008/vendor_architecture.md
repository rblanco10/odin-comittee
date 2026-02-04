# Vendor Architecture Design Document

> **Session:** SC-2025-12-23-008  
> **Date:** 2025-12-23  
> **Status:** ✅ IMPLEMENTED  
> **Topic:** Vendor vs Merchant Investigation for Expense Domain + ERP Linking

---

## Executive Summary

The Sync Committee investigated how vendors and merchants are handled in the expense domain, specifically focusing on:
1. How users add vendors to card requests
2. Whether vendors are standalone resources or artifacts
3. How ERP vendor sync should link to product domain

**Key Finding:** Three gaps were identified in the vendor flow that prevent proper vendor linking and ERP integration.

**Approved Solution:** Implement the "Vendor Wrapper Pattern" with on-the-fly vendor creation.

---

## Architecture Overview

### The Vendor Wrapper Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VENDOR RESOURCE HIERARCHY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRODUCT DOMAIN (Always points to Wrapper)                                  │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  CardRequest ────────┐                                                      │
│  ExpenseCard ────────┼──► EmberApVendors.Vendor (wrapper)                  │
│  ExpenseCardTransaction ─┘      │                                           │
│  Invoice ────────────────────────│                                          │
│  MerchantVendorMapping ──────────┘                                          │
│                                  │                                          │
│                      ┌───────────┴───────────┐                             │
│                      ↓                       ↓                             │
│              ┌──────────────┐        ┌──────────────────────┐              │
│              │ VendorDetail │        │ EmberErp.Accounting. │              │
│              │  (internal)  │        │   Parties.Vendor     │              │
│              │              │        │   (ERP mirror)       │              │
│              └──────────────┘        └──────────────────────┘              │
│                      ↑                       ↑                             │
│                      │                       │                             │
│              Created locally          Synced from ERP                      │
│              (manual/CSV/form)        (NetSuite/Intacct/QB)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Product domain always references `EmberApVendors.Vendor` (wrapper)**
   - Never directly reference ERP mirror or VendorDetail
   - Wrapper provides stable ID that doesn't change

2. **Wrapper links to sources via optional FKs**
   - `erp_vendor_id` → ERP mirror (when synced from ERP)
   - `vendor_detail_id` → VendorDetail (when created locally)
   - Can have both, one, or neither

3. **Source types indicate origin**
   - `:erp_sync` - Created from ERP vendor sync
   - `:csv_import` - Created from CSV upload
   - `:manual` - Created manually by user (including card request form)
   - `:portal_registration` - Created from vendor self-registration

4. **ERP integration is additive, not destructive**
   - Vendor wrapper can exist without ERP connection
   - ERP link added later via sync or push
   - Product domain references unchanged

---

## Merchants vs Vendors

### Definitions

| Concept | Description | Storage |
|---------|-------------|---------|
| **Merchant** | Raw string from card network (e.g., "AMAZON.COM*1234567") | `CardTransaction.merchant_name` |
| **Vendor** | Structured resource representing a business entity | `EmberApVendors.Vendor` |
| **ERP Vendor** | Read-only mirror of vendor data from ERP | `EmberErp.Accounting.Parties.Vendor` |
| **VendorDetail** | Internal vendor data storage (no ERP) | `EmberApVendors.VendorDetail` |

### Data Flow

```
Card Network Transaction
    │
    ▼
CardTransaction.merchant_name = "AMAZON.COM*1234567"
    │
    ▼
MerchantVendorMappingService.resolve_vendor()
    │
    ├─► Card Vendor (if vendor-locked card)
    ├─► Exact Mapping (MerchantVendorMapping table)
    ├─► Pattern Mapping (regex/prefix)
    └─► Fuzzy Match (Jaro-Winkler similarity)
    │
    ▼
ExpenseCardTransaction.vendor_id → EmberApVendors.Vendor
```

---

## Gap Analysis

### Gap 1: Existing Vendor Selection Not Persisted

**Location:** `requests_live.ex`

**Problem:**
- User selects vendor from dropdown
- `vendor_id` stored as `:vendor` in attrs
- `:vendor` is dropped before creating CardRequest
- CardRequest expects `:vendor_id`, not `:vendor`
- Result: `CardRequest.vendor_id = nil`

**Impact:**
- Vendor-locked cards don't work
- No vendor propagation to ExpenseCard
- MerchantVendorMappingService can't use card vendor

**Fix:**
```elixir
# In requests_live.ex, modify attrs (around line 5903)
attrs = %{
  ...
  vendor_id: card_form.vendor_id,  # ADD: For CardRequest
  vendor: card_form.vendor_id || card_form.vendor,  # Keep for subject_data
  ...
}

# In create_and_submit_card_request (around line 5970)
# Keep vendor_id in card_request_attrs, only drop :vendor
card_request_attrs = Map.drop(attrs, [
  :department, :gl_code, :vendor,  # :vendor for subject_data
  :category, :class, :client_billable, :customer, :project
])
# Note: :vendor_id is NOT dropped - it goes to CardRequest
```

---

### Gap 2: Free-Form Vendor Just Becomes Text

**Location:** `requests_live.ex`

**Problem:**
- User types new vendor name (when no vendors exist)
- Stored in `CardRequest.justification` as text
- No `VendorDetail` created
- No `Vendor` wrapper created
- No link to ERP possible

**Impact:**
- Free-form vendors are ephemeral text
- Cannot be linked to ERP
- No vendor analytics possible

**Fix:**
Create `VendorDetail` + `Vendor` wrapper when user submits free-form vendor.

```elixir
# In requests_live.ex or SubmitCardRequestReactor
defp ensure_vendor_for_request(card_form, workspace_id, entity_id) do
  cond do
    # User selected existing vendor
    is_binary(card_form.vendor_id) and card_form.vendor_id != "" ->
      {:ok, card_form.vendor_id}

    # User typed new vendor name
    is_binary(card_form.vendor) and card_form.vendor != "" ->
      create_vendor_from_name(card_form.vendor, workspace_id, entity_id)

    # No vendor specified
    true ->
      {:ok, nil}
  end
end

defp create_vendor_from_name(vendor_name, workspace_id, entity_id) do
  # 1. Create VendorDetail
  {:ok, vendor_detail} = VendorDetail
    |> Ash.Changeset.for_create(:create, %{
      workspace_id: workspace_id,
      entity_id: entity_id,
      vendor_name: vendor_name,
      vendor_number: generate_vendor_number(entity_id),
      status: :active
    })
    |> Ash.create(authorize?: false, tenant: entity_id)

  # 2. Create Vendor wrapper
  {:ok, vendor} = Vendor
    |> Ash.Changeset.for_create(:create_manual, %{
      workspace_id: workspace_id,
      entity_id: entity_id,
      vendor_detail_id: vendor_detail.id,
      source_type: :manual
    })
    |> Ash.create(authorize?: false, tenant: entity_id)

  {:ok, vendor.id}
end
```

---

### Gap 3: No "Allow Custom" Combobox

**Location:** `requests_live.ex` (template around line 2785)

**Problem:**
- If vendors exist: dropdown only (can't type new)
- If no vendors exist: text input only
- Users with existing vendors can't add new ones

**Current UI:**
```heex
<%= if length(@vendor_options) > 0 do %>
  <%!-- Dropdown ONLY --%>
  <.custom_select name="card_form[vendor_id]" ... />
<% else %>
  <%!-- Text input ONLY --%>
  <input type="text" name="card_form[vendor]" ... />
<% end %>
```

**Fix:**
Implement combobox pattern that allows selection OR free-form entry.

```heex
<%!-- Always show combobox with "Add new..." option --%>
<.combobox
  id="card-form-vendor"
  name="card_form[vendor_id]"
  text_name="card_form[vendor]"
  options={@vendor_options}
  selected={@card_form[:vendor_id]}
  text_value={@card_form[:vendor]}
  allow_custom={true}
  placeholder="Select or type vendor name..."
/>
```

Or simpler approach with dropdown + "Other" option:
```heex
<.custom_select
  name="card_form[vendor_id]"
  options={[{"", "Select vendor..."}, {"__new__", "➕ Add new vendor..."} | vendor_options]}
  selected={@card_form[:vendor_id]}
/>
<%= if @card_form[:vendor_id] == "__new__" do %>
  <input type="text" name="card_form[vendor]" placeholder="Enter vendor name..." />
<% end %>
```

---

## ERP Sync Flow

### Scenario A: Vendor Created Locally First

```
1. User creates card request, types "Amazon"
   └─► VendorDetail created (source: :manual)
   └─► Vendor wrapper created (vendor_detail_id: X)
   └─► CardRequest.vendor_id = Vendor.id

2. ERP connected, finance pushes vendor to ERP
   └─► VendorDetail → Push → NetSuite Vendor (external_id: "12345")

3. Sync pulls vendor back
   └─► EmberErp.Accounting.Parties.Vendor (external_id: "12345")

4. Reconciliation links wrapper
   └─► Vendor.erp_vendor_id = ERP Vendor.id

✅ Product domain unchanged! CardRequest still points to same Vendor wrapper.
```

### Scenario B: Vendor Synced from ERP First

```
1. ERP sync pulls vendors
   └─► EmberErp.Accounting.Parties.Vendor created
   └─► VendorWrapperService.wrap_erp_vendor()
   └─► Vendor wrapper created (erp_vendor_id: X)

2. User creates card request, selects from dropdown
   └─► CardRequest.vendor_id = Vendor.id (already exists)

✅ Vendor already has ERP link from the start.
```

---

## Reconciliation Updates

### VendorReconciliationService Enhancements

Current service only links `PushRequest → ERP Vendor`.

With Gap 2 fix, also link `Vendor wrapper → ERP Vendor`:

```elixir
defp link_source_to_mirror(push_request, erp_vendor_mirror, workspace_id) do
  # Find the Vendor wrapper that initiated this push
  case find_vendor_wrapper_by_vendor_detail(push_request.source_resource_id, workspace_id) do
    {:ok, vendor_wrapper} ->
      # Link wrapper to ERP mirror
      Vendor.link_to_erp(vendor_wrapper, %{
        erp_vendor_id: erp_vendor_mirror.id
      }, tenant: workspace_id, authorize?: false)

    {:error, _} ->
      {:ok, :no_wrapper}  # Vendor was pushed directly, not via wrapper
  end
end
```

---

## Implementation Plan

### Phase 1: Gap 1 Fix (Immediate)
- Modify `requests_live.ex` to pass `vendor_id` to CardRequest
- Verify propagation to ExpenseCard
- Test vendor-locked card behavior

### Phase 2: Gap 2 Fix (VendorDetail Creation)
- Create service for on-the-fly vendor creation
- Integrate into SubmitCardRequestReactor or requests_live.ex
- Add vendor number generation

### Phase 3: Gap 3 Fix (Combobox UI)
- Implement combobox or "Add new" pattern
- Handle both selection and free-form in same control
- Update form handling to distinguish modes

### Phase 4: Reconciliation Enhancement
- Update VendorReconciliationService
- Link Vendor wrapper to ERP mirror after push
- Add tests for reconciliation flow

---

## Files to Modify

| File | Changes |
|------|---------|
| `requests_live.ex` | Gap 1, 2, 3: Form handling, vendor creation, UI |
| `VendorDetail` | Gap 2: May need `:create_minimal` action |
| `Vendor` | Gap 2: May need `:create_manual` action |
| `VendorReconciliationService` | Gap 4: Link wrapper to ERP |
| `SubmitCardRequestReactor` | Gap 2: Alternative location for vendor creation |

---

## Testing Checklist

- [ ] User selects existing vendor → CardRequest.vendor_id populated
- [ ] CardRequest approved → ExpenseCard.vendor_id inherited
- [ ] Vendor-locked card → Transactions auto-assigned vendor
- [ ] User types new vendor → VendorDetail + Vendor created
- [ ] New vendor → CardRequest.vendor_id points to wrapper
- [ ] Vendor pushed to ERP → Sync pulls back → Wrapper linked
- [ ] Combobox shows existing vendors + allows new entry

---

*Document prepared by Sync Committee Scribe*  
*Session: SC-2025-12-23-008*

