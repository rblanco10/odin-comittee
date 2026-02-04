# NetSuite Quirks & Gotchas

> **Known issues, unexpected behaviors, and workarounds for NetSuite integration.**

---

## Status: Living Document

This document captures hard-won knowledge about NetSuite's behavior. Add to it when you encounter new quirks.

---

## Data Model Quirks

### isInactive vs. Deleted

NetSuite has two concepts that are often confused:

| State | API Behavior | Data Behavior | Impact |
|-------|--------------|---------------|--------|
| `isInactive = true` | Record still exists, returned by API | Historial references remain | Cannot be used for new transactions |
| Deleted | 404 on fetch | References may break | Truly removed |

**Gotcha**: `isInactive` does NOT mean the record is deleted. Syncing only active records misses historical context.

### Subsidiary Scope

In OneWorld (multi-subsidiary) NetSuite:
- Some records are subsidiary-specific
- Some records are shared (subsidiary = null)
- API visibility depends on role's subsidiary access

**Gotcha**: A sync running as a role with limited subsidiary access will not see all records.

### Custom Segments

NetSuite's custom segments (dimensions) have complex behavior:
- They're defined as CustomSegment records
- Values are in a linked CustomRecordType
- References use the segment's scriptId

**Gotcha**: You can't just sync "custom segments" — you need the segment definition AND the values.

---

## API Quirks

### Date Formats

NetSuite returns dates in inconsistent formats:

| Field Type | Format | Example |
|------------|--------|---------|
| Date fields | MM/DD/YYYY | 12/25/2024 |
| DateTime fields | ISO 8601 | 2024-12-25T10:30:00Z |
| Legacy fields | Varies | "Dec 25, 2024" |

**Workaround**: Parse dates defensively with multiple format attempts.

### Number Formats

Amounts may include:
- Currency symbols: "$1,234.56"
- Grouping separators: "1,234.56"
- Negative in parentheses: "(500.00)"

**Workaround**: Strip non-numeric characters before parsing.

### REST API Pagination

- Default page size: 1000 records
- Maximum page size: 1000 records
- Uses `links.next` for pagination
- **Gotcha**: Empty results return `{ items: [] }`, not 404

### Rate Limiting

- Concurrency limit: 10 concurrent connections
- Request limit: 10,000 requests per hour
- **Gotcha**: Limits are per account, not per integration

### Boolean Returns

- `true` / `false` (expected)
- `"T"` / `"F"` (legacy)
- `"Yes"` / `"No"` (some fields)

**Workaround**: Check for all three patterns.

---

## Entity-Specific Quirks

### Vendors

- `companyName` can be null for draft vendors
- `email` may contain "N/A", "none", or garbage
- `balance` can be non-numeric strings
- Inactive vendors still have payable bills

### Bills (Vendor Bills)

- `dueDate` is calculated from `tranDate` + payment terms
- `status` values differ between REST and SuiteQL
- Line items are in a sublist, not separate records
- `amountRemaining` changes as payments are applied

### GL Accounts

- Parent accounts exist but shouldn't be posted to
- Account numbers can contain non-numeric characters
- Some accounts are "header" accounts (posting = false)

### Employees

- May or may not be "system users" (login access)
- `email` is required for system users, optional for others
- Subsidiary assignment is mandatory in OneWorld

---

## Multi-Subsidiary (OneWorld) Quirks

### Record Visibility

| Record Type | Scoping |
|-------------|---------|
| Vendors | Can be subsidiary-specific or shared |
| GL Accounts | Always subsidiary-specific |
| Departments | Can be shared or specific |
| Employees | Always subsidiary-specific |
| Bills | Always subsidiary-specific |

### Intercompany

- Intercompany transactions create paired records
- Each subsidiary sees only their side
- Elimination entries are automatic (if configured)

### Currency

- Each subsidiary has a base currency
- Transactions can be in non-base currencies
- Exchange rates are maintained per date

---

## Error Messages

NetSuite error messages are often unhelpful:

| Error Message | Actual Meaning |
|---------------|----------------|
| "Invalid reference" | FK to non-existent record |
| "Permission violation" | Role lacks access (check subsidiary) |
| "Record has been changed" | Concurrent modification (optimistic lock) |
| "You cannot complete this action" | Could be anything |
| "Unexpected error" | Could be anything |

---

## Performance Considerations

### Large Record Sets

- Syncing >10,000 vendors: Use SuiteQL with pagination
- Syncing >50,000 transactions: Consider date-range batching
- Custom segments with >1,000 values: May need special handling

### API Choice

| Operation | Recommended API |
|-----------|-----------------|
| List all records | SuiteQL |
| Get single record | REST |
| Search with complex criteria | SuiteQL |
| Create/Update | REST |

---

## Common Implementation Mistakes

1. **Assuming clean data**: NetSuite data is often messy
2. **Ignoring subsidiaries**: Breaks in OneWorld
3. **Hard-coding field names**: Custom fields vary by customer
4. **Not handling pagination**: Missing records
5. **Single retry on error**: Some errors need exponential backoff
6. **Trusting documentation**: Test actual behavior

---

## Debugging Utilities

### DebugLogger (Removed — Pattern Preserved)

**Status:** REMOVED (January 13, 2026)  
**Original Session:** SC-2026-01-13-001  
**Reason for Removal:** Prevented filesystem accumulation from log files

#### What It Did

The `DebugLogger` module was a temporary debugging utility that wrote detailed NetSuite API request/response data to files in `priv/netsuite_debug_logs/`. Each API call created a timestamped log file.

**Files:**
- Module: `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/debug_logger.ex`
- Logs: `priv/netsuite_debug_logs/netsuite_response_YYYY-MM-DD_HH-MM-SS_MICROSECONDS.log`

#### Log File Format

```
================================================================================
NETSUITE DEBUG LOG
================================================================================
Timestamp: 2026-01-13T19:05:47Z
Operation: RESTLET_CREATE_EXPENSE_REPORT_PAYMENT

================================================================================
REQUEST
================================================================================
URL: https://xxx.restlets.api.netsuite.com/...
Method: POST
Headers: (Authorization masked)
Payload: { expenseReportId: "123", ... }

================================================================================
RESPONSE
================================================================================
HTTP Status: 200
Response Body: { success: true, paymentId: "456", ... }

================================================================================
RAW DATA (for programmatic parsing)
================================================================================
REQUEST_JSON: { ... }
RESPONSE_JSON: { ... }
================================================================================
```

#### Key Features

1. **Automatic masking** — Authorization headers masked for security
2. **Structured output** — Both human-readable and JSON sections
3. **Full context** — Request URL, headers, payload, response status, body
4. **Timestamped filenames** — Microsecond precision for ordering

#### When To Recreate

If NetSuite API debugging is needed again:

1. **Copy the pattern** from this documentation
2. **Use environment variable** to enable/disable (don't leave always-on)
3. **Add log rotation** or TTL to prevent filesystem fill
4. **Consider structured logging** (Loki) instead of file-based

#### Alternative: Standard Logger

The `RestletClient` still logs key information via Elixir's Logger:

```elixir
Logger.info("[RestletClient] RESPONSE RECEIVED")
Logger.info("[RestletClient] HTTP Status: #{status}")
Logger.info("[RestletClient] Response Body: #{inspect(body, pretty: true, limit: :infinity)}")
```

This goes to console/Loki without file accumulation.

#### Removal Checklist (For Reference)

When this module was removed:

1. ✅ Removed `DebugLogger.log_restlet_payment/3` calls from `restlet_client.ex`
2. ✅ Removed the `DebugLogger` alias from `restlet_client.ex`
3. ✅ Deleted `debug_logger.ex` module
4. ✅ Deleted `priv/netsuite_debug_logs/` directory
5. ✅ Removed `.gitkeep` from the logs directory

---

## Last Updated

2026-01-13 — Added DebugLogger documentation

---

## Contributing

When you discover a new quirk:
1. Add it to the appropriate section
2. Include: What the quirk is, why it matters, how to handle it
3. Update "Last Updated"

