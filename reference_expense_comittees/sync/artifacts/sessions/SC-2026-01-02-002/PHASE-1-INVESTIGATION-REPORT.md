# Phase 1 Investigation Report: Bi-Directional Sync Implementation Status

**Session:** SC-2026-01-02-002  
**Date:** 2026-01-02  
**Investigator:** Sync Committee Engineering Team

---

## Executive Summary

**Bi-directional sync (ERP → Teampay) is NOT implemented.**

The product requirement for Flow-10 and Flow-11 describes a mechanism where:
1. ERP admin edits coding in NetSuite
2. Changes propagate back to Teampay product domain

This mechanism does not exist in the codebase.

---

## Investigation Methodology

### Searches Performed

1. **Pattern search for propagation logic:**
   - `propagate.*domain|domain.*propagate|sync.*back|bidirectional|bi-directional|bidi`
   - **Result:** Only references to "bidirectional linking" (references between records), NOT data propagation

2. **Search for product domain updates:**
   - `update.*ExpenseCardTransaction|ExpenseCardTransaction.*update`
   - `update.*ReimbursementItem|ReimbursementItem.*update`
   - **Result:** No matches in ember_bridge services

3. **Search for coding comparison logic:**
   - `erp.*teampay|coding.*update|update.*coding|propagate.*change|apply.*change`
   - **Result:** Only references to CodingValue updates (dimension bridging), not product domain

4. **Semantic search for coding difference detection:**
   - "How does the system detect and compare coding differences between ERP bill and Teampay transaction?"
   - **Result:** Found `CircularDetectionService` which can detect data changes via hashing, but no propagation logic

---

## What Exists (NOT What We Need)

### 1. Dimension Bridging (DimensionBridgeService)

This bridges ERP dimension records (Department, Location, Class, etc.) to CodingValue records.

**Flow:** ERP Mirror → CodingValue

**Does NOT:** Update product domain records (ExpenseCardTransaction, ReimbursementItem)

### 2. Reconciliation Services (BillReconciliationService, etc.)

These LINK records after push:
- PushRequest → Bill (accounting_resource_id)
- Bill → PushRequest (origin_push_request_id)
- Invoice → Bill (erp_bill_id)

**Does NOT:** Propagate coding changes from Bill to product domain

### 3. Circular Detection Service

This detects if synced data was recently pushed (to avoid processing our own pushes).

**Can detect:** If data changed between sync and push
**Does NOT:** Propagate changes anywhere

---

## What Is Missing (GAP-BIDI-001)

### Flow-10 (Open Period)

**Required Logic:**

```elixir
defmodule BidirectionalSyncService do
  def propagate_erp_coding_to_product(bill_mirror, source_type, source_id, workspace_id) do
    # 1. Check if period is OPEN
    if period_is_open?(bill_mirror.period_id) do
      # 2. Load product domain record
      product_record = load_product_record(source_type, source_id)
      
      # 3. Compare coding fields
      erp_coding = extract_coding(bill_mirror)
      product_coding = extract_coding(product_record)
      
      if erp_coding != product_coding do
        # 4. Update product domain record
        update_product_coding(product_record, erp_coding)
        
        # 5. Create audit log
        create_audit_entry(product_record, :erp_originated_edit, erp_coding)
      end
    else
      # Period closed - skip propagation (Flow-11)
      {:ok, :period_closed_skip}
    end
  end
end
```

### Flow-11 (Closed Period)

**Required Logic:**

Same as Flow-10, but the period check returns `:period_closed_skip` - no propagation occurs.

---

## Architecture Decision

Since bi-directional sync is not implemented, we have two options:

### Option A: Implement Bi-Directional Sync First, Then Test

1. Create `BidirectionalSyncService`
2. Add step to `BridgeReactor` to call it during reconciliation
3. Implement period checking logic
4. Write tests

**Pros:** Tests verify real functionality  
**Cons:** Significant implementation work

### Option B: Create Tests That Verify Current Behavior (No Sync)

1. Write tests that verify ERP coding changes do NOT propagate
2. Document this as expected current behavior
3. Tests will need updating when feature is implemented

**Pros:** Quick, documents current state  
**Cons:** Tests don't verify product requirement

---

## Recommendation

**Implement Option A** - Bi-directional sync is a product requirement.

The product documentation explicitly calls for this behavior. Creating tests without the implementation would be testing non-existent functionality.

---

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `lib/.../ember_bridge/services/bidirectional_sync_service.ex` | Core logic |
| `test/.../flows/flow_10_erp_bidirectional_sync_test.exs` | Flow-10 tests |
| `test/.../flows/flow_11_erp_closed_no_sync_test.exs` | Flow-11 tests |

### Files to Modify

| File | Change |
|------|--------|
| `BridgeReactor` | Add step to call BidirectionalSyncService |

### Key Interfaces

**Input:** Bill mirror (with coding fields), source type, source ID, workspace ID  
**Output:** Success/skip result with audit trail

---

## Next Steps

1. ✅ Investigation complete
2. ⏳ Committee decision: Proceed with Option A
3. 🔲 Implement BidirectionalSyncService
4. 🔲 Write Flow-10 tests
5. 🔲 Write Flow-11 tests
6. 🔲 Verify all tests pass

---

*Phase 1 Investigation Report*  
*Session: SC-2026-01-02-002*

