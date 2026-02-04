# NetSuite Date Precision Quirk

**Discovered**: 2024-12-21  
**Severity**: High - Affects incremental sync correctness  
**Status**: Documented, fix pending

## The Problem

NetSuite's SuiteQL has **DATE-only precision** for `lastmodifieddate` filtering. It does NOT support datetime precision.

### Verified Facts

| Aspect | Finding |
|--------|---------|
| **SENDING** - ISO8601 with time (`2025-12-21T12:00:00Z`) | ❌ REJECTED by NetSuite |
| **SENDING** - M/D/YYYY date only (`12/21/2025`) | ✅ ACCEPTED |
| **RECEIVING** - `lastmodifieddate` format | `D/M/YYYY` (e.g., "18/12/2025") |
| **RECEIVING** - Contains time? | ❌ NO - date only |

### Test Evidence

```sql
-- FAILS with "Invalid or unsupported search"
SELECT id FROM vendor WHERE lastmodifieddate > '2025-12-21T20:54:43Z' ORDER BY lastmodifieddate

-- WORKS
SELECT id FROM vendor WHERE lastmodifieddate > '1/1/2020' ORDER BY lastmodifieddate
```

**Additional quirk**: NetSuite requires `ORDER BY` clause when using date comparisons, otherwise query fails.

## Impact on Incremental Sync

### With `>` (greater than) operator:

| Sync # | Time | Cursor | Records Fetched |
|--------|------|--------|-----------------|
| 1st sync (8am) | 8:00am | None | All records |
| 2nd sync (8:05am) | 8:05am | `> '12/21/2025'` | **NOTHING** |
| 3rd sync (8:10am) | 8:10am | `> '12/21/2025'` | **NOTHING** |
| Next day (8am) | 8:00am | `> '12/21/2025'` | All Dec 22 records |

**Problem**: Same-day changes are invisible to incremental syncs.

### With `>=` (greater than or equal) operator:

| Sync # | Time | Cursor | Records Fetched |
|--------|------|--------|-----------------|
| 1st sync (8am) | 8:00am | None | All records |
| 2nd sync (8:05am) | 8:05am | `>= '12/21/2025'` | All Dec 21 records (re-sync) |
| 3rd sync (8:10am) | 8:10am | `>= '12/21/2025'` | All Dec 21 records (re-sync) |
| Next day (8am) | 8:00am | `>= '12/21/2025'` | All Dec 21 + Dec 22 records |

**Trade-off**: Re-syncs same-day records on every run, but never misses changes.

## Recommended Solution

### 1. Use `>=` operator for queries
Ensures no records are missed, even with same-day multiple syncs.

### 2. Convert DateTime to M/D/YYYY format
```elixir
# Before (BROKEN)
defp format_date(%DateTime{} = dt), do: DateTime.to_iso8601(dt)

# After (WORKS)
defp format_date(%DateTime{} = dt), do: "#{dt.month}/#{dt.day}/#{dt.year}"
```

### 3. Blindly upsert
Since we can't detect actual changes from NetSuite's date-only precision:
- Let database handle duplicates via upsert
- Update `last_synced_at` on every touch
- Don't trigger change events on re-sync (only on actual field changes)

### 4. No downstream change detection needed (for now)
Reference data sync (vendors, customers, GL accounts) doesn't need "this record actually changed" events. If needed later, add hash comparison.

## Files Requiring Changes

All NetSuite capability files with `format_date` function:

```
lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/sync/
├── core/
│   ├── accounting_periods.ex
│   ├── classes.ex
│   ├── currencies.ex
│   ├── departments.ex
│   ├── gl_accounts.ex
│   ├── locations.ex
│   ├── projects.ex
│   └── subsidiaries.ex
├── expense/
│   └── expense_categories.ex
└── parties/
    ├── customers.ex
    ├── employees.ex  (already fixed)
    └── vendors.ex
```

## Changes Required

1. **`format_date` function**: Convert DateTime → `M/D/YYYY`
2. **`build_page_query` function**: Change `>` to `>=`
3. **All 12 capability files** need both changes

## Platform Limitation Acknowledgment

This is a **NetSuite platform limitation**, not a bug in our code. NetSuite's SuiteQL simply doesn't support datetime precision for date field filtering. Our solution works within these constraints.

