# UI Enhancement Proposal: Vendor ERP Sync Status Visibility

**Session:** SC-2026-01-06-001  
**Date:** 2026-01-06  
**Status:** 📋 PROPOSED — Needs design discussion

---

## Problem Statement

When a card transaction is matched to a vendor, users cannot see whether that vendor exists in the ERP system. This creates uncertainty:

- Users don't know if the transaction will sync smoothly
- Users discover vendor issues only at sync time (too late)
- Users can't proactively fix vendor sync issues

---

## Current State

### Transaction View (Current)

```
┌───────────────────────────────────────────────────────────────────┐
│ STARBUCKS STORE #1234                    $15.00                   │
│                                                                   │
│ Vendor: Starbucks ✓                                               │
│                                                                   │
│ [Sync to NetSuite]                                               │
└───────────────────────────────────────────────────────────────────┘
```

**Problem:** User has no idea if "Starbucks" is:
- Synced from NetSuite (ready to push)
- Created locally and not yet in ERP (will be auto-created)
- An internal-only vendor that can't sync (will fail)

---

## Proposed Enhancement

### Transaction View (Enhanced)

**Scenario A: Vendor is ERP-linked (ready to sync)**

```
┌───────────────────────────────────────────────────────────────────┐
│ STARBUCKS STORE #1234                    $15.00                   │
│                                                                   │
│ Vendor: Starbucks Corporation                                     │
│         ✅ Synced to NetSuite                                      │
│                                                                   │
│ [Sync to NetSuite]                                               │
└───────────────────────────────────────────────────────────────────┘
```

**Scenario B: Vendor is internal-only (will be auto-created)**

```
┌───────────────────────────────────────────────────────────────────┐
│ JOE'S COFFEE SHOP #42                    $12.50                   │
│                                                                   │
│ Vendor: Joe's Coffee                                              │
│         ⚠️ Not in ERP — will be created on sync                   │
│                                                                   │
│ [Sync to NetSuite]  [Link to ERP Vendor ▼]                       │
└───────────────────────────────────────────────────────────────────┘
```

**Scenario C: Vendor is internal-only AND policy blocks auto-create**

```
┌───────────────────────────────────────────────────────────────────┐
│ ACME SUPPLIES INC                        $5,000.00                │
│                                                                   │
│ Vendor: ACME Supplies                                             │
│         ❌ Not in ERP — requires manual linking                    │
│                                                                   │
│ [Link to ERP Vendor ▼]                                           │
│                                                                   │
│ ⚠️ Amount exceeds auto-create threshold. Please link to an        │
│    existing ERP vendor before syncing.                            │
└───────────────────────────────────────────────────────────────────┘
```

**Scenario D: No ERP connection configured**

```
┌───────────────────────────────────────────────────────────────────┐
│ STARBUCKS STORE #1234                    $15.00                   │
│                                                                   │
│ Vendor: Starbucks ✓                                               │
│         (No ERP connected)                                        │
│                                                                   │
│ [Mark as Reviewed]                                               │
└───────────────────────────────────────────────────────────────────┘
```

---

## Data Requirements

To display vendor ERP status, the UI needs access to:

| Field | Source | Description |
|-------|--------|-------------|
| `vendor.erp_vendor_id` | Vendor wrapper | If set, vendor is ERP-linked |
| `erp_vendor.external_id` | ERP Vendor mirror | The ERP system's ID for this vendor |
| `erp_connection.provider` | ErpConnection | Which ERP (NetSuite, Intacct, etc.) |
| `vendor_policy` | VendorPolicy | Auto-create thresholds and rules |
| `transaction.amount` | Transaction | For policy threshold checks |

### Calculation: `erp_sync_status`

New calculation on Vendor resource (or service method):

```elixir
def erp_sync_status(vendor, erp_connection) do
  cond do
    is_nil(erp_connection) ->
      {:no_erp, "No ERP connected"}
    
    not is_nil(vendor.erp_vendor_id) ->
      {:synced, "Synced to #{erp_connection.provider}"}
    
    true ->
      {:not_synced, "Not in ERP"}
  end
end
```

### Calculation: `can_auto_create?`

Check if vendor can be auto-created based on policy:

```elixir
def can_auto_create?(vendor, amount, vendor_policy) do
  VendorPolicy.should_auto_create?(vendor_policy, amount)
end
```

---

## UI Components Needed

### 1. Vendor ERP Status Badge

A badge/tag showing ERP status:

| Status | Badge | Color |
|--------|-------|-------|
| Synced | `✅ Synced to NetSuite` | Green |
| Will auto-create | `⚠️ Not in ERP — will be created on sync` | Yellow/Orange |
| Blocked | `❌ Not in ERP — requires manual linking` | Red |
| No ERP | `(No ERP connected)` | Gray |

### 2. "Link to ERP Vendor" Dropdown

For internal-only vendors, allow user to link to an existing ERP vendor:

- Dropdown shows ERP vendors (from `ember_erp_accounting_vendors`)
- Search/filter by name
- On selection, calls `Vendor.link_erp_vendor` action

### 3. Inline Warning Message

When policy blocks auto-create, show explanation:

```
⚠️ Amount exceeds auto-create threshold ($1,000). 
   Please link to an existing ERP vendor before syncing.
```

---

## Affected Views

| View | File | Changes Needed |
|------|------|----------------|
| Transaction List | `transactions_live.ex` | Add vendor ERP status badge |
| Transaction Detail | (modal/sidebar) | Add status badge + link dropdown |
| Bulk Actions | (if applicable) | Consider bulk "link to vendor" action |
| Vendor Picker | (component) | Show ERP status in vendor dropdown |

---

## Implementation Approach

### Phase 1: Read-Only Status Display

1. Add `erp_sync_status` calculation to Vendor resource
2. Load this calculation in transaction queries
3. Display status badge in UI

### Phase 2: Link to ERP Vendor Action

1. Add "Link to ERP Vendor" dropdown component
2. Query ERP vendors for dropdown options
3. Call `link_erp_vendor` action on selection
4. Refresh transaction display

### Phase 3: Policy-Aware Messaging

1. Load VendorPolicy for entity/workspace
2. Calculate if auto-create is allowed for transaction amount
3. Display appropriate message based on policy

---

## Questions for Design Discussion

1. **Badge placement:** Inline with vendor name, or separate row?
2. **Link dropdown:** Always visible, or only when not synced?
3. **Policy messaging:** How much detail to show about policy rules?
4. **Bulk operations:** Should we support bulk "link to ERP vendor" for multiple transactions?
5. **Notification:** Should we proactively notify users of unsynced vendors?

---

## Related Code

| Component | Location |
|-----------|----------|
| Vendor wrapper | `ember_ap_vendors/resources/vendor/vendor.ex` |
| ERP Vendor mirror | `ember_erp/resources/accounting/parties/vendor.ex` |
| Link action | `ember_ap_vendors/resources/vendor/changes/link_to_erp.ex` |
| Transaction queries | `ember_expense_card/services/transaction_query_service.ex` |
| Transaction UI | `flame_teampay_payables_web/live/expense_v2/transactions_live.ex` |

---

*Proposal created by Sync Committee — SC-2026-01-06-001*

