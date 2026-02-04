# Flow-11 Engineering Handoff

**Session:** SC-2026-01-01-008  
**Date:** 2026-01-01  
**Status:** READY FOR ENGINEERING

---

## Executive Summary

Flow-11 implements **Edit & Sync for Card Transactions**. When a user edits a card transaction that has already been pushed to the ERP, the system must:

1. **Check if the accounting period is OPEN or CLOSED**
2. **If OPEN:** Allow the edit AND sync the change to the ERP
3. **If CLOSED:** Block the edit and show a message

**This is NOT a design decision. Product requirements explicitly specify this behavior.**

---

## Product Requirements Source

**Document:** `REQUIREMENTS-PART-1-AUTO-SYNC.md`  
**Session:** SC-2025-12-29-001

### Explicit Bi-Directional Editing Rules

| Scenario | Teampay Action | ERP Action |
|----------|----------------|------------|
| Teampay edit, period **open** | **Allowed + synced** | Receives update |
| Teampay edit, period **closed** | **BLOCKED** | N/A |

### Invariant Rules (Verbatim from Product)

> **Invariant 5:** While a period is **open**, transaction edits are **bi-directionally synced**
>
> **Invariant 6:** Once a period is **closed**, the **ERP is authoritative** and Teampay becomes **read-only**

### UI Behavior for Closed Period (Verbatim from Product)

> **Flow 10 (Product Numbering): Admin Attempts to Edit in Teampay (Period Closed)**
>
> | Step | Action |
> |------|--------|
> | 1 | **Teampay blocks the edit** |
> | 2 | Editable fields are **disabled** |
> | 3 | A message is shown: "This transaction is in a closed accounting period. Edits must be made directly in the ERP." |

---

## Scenario Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  FLOW-11: EDIT CARD TRANSACTION AFTER PUSH                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRE-CONDITIONS:                                                           │
│   - Card transaction was pushed to ERP (erp_synced_at IS NOT NULL)          │
│   - ERP Bill + Bill Payment exist with external_id                          │
│   - User attempts to edit coding, vendor, or other fields                   │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   CASE A: PERIOD IS OPEN                                                    │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ 1. User edits transaction in Teampay                               │    │
│   │ 2. System validates period is OPEN                                 │    │
│   │ 3. Edit is ALLOWED                                                 │    │
│   │ 4. System triggers UPDATE to ERP Bill                              │    │
│   │ 5. ERP Bill coding/amount updated                                  │    │
│   │ 6. erp_synced_at updated                                           │    │
│   │ 7. Audit log: "Transaction updated and synced to ERP"              │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│   CASE B: PERIOD IS CLOSED                                                  │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │ 1. User attempts to edit transaction in Teampay                    │    │
│   │ 2. System validates period is CLOSED                               │    │
│   │ 3. Edit is BLOCKED                                                 │    │
│   │ 4. Fields are DISABLED in UI                                       │    │
│   │ 5. Message shown: "This transaction is in a closed accounting      │    │
│   │    period. Edits must be made directly in the ERP."                │    │
│   │ 6. No sync attempted                                               │    │
│   └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Gap Analysis

### Current State

| Component | Current Behavior | Required Behavior |
|-----------|------------------|-------------------|
| ExpenseCardTransaction | No check on edit if synced | Must check period before edit |
| ExpenseCardTransaction | No `sync_status` tracking | May need resync tracking |
| PushCardSpendReactor | Only CREATE mode | Need UPDATE mode |
| ERP Adapters | `update/4` exists for Bills | Wire up to reactor |
| UI | Edits always allowed | Disable fields if period closed |

### Identified Gaps

| Gap ID | Component | Issue | Severity |
|--------|-----------|-------|----------|
| GAP-F11-001 | ExpenseCardTransaction | No validation to check period status before allowing edit on synced transactions | 🔴 Critical |
| GAP-F11-002 | ExpenseCardTransaction | No mechanism to determine which period a transaction was posted to | 🔴 Critical |
| GAP-F11-003 | PushCardSpendReactor | No UPDATE mode - only handles initial push | 🔴 Critical |
| GAP-F11-004 | UI/LiveView | No logic to disable edit fields when period is closed | 🟠 High |
| GAP-F11-005 | Audit | No "edit synced to ERP" audit event | 🟡 Medium |

---

## Implementation Requirements

### 1. Period Check Before Edit

**Location:** `ExpenseCardTransaction` resource actions

Add validation to edit actions (`update_description`, `set_vendor`, `assign_dimensions`, etc.):

```elixir
# Pseudocode
validate fn changeset, context ->
  transaction = changeset.data
  
  # Only check if transaction was already synced
  if transaction.erp_synced_at != nil do
    # Get the posting period from push metadata or PushRequest
    case get_posting_period(transaction) do
      {:ok, period} when period.is_open == true ->
        :ok  # Allow edit
        
      {:ok, period} when period.is_open == false ->
        {:error, "This transaction is in a closed accounting period. Edits must be made directly in the ERP."}
        
      {:error, _} ->
        :ok  # If we can't determine period, allow edit (fail open)
    end
  else
    :ok  # Not synced yet, allow edit
  end
end
```

### 2. Update Reactor or Update Mode

**Option A:** Create new `UpdateCardSpendReactor`
**Option B:** Add `:update` mode to existing `PushCardSpendReactor`

The reactor must:
1. Load the existing PushEntityRecords (for Bill external_id)
2. Transform edited fields to ERP format
3. Call `adapter.update(config, external_id, data)`
4. Update `erp_synced_at` on success

### 3. Wire Up Adapter Update Capability

The adapters already have `update/4` for Bills:

```elixir
# Acumatica - EXISTS
def update(config, external_id, data, opts \\ [])

# QuickBooks - EXISTS  
def update(config, external_id, data, opts \\ [])

# Sage Intacct - NEEDS VERIFICATION
# NetSuite - NEEDS VERIFICATION
```

### 4. Track Posting Period

Need to store which accounting period a transaction was posted to:

**Option A:** Store `posting_period_id` on ExpenseCardTransaction
**Option B:** Query PushRequest.push_metadata["posting_period_id"]
**Option C:** Query AccountingPeriod by transaction date

---

## Test Requirements

### Core Tests (Minimum 8)

| Test ID | Scenario | Expected |
|---------|----------|----------|
| F11-T01 | Edit synced transaction, period OPEN | Edit allowed, ERP updated |
| F11-T02 | Edit synced transaction, period CLOSED | Edit BLOCKED with error message |
| F11-T03 | Edit coding (department), period OPEN | Coding synced to ERP Bill |
| F11-T04 | Edit vendor, period OPEN | Vendor updated in ERP Bill |
| F11-T05 | Edit unsynced transaction, any period | Edit allowed (no ERP check) |
| F11-T06 | Verify ERP Bill updated after edit | adapter.update called |
| F11-T07 | Verify erp_synced_at updated after edit-sync | Timestamp updated |
| F11-T08 | Verify audit log for edit-sync | Audit entry created |

### Regression Tests

| Test ID | Scenario | Expected |
|---------|----------|----------|
| F11-T09 | All previous Flow-01 to Flow-10 tests | 284 tests pass |
| F11-T10 | Initial push still works (not affected by update logic) | Push succeeds |

---

## Files to Modify

### Core Implementation

| File | Changes |
|------|---------|
| `expense_card_transaction.ex` | Add period validation to edit actions |
| `push_card_spend_reactor.ex` | Add UPDATE mode or create new reactor |
| `bill_reconciliation_service.ex` | May need updates for edit tracking |

### New Files

| File | Purpose |
|------|---------|
| `expense_card_transaction_flow_11_lifecycle_test.exs` | Flow-11 tests |

### UI (If Applicable)

| File | Changes |
|------|---------|
| `transaction_detail_live.ex` | Disable edit fields if period closed |

---

## Critical Invariants (Carry Forward)

1. ✅ Cards create vendor payables (Bill + Payment)
2. ✅ Reimbursements create ExpenseReports, NOT Bills
3. ✅ If period OPEN: Teampay edits sync to ERP
4. ✅ If period CLOSED: Teampay edits are BLOCKED
5. ✅ ERP is authoritative for closed periods
6. ✅ All 284+ ERP tests must pass after implementation

---

## Validation Checklist

- [ ] Period check added to edit actions on ExpenseCardTransaction
- [ ] Update capability wired for Bills
- [ ] Edit-sync works for open period
- [ ] Edit blocked for closed period
- [ ] Error message matches product spec
- [ ] All 8+ Flow-11 tests pass
- [ ] All existing 284 ERP tests pass (0 regressions)
- [ ] Audit log entry for edit-sync

---

## Notes from Committee

### Key Understanding

The committee initially presented design options (A, B, C, D) which was **incorrect**. Upon re-reading the product requirements, it was clear that:

1. Product **explicitly specified** the behavior in `REQUIREMENTS-PART-1-AUTO-SYNC.md`
2. There was **no design decision** to make
3. The requirements are:
   - Period OPEN → Allow edit + sync to ERP
   - Period CLOSED → Block edit + show message

### Lesson Learned

> When product provides explicit requirements, implement them exactly. Do not invent alternatives or present options that contradict the requirements.

---

## Handoff to Engineering

**Engineering Team:** You are receiving:
- 284 passing ERP integration tests
- Clear product requirements (see Section 2)
- Identified gaps (see Section 4)
- Implementation requirements (see Section 5)
- Test requirements (see Section 6)

**Your responsibility:**
1. Implement the period check validation
2. Implement the update-sync mechanism
3. Create Flow-11 test file with 8+ tests
4. Ensure ALL 284+ ERP tests pass (0 failures)
5. Any test failures are YOUR responsibility to fix

---

*Documented by Sync Committee*  
*Session: SC-2026-01-01-008*

