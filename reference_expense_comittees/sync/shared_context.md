# Sync Committee Shared Context

> **Purpose:** Committee's collective memory. Permanent knowledge persists; session context archives at session close.
> 
> **Governance:** See [GOVERNANCE.md](GOVERNANCE.md) for archival process.

---

## Permanent Knowledge

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      WorkspaceSyncWorker                        │
│                    (Oban, queue: :erp_sync)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WorkspaceSyncReactor                        │
│   (Tiered sync: processes entity subset per run_number)         │
│                                                                 │
│   Tiers: HOT(1) → WARM(8) → COLD(30) → STATIC(720)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EntitySyncService                          │
│           (Paginated fetch → bulk upsert loop)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   CapabilityRouter      │   │   BulkUpsertServices    │
│   .fetch_page/4         │   │   (12 entity types)     │
└─────────────────────────┘   └─────────────────────────┘
```

### Bridge Architecture (Updated SC-2025-12-23-006)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BridgeWorker                              │
│                    (Oban, queue: :bridge)                        │
│                    Cross-workspace, every 2 min                  │
│            Handles ALL post-sync linking operations              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BridgeReactor                             │
│   (8 steps: Department, Location, Class, Project,               │
│    GLAccount, Job, ExpenseCategory, CustomDimensions)           │
│   Per-step compensation; failure isolation                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DimensionBridgeService                         │
│   Query: WHERE bridged_at IS NULL OR updated_at > bridged_at    │
│   Creates CodingCategory/CodingValue from ERP mirrors            │
└─────────────────────────────────────────────────────────────────┘

FLOW:
ERP Mirror (with bridged_at) → CodingCategory → CodingValue
                                      ↑
                         entity_id optional (workspace-wide support)
```

---

### Key Design Decisions

| Decision | Choice | Rationale | Session |
|----------|--------|-----------|---------|
| Sync scheduling | Workspace-centric (not per-entity) | Single job = all entities | SC-2025-12-21-001 |
| Data fetching | Paginated streaming | Bounded memory | SC-2025-12-21-001 |
| Database writes | Bulk upsert (1K batches) | Eliminates N+1 | SC-2025-12-21-001 |
| Tiered sync | Counter/modulo approach | 2-min SLA achievable | SC-2025-12-22-001 |
| Run number storage | `ErpConnection.sync_run_number` | Persistent, atomic | SC-2025-12-22-001 |
| **Bridge decoupling** | Separate worker/reactor from sync | Isolation; 80% of tickets from sync | SC-2025-12-22-002 |
| **Bridge scope** | Cross-workspace | Efficiency; avoid per-workspace overhead | SC-2025-12-22-002 |
| **Bridge cursor** | Per-record `bridged_at` | Most resilient; record-level precision | SC-2025-12-22-002 |
| **Entity scoping** | `entity_id` optional | Workspace-wide dimensions (NULL = all entities) | SC-2025-12-22-002 |
| **Name/code fallback** | Update `external_id` on conflict | Handle ERP data quality issues | SC-2025-12-22-003 |
| **Pagination** | 500/page, max 10K/run | Bounded memory, no 10K load | SC-2025-12-22-003 |
| **N+1 hierarchy fix** | Batch parent lookup | Single query per page vs per record | SC-2025-12-22-003 |
| **Push/Sync separation** | Option D: Sync-only mirrors | ERP is truth, no conflict, clean separation | SC-2025-12-22-004 |
| **Push verification** | Post-sync reconciliation | Links PushRequest → Mirror via external_id | SC-2025-12-22-004 |
| **Push traceability** | Strong linkage model | Invoice ↔ PushRequest ↔ Mirror bidirectional | SC-2025-12-22-004 |
| **Push mode toggle** | `push_mode: :automatic \| :manual` per ErpConnection | All-or-nothing auto vs manual push | SC-2025-12-22-004 |
| **Parallel infra cleanup** | Removed PushWorker, PushTask, MonitorPushHealthWorker | Dead code causing confusion | SC-2025-12-22-004 |
| **Vendor matching provider** | Ntropy as primary, Local as fallback | Production accuracy + dev flexibility | SC-2026-01-05-001 |
| **Vendor matching target** | Vendor wrapper (`ap_vendors`), not ERP mirror or VendorDetail | Unified view of all sources; supports non-ERP customers | SC-2026-01-06-001 |
| **Internal-only vendor matching** | YES — match even if `erp_vendor_id` is NULL | Teampay-first workflow; auto-create handles ERP push | SC-2026-01-06-001 |
| **Fuzzy match scalability** | Hybrid: pg_trgm pre-filter + Jaro-Winkler final scoring | Scales to unlimited vendors; maintains accuracy | SC-2026-01-06-005 |
| **Fuzzy match algorithm** | Keep Jaro-Winkler for final scoring (0.80 threshold) | Better for typos/abbreviations than pure trigram | SC-2026-01-06-005 |
| **Pre-normalized column** | Add `normalized_name` to ap_vendors | Faster queries, consistent normalization | SC-2026-01-06-005 |
| **Vendor display_name** | Add `display_name` to ap_vendors (DEC-2026-002) | Eliminates N+1 queries; no nested relationship loading for name | SC-2026-01-23-001 |
| **Coding status ≠ vendor** | Vendor removed from coding_status calculation | Separate concerns; vendor has its own lifecycle | SC-2026-01-07-002 |
| **GL Account posting_type** | Add `posting_type` attribute to GLAccount | Filters summary/statistical accounts from dropdowns | SC-2026-01-07-002 |
| **Keep IdentityBinding** | DO NOT remove IdentityBinding table | Required for per-workspace access control, auth checks binding status | SC-2026-01-16-005 |
| **Admin-only ERP employee** | Users cannot self-create ERP employees | Admin workflow via Workforce Setup only | SC-2026-01-16-005 |
| **Identity.User at invitation** | Create Identity.User when admin invites employee | Not at login; ensures user exists before they authenticate | SC-2026-01-16-006 |
| **Dimension filtering by entity_ids** | Use `entity_ids` array on ERP mirrors | Consistent filtering for dimensions, vendors, GL accounts | SC-2026-01-16-008 |
| **AP Control = AcctPay type** | Filter teampay_ap_control by `account_category = "AcctPay"` | NetSuite requires AP-type account on bill header | SC-2026-01-16-008 |
| **In-memory entity filtering** | Filter ERP mirrors in-memory after Ash query | Ash fragment() syntax unreliable; in-memory more robust | SC-2026-01-16-008 |

---

### Elliot's Identity Model (SC-2026-01-16-005, SC-2026-01-16-006)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ELLIOT'S IDENTITY MODEL                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   THREE-DOMAIN SEPARATION:                                                   │
│                                                                              │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │    WORKFORCE    │   │    IDENTITY     │   │      ERP        │          │
│   │    (Employee)   │   │     (User)      │   │   (Employee)    │          │
│   └────────┬────────┘   └────────┬────────┘   └────────┬────────┘          │
│            │                     │                     │                    │
│   Who you are as an      Who you are for        Who you are in             │
│   employee of a          login/permissions      NetSuite/ERP               │
│   specific company       (global)               (synced mirror)            │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   RELATIONSHIPS:                                                             │
│                                                                              │
│   Workforce.Employee ───────────────────► Identity.User                     │
│         │                                      │                            │
│         │  employee.user_id (direct FK)        │                            │
│         │                                      │                            │
│         └────────┬────────────────────────────►│                            │
│                  │                             │                            │
│          IdentityBinding (junction)            │                            │
│          - workspace_id                        │                            │
│          - status: :active/:suspended          │                            │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   WHEN IDENTITY.USER IS CREATED:                                            │
│                                                                              │
│   ✓ Employee Invitation (admin invites from Workforce Setup)                │
│   ✓ First OAuth Login (find-first-then-create)                              │
│   ✓ First SSO Login (JIT provisioning)                                      │
│                                                                              │
│   WHEN IDENTITY.USER IS NOT CREATED:                                        │
│                                                                              │
│   ✗ ERP Sync (only creates Erp.Employee mirror)                             │
│   ✗ CSV Import (only creates Employee)                                      │
│   ✗ Teams/Slack Sync (only creates Employee)                                │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PROVISIONING FLOW (SC-2026-01-16-006):                                    │
│                                                                              │
│   Admin clicks "Invite"                                                      │
│         │                                                                    │
│         ▼                                                                    │
│   ProvisionEmployeeReactor                                                   │
│         │                                                                    │
│         ├─► 1. Fetch Employee                                               │
│         ├─► 2. Check existing IdentityBinding                               │
│         ├─► 3. Find or Create Identity.User  ◄─── USER CREATED HERE         │
│         ├─► 4. Create IdentityBinding                                       │
│         ├─► 5. Set Employee.user_id  ◄─────────── LINK CREATED HERE         │
│         ├─► 6. Send Welcome Notification                                    │
│         └─► 7. Complete                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Dimension-Subsidiary Filtering Architecture (SC-2026-01-16-008)

**Session:** SC-2026-01-16-008  
**Problem:** Dimensions, vendors, and GL accounts from NetSuite were not being correctly filtered by subsidiary, causing "Invalid Field Value" errors when pushing to NetSuite.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     DIMENSION → SUBSIDIARY FILTERING ARCHITECTURE                │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │   ERP SETUP (UI)    │         │   ERP SYNC (Oban)   │
  │   erp_live.ex       │         │ WorkspaceSyncWorker │
  └──────────┬──────────┘         └──────────┬──────────┘
             │                               │
             ▼                               ▼
  ┌─────────────────────┐         ┌─────────────────────┐
  │   EntityMapping     │         │    ERP Mirrors      │
  │ (erp_entity_mappings)│         │ (ember_erp_*)       │
  ├─────────────────────┤         ├─────────────────────┤
  │ entity_id: UUID     │←───┐    │ GLAccount           │
  │ erp_location_id:"3" │    │    │ Department          │
  │ erp_connection_id   │    │    │ Location, etc.      │
  └──────────┬──────────┘    │    │ entity_ids: ["1","3"]│
             │               │    └──────────┬──────────┘
             │               │               │
             │               │               ▼
             │               │    ┌─────────────────────┐
             │               │    │  BRIDGE WORKER      │
             │               │    │ DimensionBridgeService │
             │               │    │  PASS 4: entity sync│
             │               │    └──────────┬──────────┘
             │               │               │
             │               │               ▼
             │               │    ┌─────────────────────┐
             │               │    │  CodingValue +      │
             │               │    │  CodingValueEntity  │
             │               │    │  (junction table)   │
             │               ├────│ coding_value_id:UUID│
             │                    │ entity_external_id:"3"│
             │                    │ erp_subsidiary_id   │
             ▼                    └──────────┬──────────┘
  ┌─────────────────────────────────────────┴──────────────────────────────────────┐
  │                          RUNTIME FILTERING                                      │
  │                                                                                 │
  │   1. get_entity_erp_location(entity_id) → EntityMapping.erp_location_id = "3"  │
  │   2. filter_by_entity(value_ids, "3") → CodingValueEntity.entity_external_id   │
  │   3. Return only values where entity_external_id == "3" OR no restrictions     │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Data Sources

| Resource | Attribute | Purpose |
|----------|-----------|---------|
| `EntityMapping` | `erp_location_id` | Maps Teampay entity UUID → NetSuite subsidiary ID |
| `GLAccount` | `entity_ids` | Array of subsidiary IDs this account is available for |
| `ErpVendor` | `entity_ids` | Array of subsidiary IDs this vendor is available for |
| `CodingValueEntity` | `entity_external_id` | Junction table linking CodingValue → subsidiary |

#### Filtering by Account Type (SC-2026-01-16-008)

| Configuration Item | Account Type | Filter Field | Filter Value |
|--------------------|--------------|--------------|--------------|
| `ach_funding_account` | Bank | `erp_metadata->>'accttype'` | `"Bank"` |
| `wire_funding_account` | Bank | `erp_metadata->>'accttype'` | `"Bank"` |
| `check_funding_account` | Bank | `erp_metadata->>'accttype'` | `"Bank"` |
| `employee_reimbursement_account` | Bank | `erp_metadata->>'accttype'` | `"Bank"` |
| **`teampay_ap_control`** | **Accounts Payable** | **`account_category`** | **`"AcctPay"`** |
| Other GL accounts | Expense | `account_type` | `:expense, :other` |

#### Service Functions

| Service | Function | Purpose |
|---------|----------|---------|
| `AccountMappingService` | `get_bank_accounts_for_subsidiary/3` | Bank-type accounts filtered by subsidiary |
| `AccountMappingService` | `get_ap_accounts_for_subsidiary/3` | AcctPay accounts filtered by subsidiary |
| `AccountMappingService` | `get_available_accounts_for_subsidiary/3` | All GL accounts filtered by subsidiary |
| `DimensionFilterService` | `filter_by_entity/4` | Dimensions filtered via CodingValueEntity |
| `DimensionFilterService` | `get_entity_erp_location/2` | Resolves entity UUID → erp_location_id |

#### Defense-in-Depth Validation

The system has **three layers** of protection for subsidiary validation:

| Layer | Where | What it does |
|-------|-------|-------------|
| 1. UI Selection | Bank Mapping, Transactions | Only shows accounts/dimensions valid for subsidiary |
| 2. Push Pre-Validation | `push_card_spend_reactor.ex` | Validates all dimensions before sending to ERP |
| 3. Push Fallback | `check_gl_account_entity_ids_directly/4` | Checks GLAccount.entity_ids when CodingValue not found |

#### Common Pitfalls

1. **Filtering by wrong field**: `account_category` contains NetSuite's `accttype` (e.g., `"AcctPay"`), NOT `erp_metadata`
2. **Not passing ap_accounts**: Parent LiveView must load AND pass `ap_accounts` to BankMappingTab
3. **Missing EntityMapping**: If no `EntityMapping` exists for the entity, filtering won't work
4. **Empty entity_ids**: Empty `entity_ids` array means the resource is globally available (include it)

---

### GL Account Posting Type (SC-2026-01-07-002)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GL ACCOUNT POSTING TYPE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   posting_type: :posting | :summary | :statistical | :system                │
│                                                                              │
│   :posting     - Normal account that can receive transactions               │
│   :summary     - Parent/header account (NetSuite issummary=T, Acumatica     │
│                  Type=Header) - CANNOT post directly                        │
│   :statistical - Non-posting statistical account                            │
│   :system      - System-generated account (Intacct SYSTEMGENERATED=true)    │
│                                                                              │
│   ERP-Specific Detection:                                                   │
│   ┌─────────────┬────────────────────────────────────────────────────────┐  │
│   │ NetSuite    │ issummary='T' → :summary                               │  │
│   │             │ accttype contains 'statistical' → :statistical         │  │
│   ├─────────────┼────────────────────────────────────────────────────────┤  │
│   │ Intacct     │ SYSTEMGENERATED=true → :system                         │  │
│   │             │ ACCOUNTTYPE='statistical' → :statistical               │  │
│   ├─────────────┼────────────────────────────────────────────────────────┤  │
│   │ QuickBooks  │ AccountType='Non-Posting' → :statistical               │  │
│   ├─────────────┼────────────────────────────────────────────────────────┤  │
│   │ Acumatica   │ Type='Header' → :summary                               │  │
│   └─────────────┴────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Filtering:                                                                │
│   - DimensionFilterService: Filters GL dimensions by posting_type=:posting  │
│   - CategoryGLLoaderService: Adds posting_type=:posting to account_type     │
│                              filter                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Vendor Matching Architecture (SC-2026-01-05-001, Corrected SC-2026-01-05-003)

⚠️ **Correction (SC-2026-01-05-003):** Actual implementation is SIMPLIFIED. No ProviderBehaviour pattern exists.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VENDOR MATCHING (SIMPLIFIED IMPLEMENTATION)               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MerchantVendorMappingService.resolve_vendor/1                              │
│       │                                                                     │
│       ▼                                                                     │
│  VendorEnrichmentService.enrich/2                                           │
│       │                                                                     │
│       ├─► [Production: enricher=:ntropy]                                    │
│       │       NtropyClient.enrich_transaction/2                             │
│       │       └─► (on error/timeout) → normalize_local/1                    │
│       │                                                                     │
│       └─► [Development: enricher=:local]                                    │
│               normalize_local/1 (regex-based)                               │
│                                                                             │
│  Files:                                                                     │
│  • adapters/providers/ntropy/client.ex — Ntropy HTTP client                │
│  • services/vendor_enrichment_service.ex — Enrichment orchestrator         │
│  • services/vendor_matching_telemetry.ex — Observability                   │
│                                                                             │
│  Ntropy API: https://docs.ntropy.com/enrichment/introduction               │
│  • Entity identification (merchant → vendor)                                │
│  • Transaction categorization                                               │
│  • Name normalization                                                       │
│                                                                             │
│  Local Matching (in MerchantVendorMappingService):                          │
│  • Card vendor check (vendor-locked cards)                                  │
│  • Exact mapping (MerchantVendorMapping table)                             │
│  • Pattern/prefix matching                                                  │
│  • Fuzzy match (Jaro-Winkler) against Vendor wrappers                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Key Decision: Ntropy is THE provider. Local is fallback/dev mode only.
NOT a multi-provider race or "best-of-N" strategy.

Architecture Note: ProviderBehaviour pattern was SKIPPED in favor of simpler
inline implementation. Can be added later if multi-provider need emerges.
```

---

### Ntropy v3 API Response Structure (SC-2026-01-06-003)

```json
{
  "id": "tp_xxx_timestamp",
  "created_at": "2026-01-07T00:00:00Z",
  "entities": {
    "counterparty": {
      "id": "uuid",
      "type": "organization",
      "name": "Starbucks",           // ← Primary merchant name
      "website": "starbucks.com",
      "logo": "https://logos.ntropy.com/starbucks.com",
      "mccs": [5814],
      "phone_number": "+1 415...",   // Sometimes available
      "tax_number": "80-0429876"     // Sometimes available
    },
    "intermediaries": [
      { "name": "Square, Inc.", "website": "squareup.com", ... }
    ]
  },
  // ONLY with account_holder_id:
  "categories": {
    "general": "coffee shop",
    "accounting": "operational expenses"
  },
  "location": {
    "structured": { "city": "New York", "state": "NY", ... }
  }
}
```

**Extraction Path:** `body["entities"]["counterparty"]["name"]`

**Future Enhancement:** To get `categories` and `location`, create Ntropy account holders (one per workspace/entity) and pass `account_holder_id` in requests.

---

### How to Execute SuiteQL Queries (SC-2026-01-18-001)

**Purpose:** Run ad-hoc SuiteQL queries against NetSuite for troubleshooting.

#### Prerequisites

1. Active NetSuite ErpConnection with status `:connected`
2. Valid OAuth credentials stored in `ErpConnection.credentials`

#### Complete Script Template

```elixir
# In IEx or via mix run -e '...'
alias FlameTeampayPayables.EmberErp.Resources.Connection.ErpConnection
alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Config
alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Adapter
alias FlameTeampayPayables.Repo
require Ash.Query
import Ash.Expr

# Step 1: Get workspace_id using raw SQL (cross-workspace query)
{:ok, %{rows: [[workspace_id]]}} = Repo.query(
  "SELECT workspace_id FROM erp_connections WHERE provider = $1 AND status = $2 ORDER BY id FETCH FIRST 1 ROWS ONLY",
  ["netsuite", "connected"]
)
workspace_id = Ecto.UUID.load!(workspace_id)

# Step 2: Load ErpConnection with tenant context
{:ok, [conn | _]} = ErpConnection
|> Ash.Query.filter(expr(provider == :netsuite and status == :connected))
|> Ash.read(tenant: workspace_id, authorize?: false)

# Step 3: Build adapter config using NetSuite.Config module (CRITICAL!)
# NEVER manually build the config map — always use Config.build_config/1
config = Config.build_config(conn.credentials)

# Step 4: Execute SuiteQL query
query = "SELECT j.id, j.entityid, j.isinactive FROM job j WHERE j.id = 53384"

case Adapter.query_suiteql(config, query) do
  {:ok, %{records: records}} ->
    IO.puts("Query successful! Found #{length(records)} records")
    for record <- records, do: IO.inspect(record)
  {:error, reason} ->
    IO.puts("Query failed: #{inspect(reason, pretty: true)}")
end
```

#### SuiteQL Syntax Differences from Standard SQL

| Feature | Standard SQL | SuiteQL |
|---------|-------------|---------|
| **Limit rows** | `LIMIT 10` | `WHERE ROWNUM <= 10` or `FETCH FIRST 10 ROWS ONLY` (in subquery) |
| **Display name** | N/A | `BUILTIN.DF(field) AS display_name` |
| **Boolean values** | `true/false` | `'T'` / `'F'` (as strings) |
| **Date format** | ISO 8601 | `'DD/MM/YYYY'` or `'YYYY-MM-DD'` |

#### Common Queries

**Check job/project status:**
```sql
SELECT j.id, j.entityid, j.isinactive, j.entitystatus, 
       BUILTIN.DF(j.entitystatus) AS status_name,
       j.subsidiary, BUILTIN.DF(j.subsidiary) AS subsidiary_name,
       j.customer, j.parent, j.allowexpenses
FROM job j 
WHERE j.id = 53384
```

**Check customer details:**
```sql
SELECT c.id, c.entityid, c.companyname, c.isinactive, 
       c.subsidiary, BUILTIN.DF(c.subsidiary) AS subsidiary_name
FROM customer c 
WHERE c.id = 53379
```

**Check employee subsidiary:**
```sql
SELECT e.id, e.entityid, e.firstname, e.lastname, 
       e.isinactive, e.subsidiary, BUILTIN.DF(e.subsidiary) AS subsidiary_name
FROM employee e 
WHERE e.id = 75509
```

#### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `KeyError: :realm` | Manually built config map | Use `Config.build_config(conn.credentials)` |
| `TenantRequired` | Ash query without tenant | Add `tenant: workspace_id` to `Ash.read/2` |
| `Invalid search type` | Table name doesn't exist | Check NetSuite Record Browser for correct table name |
| `syntax error near: LIMIT` | LIMIT not supported | Use `WHERE ROWNUM <= N` |

---

### Platform Quirks

#### NetSuite Date Format (Outgoing Requests)

```elixir
# NetSuite REJECTS ISO8601 in requests
DateTime.to_iso8601(dt)  # ❌ "2025-12-21T12:00:00Z"

# NetSuite REQUIRES M/D/YYYY in requests
"#{dt.month}/#{dt.day}/#{dt.year}"  # ✅ "12/21/2025"
```

**Impact:** All 12 NetSuite capabilities use `format_date/1` helper.

#### NetSuite DateTime Serialization (Incoming Responses) ⚠️ CRITICAL

NetSuite SuiteTalk REST API **strips the time component** from datetime fields during JSON serialization, returning only the date portion.

```sql
-- ❌ WRONG: Querying datetime field directly loses time!
SELECT Transaction.lastmodifieddate FROM Transaction
-- Returns: "2024-12-22" (time component LOST)

-- ✅ CORRECT: Use TO_CHAR to preserve full datetime
SELECT TO_CHAR(Transaction.lastmodifieddate, 'YYYY-MM-DD"T"HH24:MI:SS') AS lastmodifieddate
FROM Transaction
-- Returns: "2024-12-22T15:30:45" (time preserved)
```

**Required format pattern:**
```sql
TO_CHAR(fieldName, 'YYYY-MM-DD"T"HH24:MI:SS')
```

**Impact on Delta Sync:**

| Without TO_CHAR | With TO_CHAR |
|-----------------|--------------|
| Returns: `"2024-12-22"` | Returns: `"2024-12-22T15:30:45"` |
| **Misses same-day updates** | Captures all updates |
| Delta sync unreliable | Delta sync accurate |

**Fields affected:** `lastmodifieddate`, `createddate`, `trandate`, `duedate`, and all datetime columns.

**Rule:** ALWAYS wrap datetime fields with `TO_CHAR()` in both SELECT and WHERE clauses.

#### NetSuite Sandbox Date Limitation

The sandbox `tstdrv1681108` rejects queries with dates >= December 13, 2025. This is a sandbox issue, not a code bug. Production will work correctly.

---

### NetSuite VendorPayment Apply Sublist (SC-2026-01-19-001)

**Critical:** The `apply` sublist on VendorPayment is a **static sublist** with strict field constraints.

#### Valid Fields for Apply Items

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `doc` | Record Reference | ✅ Yes | Internal ID of the bill being paid (as `{"id": "123456"}`) |
| `apply` | Boolean | ✅ Yes | Must be `true` to apply payment to this line |
| `amount` | Number | ✅ Yes | Amount to apply to this bill |
| `line` | Integer | No | Line number (optional, NetSuite auto-assigns) |

#### Invalid Fields (Will Cause Error)

| Field | Error | Explanation |
|-------|-------|-------------|
| `refnum` | "invalid sublist operation" | READ-ONLY display field; NetSuite populates automatically with bill's tranid |
| `internalid` | "invalid field" | Use `doc` instead |
| Any custom field | "invalid field" | Apply sublist doesn't support custom fields |

#### Correct Payload Structure

```json
{
  "entity": {"id": "76012"},
  "account": {"id": "123"},
  "trandate": "2026-01-19",
  "memo": "Card payment for CARD-a0631167",
  "externalid": "CARD-PAY-627570-215206c2",
  "apply": {
    "items": [
      {
        "doc": {"id": "627570"},
        "apply": true,
        "amount": 75.0
      }
    ]
  }
}
```

**Pattern Reference:** See `expense_report_payments.ex` for working implementation — uses only `doc`, `apply`, `amount`.

---

### NetSuite Duplicate Record Recovery (SC-2026-01-19-002)

**Problem:** Partial failure scenarios where NetSuite creates a bill but PushEntityRecord isn't saved.

**Error Message:**
```json
{
  "o:errorDetails": [{
    "detail": "Error while accessing a resource. This record already exists.",
    "o:errorCode": "USER_ERROR"
  }]
}
```

**Root Cause:** NetSuite enforces `externalId` uniqueness. If a bill was created with `externalId = tp_xxx_yyy` but the PushEntityRecord wasn't saved (timeout, crash), the retry will fail because:
1. No PushEntityRecord → reactor chooses CREATE mode
2. NetSuite rejects because `externalId` already exists

**Solution: Idempotent Recovery Pattern**

```elixir
# 1. Detect duplicate error
defp is_duplicate_record_error?(error_details) do
  Enum.any?(error_details, fn detail ->
    String.contains?(detail["detail"] || "", "This record already exists")
  end)
end

# 2. Query by externalId to get internal ID
defp query_bill_by_external_id(config, external_id) do
  query = "SELECT id FROM Transaction WHERE type = 'VendBill' AND externalId = '#{external_id}'"
  Adapter.query_suiteql(config, query, limit: 1)
end

# 3. Create PushEntityRecord with recovered ID
# 4. Proceed to payment scheduling
```

**Key Points:**
- `externalId` is deterministic: `tp_{workspace_short}_{source_short}`
- SuiteQL query is case-sensitive on `externalId`
- Mark recovered records with `recovered_from_duplicate: true` in metadata

---

### Entity Tiers (Tiered Sync)

| Tier | Modulo | Frequency | Entities |
|------|--------|-----------|----------|
| HOT | 1 | Every 2 min | expense_reports, bills, ap_payments |
| WARM | 8 | Every 16 min | vendors, employees, projects |
| COLD | 30 | Every 1 hour | customers, gl_accounts, departments, classes, expense_categories |
| STATIC | 720 | Daily | currencies, subsidiaries, locations, accounting_periods |

**Capacity:** 25 workers support ~1,700 workspaces with 2-min SLA.

---

### Entity Scoping (NEW - SC-2025-12-22-002)

| Layer | `entity_id` | Meaning |
|-------|-------------|---------|
| ERP Mirror | Optional | NULL = workspace-wide (all entities) |
| CodingCategory | Optional (changed) | NULL = workspace-wide |
| CodingValue | Optional (changed) | NULL = workspace-wide |
| CodingAssignment | Required | Assignment is entity-scoped |

**Pattern for queries:**
```elixir
# Include workspace-wide dimensions
|> Ash.Query.filter(entity_id == ^entity_id or is_nil(entity_id))
```

---

### Gaps Resolved

| Gap ID | Description | Resolution | Session |
|--------|-------------|------------|---------|
| GAP-SCALE-MEM-001 | Memory accumulation | Paginated fetch_page | SC-2025-12-21-001 |
| GAP-SCALE-DB-001 | N+1 queries | Bulk upsert services | SC-2025-12-21-001 |
| GAP-CAP-001 | Missing :erp_sync queue | Added to config | SC-2025-12-22-001 |
| GAP-CAP-002 | No tiered sync | Counter/modulo impl | SC-2025-12-22-001 |
| GAP-BRIDGE-001 | Business logic in sync | Decoupled Bridge system | SC-2025-12-22-002 |
| GAP-BRIDGE-002 | entity_id required on coding | Made optional (workspace-wide) | SC-2025-12-22-002 |
| GAP-BRIDGE-003 | N+1 in hierarchy resolution | Batch parent lookup | SC-2025-12-22-003 |
| GAP-BRIDGE-004 | Silent failure tracking | Return :error on failures | SC-2025-12-22-003 |
| GAP-BRIDGE-005 | Concurrent run protection | Oban unique constraint | SC-2025-12-22-003 |
| GAP-BRIDGE-006 | 10K memory load | Paginated (500/page) | SC-2025-12-22-003 |
| GAP-NS-DATETIME-001 | SELECT * loses time precision | ✅ TO_CHAR in SELECT + cursor builder | SC-2025-12-22-003 |
| GAP-VND-MATCH-001 | Fuzzy match excludes ERP Vendors | ✅ Fixed — queries Vendor wrapper directly | SC-2026-01-05-002 |
| GAP-VND-MATCH-002 | Push reactor uses non-existent source_vendor_id | ✅ Fixed — uses erp_vendor_id | SC-2026-01-05-002 |
| GAP-VND-MATCH-003 | Entity scoping prevents ERP vendor matching | ⏸️ **DEFERRED** — Entity/Subsidiary mapping work in progress by another team | SC-2026-01-05-003 |
| GAP-VND-UI-001 | UI does not show vendor ERP sync status | 📋 **PROPOSED** — UI enhancement needed to show if matched vendor is in ERP | SC-2026-01-06-001 |
| GAP-VND-PUSH-001 | PushCardSpendReactor accesses .external_id on Vendor wrapper | ✅ Fixed — use ERP Vendor fields via relationship | SC-2026-01-06-002 |
| GAP-NTROPY-001 | Wrong Ntropy API endpoint (`/enrich` vs `/transactions`) | ✅ Fixed — use `/v3/transactions` | SC-2026-01-06-003 |
| GAP-NTROPY-002 | Wrong JSON path (`entities[0]` vs `entities.counterparty`) | ✅ Fixed — extract from `counterparty` map | SC-2026-01-06-003 |
| GAP-NTROPY-003 | Access.at/1 used on map (crashed reactor) | ✅ Fixed — removed incorrect Access usage | SC-2026-01-06-003 |
| GAP-NTROPY-004 | `labels` field removed but still accessed | ✅ Fixed — use `mccs` instead | SC-2026-01-06-003 |
| GAP-FUZZY-001 | Fuzzy match LIMIT 100 missed vendors | ✅ Fixed — increased to LIMIT 1000, added sorting | SC-2026-01-06-004 |
| GAP-FUZZY-002 | Fuzzy match LIMIT 1000 insufficient for enterprise (need pg_trgm) | ✅ **APPROVED** — Hybrid pg_trgm + Jaro-Winkler with safeguards | SC-2026-01-06-005 |
| GAP-CODING-VENDOR-001 | Vendor incorrectly considered in coding_status calculation | ✅ **Fixed** — Removed vendor from coding status; separate concern | SC-2026-01-07-002 |
| **GAP-REIMB-VENDOR-001** | **ReimbursementItem lacks vendor_id for coding rules** | **✅ Fixed** — Added `vendor_id` attribute, relationship, and migration | **SC-2026-01-09-001** |
| **GAP-DIM-UI-001** | **Entity filtering not applied in transactions_live dimension dropdowns** | **✅ Fixed** — Added `filter_values_by_entity/3` to check `CodingValueEntity` junction | **SC-2026-01-14-001** |
| **GAP-PROJECT-RESOURCE-001** | **NetSuite project "Limit Time and Expenses to Resources" causes "Invalid Field Value" error** | 📋 **DOCUMENTED** — Root cause confirmed; error handling improvement proposed | **SC-2026-01-18-001** |

---

### Artifacts Index

| Session | Artifact | Location |
|---------|----------|----------|
| SC-2025-12-21-001 | Streaming Sync Design | `artifacts/reviews/scale-review-2024-12-21/design-proposal-streaming-sync.md` |
| SC-2025-12-21-001 | Implementation Plan | `artifacts/reviews/scale-review-2024-12-21/implementation-plan.md` |
| SC-2025-12-21-001 | Wiring Diagram | `artifacts/reviews/scale-review-2024-12-21/wiring-diagram.md` |
| SC-2025-12-22-001 | Implementation Spec | `artifacts/reviews/capacity-planning-2024-12-22/IMPLEMENTATION-SPEC.md` |
| SC-2025-12-22-001 | Session Archive | `artifacts/sessions/SC-2025-12-22-001/` |
| SC-2025-12-22-002 | Bridge Design | `artifacts/sessions/SC-2025-12-22-002/DESIGN-PROPOSAL.md` |
| SC-2025-12-22-002 | Implementation Spec | `artifacts/sessions/SC-2025-12-22-002/IMPLEMENTATION-SPEC.md` |
| SC-2025-12-22-002 | Migrations | `artifacts/sessions/SC-2025-12-22-002/MIGRATIONS.md` |
| SC-2025-12-22-002 | Resource Changes | `artifacts/sessions/SC-2025-12-22-002/RESOURCE-CHANGES.md` |
| SC-2025-12-22-002 | Engineering Handoff | `artifacts/sessions/SC-2025-12-22-002/ENGINEERING-HANDOFF.md` |
| SC-2025-12-22-002 | Session Archive | `artifacts/sessions/SC-2025-12-22-002/` |
| SC-2025-12-22-003 | Task Assignments | `artifacts/sessions/SC-2025-12-22-003/TASK-ASSIGNMENTS.md` |
| SC-2025-12-22-003 | Design Decision: Name Fallback | `artifacts/sessions/SC-2025-12-22-003/DESIGN-DECISION-NAME-FALLBACK.md` |
| SC-2025-12-22-003 | Session Archive | `artifacts/sessions/SC-2025-12-22-003/` |
| SC-2025-12-22-004 | **Push Design: Option D** | `artifacts/sessions/SC-2025-12-22-004/DESIGN-PROPOSAL-OPTION-D.md` |
| SC-2025-12-22-004 | Engineering Handoff | `artifacts/sessions/SC-2025-12-22-004/ENGINEERING-HANDOFF.md` |
| SC-2025-12-22-004 | Task Assignments | `artifacts/sessions/SC-2025-12-22-004/TASK-ASSIGNMENTS.md` |
| SC-2025-12-23-002 | **Complete Sync Pipeline** | `artifacts/sessions/SC-2025-12-23-002/ENGINEERING-HANDOFF.md` |
| SC-2025-12-23-002 | Task Assignments | `artifacts/sessions/SC-2025-12-23-002/TASK-ASSIGNMENTS.md` |
| SC-2025-12-23-006 | **Unified Bridge Architecture** | `artifacts/sessions/SC-2025-12-23-006/ENGINEERING-HANDOFF.md` |
| SC-2025-12-23-006 | Task Assignments | `artifacts/sessions/SC-2025-12-23-006/TASK-ASSIGNMENTS.md` |
| SC-2026-01-05-001 | **Vendor Matching Provider Pattern** | `artifacts/sessions/SC-2026-01-05-001/SESSION-DECISION.md` |
| SC-2026-01-06-001 | **Vendor/Merchant Matching Tables Review** | `artifacts/sessions/SC-2026-01-06-001/SESSION-SUMMARY.md` |
| SC-2026-01-06-001 | **UI Enhancement: Vendor ERP Status** | `artifacts/sessions/SC-2026-01-06-001/UI-ENHANCEMENT-PROPOSAL.md` |

---

### Session History

| Session ID | Focus | Outcome |
|------------|-------|---------|
| SC-2025-12-21-001 | Scale Review & Streaming Design | ✅ Complete — Streaming sync implemented |
| SC-2025-12-22-001 | Capacity Planning & Tiered Sync | ✅ Complete — 2-min SLA achievable |
| SC-2025-12-22-002 | Cross-Workspace Bridge Design | ✅ Complete — Bridge architecture designed |
| SC-2025-12-22-003 | Bridge Implementation | ✅ Complete — Fully implemented & verified |
| SC-2025-12-22-004 | Push Architecture Evaluation | ✅ Complete — Option D proposed |
| SC-2025-12-23-002 | Complete Sync Pipeline | 🔧 Handoff — Engineering implementation pending |
| SC-2025-12-23-006 | Unified Bridge Architecture | ✅ Complete — Push reconciliation unified into bridge |
| SC-2025-12-23-007 | Entity-Specific Reconciliation | ✅ Complete — 10 services + line item linking |
| SC-2025-12-29-002 | PushEntityRecord Architecture | ⚠️ Partial — Claims of completion were false |
| SC-2025-12-31-001 | Flow-02 + Integrity Audit | ✅ Complete — Fixed 5 reconciliation services |
| SC-2026-01-01-001 | Flow-03 Implementation | ✅ Complete — Added :blocked status, 6 tests, 3 subcommittees verified |
| SC-2026-01-05-001 | Vendor Bridge Validation & Provider Adapter Pattern | ✅ Complete — Approved Ntropy integration |
| SC-2026-01-05-002 | Vendor Matching Implementation | ✅ Complete — Simplified inline implementation (no ProviderBehaviour) |
| SC-2026-01-05-003 | Ntropy Implementation Verification & Closure | ✅ Complete — Production-ready, GAP-VND-MATCH-003 deferred to Entity/Subsidiary work |
| SC-2026-01-05-005 | Post-Push Data Discrepancy | ✅ Complete — Identified 9 gaps in expense report push |
| SC-2026-01-06-001 | Vendor/Merchant Matching Tables Review | ✅ Complete — Confirmed Vendor wrapper is correct target; UI enhancement proposed |
| SC-2026-01-06-002 | PushCardSpendReactor external_id Fix | ✅ Complete — Fixed GAP-VND-PUSH-001 |
| SC-2026-01-06-003 | **Ntropy v3 API Integration & Bug Fixes** | ✅ Complete — Fixed 4 Ntropy gaps (endpoint, JSON path, Access.at, labels) |
| SC-2026-01-06-004 | **Fuzzy Match Query Limit Fix** | ✅ Complete — Fixed GAP-FUZZY-001 (LIMIT 100→1000) |
| SC-2026-01-06-005 | **Fuzzy Match Scalability Review** | ✅ Complete — Approved hybrid pg_trgm + Jaro-Winkler solution |
| SC-2026-01-06-014 | Expense Category & Dimension Mapping | ✅ **CLOSED** — Fixed UUID→external_id, GL→Category mapping, Money→Decimal conversion |
| SC-2026-01-07-002 | **Decouple Vendor from Coding Status** | ✅ Complete — Removed vendor from coding_status; separate concern |
| SC-2026-01-08-015 | Reimbursement Sync Polishing | 🔄 **IN PROGRESS** — Complete dimension mapping, payment linking, project support |
| SC-2026-01-13-003 | **ACH Funding Account Not Used in Bill Payment** | ✅ CLOSED — Fixed GAP-ACH-001, GAP-ACH-002, GAP-TAX-001; GAP-PMT-001 open |
| SC-2026-01-18-001 | **NetSuite Project "Invalid Field Value" Error** | ✅ **ROOT CAUSE CONFIRMED** — "Limit Time and Expenses to Resources" setting + employee not assigned as resource |
| SC-2026-01-19-001 | **Bill Payment Push Failure — Apply Sublist Error** | ✅ **FIXED** — Removed invalid `refnum` field from VendorPayment apply sublist |
| SC-2026-01-23-001 | **Vendor Wrapper Denormalization — display_name** | ✅ **COMPLETE** — Added `display_name` to ap_vendors; eliminates N+1 queries; DEC-2026-002 |
| SC-2026-01-19-002 | **Duplicate Bill Error — Idempotent Recovery** | ✅ **FIXED** — Handle "record already exists" by querying externalId and recovering |

---

## Current Session Context

### Session SC-2026-01-19-002: Duplicate Bill Error — Idempotent Recovery

**Date:** January 19, 2026  
**Status:** ✅ IMPLEMENTED  
**Focus:** "This record already exists" error on retry after partial failure

#### Problem Statement

When pushing card transactions to NetSuite:
1. Bill push times out or crashes after NetSuite creates the bill
2. PushEntityRecord is NOT created
3. On retry, reactor finds no PushEntityRecord → chooses CREATE mode
4. NetSuite rejects with: `"This record already exists"`

**Error:**
```json
{
  "o:errorDetails": [{
    "detail": "Error while accessing a resource. This record already exists.",
    "o:errorCode": "USER_ERROR"
  }]
}
```

#### Root Cause

**GAP-NS-DUPLICATE-BILL-001:** Partial failure scenario where:
- NetSuite creates bill with deterministic `externalId` (e.g., `tp_550e8400_61bb0575`)
- PushEntityRecord creation fails (timeout, crash, compensation)
- Retry has no record → tries CREATE → fails on externalId uniqueness

#### Fix Applied

```elixir
# push_card_spend_reactor.ex - Added duplicate recovery handling

# 1. Detect duplicate error in push result handling
{:error, {:http_error, 400, %{"o:errorDetails" => details}}} = error when is_list(details) ->
  if is_duplicate_record_error?(details) do
    handle_duplicate_bill_recovery(config, push_request, raw_bill_data, period_info, erp_data)
  else
    error
  end

# 2. Query NetSuite by externalId to get internal ID
defp query_bill_by_external_id(config, external_id) do
  query = "SELECT id FROM Transaction WHERE type = 'VendBill' AND externalId = '#{external_id}'"
  Adapter.query_suiteql(config, query, limit: 1)
end

# 3. Create PushEntityRecord with recovered ID
# 4. Proceed to payment scheduling as normal
```

#### Key Knowledge

1. **NetSuite externalId is deterministic:** `tp_{workspace_short}_{source_short}`
2. **SuiteQL query is case-sensitive** on externalId
3. **Mark recovered records** with `recovered_from_duplicate: true` in metadata
4. **Operation type** is `:create_recovered` for audit trail

---

### Session SC-2026-01-19-001: Bill Payment Push Failure — Apply Sublist Error

**Date:** January 19, 2026  
**Status:** ✅ IMPLEMENTED  
**Focus:** Card transaction payments failing with "invalid sublist operation" error

#### Problem Statement

When pushing card transactions to NetSuite:
1. Bill created successfully (e.g., ID `627570`)
2. `ApplyBillPaymentWorker` scheduled 30 seconds later
3. Worker attempts POST `/vendorPayment`
4. **FAILS** with: `"You have attempted an invalid sublist or line item operation"`

**Error Path:** `o:errorPath: "apply"`

#### Investigation (Committee Session)

**Request Body Analysis:**
```json
{
  "apply": {
    "items": [{
      "amount": 75.0,
      "apply": true,
      "doc": {"id": "627570"},
      "refnum": "CARD-a0631167"  // <-- PROBLEM!
    }]
  },
  "entity": {"id": "76012"},
  "externalid": "CARD-PAY-627570-215206c2",
  "memo": "Card payment for CARD-a0631167",
  "trandate": "2026-01-19"
}
```

**Comparison with Working Implementation:**

| Module | `refnum` in apply items? | Status |
|--------|--------------------------|--------|
| `expense_report_payments.ex` | ❌ No | ✅ Works |
| `ap_payments.ex` | ✅ Yes | ❌ Fails |

#### Root Cause

**GAP-NS-APPLY-REFNUM-001:** The `refnum` field was being added to VendorPayment apply sublist items via:

```elixir
# ap_payments.ex line 447 (BEFORE FIX)
|> add_field("refnum", app[:reference] || app["reference"])
```

The `refnum` field is a **READ-ONLY** display field that NetSuite populates automatically (showing the bill's transaction number). Attempting to SET it via REST API causes "invalid sublist operation" error.

#### Fix Applied

```elixir
# ap_payments.ex build_apply_items/1 (AFTER FIX)
defp build_apply_items(data) do
  applications = data[:applications] || data["applications"] || []

  Enum.map(applications, fn app ->
    %{
      "doc" => build_record_ref(app[:bill_external_id] || app["bill_external_id"]),
      "apply" => true,
      "amount" => format_amount_as_number(app[:amount] || app["amount"])
    }
    # REMOVED: |> add_field("refnum", ...)
  end)
  |> Enum.reject(fn item -> is_nil(item["doc"]) end)
end
```

#### Committee Vote

**UNANIMOUS (11-0):** Remove `refnum` field from apply items.

**Participating Members:**
- Sync Architect, NetSuite Domain Expert, Data Mapping Specialist
- Edge Case Hunter, Accounts Payable Expert, Test Coverage Analyst
- Standards Enforcer, Code Fidelity Auditor, End User Advocate
- Finance Operations Generalist, Path Defender

---

### Session SC-2026-01-18-001: NetSuite Project/Customer Invalid Field Value Error

**Date:** January 18, 2026  
**Status:** ✅ ROOT CAUSE CONFIRMED  
**Focus:** NetSuite rejects expense report push with "Invalid Field Value 53384 for the following field: customer"

#### Problem Statement

When pushing an expense report to NetSuite, the API returned:
```json
{
  "o:errorDetails": [{
    "detail": "Invalid Field Value 53384 for the following field: customer.",
    "o:errorCode": "USER_ERROR",
    "o:errorPath": "expense.items[2]"
  }]
}
```

#### Root Cause (CONFIRMED ✅)

On the **Project (Job) record** in NetSuite, under **Project Preferences**, two settings control whether a project can be used on expense reports:

##### 1. Allow Expenses Checkbox

| Setting | Effect |
|---------|--------|
| ✅ Checked | Project CAN be used on expense reports |
| ❌ Unchecked | Project CANNOT be used - REST API returns "Invalid Field Value" error |

##### 2. Limit Time and Expenses to Resources Checkbox

| Setting | Effect |
|---------|--------|
| ❌ Unchecked | ANY employee can enter expenses against this project |
| ✅ Checked | ONLY employees assigned as **Resources** on the project can enter expenses |

**When "Limit Time and Expenses to Resources" is checked and the submitting employee is NOT assigned as a resource:**
- UI: The project shows "No matching records" in the selector
- API: NetSuite returns error as if the "customer" doesn't exist

#### Resolution Applied

1. Navigate to project record in NetSuite
2. Go to **Project Preferences** subtab
3. ✅ Check "Allow Expenses"
4. ❌ Uncheck "Limit Time and Expenses to Resources" (or add the employee as a Resource)

#### How to Reproduce

1. Pick a project/job (e.g., internal ID 53384)
2. On that project, do ONE of:
   - Uncheck "Allow Expenses", OR
   - Check "Limit Time and Expenses to Resources" while the submitting employee is NOT a project resource
3. Attempt to create an Expense Report:
   - **UI**: Open expense report → attempt to select project in Customer/Project field → shows "No matching records"
   - **API**: POST expense report with `"customer": {"id": "53384"}` → NetSuite returns "Invalid Field Value" error

#### Investigation Journey

| Check | Result | Was it the cause? |
|-------|--------|-------------------|
| `isinactive` field | `F` (active) | ❌ No |
| `allowexpenses` field | `T` (true) | ❌ Not directly queryable issue |
| Subsidiary match | Both job and expense report in subsidiary 6 | ❌ No |
| Employee subsidiary | Employee in subsidiary 6 | ❌ No |
| Entity status | "Won" (5) vs typical "In Progress" (2) | ❌ No (red herring) |
| Currency mismatch | Job uses EUR (4), expense uses GBP (2) | ❌ No |
| Parent customer status | Active, same subsidiary | ❌ No |
| **Limit Time and Expenses to Resources** | **CHECKED, employee NOT a resource** | ✅ **ROOT CAUSE** |

#### Key Learning

The `allowexpenses` field queryable via SuiteQL (`job.allowexpenses`) only reflects the "Allow Expenses" checkbox, **NOT** the resource restriction. The "Limit Time and Expenses to Resources" setting creates a **dynamic filter based on the current user context**, which cannot be queried statically via SuiteQL.

#### Recommendations for Teampay

| Priority | Recommendation | Description |
|----------|----------------|-------------|
| **Short-term** | Improve error messaging | When NetSuite returns "Invalid Field Value" for customer field, show user-friendly message about project restrictions |
| **Medium-term** | Pre-push validation | Before pushing, warn if project has known restrictions |
| **Long-term** | Sync resource assignments | Consider syncing project resource assignments to enable pre-validation |

#### Related Artifacts

- Full finding documentation: `artifacts/findings/SC-2026-01-18-001-netsuite-project-expense-restrictions.md`

#### New Gap Created

| Gap ID | Description | Priority |
|--------|-------------|----------|
| **GAP-PROJECT-RESOURCE-001** | No validation for project resource restrictions before push | Medium |

---

---

## Session Context Archive: SC-2026-01-29-005

**Session:** SC-2026-01-29-005  
**Date:** January 29, 2026  
**Status:** ✅ IMPLEMENTED  
**Focus:** Root Cause Analysis - Reimbursement Sync Status Determination

### Executive Summary

After four sequential incremental fixes (SC-2026-01-29-001 through 004), the committee convened an emergency session to perform a full root cause analysis. The issue: when using `:reimbursement_complete` entity type (full mode), the UI showed "Post Payment" even after both expense report AND payment were successfully pushed to NetSuite.

### Root Cause

**Location:** `reimbursements_live.ex` → `build_push_status_lookup_by_entity_type/1`

The enrichment logic used `:reimbursement_complete` push request as fallback for `expense_report_push_status` but NOT for `expense_report_payment_push_status`. Since `:reimbursement_complete` pushes BOTH expense report AND payment when status is `:pushed`, both statuses should be derived from it.

### Impact Chain

```
:reimbursement_complete push (status: :pushed)
    │
    ├─► expense_report_push_status = :pushed ✓ (legacy fallback worked)
    │
    └─► expense_report_payment_push_status = nil ✗ (NO fallback!)
              │
              ▼
        compute_payment_sync_status() → "not_synced"
              │
              ▼
        UI shows "Post Payment" instead of "Posted" ✗
```

### Fix Applied

```elixir
# Derive payment status from legacy :reimbursement_complete
# :pushed = BOTH succeeded, :partial = only expense report succeeded
legacy_payment_status = case get_push_status(legacy_request) do
  :pushed -> :pushed
  _ -> nil
end

expense_report_payment_push_status: get_push_status(payment_request) || legacy_payment_status
```

### Files Changed

| File | Change |
|------|--------|
| `reimbursements_live.ex` | `build_push_status_lookup_by_entity_type/1` - added legacy fallback for payment status |

### Lessons Learned

1. **Root cause analysis first** - Four incremental fixes were applied before tracing the complete data flow
2. **Two-phase sync complexity** - Multiple entity types require consistent fallback handling
3. **Test complete flows** - Must test from user click to UI update, not individual components

### Artifact

Full session summary: `artifacts/sessions/SC-2026-01-29-005/SESSION-SUMMARY.md`

---

---

## Session Context Archive: SC-2026-01-27-002

**Session:** SC-2026-01-27-002  
**Date:** January 27, 2026  
**Status:** ✅ IMPLEMENTED  
**Focus:** Human-Readable Error Messages for Duplicate Push Requests

### Executive Summary

User reported that when attempting to sync a reimbursement that already has a push request, the UI displayed a raw Ash error struct: `Failed to sync to ERP: %Ash.Error.Invalid{...message: "has already been taken"...}`. This was confusing and alarming for end users.

Committee implemented a two-phase solution:
1. **Idempotency pre-check** in `PushOrchestrator` to detect existing push requests BEFORE triggering unique constraint violations
2. **Human-readable error formatter** (`ErpErrorFormatter`) to convert technical errors into user-friendly messages

### Problem Analysis

The "has already been taken" error occurs because `PushRequest` has a unique identity constraint on:
```
[:source_domain, :source_resource_type, :source_resource_id, :erp_connection_id]
```

When a user clicks "Sync to ERP" twice (or there's a race condition), the second create attempt violates this constraint. The raw Ash error struct was displayed directly to users.

### Solution Design

**End User Advocate Recommendation:**
- Treat "push request already exists" as informational, not an error
- Show friendly messages based on existing request status:
  - `:pushed` → "This item has already been synced to the ERP."
  - `:processing` → "Sync is currently in progress. Please wait for it to complete."
  - `:pending` → "Sync is already queued and will be processed shortly."
  - `:failed` → "A previous sync attempt failed. You can retry by clicking 'Sync to ERP' again."

**Sync Architect Recommendation:**
- Add idempotency pre-check in `PushOrchestrator.push_entity/9`
- Query for existing PushRequest BEFORE attempting create
- Return `{:ok, {:already_queued, existing_request}}` instead of error

### Files Modified

| File | Change |
|------|--------|
| `ember_erp/services/push_orchestrator.ex` | Added `check_existing_push_request/5` idempotency check |
| `ember_erp/services/erp_error_formatter.ex` | NEW: `format_sync_result/1` for human-readable messages |
| `ember_erp/services/manual_sync_service.ex` | Handle `{:already_queued, ...}` response |
| `flame_teampay_payables_web/live/expense_v2/reimbursements_live.ex` | Use `ErpErrorFormatter` for all sync results |

### User Experience Improvement

| Scenario | Before | After |
|----------|--------|-------|
| Already pushed | `%Ash.Error.Invalid{...}` (error flash) | "This item has already been synced to the ERP." (info flash) |
| In progress | `%Ash.Error.Invalid{...}` (error flash) | "Sync is currently in progress." (info flash) |
| Already queued | `%Ash.Error.Invalid{...}` (error flash) | "Sync is already queued and will be processed shortly." (info flash) |
| Failed previously | `%Ash.Error.Invalid{...}` (error flash) | "A previous sync attempt failed. You can retry." (warning flash) |

### Key Code Pattern

```elixir
# PushOrchestrator - Idempotency pre-check
defp check_existing_push_request(domain, source_resource_type, source_resource_id, erp_connection_id, workspace_id) do
  case PushRequest
       |> Ash.Query.filter(...)
       |> Ash.read_one(tenant: workspace_id, authorize?: false) do
    {:ok, nil} -> {:ok, :no_existing_request}
    {:ok, existing_request} -> {:existing_request, existing_request}
    {:error, _} -> {:ok, :no_existing_request}  # Fail open
  end
end
```

```elixir
# ErpErrorFormatter - Human-readable messages
def format_sync_result({:ok, {:already_queued, %PushRequest{status: :pushed}}}) do
  {:info, "This item has already been synced to the ERP."}
end
```

---

## Session Context Archive: SC-2026-01-27-001

**Session:** SC-2026-01-27-001  
**Date:** January 27, 2026  
**Status:** ✅ IMPLEMENTED  
**Focus:** Logging Verbosity for ERP Push/Sync Errors (DevOps Request)

### Executive Summary

DevOps team requested enhanced logging verbosity across ERP push/sync operations. Committee analyzed errors reported by user (reimbursement duplicate constraint, transaction timeout) and produced a comprehensive plan covering 26 logging gaps across 17 files.

### Reported Errors

1. **Reimbursement Unique Constraint Violation:**
   - `Ash.Error.Changes.InvalidAttribute` with message "has already been taken"
   - Constraint: `ember_erp_push_requests_unique_source_push_index`
   - Root cause: Race condition in `PushOrchestrator` lacking idempotency check

2. **Transaction Timeout Error:**
   - `Reactor.Error.Invalid.RunStepError` with `Req.TransportError{reason: :timeout}`
   - Root cause: NetSuite API timeouts (30s default) insufficient for complex operations

3. **Dwolla Webhook Signature Validation:**
   - DevOps specifically flagged insufficient logging context
   - Current: `Logger.error("Dwolla webhook signature validation failed")`
   - Missing: Expected/received values, customer context

### DevOps Requirements for Logging

1. Adequate verbosity (info, error, debug levels)
2. Descriptive strings indicating what's happening
3. Always print received vs expected values
4. Messages containing actionable information

### Approved Plan: 26 Gaps Across 17 Files

| Category | Files | Gaps | Priority |
|----------|-------|------|----------|
| **Dwolla** | 4 | 5 | HIGH (DevOps flagged) |
| **ERP Push Orchestration** | 5 | 7 | HIGH |
| **NetSuite Client Layer** | 4 | 4 | HIGH |
| **NetSuite Push Capabilities** | 10 | 10 | HIGH-MEDIUM |

**Exclusions:** Sage Intacct, QuickBooks, Acumatica (per user request)

### Gap Details

#### Dwolla (5 gaps)
| Gap ID | File | Issue |
|--------|------|-------|
| GAP-DWOLLA-LOG-001 | `dwolla/adapter.ex` | Webhook signature validation missing context |
| GAP-DWOLLA-LOG-002 | `dwolla/capabilities/identity_verification.ex` | Identity verification errors lack customer context |
| GAP-DWOLLA-LOG-003 | `dwolla/client.ex` | Error logging only shows `inspect(error)` |
| GAP-DWOLLA-LOG-004 | `dwolla/capabilities/funding_source_management.ex` | Webhook validation inconsistent with adapter.ex |
| GAP-DWOLLA-LOG-005 | `dwolla/adapter.ex` | Debug-level values should be at error level |

#### ERP Push Orchestration (7 gaps)
| Gap ID | File | Issue |
|--------|------|-------|
| GAP-PUSH-LOG-001 | `services/push_orchestrator.ex` | PushRequest creation failure lacks resource context |
| GAP-PUSH-LOG-002 | `reactors/expense/push_reimbursement_complete_reactor.ex` | Compensate blocks lack error detail |
| GAP-PUSH-LOG-003 | `reactors/ap/push_card_spend_reactor.ex` | Vendor resolution failure lacks context |
| GAP-PUSH-LOG-004 | `services/push_orchestrator.ex` | Unique constraint error missing idempotency guidance |
| GAP-PUSH-LOG-005 | `integrations/erp/push_on_status_change.ex` | Task.start errors not logged |
| GAP-PUSH-LOG-006 | `workers/apply_bill_payment_worker.ex` | Timeout/error handling lacks context |
| GAP-EXEC-LOG-001 | `resources/push_request/manual_actions/execute_push.ex` | Reactor failure missing entity/provider context |

#### NetSuite Client Layer (4 gaps)
| Gap ID | File | Issue |
|--------|------|-------|
| GAP-NS-LOG-001 | `netsuite/client.ex` | Timeout errors lack structured logging |
| GAP-NS-LOG-002 | `netsuite/soap_client.ex` | SOAP timeout errors lack context |
| GAP-NS-LOG-003 | `netsuite/adapter.ex` | SuiteQL timeout errors lack context |
| GAP-NS-LOG-004 | `netsuite/token_cache.ex` | OAuth refresh failures lack debugging info |

#### NetSuite Push Capabilities (10 gaps)
| Gap ID | File | Issue |
|--------|------|-------|
| GAP-NS-PUSH-001 | `capabilities/push/expense_reports.ex` | API errors missing payload context |
| GAP-NS-PUSH-002 | `capabilities/push/expense_report_payments.ex` | Payment failures lack linkage context |
| GAP-NS-PUSH-003 | `capabilities/push/bills.ex` | Bill creation errors lack vendor/amount context |
| GAP-NS-PUSH-004 | `capabilities/push/vendors.ex` | Vendor creation errors lack entity details |
| GAP-NS-PUSH-005 | `capabilities/push/ap_payments.ex` | Payment errors lack bill/vendor context |
| GAP-NS-PUSH-006 | `capabilities/push/files.ex` | File upload errors lack file details |
| GAP-NS-PUSH-007 | `capabilities/push/journal_entry.ex` | JE errors lack line item context |
| GAP-NS-PUSH-008 | `capabilities/push/vendor_credits.ex` | Credit errors lack source context |
| GAP-NS-PUSH-009 | `capabilities/push/employees.ex` | Employee push errors lack detail |
| GAP-NS-PUSH-010 | `capabilities/push/document_links.ex` | Link errors lack document context |

### Logging Standard Template

```elixir
Logger.error("[Component] Operation failed - detailed description",
  trace_id: trace_id,
  workspace_id: workspace_id,
  push_request_id: push_request_id,
  entity_type: :expense_report,
  received: inspect(actual_value),
  expected: "description of expected value",
  error_code: error_code,
  error_message: error_message,
  is_timeout: is_timeout_error?(reason),
  suggested_action: "Check X or contact Y"
)
```

### Implementation Phases

| Phase | Files | Gaps | Focus |
|-------|-------|------|-------|
| **Phase 1** | 6 | 9 | Critical: Dwolla + ExecutePush + Client timeouts |
| **Phase 2** | 5 | 8 | Push capabilities: expense_reports, payments, bills, vendors |
| **Phase 3** | 6 | 9 | Remaining: Other capabilities + orchestrator + reactors |

### Committee Members Active

| Member | Contribution |
|--------|--------------|
| **Chair** | Convened session, managed agenda |
| **Engineering Lead** | Produced comprehensive logging plan |
| **Completeness Auditor** | Identified additional gaps beyond original errors |
| **Observability Auditor** | Validated logging patterns meet DevOps requirements |

### Implementation Summary

All 26 logging gaps implemented across 17 files. Changes are purely additive (only Logger calls enhanced) with no business logic modifications.

**Key Patterns Applied:**
- Added `is_timeout` flag to detect `Req.TransportError{reason: :timeout}`
- Added `suggested_action` field with actionable guidance
- Added context identifiers (`push_request_id`, `workspace_id`, `entity_type`, etc.)
- Added `error_type` and `error_reason` for structured debugging
- Added `received`/`expected` values where applicable (per DevOps request)

**Testing Recommended:**
- [ ] Trigger a reimbursement push and verify enhanced logs in Grafana
- [ ] Trigger a timeout error (e.g., by reducing timeout) and verify logging
- [ ] Test Dwolla webhook with invalid signature and verify logging

---

---

## Session Context Archive: SC-2026-01-16-005

**Session:** SC-2026-01-16-005  
**Date:** January 16, 2026  
**Status:** ✅ APPROVED & CLOSED  
**Focus:** Elliot's Identity Model Compliance Review — Employee/Identity/ERP Separation

### Executive Summary

Full committee review of current implementation against Elliot's proposed strict identity model. Human Director approved all findings and implementation.

### Key Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Keep IdentityBinding** | Required for per-workspace access control | Cancelled Phase 4 of User/Employee Refactoring |
| **Remove User Profile ERP** | End-user self-service violates admin-only requirement | Removed ~350 lines from `user_profile_edit_live.ex` |
| **Admin-controlled sync verified** | `workforce_live.ex` already has correct flow | No changes needed |

### Elliot's Identity Model — Architectural Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELLIOT'S IDENTITY MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   WORKFORCE DOMAIN                                               │
│   • Central employee table (no "temporary users" tables)         │
│   • Fed from Teams/Slack, CSV, ERP                              │
│   • One human can have multiple Employee records (one per entity)│
│   • Workforce CREATES/LINKS Identity.User, does NOT govern it   │
│                                                                  │
│   IDENTITY DOMAIN                                                │
│   • Login and permissions object                                 │
│   • Globally unique across entire ecosystem                      │
│   • One Identity.User can link to many Workforce.Employees       │
│   • On deprovisioning: mark binding inactive, don't delete user  │
│                                                                  │
│   ERP DOMAIN                                                     │
│   • Faithful sync first ("safe harbor")                         │
│   • Then bridge to Workforce.Employee                           │
│   • End users CANNOT self-assign or create ERP employees        │
│   • Admin/setup task only                                        │
│                                                                  │
│   PROVISIONING                                                   │
│   • Creates/links Employee ↔ Identity ↔ Workspace               │
│   • Grants access via IdentityBinding                           │
│                                                                  │
│   DEPROVISIONING                                                │
│   • Marks IdentityBinding as :terminated                        │
│   • Does NOT delete Identity.User                               │
│   • Does NOT delete Workforce.Employee                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### IdentityBinding Architecture — Why Keep It

```
Identity.User (Global)
       │
       │ 1:many
       ▼
IdentityBinding (Per-Workspace)
• status: :active | :suspended | :terminated
• binding_type: :hris_sync | :manual | :invitation
       │
       │ 1:1
       ▼
Workforce.Employee (Per-Entity)
       │
       │ 1:1
       ▼
Erp.Employee (Per-ERP-Connection)
```

**Why IdentityBinding is essential:**
1. **Per-workspace access control** — One user can be active in Workspace A but terminated in Workspace B
2. **Authentication enforcement** — OAuth and Magic Link reactors check `binding.status`
3. **Audit trail** — Binding status changes tracked, not user deletion
4. **Multi-entity support** — User works for multiple companies via different bindings

### Authentication Flow Verification

Both `authenticate_with_oauth_reactor.ex` and `authenticate_with_magic_link_reactor.ex` include:

```elixir
step :verify_identity_binding do
  # Load binding for user + workspace
  binding = get_identity_binding(user, workspace_id)
  
  # Block if binding is terminated or suspended
  if binding.status in [:terminated, :suspended] do
    {:error, :access_denied}
  else
    {:ok, binding}
  end
end
```

This confirms Elliot's model is already implemented for access control.

### Gaps Inventory

| Gap ID | Description | Status | Session |
|--------|-------------|--------|---------|
| **GAP-ERP-SELF-CREATE-001** | User Profile allows ERP self-service | ✅ REMOVED | SC-2026-01-16-005 |
| **GAP-PHASE4-CONFLICT** | Documentation conflict about IdentityBinding | ✅ FIXED | SC-2026-01-16-005 |
| **GAP-IDENT-GOV-001** | TerminateEmployeeReactor sets User.active=false | ⏸️ DEFERRED | SC-2026-01-16-005 |
| **GAP-ERP-NOTIFY-001** | No admin notification for auto-created ERP employees | ⏸️ DEFERRED | SC-2026-01-16-005 |

### Files Changed

| File | Change |
|------|--------|
| `user_profile_edit_live.ex` | Removed ERP self-service (~350 lines) |
| `plan.md` | Phase 4 marked CANCELLED |
| `session_state.md` | Session closed |
| `SESSION-SUMMARY.md` | Full session documentation |

### Session Artifacts

- `artifacts/sessions/SC-2026-01-16-005/SESSION-SUMMARY.md` — Complete session documentation

---

### Session SC-2026-01-15-002: NetSuite User Linking Architecture (ARCHIVED)

**Topic:** Employee linking architecture for production-ready NetSuite push

**Human Request:** Review and design the correct approach for pushing to NetSuite without requiring manual employee linking workaround (dev tool). The current implementation requires linking a NetSuite user to an existing Teampay user via dev tools, which is not production-ready.

---

#### Turn 1: Intake Coordinator + Chair

**Materials Gathered:**

##### 1. Current Employee Linking Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CURRENT EMPLOYEE LINKING FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WorkforceEmployee (Teampay User)                                           │
│       │                                                                     │
│       │ erp_employee_id (FK) ─────── MUST BE SET ────────────────┐         │
│       │                              (manual workaround)          │         │
│       ▼                                                           ▼         │
│  ErpEmployee (NetSuite Employee Mirror)                                     │
│       │                                                                     │
│       │ external_id (NetSuite internal ID)                                  │
│       ▼                                                                     │
│  NetSuite Expense Report Push                                               │
│       - Uses external_id as employee reference                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  CURRENT WORKAROUNDS (NOT PRODUCTION-READY):                                │
│                                                                             │
│  1. DevUtilities.ex (dev_utilities.ex)                                      │
│     └── UI component, only visible in Mix.env() == :dev                     │
│     └── Dropdown to select WorkforceEmployee + ErpEmployee                  │
│     └── Calls link_erp_employee action                                      │
│                                                                             │
│  2. mix erp.link_employee task                                              │
│     └── CLI tool for manual linking                                         │
│     └── Requires shell access, not available to end users                   │
│                                                                             │
│  3. EmployeeLinkingService.reconcile_all/2                                  │
│     └── Batch job that matches by employee_number OR email                  │
│     └── Only works when data matches exactly (often doesn't)                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  WHY IT FAILS:                                                              │
│                                                                             │
│  • Names often differ: "Finance Admin" in Teampay vs "Jan Bucoy" in NS      │
│  • Email may not match: personal email in NS, work email in Teampay         │
│  • Employee numbers: may not be set in either system                        │
│  • Auto-creation: creates DUPLICATES instead of linking existing            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 2. Key Code Paths Discovered

| Component | File | Purpose |
|-----------|------|---------|
| `WorkforceEmployee` | `ember_workforce/resources/employee/employee.ex` | Teampay's internal user record |
| `ErpEmployee` | `ember_erp/resources/accounting/parties/employee.ex` | Synced mirror of NetSuite Employee |
| `EmployeeLinkingService` | `ember_workforce/services/employee_linking_service.ex` | Auto-matching by number/email |
| `DevUtilities` | `expense_v2/reimbursements/dev_utilities.ex` | Dev-only UI for manual linking |
| `erp.link_employee` | `mix/tasks/erp.link_employee.ex` | CLI tool for manual linking |
| `PushReimbursementCompleteReactor` | `reactors/expense/push_reimbursement_complete_reactor.ex` | Uses employee link for push |

##### 3. Current Resolution Logic in Reactor

```elixir
# From push_reimbursement_complete_reactor.ex

# Step 1: Try direct FK link (erp_employee.external_id)
case workforce_employee.erp_employee do
  %{external_id: ext_id} when not is_nil(ext_id) ->
    # Best case: Direct link exists
    {ext_id, employee_subsidiary_id}
    
  _ ->
    # Step 2: Legacy fallback - try employee_number
    case find_by_employee_number(workforce_employee.employee_number, erp_connection_id, workspace_id) do
      {:ok, accounting_employee} when not is_nil(accounting_employee) ->
        {accounting_employee.external_id, employee_subsidiary_id}
        
      _ ->
        # Step 3: Try email match
        case find_by_email(workforce_employee.email, erp_connection_id, workspace_id) do
          {:ok, accounting_employee} when not is_nil(accounting_employee) ->
            {accounting_employee.external_id, employee_subsidiary_id}
            
          _ ->
            # Step 4: NOT FOUND - mark for auto-creation
            {:not_found, workforce_employee}
        end
    end
end
```

##### 4. Auto-Creation Behavior (Current)

When no link is found, the reactor attempts to auto-create the employee in NetSuite:

```elixir
# From push_reimbursement_complete_reactor.ex

defp create_employee_in_netsuite(workforce_employee, subsidiary_id, ...) do
  employee_data = %{
    first_name: workforce_employee.first_name || "Unknown",
    last_name: workforce_employee.last_name || "Employee",
    email: workforce_employee.email,
    phone: workforce_employee.phone_number,
    subsidiary_id: subsidiary_id,
    teampay_user_id: workforce_employee.id
  }
  
  # This creates a NEW employee in NetSuite
  # Problem: May create duplicates if employee already exists with different data
  adapter.push_employee(config, employee_data, [])
end
```

##### 5. Gap Analysis: Why Current Approach Fails for Production

| Issue | Impact | Severity |
|-------|--------|----------|
| Dev tools hidden in production | Admins cannot link employees in production UI | 🔴 Critical |
| Auto-creation creates duplicates | NetSuite accumulates orphan employee records | 🔴 Critical |
| Name/email mismatch common | Auto-matching fails for most real customers | 🟠 High |
| No visibility into link status | Users don't know if their employee is linked | 🟠 High |
| No bulk import from NetSuite | Cannot seed from NetSuite's employee list | 🟡 Medium |

---

**Questions for Committee:**

1. Should we expose employee linking in the production Admin UI (ERP Setup)?
2. Should we add a "smart match" algorithm with confidence scoring?
3. Should we allow users to search and select from NetSuite employees during setup?
4. Should we auto-create a default "Teampay Expense" employee instead of per-user creation?
5. What's the expected NetSuite workflow for customers who use employees vs contacts?

**Recommended Initial Routing:**

| Member | Reason |
|--------|--------|
| **NetSuite Domain Expert** | NetSuite-specific knowledge of employee vs contact patterns |
| **Implementation Consultant** | Customer onboarding perspective - how do customers expect this to work? |
| **End User Advocate** | User experience - what workflow makes sense for admins? |
| **Sync Architect** | Technical design - how should this integrate with existing sync? |
| **Expense Management Expert** | Domain knowledge - how does expense workflow affect this? |

**Prepared Materials Status:** ✅ Ready for deliberation

**Handoff:** → Committee members for parallel input

---

### Session SC-2026-01-13-003: ACH Funding Account Not Used in Bill Payment Push (COMPLETED)

**Topic:** Bill Payment shows "111 Another Account" instead of the ACH Funding Account selected in ERP Setup.

**Human Request:** Investigate why Bill Payment account value doesn't match the ACH Funding Account selection in ERP Setup.

**Root Cause Identified:**

Two separate systems exist for account configuration:

| System | Purpose | Storage | Used By |
|--------|---------|---------|---------|
| **AccountMapping** | User's ERP configuration | `ember_erp_account_mappings` | ERP Setup UI |
| **BankAccount** | Synced bank accounts from ERP | `ember_erp_accounting_bank_accounts` | Payment push reactor (OLD) |

The `resolve_bank_account_external_id/3` function queried **BankAccount** (synced accounts) instead of **AccountMapping** (user's selection).

**Evidence from NetSuite Debug Logs:**
```json
"accountId": ""  // Empty because ACH mapping wasn't consulted
```

**Fix Implemented:**

| File | Change |
|------|--------|
| `push_reimbursement_complete_reactor.ex` | Added `AccountMapping` and `GLAccount` aliases |
| `push_reimbursement_complete_reactor.ex` | Added `resolve_ach_funding_account/3` function |
| `push_reimbursement_complete_reactor.ex` | Updated call sites to use new resolver |

**Resolution Flow:**
1. Query `AccountMapping` for `:ach_funding_account` configuration
2. Get `gl_account_id` from the mapping
3. Query `GLAccount` to get its `external_id` (NetSuite internal ID)
4. Fallback to `BankAccount` query if no mapping configured

---

### Session SC-2026-01-09-002: Payment Record Investigation — Check vs VendorPayment (PREVIOUS)

**Topic:** Investigate why payment push fails with "You must enter at least one line item" and test both Check and VendorPayment approaches.

**Human Request:** Test two payment implementations simultaneously (Check with expense sublist, VendorPayment) to determine which creates proper Related Records linkage. Add method suffix to memo for identification.

**Key Discovery — NetSuite Check vs VendorPayment:**

| Record Type | Required Sublists | Purpose |
|-------------|-------------------|---------|
| **Check** | `expense` OR `item` REQUIRED | Creates NEW expense transactions |
| **VendorPayment** | `apply` only | Pays EXISTING open transactions (bills, etc.) |

**Root Cause:** Our current Check implementation only includes `apply` sublist, which is NOT sufficient. Check records require `expense` or `item` sublists to create transaction lines.

**Prior Project Uses VendorPayment:**
- `BillPayment (reimbursement)` → `VendorPayment`
- Requires employee to have a Vendor record in NetSuite

**Dual Implementation Test Plan:**
1. **Check + Expense Sublist** — Add expense line with category/account
2. **VendorPayment** — Use vendor ID (if employee has vendor record)

Both will have test suffixes in memo field: `[CHECK-TEST]` and `[VENDORPAY-TEST]`

---

### Session SC-2026-01-09-001: Receipt File Attachment (COMPLETED)

**Topic:** Attach receipt files to expense reports in NetSuite.

**Key Discovery — NetSuite System Limitation:**
- Line-level file attachment via SuiteScript is NOT supported (Enhancement Request #665899)
- The `doc` field on expense lines is read-only
- `record.attach()` only works at HEADER level

**Resolution:** Implemented header-level attachment via RESTlet v1.4.0 with `attachToHeader` action.

**Files in Related Records → Files tab**, not at line level.

---

### Session SC-2026-01-08-015: Reimbursement Sync Polishing (COMPLETED)

**Topic:** Polish every detail of reimbursement sync with NetSuite - complete dimension mapping & payment linking.

**Human Request:** Evaluate and work on polishing all details for reimbursement sync. User provided screenshots showing dimensions (category, department, location, class, project) and noted the reimbursement was paid, so "Related Records" should show the payment.

**Gaps Identified:**
1. **GAP-CAT-002:** ExpenseCategory `gl_account_code` is empty for ALL records - changed to match by name
2. **GAP-DIM-001:** Class dimension missing from NetSuite adapter
3. **GAP-DIM-002:** Line-level dimensions not extracted in adapter
4. **GAP-PAY-001:** Payment push failing with `KeyError{key: :amount}`
5. **GAP-LINK-001:** Payment not linked (blocked by GAP-PAY-001)
6. **GAP-PROJ-001:** Project dimension not passed to NetSuite

**Key Finding:** NetSuite's SuiteQL `expenseCategory` table does NOT have an account linkage column. The `gl_account_code` field is never populated during sync. Solution: Match ExpenseCategory by name instead.

---

### Previous Session: SC-2026-01-06-014: Expense Category & Dimension Mapping Fix (CLOSED)

**Topic:** Fix NetSuite push failures where expense report line items were rejected with "Invalid Field Value" errors for the `category` field.

**Human Request:** User explicitly rejected the fallback solution (using NetSuite's default category) and demanded that synced dimensions from ERP setup be used correctly.

**Outcome:** ✅ **CLOSED — Implementation Complete and Verified**

**Closure Date:** 2026-01-07  
**Verified By:** Code Fidelity Expert (confirmed documentation alignment)

#### Problem Solved

1. **Teampay UUIDs sent instead of NetSuite IDs** — Dimension fields received raw `CodingValue` UUIDs instead of NetSuite `external_id`s
2. **GL Account vs Expense Category confusion** — Users select GL Accounts from "Category" dropdown, but NetSuite expects `expenseCategory` IDs
3. **Expense Categories sync disabled** — `expense_categories` was commented out for NetSuite, preventing category lookup

#### Solution

| File | Changes |
|------|---------|
| `sync_config_setup_service.ex` | Enabled `expense_categories` sync for NetSuite |
| `push_reimbursement_complete_reactor.ex` | Added `resolve_coding_value_external_id/2` for UUID→external_id |
| `push_reimbursement_complete_reactor.ex` | Added `resolve_expense_category_from_gl_account/2` for GL→Category |
| `push_reimbursement_complete_reactor.ex` | Added `extract_money_amount/1` for Money→Decimal conversion |
| `push_reimbursement_complete_reactor.ex` | Updated `build_expense_report_data/4` to use resolvers |
| `push_reimbursement_complete_reactor.ex` | Refactored `build_adapter_config/1` to use `NetSuite.Config.build_config` |
| `erp.sync_expense_categories.ex` | **NEW** Mix task for manual expense category sync (optional) |
| `erp.link_employee.ex` | **NEW** Mix task for manual employee linking (GAP-EMP-001 fix) |

#### Data Flow

```
User Selects GL Account (CodingValue UUID)
  └── resolve_coding_value_external_id() → NetSuite account ID (e.g., "185")
        └── resolve_expense_category_from_gl_account() 
              └── Query: ExpenseCategory WHERE gl_account_code = "185"
                    └── Return ExpenseCategory.external_id (e.g., "18")
                          └── NetSuite receives: category = {"id": "18"} ✅
```

#### Verification

Run `mix erp.sync_expense_categories` to populate the ExpenseCategory table, then test reimbursement push.

---

### Session SC-2025-12-23-007: Entity-Specific Reconciliation Pattern

**Topic:** Break down monolithic push reconciliation into entity-specific services with full line item linking.

**Human Request:** User preferred explicit per-entity reconciliation over hidden monolithic service. Also identified that line items needed proper linking.

**Outcome:** ✅ **Implementation Complete**

#### Problem Solved

1. Monolithic `PushReconciliationService.reconcile_push_lifecycle/0` hid which entities were covered
2. No way to track per-entity reconciliation stats
3. Line items (ReimbursementItem, InvoiceDetailLineItem) had no ERP mirror links

#### Solution

Created 10 entity-specific reconciliation services, each with its own step in BridgeReactor:

| Service | Entity Type | Source Linking |
|---------|-------------|----------------|
| `BillReconciliationService` | `:bill` | Invoice → Bill |
| `BillLineItemReconciliationService` | `:bill_line_item` | InvoiceDetailLineItem → BillLineItem |
| `ExpenseReportReconciliationService` | `:expense_report` | ReimbursementRequest → ExpenseReport |
| `ExpenseLineItemReconciliationService` | `:expense_line_item` | ReimbursementItem → ExpenseLineItem |
| `APPaymentReconciliationService` | `:ap_payment` | (none) |
| `APPaymentApplicationReconciliationService` | `:ap_payment_application` | (none) |
| `VendorReconciliationService` | `:vendor` | (none) |
| `JournalEntryReconciliationService` | `:journal_entry` | (none) |
| `CardTransactionReconciliationService` | `:card_transaction` | (none) |
| `VendorCreditReconciliationService` | `:vendor_credit` | (none) |

#### Database Changes

Migration `20251223210519_add_erp_line_item_links`:

| Table | New Column |
|-------|------------|
| `reimbursement_requests` | `erp_expense_report_id` |
| `reimbursement_items` | `erp_expense_line_item_id` |
| `ap_invoice_detail_line_items` | `erp_bill_line_item_id` |

#### BridgeReactor Now Has 18 Steps

```
Steps 1-8:   Dimension Bridging (existing)
Steps 9-18:  Entity-Specific Reconciliation (NEW)
Step 19:     Aggregate Results (updated)
```

#### Benefits

1. **Explicit Coverage**: Clear what entities are reconciled
2. **Per-Entity Stats**: Each service returns success/not_found/error counts
3. **Independent Failure**: One entity failing doesn't block others
4. **Extensible**: Adding new entity = copy service template + add step
5. **Full Traceability**: Line items linked from product domain to ERP mirrors

---

### Session SC-2025-12-23-006: Unified Bridge Architecture (Previous)

**Topic:** Unify dimension bridging and push reconciliation into single, decoupled BridgeReactor.

**Outcome:** ✅ **Complete** — Superseded by SC-2025-12-23-007 which broke down the monolithic step

---

## Previous Session Context

### Session SC-2025-12-23-002: Complete Sync Pipeline

**Topic:** Evaluate all sync items beyond dimensions, recommend patterns to follow, and propose path to getting all syncs working.

**Human Request:** Review non-dimension sync items for expense, apply same patterns used for dimensions, create path to completion.

**Outcome:** 🔧 **Engineering Handoff Prepared**

---

#### Entity Classification (SC-2025-12-23-002)

| Category | Entities | Sync | Bridge |
|----------|----------|------|--------|
| **Dimensions** | departments, locations, classes, projects, gl_accounts, expense_categories | ✅ | ✅ |
| **Dimensions (GAP)** | jobs, custom_dimensions, custom_dimension_values | ❌ | ✅ Ready |
| **Parties** | vendors, employees, customers | ✅ | N/A |
| **Reference** | currencies, subsidiaries, accounting_periods | ✅ | N/A |
| **Transactions (GAP)** | bills, bill_line_items, ap_payments, expense_reports, expense_line_items | ❌ | N/A |

#### Key Finding

**Bridging is complete** — BridgeReactor already has steps for jobs and custom_dimensions. The gap is entirely on the sync side:

1. Not in `@entity_order` (WorkspaceSyncReactor line 62-75)
2. No BulkUpsertService exists
3. No EntitySyncService route defined

#### Implementation Phases

| Phase | Focus | Effort |
|-------|-------|--------|
| Phase 1 | Dimension Sync (jobs, custom_dimensions) | 4-6 hours |
| Phase 2 | Transaction Sync (bills, expense_reports, etc.) | 8-12 hours |
| Phase 3 | Verification & Testing | 4-6 hours |

**Artifacts:**
- `artifacts/sessions/SC-2025-12-23-002/ENGINEERING-HANDOFF.md`
- `artifacts/sessions/SC-2025-12-23-002/TASK-ASSIGNMENTS.md`

---

#### Turn 1: Intake Coordinator

**Materials Gathered:**

##### 1. Push Architecture Overview

```
                         PUSH FLOW (Teampay → ERP)
                                    
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Product Domains                                      │
│  (AP, Expense, etc.)                                                        │
│                                                                              │
│  • Bill approved → queue push                                               │
│  • Expense report approved → queue push                                     │
│  • Payment completed → queue push                                           │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ PushOrchestrator.push_entity/9
                                │ or PushOrchestrator.push_batch/7
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PushRequest Resource                                │
│                     (table: ember_erp_push_requests)                        │
│                                                                              │
│  • Status: pending → processing → pushed/failed/skipped                     │
│  • Tracks: source_domain, source_resource_id, entity_type                   │
│  • Actor context stored in push_metadata for background job auth            │
│  • Uniqueness: one pending push per (domain, resource_type, resource_id)    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ AshOban trigger (scheduler_cron: false = immediate)
                                │ Queue: :erp_push
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Entity-Specific Push Reactors                          │
│                                                                              │
│  AP Domain:                                                                  │
│    • PushBillReactor                                                        │
│    • PushBillLineItemReactor                                                │
│    • PushAPPaymentReactor                                                   │
│    • PushAPPaymentApplicationReactor                                        │
│    • PushCardTransactionReactor (ap/)                                       │
│    • PushVendorReactor                                                      │
│                                                                              │
│  Expense Domain:                                                             │
│    • PushExpenseReportReactor                                               │
│    • PushExpenseLineItemReactor                                             │
│    • PushCardTransactionReactor (expense/)                                  │
│    • PushVendorCreditReactor                                                │
│                                                                              │
│  Journal Domain:                                                             │
│    • PushJournalEntryReactor                                                │
│                                                                              │
│  Documents:                                                                  │
│    • PushReceiptFileReactor                                                 │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ Each reactor:
                                │ 1. Validate push request
                                │ 2. Load source resource
                                │ 3. Transform to ERP format (FieldMapperService)
                                │ 4. Apply custom fields (CustomFieldService)
                                │ 5. Push via adapter
                                │ 6. Update accounting mirror
                                │ 7. Link source → mirror
                                │ 8. Complete push request
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CapabilityRouter.push/5                               │
│                                                                              │
│  Routes to: adapter.push_{entity_type}(config, data, opts)                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Provider-Specific Push Capabilities                       │
│                                                                              │
│  NetSuite (10 push capabilities):                                           │
│    bills, bill_line_items, ap_payment_applications, ap_payments,            │
│    vendors, expense_reports, expense_line_items, journal_entry,             │
│    files, document_links                                                    │
│                                                                              │
│  Sage Intacct (6 push capabilities):                                        │
│    bills, expense_reports, expense_line_items,                              │
│    ap_payments, ap_payment_applications, bill_line_items                    │
│                                                                              │
│  QuickBooks (11 push capabilities):                                         │
│    bills, expense_reports, etc. (full set)                                  │
│                                                                              │
│  Acumatica (6 push capabilities):                                           │
│    bills, bill_line_items, expense_reports, expense_line_items,             │
│    ap_payments, ap_payment_applications                                     │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTP POST/PUT to ERP API
                                │ Returns: {:ok, %{external_id: "...", status: ...}}
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               ERP System                                     │
│                     (NetSuite, Intacct, QuickBooks, etc.)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 2. Key Components Discovered

| Component | Location | Purpose |
|-----------|----------|---------|
| `PushOrchestrator` | `ember_erp/services/push_orchestrator.ex` | Entry point for queueing pushes |
| `PushRequest` | `ember_erp/resources/push_request/` | Queue resource (AshOban-triggered) |
| `PushTask` | `ember_erp/resources/push_task/` | Reactor-tracked push (pause/resume) |
| `PushConfiguration` | `ember_erp/resources/configuration/` | Per-connection push settings |
| `Push Reactors` | `ember_erp/resources/reactors/{ap,expense,journal}/` | 13 entity-specific reactors |
| `Push Behavior` | `ember_erp/capabilities/push/behavior.ex` | Common interface (push/update/delete) |
| `CapabilityRouter` | `ember_erp/adapters/capability_router.ex` | Routes push calls to adapters |
| `PushWorker` | `ember_erp/workers/push_worker.ex` | Oban.Pro.Worker with rate limiting |

##### 3. Push Configuration & Triggering

```elixir
# Auto vs Manual push (from PushConfiguration)
%{
  auto_push_expenses: true/false,
  auto_push_bills: true/false,
  push_on_approval: true/false,
  push_on_payment: true/false
}

# Trigger types
:manual   # User requested
:automatic  # Domain auto-created (approval, payment completion)
```

##### 4. Operational Features Identified

| Feature | Implementation | Status |
|---------|----------------|--------|
| Rate limiting | Oban.Pro.Worker, 100/min/workspace | ✅ |
| Circuit breaker | CircuitBreaker service per provider | ✅ |
| Retry | 3 attempts with exponential backoff | ✅ |
| Idempotency | Check `erp_external_id` before push | ✅ |
| Actor context | Stored in `push_metadata` for background jobs | ✅ |
| Compensation | Reactor-level `compensate` blocks | ✅ |
| Observability | Tempo tracing + Loki logging + Prometheus | ✅ |

##### 5. Parallel/Alternative Path: PushWorker (Legacy?)

There is also a `PushWorker` in `ember_erp/workers/push_worker.ex` that takes entity data directly:

```elixir
# PushWorker.process/1 signature
%{
  "erp_connection_id" => conn_id,
  "domain" => domain,
  "entity_type" => entity_type,
  "entity_data" => data,         # <-- Data passed directly
  "origin_context" => context
}
```

This appears to be a different flow from `PushRequest` (where source_resource_id is stored and reactor loads data).

##### 6. Documentation Found

| Document | Path | Content |
|----------|------|---------|
| Push Flow | `docs/agents/.../architecture/push_flow.md` | Architecture spec |
| Push Bill Reactor | `docs/agents/.../architecture/reactors/push_bill_reactor.md` | Reactor design |
| Push Integration Gaps | `docs/agents/.../gaps_push_integration.md` | Known gaps |

---

**Questions for Committee:**

1. What is the relationship between `PushRequest` (AshOban queue) and `PushWorker` (Oban job with entity_data)?
2. Is `PushTask` (resumable reactors) actively used, or is it parallel infrastructure?
3. Are there scaling concerns similar to sync (memory, N+1, rate limits)?
4. What happens when push fails? Is compensation reliable?
5. How does push interact with the sync flow? (What prevents sync from overwriting pushed data?)

**Recommended Handoffs:**

| Member | Reason |
|--------|--------|
| Architecture Presenter | Present the discovered architecture to the full committee |
| Sync Architect | Evaluate the technical design against best practices |
| Multi-ERP Generalist | Assess cross-provider coverage and consistency |

---

---

## Session Context Archive: SC-2026-01-10-001

**Session:** SC-2026-01-10-001  
**Date:** January 10, 2026  
**Status:** CLOSED (Incomplete)  
**Focus:** Full Committee Review — Payment Push Failures and Approval Workflow Bypass

### Key Findings

#### 1. NetSuite Payment Record Options

| Option | Record Type | Works With | Limitations |
|--------|-------------|------------|-------------|
| **Check + Expense Sublist** | `/check` | Employees directly | Requires valid GL Account ID for expense lines |
| **VendorPayment** | `/vendorpayment` | Vendors only | Cannot apply to Expense Reports (only Vendor Bills) |
| **Set complete=true** | Expense Report field | Marks as reimbursed | May not create separate payment record |

#### 2. Root Causes Identified

| Issue | Root Cause | Fix Applied |
|-------|------------|-------------|
| `expense.account` was `null` | ExpenseCategory ID ≠ GL Account ID | Added fallback to fetch default expense account |
| `bank_account_id` was `null` | Not configured in ERP connection | Added fallback to fetch default bank account |
| "Pending Accounting Approval" | Approval workflow active in NetSuite | Added `approvalstatus: 2` (Approved) + `complete: true` |

#### 3. Experimental: Dual Payment Test Mode

**⚠️ NOT FOR PRODUCTION ⚠️**

The implementation includes `@dual_test_mode true` in `expense_report_payments.ex` which:
- Attempts BOTH Check and VendorPayment approaches simultaneously
- Adds `[CHECK-TEST]` or `[VENDORPAY-TEST]` suffixes to memos
- Returns first successful result

**Before Production:** Disable this mode and choose a single approach.

### Files Modified

| File | Key Changes |
|------|-------------|
| `expense_report_payments.ex` | Dual test mode, account fallbacks |
| `expense_reports.ex` | Approval status bypass |
| `push_reimbursement_complete_reactor.ex` | Auto-create employees, vendor resolution |
| `reimbursements_live.ex` | ERP Post Modal, checkbox fixes |

### Pending Validation

**The Phoenix server was not restarted.** All fixes need validation after server restart.

### Session Artifacts

- `artifacts/sessions/SC-2026-01-10-001/SESSION-SUMMARY.md`
- `artifacts/sessions/SC-2026-01-10-001/DUAL-PAYMENT-EXPERIMENT.md`
- `artifacts/sessions/SC-2026-01-10-001/HANDOFF-TO-NEXT-SESSION.md`

---

## Session Context Archive: SC-2026-01-13-003 (Bank Mapping Filter)

**Session:** SC-2026-01-13-003  
**Date:** January 14, 2026  
**Status:** COMPLETED  
**Focus:** ACH Funding Account Not Used + Bank Mapping Filter Implementation

### Gaps Addressed

| Gap ID | Description | Resolution |
|--------|-------------|------------|
| GAP-ACH-001 | ACH Funding Account from ERP Setup not used in payment push | Added `resolve_ach_funding_account/3` to consult AccountMapping |
| GAP-ACH-002 | Bank mapping dropdown shows all GL accounts (wrong type/subsidiary) | Added subsidiary + account type filtering |

### Implementation (Turn 6)

#### Files Modified

| File | Change |
|------|--------|
| `account_mapping_service.ex` | Added `get_bank_accounts_for_subsidiary/3`, `get_bank_accounts/2`, `bank_funding_items/0` |
| `erp_live.ex` | Added `get_configured_subsidiary_id/2`, updated `load_tab_data(:bank_mapping)` |
| `bank_mapping_tab.ex` | Use filtered `@bank_accounts` for funding items (ACH, Wire, Check) |
| `push_reimbursement_complete_reactor.ex` | Added `resolve_ach_funding_account/3` (Turn 1) |

#### Key Design Decision

**Bank Account Filtering:** For funding account dropdowns (ACH, Wire, Check), filter by:
1. `erp_metadata->>'accttype' = 'Bank'` — NetSuite account type
2. `erp_metadata->>'subsidiary_raw' LIKE '%{subsidiary_id}%'` — Subsidiary availability

#### Database Query

```sql
SELECT * FROM ember_erp_accounting_gl_accounts
WHERE erp_connection_id = $1
  AND active = true
  AND erp_metadata->>'accttype' = 'Bank'
  AND erp_metadata->>'subsidiary_raw' LIKE '%3%'  -- e.g., subsidiary 3
ORDER BY account_code;
```

#### Valid Bank Accounts for Subsidiary 3 (Honeycomb Holdings Inc.)

| external_id | account_code | account_name |
|-------------|--------------|--------------|
| 186 | 111 | 111 Another Account |
| 208 | 1234 | 1234 Teampay Holding Ru Shan |
| 194 | 12345 | 12345 US Sub Pound Account |
| 215 | 192837465 | 192837465 Teampay Holding |

### Key Learnings (Session Close)

1. **Two-System Architecture**: `AccountMapping` (user config) vs `BankAccount` (synced data) — must prioritize user's configuration
2. **Subsidiary Filtering**: NetSuite VendorPayment requires strict subsidiary compatibility  
3. **Bank Account Types**: "Holding" accounts may be restricted for direct payments in NetSuite
4. **Tax Periods**: Subsidiary-specific in NetSuite OneWorld

### Open Item: GAP-PMT-001

Account 231 ("1010 Choice-Euro Holding Account") rejected by VendorPayment due to "Holding" account type restriction.

**Recommendations:**
1. Don't send `accountId` (use NetSuite default)
2. Select "8001 Bank Account Euro" (Account 204) instead
3. Enable "Available for Bill Payments" on Account 231 in NetSuite

### Session Artifacts

- `artifacts/sessions/SC-2026-01-13-003/SESSION-SUMMARY.md`
- `artifacts/sessions/SC-2026-01-13-003/BANK-MAPPING-FILTER-DESIGN.md`
- `artifacts/sessions/SC-2026-01-13-003/NETSUITE-LOG-ANALYSIS.md`

---

## Session SC-2026-01-15-002: ERP Employee Configuration (Turn 11)

### Bug Fix: ERP Account Card Not Displaying

**Issue Reported:** Human Director configured NetSuite ERP and visited `/expense/profile` but the ERP Account section was not visible.

**Root Cause Analysis:**

1. **Incorrect Field Name:** `supports_employee_creation?/1` pattern-matched on `state: :active`
   - ErpConnection uses `status` field (not `state`)
   
2. **Incorrect Value:** Checked for `:active` 
   - Valid status values are `:disconnected`, `:connected`
   
3. **Invalid Filter:** Query used `entity_id` filter
   - ErpConnection is workspace-level (no entity_id field)

**Fix Applied:**

```elixir
# Before (erp_employee_orchestrator.ex)
def supports_employee_creation?(%{provider: provider, state: :active}) do

# After
def supports_employee_creation?(%{provider: provider, status: :connected}) do
```

```elixir
# Before (user_profile_edit_live.ex)
Ash.Query.filter(entity_id == ^entity_id and state == :active)

# After
Ash.Query.filter(status == :connected)
```

**ErpConnection Schema Reference:**

| Field | Type | Valid Values |
|-------|------|--------------|
| `status` | `:atom` | `:disconnected`, `:connected` |
| `state` (state machine) | `:atom` | `:disconnected`, `:connected`, `:error` |
| `workspace_id` | `:uuid` | Workspace tenant |
| `entity_id` | N/A | Does not exist |

**Key Learning:** Always verify schema field names and valid values before implementing conditionals. The ErpConnection schema uses `status` for the simple status and `state` for the state machine.

### Bug Fix Turn 12: Ash.CiString Rendering & UI Improvements

**Issues Reported:**
1. Error when clicking "Create Account" - `Protocol.UndefinedError` for `Ash.CiString`
2. UI showed "NetSuite Account" instead of generic "ERP Account"
3. "Link" button was before "Create" button (reversed priority)

**Root Cause Analysis:**

1. **Ash.CiString Error:** The `workforce_employee.email` and `erp_employee.email` fields are `Ash.CiString` types, which cannot be directly rendered in HEEx templates. Phoenix.HTML.Safe protocol is not implemented for this struct type.

2. **Provider-specific naming:** The UI was displaying the provider name (e.g., "NetSuite Account") in titles and headers, but the Human Director wanted generic "ERP Account" labels.

3. **Button order:** The "Link Existing Account" button was placed before "Create Account", but Create should be the primary action for users without an existing ERP employee record.

**Fixes Applied:**

| Location | Issue | Fix |
|----------|-------|-----|
| Line 1103 | `@workforce_employee.email` rendered directly | Wrapped with `to_string()` |
| Line 1050 | `emp.email` rendered directly | Wrapped with `to_string()` |
| Line 941 | "NetSuite Account" header | Changed to "ERP Account" |
| Lines 982-1016 | Button order Link→Create | Swapped to Create→Link |
| Modal headers | "Create/Link NetSuite Account" | Changed to "Create/Link ERP Account" |

**Pattern Note:** Always convert `Ash.CiString` to string before rendering:

```elixir
# Wrong - will crash
{@workforce_employee.email}

# Correct
{to_string(@workforce_employee.email)}

# Or with nil check
{if @workforce_employee && @workforce_employee.email, do: to_string(@workforce_employee.email), else: "N/A"}
```

### Bug Fix Turn 13: NetSuite Config Building

**Issue Reported:** When clicking "Create Account", error shows:
```
** (KeyError) key :realm not found in:
    %{
      connection_id: "...",
      provider: :netsuite,
      account_id: nil,
      consumer_key: nil,
      ...
    }
```

**Root Cause:**
The `ErpEmployeeOrchestrator.build_adapter_config/1` function was manually building the config map with incorrect keys and missing the `:realm` field that NetSuite's TokenCache requires.

**Correct Pattern:**
Other reactors (e.g., `push_reimbursement_complete_reactor.ex`, `push_journal_entry_reactor.ex`) use the `NetSuite.Config.build_config/1` module to properly build the config struct.

**Fix Applied:**

```elixir
# Before - Manual config building (WRONG)
defp build_adapter_config(erp_connection) do
  credentials = connection.credentials || %{}
  %{
    account_id: credentials["account_id"],
    consumer_key: credentials["consumer_key"],
    # ... missing :realm, :base_url, etc.
  }
end

# After - Using NetSuite.Config module (CORRECT)
defp build_adapter_config(erp_connection) do
  case erp_connection.provider do
    :netsuite -> build_netsuite_config(erp_connection)
    :sage_intacct -> build_sage_intacct_config(erp_connection)
    _ -> build_generic_config(erp_connection)
  end
end

defp build_netsuite_config(erp_connection) do
  alias FlameTeampayPayables.EmberErp.Adapters.Providers.NetSuite.Config, as: NetSuiteConfig

  config_input =
    erp_connection.credentials
    |> Map.put("environment", erp_connection.configuration["environment"] || "production")

  NetSuiteConfig.build_config(config_input)
end
```

**Key Learning:**
When building adapter configs, ALWAYS use the provider's Config module (`NetSuite.Config.build_config/1`) rather than manually constructing the map. The Config module handles:
- Credential extraction from nested `credentials["rest"]` structure
- PEM key normalization
- Base URL building
- Realm and account_id fallbacks
- Algorithm defaults

### Bug Fix Turn 14: Missing Subsidiary and Currency for NetSuite Employee Creation

**Issue Reported:** NetSuite rejected employee creation with:
```
Error while accessing a resource. Please enter value(s) for: Default Currency, Subsidiary.
```

**Root Cause:**
The employee creation request was missing `subsidiary` and `currency` fields required by NetSuite OneWorld accounts. The subsidiary is already configured during ERP setup wizard in `EntityMapping`, but the orchestrator wasn't retrieving it.

**Request Body (Before Fix):**
```json
{
  "email": "user@example.com",
  "externalid": "teampay-xxx",
  "firstname": "Demo",
  "giveaccess": false,
  "isinactive": false,
  "lastname": "Finance Admin"
}
```
Missing: `subsidiary`, `currency`

**Architecture Discovery:**
1. `EntityMapping` stores the configured subsidiary (`erp_location_id`, `erp_location_name`) set during ERP setup wizard
2. `ErpSubsidiary` stores the subsidiary's currency (`currency_id`)
3. The profile page should use these pre-configured values rather than asking the user to select

**Fix Applied:**

1. **New Orchestrator Functions:**
```elixir
# Get configured subsidiary from EntityMapping
def get_configured_subsidiary(erp_connection, workspace_id)
# Returns {subsidiary_external_id, subsidiary_name}

# Get subsidiary with its currency
def get_configured_subsidiary_with_currency(erp_connection, workspace_id)
# Returns {subsidiary_external_id, subsidiary_name, currency_id}
```

2. **LiveView Updates:**
- Modal now loads configured subsidiary when opened
- Shows subsidiary as read-only (from config) rather than dropdown
- Passes both `subsidiary_id` and `currency_id` to employee creation

3. **UI Changes:**
- If subsidiary is configured: Shows as read-only field with "Configured during ERP setup" note
- If not configured: Shows dropdown for manual selection

**Data Flow:**
```
ERP Setup Wizard → EntityMapping (erp_location_id = subsidiary)
                         ↓
                   ErpSubsidiary (currency_id)
                         ↓
User Profile → Create → get_configured_subsidiary_with_currency()
                         ↓
               push_employee({subsidiary_id, currency_id})
```

**Files Modified:**
| File | Changes |
|------|---------|
| `erp_employee_orchestrator.ex` | Added `get_configured_subsidiary/2`, `get_configured_subsidiary_with_currency/2`, `get_subsidiary_currency/3`, updated `build_employee_data` to include `currency_id` |
| `user_profile_edit_live.ex` | Load configured subsidiary on modal open, show read-only when configured, pass currency to creation |

---

## Session SC-2026-01-15-002 Summary

**Topic:** User-Initiated ERP Employee Creation from Profile Page

**Outcome:** ✅ IMPLEMENTATION COMPLETE

### Features Delivered:

1. **ERP Account Section** on `/expense/profile` page
2. **Create ERP Account** button - creates employee in NetSuite linked to Teampay user
3. **Link Existing Account** button - links to existing ERP employee
4. **Provider-Agnostic Design** via `ErpEmployeeOrchestrator` service
5. **Capability-Based Feature Detection** using `AdapterRegistry.supports_capability?/2`

### Bugs Fixed During Implementation:

| Turn | Issue | Root Cause | Fix |
|------|-------|------------|-----|
| 11 | ERP card not showing | Wrong `ErpConnection` field names (`state` vs `status`) | Updated pattern matching and query filters |
| 12 | `Ash.CiString` render error | Direct rendering of CiString structs | Wrapped with `to_string()` |
| 12 | UI showed "NetSuite" | Hardcoded provider name | Changed to generic "ERP" |
| 13 | `KeyError: :realm` | Manual config building | Used `NetSuite.Config.build_config/1` |
| 14 | Missing subsidiary/currency | Not using EntityMapping | Load from configured subsidiary |

### Key Patterns Established:

1. **Config Building:** Always use provider's Config module, never manually construct
2. **Ash.CiString:** Always `to_string()` before rendering
3. **ErpConnection Status:** Use `status: :connected` (not `state: :active`)
4. **EntityMapping:** Source of truth for configured subsidiary
5. **Orchestrator Pattern:** Provider-agnostic services for complex operations

### Documentation Created:

- ADR-ERP-EMP-001: ERP Employee Creation Architecture
- Session context in `shared_context.md`

---

## Session SC-2026-01-28-002 Summary

**Topic:** ExpenseCategory Filtering for Reimbursement GL Account Selection

**Outcome:** ✅ RESOLVED

### Problem Statement

When pushing reimbursements to NetSuite, the system failed with "ExpenseCategory not found for GL Account" errors. This occurred because users could select GL Accounts that don't have corresponding ExpenseCategories in NetSuite. NetSuite requires ExpenseCategory for expense reports (reimbursements), but not for vendor bills (card transactions).

### Root Cause

**GAP-EXPENSE-CATEGORY-001:** The GL Account dropdown in reimbursement forms showed all GL Accounts, including those without corresponding ExpenseCategories. When a user selected such an account:
1. Push reactor couldn't find matching ExpenseCategory
2. Fallback logic picked incompatible category
3. NetSuite rejected due to subsidiary restrictions

### Solution Implemented

Preventative fix at the UI level to prevent invalid selection:

| Flow | Behavior |
|------|----------|
| **Reimbursement Forms** | Filter GL Account dropdowns to only show accounts with ExpenseCategories |
| **Coding Rules (NetSuite)** | Show all accounts with subtle warning indicator (amber dot) for accounts without ExpenseCategories |
| **Coding Rules (Other ERPs)** | No warnings (not applicable) |

### Files Modified

| File | Change |
|------|--------|
| `DimensionFilterService` | Added `filter_by_expense_category: true` option and `convert_to_extended_format/3` |
| `reimbursement_detail_live.ex` | Uses `filter_by_expense_category: true` for GL accounts |
| `requests_live.ex` | Uses `filter_by_expense_category: true` for reimbursement creation |
| `erp_live.ex` | Passes provider to load extended format for NetSuite |
| `coding_rule_builder.ex` | Shows warning indicators with legend for NetSuite |
| `custom_select.ex` | Extended `custom_select_form` to support `has_expense_category` flag |

### Key Patterns Established

1. **Preventative over Reactive:** Filter invalid options at UI level rather than failing at push time
2. **NetSuite-Specific Logic:** Check provider before applying NetSuite-specific behaviors
3. **Admin vs User UX:** Admins see all options with warnings; users see only valid options
4. **ExpenseCategory Matching:** Use `CodingValue.external_id` = `ExpenseCategory.gl_account_code` (both are NetSuite internal IDs)

### Related Documentation

- `REIMBURSEMENT-PUSH-ISSUES.md` - Updated with resolution details
- `session_state.md` - Added GAP-EXPENSE-CATEGORY-001 to registry

---

*Session closed: 2026-01-28*
*Last updated by Sync Committee Scribe (Session SC-2026-01-28-002)*
*See [GOVERNANCE.md](GOVERNANCE.md) for documentation governance process*
