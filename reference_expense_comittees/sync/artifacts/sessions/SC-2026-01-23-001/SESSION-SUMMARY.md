# Session Summary: SC-2026-01-23-001

> **Topic:** Vendor Wrapper Denormalization — Add `display_name` to `ap_vendors`  
> **Date:** 2026-01-23  
> **Status:** ✅ COMPLETE  
> **Decision:** DEC-2026-002

---

## Problem Statement

The Vendor Wrapper (`ap_vendors`) did not store the vendor name directly. Instead, it required loading nested relationships (`erp_vendor.vendor_name` or `vendor_detail.vendor_name`) to display the name. This caused:

1. **N+1 Query Issues** — The `effective_name` calculation did individual `Ash.get` calls per vendor
2. **Policy Complexity** — Must authorize access to `ErpVendor` and `VendorDetail` just to show a name
3. **Performance Degradation** — Identified as PERF-OPT-009 in prior sessions
4. **Authorization Failures** — Requestors/approvers couldn't see vendor names due to missing policies

---

## Committee Members Consulted

| Member | Role | Finding |
|--------|------|---------|
| Precedent Keeper | Check prior decisions | ✅ No conflict with SC-2025-12-23-008 |
| Sync Architect | Architecture impact | ✅ Architecturally sound with update hooks |
| Accounts Payable Expert | Business domain | ✅ Strong business case for usability |
| Edge Case Hunter | Risk analysis | ✅ Manageable risks with proper fallbacks |

---

## Decision: DEC-2026-002

**APPROVED:** Add `display_name` attribute to `ap_vendors` (Vendor Wrapper)

### Specification

| Attribute | Value |
|-----------|-------|
| **Name** | `display_name` |
| **Type** | `:string` (text in Postgres) |
| **Nullable** | Yes |
| **Max Length** | 500 characters |
| **Populated From** | ERP Vendor > VendorDetail > vendor_number (priority order) |

### Update Points

1. **On wrapper creation** — From source (ERP or VendorDetail)
2. **On ERP vendor sync** — When name changes
3. **On VendorDetail update** — When name changes
4. **On link_erp_vendor** — Updates to ERP vendor's name

---

## Implementation Summary

### Files Modified

#### Schema Changes
| File | Change |
|------|--------|
| `vendor.ex` | Added `display_name` attribute |
| Migration `20260124004321` | Added `display_name` column to `ap_vendors` |

#### Create Actions
| File | Change |
|------|--------|
| `create_from_erp.ex` | Populates `display_name` from `erp_vendor.vendor_name` |
| `create_manual.ex` | Populates `display_name` from `vendor_detail.vendor_name` |
| `create_from_csv.ex` | Populates `display_name` from `vendor_detail.vendor_name` |
| `link_to_erp.ex` | Updates `display_name` when linking to ERP |

#### Policy Updates
| File | Change |
|------|--------|
| `vendor.ex` | Added read policies for finance, approver, requester roles |
| `ember_erp/.../vendor.ex` | Added read policies for finance, approver, requester roles |

#### UI Updates
| File | Change |
|------|--------|
| `receipts_live.ex` | Simplified `get_resolved_vendor_name` to use `display_name` |
| `receipts_live.ex` | Updated vendor dropdown to use `display_name` |
| `receipt_detail_live.ex` | Simplified `get_vendor_name_from_expense_receipt` |
| `receipt_detail_live.ex` | Updated vendor dropdown to use `display_name` |
| `expense_receipt.ex` | Simplified `list_for_display` load to just `:vendor` |

---

## Benefits Achieved

1. **Eliminated N+1 queries** — No more `Ash.get` per vendor for name resolution
2. **Simplified authorization** — No need to authorize nested `ErpVendor` access for display
3. **Better performance** — Single attribute access instead of nested relationship traversal
4. **Consistent vendor names** — All UI now uses the same `display_name` field

---

## Backfill Note

Backfill was explicitly **out of scope** per stakeholder direction.

Existing vendors will have `NULL` display_name until:
- Re-synced from ERP
- VendorDetail is updated
- Manual backfill is run

For `NULL` display_name, UI falls back to `vendor_number`.

---

## Related Prior Sessions

| Session | Relationship |
|---------|--------------|
| SC-2025-12-23-008 | Original Vendor Wrapper Pattern decision |
| SC-2026-01-06-005 | `normalized_name` column precedent |
| PERF-OPT-009 | Original N+1 identification |

---

## Test Checklist

- [ ] Create vendor via ERP sync → `display_name` populated
- [ ] Create vendor via VendorDetail → `display_name` populated
- [ ] Link existing wrapper to ERP → `display_name` updated
- [ ] Receipts list shows vendor name (not vendor_number)
- [ ] Requestor role can see vendor names
- [ ] Approver role can see vendor names
- [ ] Vendor dropdown shows proper names

---

*Session conducted by Sync Committee*  
*Scribe: Documented 2026-01-23*
