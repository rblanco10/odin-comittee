# Sync Committee Decisions Log

> **Record of all precedent-setting decisions made by the committee.**

---

## How to Use This Document

This is the Precedent Keeper's primary reference. When a question arises about whether something was decided before, search here first.

### Entry Format

Each decision follows the template in `artifacts/_templates/decision_template.md`.

### Quick Reference

For rapid lookup, decisions are indexed by:
- **Date**: When decided
- **Topic**: What area it affects
- **Status**: Active, superseded, or conditional

---

## Decision Index

| ID | Date | Topic | Title | Status |
|----|------|-------|-------|--------|
| DEC-2024-001 | 2024-12-01 | Error Handling | Sync failures auto-retry 3x | Active |
| DEC-2024-002 | 2024-12-01 | Error Handling | AP entities retry 2x max | Active |
| DEC-2024-003 | 2024-12-15 | Provider Abstraction | Handlers must use MapperRegistry | Active |
| DEC-2026-001 | 2026-01-13 | Observability | Debug file loggers must be removable/toggleable | Active |
| DEC-2026-002 | 2026-01-23 | Vendor Architecture | Vendor wrapper stores display_name | Active |

---

## Decisions

### DEC-2024-001: Sync failures auto-retry 3 times

**Date:** 2024-12-01
**Topic:** Error Handling
**Status:** Active

**Decision:** Sync failures should auto-retry up to 3 times with exponential backoff before marking for manual review.

**Reasoning:** Reduces operational burden while ensuring visibility for persistent failures. Transient errors (network, rate limiting) often resolve on retry.

**Scope:** Applies to all sync operations for all entity types, except where overridden by more specific decisions.

---

### DEC-2024-002: AP entities have stricter retry limits

**Date:** 2024-12-01
**Topic:** Error Handling
**Status:** Active

**Decision:** AP-related entities (vendors, bills) should have stricter retry limits (2 attempts) due to downstream financial impact.

**Reasoning:** A partially synced vendor could cause incorrect bill coding. Financial data requires higher accuracy, so we fail faster to alert humans.

**Scope:** Applies to: vendors, bills, bill_line_items, ap_payments.

**Supersedes:** For AP entities, this overrides DEC-2024-001's 3-retry default.

---

### DEC-2024-003: Handlers must use MapperRegistry

**Date:** 2024-12-15
**Topic:** Provider Abstraction
**Status:** Active

**Decision:** All sync handlers must use MapperRegistry for data transformation. Direct mapper calls are prohibited.

**Reasoning:** Enables provider abstraction — handlers don't know which ERP they're talking to. Adding new ERPs requires only new mappers, not handler changes.

**Scope:** Applies to all sync handlers, all entity types.

**Implications:**
- No `case provider do` in handlers
- MapperRegistry must be registered at boot
- New ERPs require mapper registration

---

### DEC-2026-001: Debug file loggers must be removable/toggleable

**Date:** 2026-01-13  
**Topic:** Observability  
**Status:** Active

**Decision:** Temporary debug utilities that write files to disk must be designed for easy removal or must be toggleable via environment variable. Always-on file logging is prohibited in production-path code.

**Reasoning:** The `DebugLogger` module for NetSuite was implemented during SC-2026-01-13-001 to debug Bill Payment creation. It wrote a file on every API call, which would fill the server filesystem over time. This pattern is useful during debugging but harmful if left permanently enabled.

**Scope:** Applies to all ERP adapters and any module that writes debug files.

**Guidelines:**
1. **Prefer structured logging** (Logger → Loki) over file-based logging
2. **If file logging is needed**, use an environment variable to enable it (default: disabled)
3. **Document removal steps** in the module's `@moduledoc`
4. **Add to `knowledge/erp_quirks/{erp}.md`** for future reference when removed

**Example:**
```elixir
# Good: Toggleable via environment
if System.get_env("NETSUITE_DEBUG_LOGS") == "true" do
  DebugLogger.log_interaction(...)
end

# Bad: Always-on
DebugLogger.log_interaction(...)  # Creates files on every call
```

**Related:** See `knowledge/erp_quirks/netsuite.md` → "Debugging Utilities" for the DebugLogger pattern documentation.

---

### DEC-2026-002: Vendor wrapper stores display_name

**Date:** 2026-01-23  
**Topic:** Vendor Architecture  
**Status:** Active

**Decision:** The Vendor wrapper (`ap_vendors`) must store a `display_name` attribute that caches the vendor name for display purposes. UI components must use `display_name` instead of loading nested relationships (`erp_vendor.vendor_name` or `vendor_detail.vendor_name`).

**Reasoning:** The original Vendor Wrapper Pattern (SC-2025-12-23-008) designed the wrapper as a "lightweight abstraction" that delegated name resolution to source tables. This caused:
1. **N+1 queries** — The `effective_name` calculation did `Ash.get` per vendor
2. **Policy complexity** — Required authorizing access to ErpVendor/VendorDetail just to display a name
3. **Authorization failures** — Requestors/approvers couldn't see vendor names due to missing policies on child resources

**Scope:** 
- All Vendor wrapper create actions must populate `display_name`
- All UI components displaying vendor names must use `vendor.display_name`
- ERP sync must update `display_name` when vendor name changes

**Implications:**
- `display_name` is set from: ERP Vendor > VendorDetail > vendor_number (priority order)
- No need to load `vendor: [:erp_vendor]` just for display purposes
- Eliminates need for complex policy chains on nested resources for read access

**Files Modified:**
- `vendor.ex` — Added `display_name` attribute
- `create_from_erp.ex`, `create_manual.ex`, `create_from_csv.ex` — Populate on create
- `link_to_erp.ex` — Update when linking to ERP
- Migration `20260124004321_add_display_name_to_ap_vendors.exs`

**Session:** SC-2026-01-23-001

---

## Template for New Decisions

When the committee makes a new decision, add it here using this format:

```markdown
### DEC-YYYY-NNN: [Title]

**Date:** YYYY-MM-DD
**Topic:** [Area]
**Status:** Active

**Decision:** [Clear statement]

**Reasoning:** [Why this decision was made]

**Scope:** [When does this apply]

**Supersedes:** [If this overrides a prior decision]

**Implications:** [What this means for implementation]
```

---

## Finding Precedents

### By Topic

| Topic | Related Decisions |
|-------|-------------------|
| Error Handling | DEC-2024-001, DEC-2024-002 |
| Provider Abstraction | DEC-2024-003 |
| Data Quality | (none yet) |
| Observability | DEC-2026-001 |
| Vendor Architecture | DEC-2026-002 |

### By Entity Type

| Entity | Related Decisions |
|--------|-------------------|
| Vendor | DEC-2024-002, DEC-2026-002 |
| Bill | DEC-2024-002 |
| All | DEC-2024-001, DEC-2024-003 |

---

## Superseded Decisions

Decisions that are no longer active:

(None yet)

---

## Last Updated

2026-01-23

---

## Contributing

When a new decision is made:
1. Add to the Decisions section
2. Add to the Decision Index
3. Update the By Topic / By Entity lookups
4. Update Last Updated

