# Session SC-2026-01-06-001: Vendor/Merchant Matching Tables Review

**Date:** 2026-01-06  
**Status:** ✅ COMPLETED  
**Focus:** Vendor/Merchant Matching Tables Review — Which tables are used for matching and are they correct?

---

## Agenda (Human-Defined)

1. ✅ Discuss vendor flows — How merchants from transactions become vendors
2. ✅ Understand vendor tables — What each table represents in the data model
3. ✅ Verify matching target — Is the current matching logic using the correct table?

---

## Key Questions Discussed

### Question 1: Which tables store vendors?

**Answer:** Four key tables identified:

| Table | Resource | Purpose | DB Table |
|-------|----------|---------|----------|
| **ERP Vendor (Mirror)** | `EmberErp.Accounting.Parties.Vendor` | Canonical vendor data synced FROM ERP | `ember_erp_accounting_vendors` |
| **VendorDetail** | `EmberApVendors.VendorDetail` | Internal vendor data (CSV, manual, portal) | `ap_vendor_details` |
| **Vendor (Wrapper)** | `EmberApVendors.Vendor` | Business layer wrapper with workflow | `ap_vendors` |
| **MerchantVendorMapping** | `EmberExpenseCard.MerchantVendorMapping` | Learned merchant→vendor mappings | (separate table) |

### Question 2: Which table does merchant matching query?

**Answer:** `ap_vendors` (Vendor wrapper)

**Location:** `MerchantVendorMappingService.check_fuzzy_match/3`

```elixir
# From merchant_vendor_mapping_service.ex lines 436-443
defp check_fuzzy_match(workspace_id, entity_id, normalized_merchant_name) do
  case Vendor
       |> Ash.Query.filter(entity_id == ^entity_id and status == :active)
       |> Ash.Query.load([:effective_name])
       |> Ash.Query.limit(100)
       |> Ash.read(tenant: workspace_id, authorize?: false) do
```

**Confirmed correct:** The Vendor wrapper is the authoritative source for vendor identity per SC-2025-12-23-008.

### Question 3: Can a Vendor wrapper exist without an ERP link?

**Answer:** YES — by design.

Both `erp_vendor_id` and `vendor_detail_id` are optional attributes on the Vendor wrapper:

| Scenario | `erp_vendor_id` | `vendor_detail_id` | Source Type |
|----------|-----------------|-------------------|-------------|
| ERP-only vendor | ✅ Set | ❌ NULL | `:erp_sync` |
| Internal-only vendor | ❌ NULL | ✅ Set | `:csv_import`, `:manual`, `:portal_registration` |
| Both linked | ✅ Set | ✅ Set | VendorDetail pushed to ERP, then reconciled |

### Question 4: What happens when syncing a transaction with an internal-only vendor?

**Answer:** The push reactor handles it:

1. Checks if vendor has `erp_vendor_id` → If yes, get external_id from ERP mirror
2. If no `erp_vendor_id`, tries to find ERP Vendor by `vendor_number` (fallback)
3. If still not found, checks **Vendor Policy**:
   - If policy allows auto-create → Creates vendor in ERP first, then pushes transaction
   - If policy blocks → Returns error: "Vendor is not synced to ERP"

**Code location:** `push_card_spend_reactor.ex` lines 393-533

### Question 5: Should we match merchants only to ERP vendors (not internal-only)?

**Answer:** NO — The current design (match to Vendor wrapper) is correct.

**Reasoning:**

| Factor | Decision |
|--------|----------|
| Non-ERP customers | 🔴 Can't break them — wrapper matching required |
| Teampay-first workflow | 🔴 Core value prop — must support internal-only vendors |
| User experience | 🟡 Matching feels smart; no-match feels broken |
| Consistency | 🟡 Same merchant should match same vendor always |

**The real concern (visibility) is addressed separately — see UI Enhancement below.**

---

## Decisions Made

### Decision 1: Matching Target Confirmed ✅

**The Vendor wrapper (`ap_vendors`) is the correct matching target.**

The wrapper provides:
- Unified view of all vendor sources (ERP, CSV, manual, portal)
- `effective_name` calculation for consistent matching
- Status filtering (only match active vendors)
- Workspace + entity scoping

### Decision 2: Internal-Only Vendors Should Be Matched ✅

**Matching should include internal-only vendors (no ERP link).**

Reasons:
- ERP is optional — many customers don't have ERP
- Teampay-first workflow is a core value proposition
- Matching consistency across transactions
- Auto-create flow exists to handle ERP push when needed

### Decision 3: UI Enhancement Needed ⚠️

**The user's concern is valid — but it's a UI visibility problem, not a matching problem.**

Users should see whether a matched vendor is synced to ERP:

```
Current UI (insufficient):
  Vendor: Starbucks ✓

Enhanced UI (proposed):
  Vendor: Starbucks ✓
          ⚠️ Not in ERP — will be created on sync
```

See: `UI-ENHANCEMENT-PROPOSAL.md` for details.

---

## Architecture Diagrams

### Vendor Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VENDOR DATA MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐   ┌──────────────────────────────────┐│
│  │ ember_erp_accounting_vendors     │   │ ap_vendor_details                ││
│  │ (ERP Vendor Mirror)              │   │ (VendorDetail)                   ││
│  │                                  │   │                                  ││
│  │ • Synced FROM ERP (read-only)    │   │ • Created internally             ││
│  │ • vendor_name                    │   │ • vendor_name                    ││
│  │ • vendor_number                  │   │ • vendor_number                  ││
│  │ • external_id (ERP ID)           │   │ • Can be pushed TO ERP           ││
│  │ • entity_id (nullable)           │   │ • entity_id (required)           ││
│  └──────────────────┬───────────────┘   └───────────────┬──────────────────┘│
│                     │                                   │                   │
│                     │    ┌──────────────────────────────┘                   │
│                     │    │                                                  │
│                     ▼    ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐
│  │                    ap_vendors (Vendor Wrapper)                            │
│  │                                                                           │
│  │ • BUSINESS LAYER abstraction                                              │
│  │ • erp_vendor_id → ERP Vendor (optional)                                   │
│  │ • vendor_detail_id → VendorDetail (optional)                              │
│  │ • effective_name (calculated: ERP > Detail)                               │
│  │ • status (pending_approval → active → inactive → on_hold)                 │
│  │ • entity_id (REQUIRED)                                                    │
│  │ • workspace_id (REQUIRED)                                                 │
│  │                                                                           │
│  │ Source Priority: ERP Vendor > VendorDetail                                │
│  └──────────────────────────────────────────────────────────────────────────┘
│                                    ▲                                         │
│                                    │                                         │
│  ┌─────────────────────────────────┴─────────────────────────────────────────┐
│  │                  MerchantVendorMappingService                             │
│  │                                                                           │
│  │  Card Transaction → Merchant Name → resolve_vendor() → vendor_id          │
│  │                                                                           │
│  │  Fuzzy matching queries: ap_vendors (Vendor wrapper)                      │
│  │  ✅ Currently correct per SC-2026-01-05-VENDOR-MATCH                      │
│  │                                                                           │
│  └───────────────────────────────────────────────────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Vendor Wrapper States

```
┌─────────────────────────────────────────────────────────────────┐
│                    VENDOR WRAPPER STATES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State A: Internal-Only Vendor                                  │
│  ┌─────────────────────────┐                                    │
│  │ Vendor Wrapper          │                                    │
│  │ • erp_vendor_id: NULL   │──────► VendorDetail                │
│  │ • vendor_detail_id: ✓   │        (name, address, etc.)       │
│  │ • source_type: :manual  │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  State B: ERP-Only Vendor                                       │
│  ┌─────────────────────────┐                                    │
│  │ Vendor Wrapper          │                                    │
│  │ • erp_vendor_id: ✓      │──────► ERP Vendor Mirror           │
│  │ • vendor_detail_id: NULL│        (synced from NetSuite, etc.)│
│  │ • source_type: :erp_sync│                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  State C: Dual-Linked Vendor (after push & reconcile)           │
│  ┌─────────────────────────┐                                    │
│  │ Vendor Wrapper          │                                    │
│  │ • erp_vendor_id: ✓      │──────► ERP Vendor Mirror           │
│  │ • vendor_detail_id: ✓   │──────► VendorDetail                │
│  │ • source_type: :manual  │        (original internal data)    │
│  └─────────────────────────┘                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Known Issues / Deferred Items

| Gap ID | Description | Status | Notes |
|--------|-------------|--------|-------|
| GAP-VND-MATCH-003 | Entity scoping prevents workspace-wide vendors from matching | ⏸️ Deferred | Entity/Subsidiary mapping work in progress by another team |
| **NEW** | UI does not show ERP sync status for matched vendors | 📋 Documented | See `UI-ENHANCEMENT-PROPOSAL.md` |

---

## Files Referenced

| File | Purpose |
|------|---------|
| `ember_expense_card/services/merchant_vendor_mapping_service.ex` | Main matching service |
| `ember_ap_vendors/resources/vendor/vendor.ex` | Vendor wrapper resource |
| `ember_ap_vendors/resources/vendor_detail/vendor_detail.ex` | VendorDetail resource |
| `ember_erp/resources/accounting/parties/vendor.ex` | ERP Vendor mirror |
| `ember_erp/resources/reactors/ap/push_card_spend_reactor.ex` | Push flow with vendor handling |
| `ember_ap_vendors/integrations/erp/vendor_wrapper_service.ex` | Creates wrappers from ERP vendors |
| `ember_bridge/services/reconciliation/vendor_reconciliation_service.ex` | Links wrappers to ERP mirrors |

---

## Next Steps

1. **UI Team:** Review `UI-ENHANCEMENT-PROPOSAL.md` and implement vendor ERP status visibility
2. **No code changes needed** for matching — current design is correct

---

*Session closed by Scribe — SC-2026-01-06-001*

