# Testing Strategy: Streaming Sync Implementation

**Document ID:** TEST-SCALE-001  
**Created:** 2024-12-21  
**Status:** Active  
**Related:** PROP-SCALE-001 (Streaming Sync Design)

---

## Core Principle

**All tests must be real integration tests that hit real NetSuite APIs.**

- ❌ No mocks
- ❌ No stubs  
- ❌ No simulated responses
- ✅ Real API calls
- ✅ Real database operations
- ✅ Real worker execution

---

## Three Tiers of Verification

### Tier 1: IEx/Mix Script Testing (Development)

**Purpose:** Prove individual components work during development.

**When to use:** During implementation of each phase.

**Command pattern:**
```bash
cd campsite/flames/flame_teampay_payables
source .env && mix run -e '
  # Test code here
'
```

**Example — Test fetch_page:**
```elixir
alias FlameTeampayPayables.EmberErp.Resources.Connection.ErpConnection
alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Config
alias FlameTeampayPayables.EmberErp.Adapters.CapabilityRouter
alias FlameTeampayPayables.EmberWorkspaces.Resources.Workspace
require Ash.Query

# Get connection
{:ok, [workspace | _]} = Workspace |> Ash.Query.limit(1) |> Ash.read(authorize?: false)
{:ok, conns} = Ash.read(ErpConnection, tenant: workspace.id, authorize?: false)
conn = Enum.find(conns, & &1.provider == :netsuite)

# Build config
config = Config.build_config(
  conn.credentials
  |> Map.put("environment", get_in(conn.configuration, ["environment"]) || "production")
)

# Test fetch_page
{:ok, result} = CapabilityRouter.fetch_page(conn.provider, :vendors, config, %{}, page_size: 100)
IO.puts("Fetched #{length(result.records)} vendors, has_more: #{result.has_more}")
```

---

### Tier 2: Seed-Triggered Full Sync (Integration)

**Purpose:** Prove full sync flow works end-to-end after implementation.

**When to use:** After implementing EntitySyncService and WorkspaceSyncReactor.

**Command:**
```bash
cd campsite/flames/flame_teampay_payables
source .env && mix run priv/repo/seeds/dev/06_erp_connections_auto_setup.exs
```

**Verification:**
```elixir
# Count records in database after sync
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Parties.Vendor
{:ok, vendors} = Ash.read(Vendor, tenant: workspace_id, authorize?: false)
IO.puts("Vendors in DB: #{length(vendors)}")
```

---

### Tier 3: Real Worker Execution (Production Readiness) — REQUIRED

**Purpose:** Prove Oban workers, job queues, and scheduling work under realistic conditions.

**When to use:** Before declaring implementation complete.

**This tier is NOT optional.** The implementation is incomplete until workers can be verified.

**Command:**
```bash
cd campsite/flames/flame_teampay_payables
source .env && mix phx.server
```

**Trigger sync via:**
1. UI: Navigate to ERP connections, click "Sync Now"
2. Scheduler: Wait for next scheduled sync
3. Manual Oban insert:
```elixir
iex -S mix phx.server
# Then:
Oban.insert(FlameTeampayPayables.EmberErp.Workers.SyncWorker.new(%{
  connection_id: "247cee43-9968-4d08-888c-1a4123c3a357",
  workspace_id: "550e8400-e29b-41d4-a716-446655440000"
}))
```

**Verification:**
- Check Oban dashboard for job status
- Query SyncExecution records for completion status
- Verify entity counts in database match NetSuite

---

## Current State (Baseline Established 2024-12-21)

### Environment

| Component | Status | Details |
|-----------|--------|---------|
| Workspace | ✅ Ready | `Paystand Console` (550e8400-e29b-41d4-a716-446655440000) |
| NetSuite Connection | ✅ Ready | ID: `247cee43-9968-4d08-888c-1a4123c3a357`, Status: connected |
| API Verification | ✅ Passed | Fetched 1,108 vendors from NetSuite sandbox |
| OAuth 2.0 | ✅ Working | JWT authentication, token cached in Redis |
| PostgreSQL | ✅ Running | Docker container |
| Redis | ✅ Running | Token cache operational |

### .env Configuration

**Critical:** The `NETSUITE_PRIVATE_KEY` must be formatted as a single line with escaped newlines:

```
NETSUITE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIJ...\n...\n-----END RSA PRIVATE KEY-----"
```

**Why:** Elixir's `System.get_env/1` does not properly receive multiline values from shell environment. The key must use literal `\n` characters (not actual newlines).

**Verification:**
```bash
source .env && mix run -e 'IO.puts(String.length(System.get_env("NETSUITE_PRIVATE_KEY") || ""))'
# Should output ~3298 (not 32)
```

---

## Verification Checklist by Implementation Phase

### Phase 1: Capability Layer (fetch_page)

```
□ Add fetch_page/3 to NetSuite Vendors capability
□ Add fetch_page/4 to CapabilityRouter
□ Tier 1 Test: Verify single page returns ~1000 records
□ Tier 1 Test: Verify pagination (offset 0, then 1000)
□ Tier 1 Test: Verify has_more flag is correct
□ Tier 1 Test: Verify next_cursor is usable
```

### Phase 2: Bulk Upsert Layer

```
□ Create VendorBulkUpsertService
□ Tier 1 Test: Fetch 100 vendors, bulk upsert, verify DB count
□ Tier 1 Test: Run twice, verify upsert (not duplicate) behavior
□ Tier 1 Test: Verify error handling for bad records
```

### Phase 3: Orchestrator Layer (EntitySyncService)

```
□ Create EntitySyncService with recursive pagination
□ Tier 1 Test: Sync all vendors, verify stats
□ Tier 1 Test: Compare count to baseline (1108 vendors)
□ Tier 2 Test: Run via seed, verify completion
```

### Phase 4: Reactor Integration

```
□ Create/update WorkspaceSyncReactor
□ Wire to scheduler/worker
□ Tier 3 Test: Trigger via Oban, verify completion
□ Tier 3 Test: Check job status in Oban dashboard
□ Tier 3 Test: Verify scheduled runs work
```

---

## Troubleshooting

### "Token error: no_private_key_in_pem"

**Cause:** Private key in database has truncated value (only 32 bytes).

**Fix:**
1. Ensure `.env` has single-line private key with `\n` escapes
2. Delete existing connection: 
   ```elixir
   Ash.destroy!(conn, tenant: workspace_id, authorize?: false)
   ```
3. Re-run seed:
   ```bash
   source .env && mix run priv/repo/seeds/dev/06_erp_connections_auto_setup.exs
   ```

### "No ERP connections found"

**Cause:** Seed hasn't been run or connection was deleted.

**Fix:** Run the seed file as shown above.

### NetSuite rate limiting (429 errors)

**Cause:** Too many requests in short period.

**Fix:** EntitySyncService should implement retry with exponential backoff.

---

## NetSuite Data Quirks (For Implementors)

### Field Format Issues

| Field Type | NetSuite Format | Expected Format | Conversion |
|------------|-----------------|-----------------|------------|
| Dates | `"16/12/2025"` (DD/MM/YYYY) | ISO8601 or Date | Parse with Timex |
| Booleans | `"T"` / `"F"` | `true` / `false` | String match |
| Money | `"41.71"` (string) | Decimal | `Decimal.new/1` |
| IDs | `"1495"` (string) | String | Use as-is |

### Null Handling

NetSuite may **omit fields entirely** rather than sending null. Always use:
```elixir
Map.get(record, "fieldname", default_value)
```

Never use direct access like `record["fieldname"]` without nil checking.

---

## Metrics to Instrument

| Metric | Type | Description |
|--------|------|-------------|
| `sync.page.fetch.duration_ms` | Histogram | API call time |
| `sync.bulk_upsert.duration_ms` | Histogram | Batch insert time |
| `sync.bulk_upsert.success_count` | Counter | Successful upserts |
| `sync.bulk_upsert.failure_count` | Counter | Failed upserts |
| `sync.entity.total_records` | Gauge | Total synced |

---

## Additional Edge Case Tests

```
□ Empty result set (0 records)
□ Exactly page_size records (boundary)
□ Last page < page_size records
□ Duplicate external_ids in batch
□ All nullable fields are null
□ Very long strings (>255 chars)
□ Sync interrupted mid-way (resumability)
□ Token expires mid-sync
□ Rate limit (429 response)
□ Maintenance window (503 response)
```

---

## Notes

- This testing strategy was established by the Sync Committee on 2024-12-21
- The baseline check confirmed 1,108 vendors in the NetSuite sandbox
- All implementation phases must be verified against these tiers before completion
- **Tier 3 (real worker execution) is mandatory** — the feature is not complete without it
- Data Quality, Performance, and Edge Case guidance added for implementors

