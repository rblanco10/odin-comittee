# Flow-12 Engineering Handoff: Edit & Sync - Reimbursement

> **Session:** SC-2026-01-01-009  
> **Status:** HANDOFF TO ENGINEERING  
> **Created:** 2026-01-01  
> **Committee Decision:** Unanimous consensus

---

## 1. Specification

### Product Requirements (REQUIREMENTS-PART-1-AUTO-SYNC.md)

| Invariant | Statement |
|-----------|-----------|
| 5 | While a period is **open**, transaction edits are **bi-directionally synced** |
| 6 | Once a period is **closed**, the **ERP is authoritative** and Teampay becomes **read-only** |

### Flow 10 (Product Doc - Applies to Reimbursements)

> **Context:** Period is CLOSED, transaction already posted to ERP, admin attempts to edit in Teampay
>
> **What Happens:**
> 1. **Teampay blocks the edit**
> 2. Editable fields are **disabled**
> 3. Message shown: "This transaction is in a closed accounting period. Edits must be made directly in the ERP."

---

## 2. Implementation Requirements

### 2.1 Create ValidateReimbursementEditPeriod

**File:** `lib/flame_teampay_payables/ember_reimbursements/resources/item/changes/validate_reimbursement_edit_period.ex`

**Behavior:**

```
IF erp_expense_line_item_id IS NULL:
  → Allow edit (not synced yet)
ELSE:
  → Find ERP connection via parent chain
  → Get expense_date from item
  → Check accounting period status
  → IF period OPEN: Allow edit
  → IF period CLOSED: Block with error message
  → IF no periods synced: Allow edit (fail open)
```

### 2.2 Sync Detection

| Field | Purpose |
|-------|---------|
| `ReimbursementItem.erp_expense_line_item_id` | If set, item has been synced to ERP |

### 2.3 Navigation Path (ERP Connection Lookup)

```
ReimbursementItem.request_id
  → ReimbursementRequest
    → ReimbursementRequest.erp_expense_report_id
      → ExpenseReport
        → ExpenseReport.erp_connection_id
          → AccountingPeriod lookup
```

### 2.4 Period Check Date

Use `ReimbursementItem.expense_date` for the accounting period lookup.

### 2.5 Error Message (EXACT from product spec)

```
"This transaction is in a closed accounting period. Edits must be made directly in the ERP."
```

---

## 3. Modify ReimbursementItem Resource

**File:** `lib/flame_teampay_payables/ember_reimbursements/resources/item/reimbursement_item.ex`

### 3.1 Add to `:update` action

```elixir
update :update do
  accept [...]
  
  # SC-2026-01-01-009: Flow-12 - ValidateReimbursementEditPeriod does DB lookups
  require_atomic? false
  
  # SC-2026-01-01-009: Flow-12 - Validate period is open before allowing edit on synced items
  change FlameTeampayPayables.EmberReimbursements.Resources.Item.Changes.ValidateReimbursementEditPeriod
  
  change FlameTeampayPayables.EmberReimbursements.Resources.Item.Changes.ApplyCodingRules
end
```

---

## 4. Test Requirements

### 4.1 Test File

**File:** `test/flame_teampay_payables/ember_erp/integration/flows/reimbursement_flow_12_lifecycle_test.exs`

### 4.2 Test Cases (10 minimum)

| ID | Description | Expected Outcome |
|----|-------------|------------------|
| F12-T01 | Edit unsynced item | ✅ ALLOWED |
| F12-T02 | Edit synced item, period OPEN | ✅ ALLOWED |
| F12-T03 | Edit synced item, period CLOSED | ❌ BLOCKED |
| F12-T04 | Error message matches product spec | Exact text match |
| F12-T05 | Edit synced item, no periods exist | ✅ ALLOWED (fail open) |
| F12-T06 | Edit amount field, period OPEN | ✅ ALLOWED |
| F12-T07 | Edit description field, period CLOSED | ❌ BLOCKED |
| F12-T08 | Edit expense_date field, period CLOSED | ❌ BLOCKED |
| F12-T09 | Edit merchant field, period OPEN | ✅ ALLOWED |
| F12-T10 | Multiple items, one open one closed period | Mixed results |

### 4.3 Test Invariants

- ❌ NEVER block edits on unsynced items
- ✅ ALWAYS use exact product spec error message
- ✅ Period check uses item's expense_date
- ✅ Fail open when no ERP data available

---

## 5. Dependencies

### Resources to Access

| Resource | Module | Purpose |
|----------|--------|---------|
| ReimbursementRequest | EmberReimbursements | Get erp_expense_report_id |
| ExpenseReport | EmberErp | Get erp_connection_id |
| AccountingPeriod | EmberErp | Check is_open status |
| ErpConnection | EmberErp | Fallback lookup |

### Imports Required

```elixir
alias FlameTeampayPayables.EmberReimbursements.Resources.Request.ReimbursementRequest
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseReport
alias FlameTeampayPayables.EmberErp.Resources.Accounting.Core.AccountingPeriod
alias FlameTeampayPayables.EmberErp.Resources.Connection.ErpConnection
```

---

## 6. Success Criteria

1. ✅ All 10+ Flow-12 tests pass
2. ✅ All 331+ existing ERP tests pass (0 failures)
3. ✅ Unsynced items always editable
4. ✅ Synced items in OPEN period editable
5. ✅ Synced items in CLOSED period blocked with exact message
6. ✅ No regressions in other reimbursement functionality

---

## 7. Comparison to Flow-11

| Aspect | Flow-11 (Card) | Flow-12 (Reimbursement) |
|--------|----------------|-------------------------|
| Change Module | `ValidateEditPeriod` | `ValidateReimbursementEditPeriod` |
| Location | EmberExpenseCard | EmberReimbursements |
| Sync Field | `erp_synced_at` + `erp_external_id` | `erp_expense_line_item_id` |
| Date Source | `transaction_date` | `expense_date` |
| ERP Path | Transaction → PushRequest | Item → Request → ExpenseReport |

---

*Engineering Handoff Complete*  
*Ready for Implementation*

