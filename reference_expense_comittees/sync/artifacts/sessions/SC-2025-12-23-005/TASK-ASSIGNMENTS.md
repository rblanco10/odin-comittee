# Task Assignments: Expense Report Push/Sync/Reconciliation

**Session**: SC-2025-12-23-005  
**Date**: 2025-12-23  
**Status**: ENGINEERING_IN_PROGRESS

---

## Task 1: Fix Line Item Loading in Push Reactor

**Assignee**: Reactor Engineer  
**File**: `push_expense_report_reactor.ex`  
**Priority**: P0  

### Acceptance Criteria
- [ ] `load_related_line_items` queries ReimbursementLineItems for source_resource_id
- [ ] Line items include: id, line_number, amount, description, expense_category
- [ ] Returns list of line item maps ready for transformation

### Implementation Notes
- Query ember_reimbursements for ReimbursementLineItem
- Handle case where ReimbursementRequest doesn't exist (test scenario)

---

## Task 2: Store Line Mapping in Push Metadata

**Assignee**: Reactor Engineer  
**File**: `push_expense_report_reactor.ex`  
**Priority**: P0  

### Acceptance Criteria
- [ ] `complete_push_request` step stores line mapping in push_metadata
- [ ] Format: `{"line_items": [{"line_number": 1, "source_line_id": "uuid"}]}`
- [ ] Mapping persists even if some line items fail transformation

---

## Task 3: Add ExpenseLineItem to Mirror Module Registry

**Assignee**: Sync Specialist  
**File**: `push_reconciliation_service.ex`  
**Priority**: P1  

### Acceptance Criteria
- [ ] Add `get_mirror_module(:expense_line_item)` returning `ExpenseLineItem`
- [ ] Ensure proper module alias

---

## Task 4: Add erp_expense_report_id to ReimbursementRequest

**Assignee**: Data Engineer  
**File**: `reimbursement_request.ex`  
**Priority**: P1  

### Acceptance Criteria
- [ ] Add `erp_expense_report_id` field (uuid, nullable)
- [ ] Add `link_erp_report` action that accepts erp_expense_report_id
- [ ] Add relationship to ExpenseReport (optional)

---

## Task 5: Implement update_expense_erp_link

**Assignee**: Sync Specialist  
**File**: `push_reconciliation_service.ex`  
**Priority**: P1  

### Acceptance Criteria
- [ ] Query ReimbursementRequest by source_resource_id
- [ ] Call `link_erp_report` action with ExpenseReport mirror id
- [ ] Handle not found gracefully (log, don't fail)

---

## Task 6: Add erp_expense_line_item_id to ReimbursementLineItem

**Assignee**: Data Engineer  
**File**: `reimbursement_line_item.ex` (or equivalent)  
**Priority**: P2  

### Acceptance Criteria
- [ ] Add `erp_expense_line_item_id` field (uuid, nullable)
- [ ] Add `link_erp_line_item` action

---

## Task 7: Implement Line-Level Reconciliation

**Assignee**: Sync Specialist  
**File**: `push_reconciliation_service.ex`  
**Priority**: P2  

### Acceptance Criteria
- [ ] After header reconciliation, process line items
- [ ] Match by line_number from push_metadata → ExpenseLineItem.line_number
- [ ] Update ReimbursementLineItem with erp_expense_line_item_id

---

## Execution Order

```
Task 1 ─┬─► Task 2 ─► (Push flow complete)
        │
Task 3 ─┼─► Task 5 ─► (Header reconciliation complete)
        │
Task 4 ─┘
        
Task 6 ─► Task 7 ─► (Line reconciliation complete)
```

**Phase 1 (Critical)**: Tasks 1, 2, 3, 4, 5  
**Phase 2 (Enhancement)**: Tasks 6, 7

---

## Testing Strategy

1. **Unit Test**: Push reactor correctly loads and transforms line items
2. **Integration Test**: Full push → sync → reconcile flow with line items
3. **Verification**: Check push_metadata contains line mapping
4. **Verification**: Check ReimbursementRequest.erp_expense_report_id populated

