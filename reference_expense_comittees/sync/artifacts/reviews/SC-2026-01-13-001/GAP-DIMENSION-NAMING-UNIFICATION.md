# GAP-DIMENSION-NAMING-001: Unify Dimension Naming Conventions

**Status:** DEFERRED  
**Priority:** Medium  
**Created:** 2026-01-14  
**Session:** SC-2026-01-13-001 (follow-up)

---

## Problem Statement

The codebase has evolved with **multiple naming conventions** for the same dimension concepts, requiring translation functions (`dimension_type_to_coding_key`) scattered across multiple files.

---

## Current State: 4+ Naming Conventions

| Source | Example Names | Used In |
|--------|---------------|---------|
| **Seed/DB codes** (`CodingCategory.code`) | `"DEPT"`, `"GL"`, `"LOC"`, `"PROJ"`, `"CC"` | Seeds, DimensionBridgeService |
| **ERP dimension types** (`DimensionTypeConfig.dimension_type`) | `:department`, `:account`, `:location`, `:project` | DimensionTypeConfig, RequiredDimensionValidation |
| **Internal coding_map keys** | `:department`, `:gl_code`, `:location`, `:project` | TransactionQueryService, UpdateCodingStatus |
| **UI/field names** | `"department"`, `"gl_account"`, `"location"` | LiveViews, API responses |

### Key Inconsistencies

| Dimension | Seed Code | DimensionTypeConfig | coding_map Key |
|-----------|-----------|---------------------|----------------|
| GL Account | `"GL"` | `:account` or `:gl_account` | `:gl_code` |
| Department | `"DEPT"` | `:department` | `:department` |
| Cost Center | `"CC"` | `:cost_center` | `:department` (aliased!) |
| Location | `"LOC"` | `:location` | `:location` |
| Project | `"PROJ"` | `:project` | `:project` |
| Class | `"CLASS"` | `:class` | `:class` |

---

## Files Containing Translation Logic

These files have duplicate `dimension_type_to_coding_key` functions:

1. `ember_expense_card/resources/expense_card_transaction/changes/update_coding_status.ex`
2. `ember_expense_card/services/transaction_query_service.ex` (2 definitions!)
3. `ember_reimbursements/resources/item/changes/update_coding_status.ex`

Additional mapping logic in:
- `ember_expense_card/integrations/coding/dimension_integration.ex` (`map_field_name_to_category_code`)
- `ember_expense_card/integrations/coding/dimension_integration.ex` (`@dimension_code_aliases`)

---

## Why This Happened

1. **Historical evolution**: Different parts of the system were built at different times
2. **Multi-ERP support**: NetSuite uses "account", Intacct uses "glaccountno", QuickBooks uses different names
3. **Early design decisions**: `coding_map` chose `:gl_code`, DimensionTypeConfig later used `:account`
4. **Seed data conventions**: Used short codes like "DEPT", "GL" before ERP sync existed

---

## What SC-2026-01-13-001 Fixed

Added explicit FK from `DimensionTypeConfig.coding_category_id` → `CodingCategory.id`, eliminating:
- Hardcoded code lookups ("DEPT" → find CodingCategory)
- The need for `DimensionCodeUtils` module (which was referenced but never created)

**What remains**: The `:account` → `:gl_code` translation in `dimension_type_to_coding_key`

---

## Proposed Solution

### Phase 1: Standardize on `DimensionTypeConfig.dimension_type` atoms

Pick the canonical set:
- `:department`
- `:location`
- `:class`
- `:project`
- `:account` (not `:gl_code` or `:gl_account`)
- `:entity`
- `:customer`
- `:vendor`

### Phase 2: Refactor `coding_map` to use standard atoms

Change all usages from:
```elixir
Map.get(coding_map, :gl_code)
```
to:
```elixir
Map.get(coding_map, :account)
```

### Phase 3: Remove translation functions

Delete all `dimension_type_to_coding_key` implementations once callers use standard atoms.

### Phase 4: Update seeds

Change CodingCategory codes from "GL", "DEPT" to match atom names (optional, lower priority).

---

## Affected Areas

- [ ] `TransactionQueryService` - builds and reads coding_map
- [ ] `UpdateCodingStatus` (expense card) - builds and reads coding_map
- [ ] `UpdateCodingStatus` (reimbursement) - builds and reads coding_map
- [ ] `DimensionIntegration` - has code alias mappings
- [ ] Seeds - CodingCategory code values
- [ ] UI components - field name references

---

## Effort Estimate

**Medium** - Affects multiple files but mostly search-and-replace once pattern is established.

---

## Quick Fix Applied (2026-01-14)

Replaced reference to non-existent `DimensionCodeUtils` module with inline mapping in `update_coding_status.ex`:

```elixir
defp dimension_type_to_coding_key(dim_type) when is_atom(dim_type) do
  case dim_type do
    :department -> :department
    :cost_center -> :department
    :project -> :project
    :class -> :class
    :location -> :location
    :account -> :gl_code
    :gl_account -> :gl_code
    :entity -> :entity
    _ -> dim_type
  end
end
```

This is a **temporary fix** until the full unification is done.
