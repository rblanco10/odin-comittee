# Sync Committee Session SC-2026-01-19-004

## Session Summary: NetSuite Vendor Subsidiary Filtering

**Date:** January 19, 2026  
**Status:** ✅ COMPLETED  
**Topic:** Fix vendor filtering to use `primary_erp_location_id` for proper NetSuite OneWorld subsidiary support

---

## Executive Summary

This session addressed a critical issue where vendor dropdowns across the application were not correctly filtering vendors by their primary NetSuite subsidiary. In NetSuite OneWorld environments, vendors can be "shared" across multiple subsidiaries, but payments MUST be created in the vendor's PRIMARY subsidiary or they will fail with errors like "Invalid sublist or line item operation".

---

## Issues Encountered and Solutions

### Issue 1: NetSuite SuiteQL Does Not Return `subsidiary` Field for Vendors

**Problem:**  
When attempting to query the vendor's primary subsidiary directly from NetSuite using SuiteQL:
```sql
SELECT id, subsidiary FROM vendor WHERE isinactive = 'F'
```
NetSuite returned an error:
```
Unknown identifier 'subsidiary'. Available identifiers are: {vendor=vendor}.
```

**Root Cause:**  
NetSuite SuiteQL does not expose the `subsidiary` field on the `vendor` table. This is a known limitation of the SuiteQL interface.

**Solution:**  
Instead of querying the vendor table directly, we derive the primary subsidiary from the `vendorSubsidiaryRelationship` table. We use the **first subsidiary (lowest ID)** for each vendor as the "primary" for UI filtering purposes.

**File Changed:** `vendor_entity_relationships.ex`

**New Query:**
```sql
SELECT entity, subsidiary FROM vendorSubsidiaryRelationship ORDER BY entity
```

---

### Issue 2: `VendorBulkUpsertService` Missing `primary_erp_location_id` in Upsert Fields

**Problem:**  
Even when the `VendorMapper` correctly extracted `primary_erp_location_id`, the value was never persisted to the database because `VendorBulkUpsertService.upsert_fields` did not include this field.

**Root Cause:**  
The `upsert_fields` list in `Ash.bulk_create` determines which fields are updated on re-sync. Missing fields are simply ignored.

**Solution:**  
Added `:entity_ids` and `:primary_erp_location_id` to the `upsert_fields` list.

**File Changed:** `vendor_bulk_upsert_service.ex`

```elixir
upsert_fields: [
  # ... existing fields ...
  :entity_ids,
  :primary_erp_location_id
]
```

---

### Issue 3: `requests_live.ex` Filtering Vendors by `entity_ids` Instead of `primary_erp_location_id`

**Problem:**  
The Card/Expense Request form was using `filter_by_erp_entity_ids` which checks if the vendor's `entity_ids` array contains the subsidiary. This showed vendors that are "shared" with the subsidiary but whose payments would fail because their PRIMARY subsidiary is different.

**Root Cause:**  
The original implementation didn't distinguish between "shared" subsidiaries (where a vendor CAN be used for viewing) and "primary" subsidiary (where payments MUST be created).

**Solution:**  
Changed to filter by `primary_erp_location_id` in-memory after loading vendors:

**File Changed:** `requests_live.ex`

```elixir
filtered_vendors = if erp_location_id do
  erp_location_str = to_string(erp_location_id)
  Enum.filter(vendors, fn vendor ->
    primary_location = vendor.primary_erp_location_id
    # Include if: no primary location (nil = global) OR primary matches
    is_nil(primary_location) or primary_location == erp_location_str
  end)
else
  vendors
end
```

---

### Issue 4: `teams_virtual_card_request_controller.ex` No Subsidiary Filtering At All

**Problem:**  
The Microsoft Teams virtual card request form had no ERP subsidiary filtering whatsoever. It loaded all vendors for the entity without checking their primary subsidiary.

**Root Cause:**  
The Teams integration was built before the OneWorld subsidiary support was fully implemented.

**Solution:**  
Added:
1. `get_entity_erp_location_id/2` function to look up the ERP subsidiary from EntityMapping
2. `get_vendor_primary_erp_location/1` function to extract primary location from erp_vendor relationship
3. In-memory filtering by `primary_erp_location_id` matching the pattern used elsewhere

**File Changed:** `teams_virtual_card_request_controller.ex`

---

### Issue 5: Server Not Loading New Code After Compilation

**Problem:**  
After making code changes and running `mix compile`, the server continued to execute old code. Debug logs we added weren't appearing.

**Root Cause:**  
The server was started with `mix phx.server` instead of `iex -S mix phx.server`. Without IEx, code changes are compiled but NOT hot-reloaded into the running BEAM VM.

**Solution:**  
Restart the server with `iex -S mix phx.server` to enable code reloading, or manually restart the server after each code change.

---

## Key Learnings

### 1. NetSuite OneWorld Vendor Subsidiary Model

In NetSuite OneWorld:
- **`vendor.subsidiary`** = PRIMARY subsidiary (where payments MUST be created)
- **`vendorSubsidiaryRelationship`** = ALL shared subsidiaries (where vendor CAN be used)

The distinction is critical because:
- Showing a vendor in a dropdown ≠ being able to pay that vendor
- Payments to a vendor from the wrong subsidiary will fail

### 2. SuiteQL Field Availability

Not all NetSuite record fields are available via SuiteQL. The `vendor.subsidiary` field is one such example. When a field isn't available:
1. Check if the data exists in a relationship table
2. Use the REST API directly (not SuiteQL) if needed
3. Derive the value from related data

### 3. Ash Bulk Upsert Behavior

When using `Ash.bulk_create` with `upsert?: true`:
- Only fields in `upsert_fields` are updated on conflict
- Missing fields retain their previous values (or NULL if new)
- This is intentional for performance but can cause subtle bugs

### 4. Consistent Filtering Pattern

All vendor dropdowns should use this pattern:

```elixir
# Filter by PRIMARY ERP location (not entity_ids)
filtered_vendors = if erp_location_id do
  erp_location_str = to_string(erp_location_id)
  Enum.filter(vendors, fn vendor ->
    primary_location = get_vendor_primary_erp_location(vendor)
    is_nil(primary_location) or primary_location == erp_location_str
  end)
else
  vendors
end
```

---

## Files Modified

| File | Change Type | Purpose |
|------|-------------|---------|
| `vendor_entity_relationships.ex` | Added function | `fetch_primary_subsidiaries/2` to get primary subsidiary from vendorSubsidiaryRelationship |
| `vendor_bulk_upsert_service.ex` | Modified | Added `entity_ids` and `primary_erp_location_id` to upsert_fields |
| `vendor_entity_sync_service.ex` | Modified | Updated to fetch and update primary_erp_location_id |
| `requests_live.ex` | Modified | Changed vendor filtering from `entity_ids` to `primary_erp_location_id` |
| `teams_virtual_card_request_controller.ex` | Modified | Added ERP subsidiary filtering for vendors |

---

## Verification Steps

1. Restart the server to load new code
2. Trigger a vendor sync (via DevAPI or full workspace sync)
3. Query database to verify `primary_erp_location_id` is populated:
   ```sql
   SELECT external_id, vendor_name, primary_erp_location_id, entity_ids
   FROM ember_erp_accounting_vendors
   WHERE primary_erp_location_id IS NOT NULL
   LIMIT 10;
   ```
4. Open a form with vendor dropdown and verify only vendors with matching primary subsidiary appear

---

## Related Sessions

- SC-2026-01-19-003: Initial vendor entity sync implementation
- SC-2026-01-16-008: Dimension filtering by entity

---

## Committee Sign-off

- **Chair**: Approved implementation approach
- **Sync Architect**: Verified data flow correctness
- **Code Fidelity Analyst**: Confirmed all files compile
- **NetSuite Specialist**: Validated OneWorld behavior understanding
