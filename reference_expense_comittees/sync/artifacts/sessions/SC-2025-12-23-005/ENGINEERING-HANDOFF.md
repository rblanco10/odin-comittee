# Engineering Handoff: Expense Report Push/Sync/Reconciliation

**Session**: SC-2025-12-23-005  
**Date**: 2025-12-23  
**Focus**: NetSuite Expense Report & Line Item Push/Sync/Reconciliation  
**Constraint**: Single API call (assumes <500 line items)

---

## Executive Summary

The expense report push flow is missing critical line item handling and reconciliation logic. While the push capability for NetSuite correctly structures the payload with line items, the reactor that prepares the data doesn't actually load the line items from the source (ReimbursementRequest).

Additionally, the reconciliation service lacks the ability to link:
1. ReimbursementRequest → ExpenseReport mirror
2. ReimbursementLineItem → ExpenseLineItem mirror

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PUSH FLOW (Current State)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ReimbursementRequest (with LineItems)                                       │
│       │                                                                      │
│       ▼ PushOnStatusChange.maybe_push_to_erp/2                              │
│       │                                                                      │
│       ▼ PushOrchestrator.push_entity/8                                      │
│       │                                                                      │
│       ▼ PushRequest created                                                  │
│       │                                                                      │
│       ▼ PushExpenseReportReactor                                            │
│           │                                                                  │
│           ├─► Step 2: load_source_expense_report ✅ Works                    │
│           │                                                                  │
│           ├─► Step 3: load_related_line_items ❌ RETURNS EMPTY []           │
│           │                                                                  │
│           ├─► Step 4: transform_to_erp_format                               │
│           │       └─► Adds empty line_items to payload                      │
│           │                                                                  │
│           └─► Step 5: push_to_erp                                           │
│                   └─► NetSuite creates default test line                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECONCILIATION FLOW (Current State)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PushReconciliationService.reconcile_workspace/2                            │
│       │                                                                      │
│       ├─► get_mirror_module(:expense_report) → ExpenseReport ✅             │
│       │                                                                      │
│       ├─► get_mirror_module(:expense_line_item) → nil ❌ MISSING            │
│       │                                                                      │
│       ├─► update_expense_erp_link/3 → {:ok, :expense_link_pending} ❌ TODO  │
│       │                                                                      │
│       └─► No line item reconciliation ❌ MISSING                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Identified Gaps

### GAP-EXP-001: Line Items Not Loaded During Push

**Location**: `push_expense_report_reactor.ex` Step 3  
**Severity**: HIGH  
**Impact**: Expense reports pushed to NetSuite have no line items from actual reimbursements

**Current Code** (lines 207-224):
```elixir
step :load_related_line_items do
  run fn %{source_expense_report: source_expense_report, push_request: push_request}, _context ->
    Logger.info("PushExpenseReportReactor: Loading related line items for context")
    # In production, this would load related line items
    {:ok, []}  # ← ALWAYS RETURNS EMPTY!
  end
end
```

**Required Fix**: Load ReimbursementLineItems from the source ReimbursementRequest

---

### GAP-EXP-002: Line Item Mapping Not Stored in Push Metadata

**Location**: `push_expense_report_reactor.ex` Step 4 & 6  
**Severity**: MEDIUM  
**Impact**: Cannot reconcile ReimbursementLineItems to ExpenseLineItems after sync

**Problem**: When we push, we need to store a mapping:
```
line_number → source_line_id (ReimbursementLineItem.id)
```

This allows reconciliation to work after sync by matching:
```
ExpenseLineItem.line_number → pushed line_number → ReimbursementLineItem.id
```

---

### GAP-EXP-003: ExpenseLineItem Missing from Mirror Module Registry

**Location**: `push_reconciliation_service.ex` line 276  
**Severity**: MEDIUM  
**Impact**: Reconciliation service can't find ExpenseLineItem mirrors

**Current Code**:
```elixir
defp get_mirror_module(entity_type) do
  Logger.warning("[PushReconciliation] Unmapped entity_type: #{inspect(entity_type)}")
  nil
end
```

**Required Fix**: Add mapping for `:expense_line_item`

---

### GAP-EXP-004: Source Resource Link Not Implemented for Expenses

**Location**: `push_reconciliation_service.ex` lines 245-255  
**Severity**: HIGH  
**Impact**: ReimbursementRequest not linked to ExpenseReport mirror after reconciliation

**Current Code**:
```elixir
defp update_expense_erp_link(expense_resource_id, expense_report_id, workspace_id) do
  # TODO: When expense domain product wrapper is implemented, add the link logic here
  Logger.debug("Linking expense #{expense_resource_id} → #{expense_report_id}")
  {:ok, :expense_link_pending}
end
```

**Required Fix**: 
1. Add `erp_expense_report_id` field to ReimbursementRequest
2. Implement the actual linking logic

---

### GAP-EXP-005: No Line-Level Reconciliation

**Location**: `push_reconciliation_service.ex` (new feature needed)  
**Severity**: MEDIUM  
**Impact**: Individual line items cannot be traced from product domain to ERP

**Problem**: After sync, we have ExpenseLineItems with their own external_ids, but no way to link them back to ReimbursementLineItems.

**Required Fix**: Implement line-number based matching after header reconciliation

---

## Implementation Plan

### Phase 1: Fix Line Item Loading (GAP-EXP-001, GAP-EXP-002)

1. Update `load_related_line_items` to query ReimbursementLineItems
2. Transform line items with source_line_id preserved
3. Store line mapping in push_metadata

### Phase 2: Complete Reconciliation Service (GAP-EXP-003, GAP-EXP-004)

1. Add `:expense_line_item` to `get_mirror_module/1`
2. Add `erp_expense_report_id` to ReimbursementRequest resource
3. Implement `update_expense_erp_link/3`

### Phase 3: Line-Level Reconciliation (GAP-EXP-005)

1. After header reconciliation, reconcile line items
2. Match by line_number from push_metadata
3. Add `erp_expense_line_item_id` to ReimbursementLineItem resource

---

## Data Flow After Fix

```
PUSH:
  ReimbursementRequest (id: "reimb_123")
    └── line_items[0] (id: "line_001", line_number: 1, amount: 150.00)
    └── line_items[1] (id: "line_002", line_number: 2, amount: 85.50)
        │
        ▼ PushExpenseReportReactor
        
  PushRequest
    external_id: "789"
    push_metadata: {
      "line_items": [
        {"line_number": 1, "source_line_id": "line_001"},
        {"line_number": 2, "source_line_id": "line_002"}
      ]
    }

SYNC:
  ExpenseReport (external_id: "789")
    └── ExpenseLineItem (line_number: 1, external_id: "ns_line_1001")
    └── ExpenseLineItem (line_number: 2, external_id: "ns_line_1002")

RECONCILIATION:
  PushRequest.external_id "789" → ExpenseReport.external_id "789" ✓
  
  For each line in push_metadata.line_items:
    line_number: 1 → ExpenseLineItem.line_number: 1 → source_line_id: "line_001"
    → ReimbursementLineItem("line_001").erp_expense_line_item_id = ExpenseLineItem.id
    
  ReimbursementRequest.erp_expense_report_id = ExpenseReport.id
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `push_expense_report_reactor.ex` | Fix `load_related_line_items`, store line mapping in metadata |
| `push_reconciliation_service.ex` | Add expense_line_item mapping, implement expense link, add line reconciliation |
| `reimbursement_request.ex` | Add `erp_expense_report_id` field and `link_erp_report` action |
| `reimbursement_line_item.ex` | Add `erp_expense_line_item_id` field and `link_erp_line_item` action |

---

## Success Criteria

1. ✅ Push expense report includes all line items from ReimbursementRequest
2. ✅ Push metadata contains line_number → source_line_id mapping
3. ✅ Reconciliation links ReimbursementRequest → ExpenseReport
4. ✅ Reconciliation links ReimbursementLineItem → ExpenseLineItem
5. ✅ All changes compile without errors

---

## Engineering Subcommittee Assignment

**Lead**: Reactor Engineer  
**Support**: Sync Specialist, Data Engineer

**Estimated Effort**: 2-3 hours

**Priority**: HIGH - This is blocking end-to-end expense report push verification

