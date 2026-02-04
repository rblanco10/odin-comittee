# Sync Committee Session SC-2026-01-05-001

> **Date:** 2026-01-05
> **Topic:** Vendor Bridge Validation & Provider Adapter Pattern
> **Status:** ✅ APPROVED
> **Chair:** Sync Committee Orchestrator

---

## Executive Summary

The Sync Committee convened to review the vendor bridge between ERP mirror tables and the business layer. During investigation, three critical gaps were identified in vendor matching. The session concluded with approval of a Provider Adapter Pattern for vendor matching, with Ntropy as the primary external enrichment provider.

---

## Gaps Identified

### GAP-VND-MATCH-001: Fuzzy Match Excludes ERP Vendors

**Location:** `merchant_vendor_mapping_service.ex:331-369`

**Problem:** The `check_fuzzy_match/3` function only queries `VendorDetail` table, completely ignoring ERP Vendors synced from NetSuite/Intacct/QuickBooks.

```elixir
# Current (broken)
VendorDetail
|> Ash.Query.filter(entity_id == ^entity_id)  # Only checks VendorDetail!
```

**Impact:** ERP vendors are NEVER matched via fuzzy matching.

**Fix Required:** Include `EmberErp.Accounting.Parties.Vendor` in fuzzy search.

---

### GAP-VND-MATCH-002: Push Reactor References Non-Existent Field

**Location:** `push_card_spend_reactor.ex:413`

**Problem:** The push reactor tries to find ERP external_id using `source_vendor_id` field which does not exist on the ERP Vendor mirror.

```elixir
# Current (broken)
AccountingVendor
|> Ash.Query.filter(source_vendor_id == ^transaction.vendor.id)
# ❌ source_vendor_id field does not exist!
```

**Impact:** Vendors with no direct external_id always fail ERP lookup.

**Fix Required:** Use the Vendor wrapper's `erp_vendor_id` relationship instead.

---

### GAP-VND-MATCH-003: Entity Scoping Mismatch

**Location:** `vendor_bulk_upsert_service.ex:167-170`

**Problem:** ERP Vendors are synced with `entity_id = NULL` (connection-scoped), but:
- Fuzzy match filters by `entity_id`
- VendorWrapperService skips vendors with `nil entity_id`

**Impact:** ERP vendors never get wrapped, never appear in fuzzy matches.

**Fix Required:** 
- Fuzzy match should include `is_nil(entity_id)` in query
- VendorWrapperService should handle workspace-wide vendors

---

## Architecture Decision

### Provider Adapter Pattern for Vendor Matching

**Decision:** ✅ APPROVED

**Rationale:** 
1. Integrating external enrichment API (Ntropy) improves match accuracy
2. Local matching must remain available for development
3. Abstraction layer provides fallback safety and future flexibility

---

### Key Clarification

This is **NOT** a multi-provider race or "best-of-N" strategy.

| Environment | Primary Provider | Fallback |
|-------------|------------------|----------|
| Production | Ntropy | Local (on error/timeout) |
| Development | Local | N/A |
| Test | Mock/Local | N/A |

Ntropy is THE provider. Local exists for:
- Developer experience (no API key required)
- Fallback when Ntropy is unavailable
- Testing without network dependencies

---

### Implementation Phases

| Phase | Description | Priority |
|-------|-------------|----------|
| **Phase 0** | Fix local matching gaps (GAP-VND-MATCH-001/002/003) | 🔴 Immediate |
| **Phase 1** | Establish `ProviderBehaviour` abstraction | 🟡 High |
| **Phase 2** | Build Ntropy SDK inline (`VendorMatching.Ntropy.Client`) | 🟡 High |
| **Phase 3** | Implement `NtropyProvider` | 🟡 High |
| **Phase 4** | (Optional) Extract SDK to Kindling if multi-flame need emerges | 🟢 Low |

---

### Proposed Behaviour Interface

```elixir
defmodule FlameTeampayPayables.EmberExpenseCard.VendorMatching.ProviderBehaviour do
  @moduledoc """
  Behaviour for vendor matching providers.
  
  Providers take a raw merchant string and return enriched vendor match candidates.
  """
  
  @type merchant_input :: %{
    merchant_name: String.t(),
    amount: Decimal.t() | nil,
    currency: String.t() | nil,
    mcc: String.t() | nil,
    transaction_date: Date.t() | nil
  }
  
  @type match_result :: %{
    vendor_name: String.t(),
    confidence: float(),  # 0.0 - 1.0
    match_method: atom(),
    metadata: map()
  }
  
  @type provider_result :: 
    {:ok, [match_result()]} | 
    {:error, :rate_limited} |
    {:error, :timeout} |
    {:error, :unavailable} |
    {:error, term()}
  
  @callback resolve(merchant_input(), opts :: keyword()) :: provider_result()
  @callback available?() :: boolean()
end
```

---

### Configuration Pattern

```elixir
# config/config.exs (defaults)
config :flame_teampay_payables, :vendor_matching,
  provider: :local,
  fallback_enabled: true

# config/prod.exs
config :flame_teampay_payables, :vendor_matching,
  provider: :ntropy,
  fallback_enabled: true,
  ntropy: [
    api_key: {:system, "NTROPY_API_KEY"},
    timeout_ms: 5_000,
    base_url: "https://api.ntropy.com"
  ]

# config/dev.exs
config :flame_teampay_payables, :vendor_matching,
  provider: :local,
  fallback_enabled: false
```

---

### Files to Create/Modify

#### New Files

| File | Purpose |
|------|---------|
| `ember_expense_card/vendor_matching/provider_behaviour.ex` | Behaviour definition |
| `ember_expense_card/vendor_matching/provider_chain.ex` | Orchestrator (provider + fallback) |
| `ember_expense_card/vendor_matching/providers/local.ex` | Local matching (refactored) |
| `ember_expense_card/vendor_matching/providers/ntropy.ex` | Ntropy provider |
| `ember_expense_card/vendor_matching/ntropy/client.ex` | HTTP client for Ntropy API |

#### Files to Modify

| File | Changes |
|------|---------|
| `merchant_vendor_mapping_service.ex` | Delegate to ProviderChain |
| `push_card_spend_reactor.ex` | Fix source_vendor_id query |

---

### Observability Requirements

#### Telemetry Events

```elixir
[:vendor_matching, :resolve, :start]
[:vendor_matching, :resolve, :stop]
[:vendor_matching, :resolve, :exception]
[:vendor_matching, :fallback, :triggered]
[:vendor_matching, :ntropy, :request]
[:vendor_matching, :ntropy, :response]
[:vendor_matching, :ntropy, :error]
```

#### Key Metrics

| Metric | Purpose |
|--------|---------|
| `vendor_matching.resolve.duration_ms` | Latency tracking |
| `vendor_matching.ntropy.success_rate` | Provider reliability |
| `vendor_matching.fallback.rate` | How often local fallback is used |
| `vendor_matching.confidence_score` | Distribution of match quality |

---

### Precedents Referenced

| Precedent | Location | Relevance |
|-----------|----------|-----------|
| Document Storage Adapters | `ember_document_intake/storage/` | Environment-driven adapter selection |
| ERP Capability Router | `ember_erp/adapters/capability_router.ex` | Provider abstraction pattern |
| Card Provider Adapters | `ember_payments/adapters/marqeta/` | External API SDK pattern |

---

### Committee Votes

| Member | Vote | Notes |
|--------|------|-------|
| Sync Architect | ✅ Approve | Aligns with existing patterns |
| Precedent Keeper | ✅ Approve | Matches document storage precedent |
| Dependency Guardian | ✅ Approve | With fallback guarantees |
| Standards Enforcer | ✅ Approve | Clean behaviour contract |
| Observability Auditor | ✅ Approve | Telemetry requirements clear |

**Decision:** UNANIMOUS APPROVAL

---

### Next Steps

1. **Engineering Handoff:** Create implementation tickets for Phase 0-3
2. **Gap Remediation:** Fix GAP-VND-MATCH-001/002/003 immediately
3. **SDK Development:** Build Ntropy client following Req conventions
4. **Integration:** Wire up provider chain in MerchantVendorMappingService

---

### External References

- [Ntropy API Documentation](https://docs.ntropy.com/enrichment/introduction) — Transaction enrichment API

---

*Session concluded: 2026-01-05*
*Scribe: Sync Committee Scribe*

