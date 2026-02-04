# Engineering Handoff - Phase 4: Missing Expense Mappers

**Session ID:** SC-2025-12-23-010
**Date:** 2025-12-24
**Status:** PENDING EXECUTION

---

## Overview

The Sync Committee's comprehensive audit identified 4 missing mapper files that prevent proper data transformation during sync. The sync capabilities exist and work correctly (data is fetched from ERPs), but without mappers the raw ERP data won't be transformed into Ash resource attributes.

---

## Gaps to be Addressed

### GAP G-10: QuickBooks `expense_report_mapper.ex` (P2)

- **Problem:** Sync capability exists, dispatch function exists, but mapper file doesn't exist
- **Impact:** Expense reports synced from QuickBooks won't be properly mapped to `ExpenseReport` resource
- **Location:** Create `providers/quickbooks/mappers/expense_report_mapper.ex`
- **Reference:** See `netsuite/mappers/expense_report_mapper.ex` for pattern
- **Effort:** Small

### GAP G-11: QuickBooks `expense_line_item_mapper.ex` (P2)

- **Problem:** Sync capability exists, dispatch function exists, but mapper file doesn't exist
- **Impact:** Expense line items synced from QuickBooks won't be properly mapped
- **Location:** Create `providers/quickbooks/mappers/expense_line_item_mapper.ex`
- **Reference:** See `netsuite/mappers/expense_line_item_mapper.ex` for pattern
- **Effort:** Small

### GAP G-12: QuickBooks `ap_payment_mapper.ex` (P2)

- **Problem:** Sync capability exists, dispatch function exists, but mapper file doesn't exist
- **Impact:** AP payments synced from QuickBooks won't be properly mapped
- **Location:** Create `providers/quickbooks/mappers/ap_payment_mapper.ex`
- **Reference:** See `netsuite/mappers/ap_payment_mapper.ex` for pattern
- **Effort:** Small

### GAP G-13: Sage Intacct `expense_line_item_mapper.ex` (P2)

- **Problem:** Sync capability exists, dispatch function exists, capability file exists, but mapper file doesn't exist
- **Impact:** Expense line items synced from Sage Intacct won't be properly mapped
- **Location:** Create `providers/sage_intacct/mappers/expense_line_item_mapper.ex`
- **Reference:** See `netsuite/mappers/expense_line_item_mapper.ex` for pattern
- **Effort:** Small

---

## Implementation Plan

### Step 1: Create QuickBooks Mappers

1. **expense_report_mapper.ex**
   - Map QuickBooks Purchase (PaymentType=Expense) to ExpenseReport attributes
   - Key fields: Id → external_id, TotalAmt → total_amount, TxnDate → report_date
   - Extract employee reference from EntityRef

2. **expense_line_item_mapper.ex**
   - Map QuickBooks Purchase Line items to ExpenseLineItem attributes
   - Key fields: Line.Id, Line.Amount, Line.Description
   - Extract coding from AccountRef, ClassRef, DepartmentRef

3. **ap_payment_mapper.ex**
   - Map QuickBooks BillPayment to APPayment attributes
   - Key fields: Id → external_id, TotalAmt → amount, TxnDate → payment_date
   - Extract vendor from VendorRef

### Step 2: Create Sage Intacct Mapper

4. **expense_line_item_mapper.ex**
   - Map Sage Intacct EEXPENSEENTRIES to ExpenseLineItem attributes
   - Key fields: RECORDNO → external_id, AMOUNT → amount, DESCRIPTION → description
   - Extract coding from LOCATIONID, DEPARTMENTID, CLASSID

### Step 3: Register Mappers

Update `registries/mapper_registry.ex`:
```elixir
# QuickBooks
register(:quickbooks, :expense_report, Mappers.ExpenseReportMapper)
register(:quickbooks, :expense_line_item, Mappers.ExpenseLineItemMapper)
register(:quickbooks, :ap_payment, Mappers.APPaymentMapper)

# Sage Intacct
register(:sage_intacct, :expense_line_item, Mappers.ExpenseLineItemMapper)
```

### Step 4: Verify

- Run `mix compile` to ensure no errors
- Verify all mappers are properly registered

---

## QuickBooks API Reference

### Expense Reports (Purchase with PaymentType=Expense)

```json
{
  "Id": "123",
  "TxnDate": "2024-01-15",
  "TotalAmt": 250.00,
  "EntityRef": {"value": "emp-456", "name": "John Doe"},
  "PaymentType": "Expense",
  "AccountRef": {"value": "acc-789"},
  "Line": [
    {
      "Id": "1",
      "Amount": 150.00,
      "Description": "Office supplies",
      "AccountBasedExpenseLineDetail": {
        "AccountRef": {"value": "6000"},
        "ClassRef": {"value": "class-1"},
        "DepartmentRef": {"value": "dept-1"}
      }
    }
  ]
}
```

### AP Payments (BillPayment)

```json
{
  "Id": "456",
  "TxnDate": "2024-01-20",
  "TotalAmt": 1000.00,
  "VendorRef": {"value": "vendor-123"},
  "PayType": "Check",
  "Line": [
    {
      "Amount": 1000.00,
      "LinkedTxn": [{"TxnId": "bill-789", "TxnType": "Bill"}]
    }
  ]
}
```

---

## Sage Intacct API Reference

### Expense Line Items (EEXPENSEENTRIES)

```xml
<EEXPENSEENTRIES>
  <RECORDNO>12345</RECORDNO>
  <AMOUNT>150.00</AMOUNT>
  <DESCRIPTION>Office supplies</DESCRIPTION>
  <EXPENSEDATE>01/15/2024</EXPENSEDATE>
  <LOCATIONID>LOC-001</LOCATIONID>
  <DEPARTMENTID>DEPT-001</DEPARTMENTID>
  <CLASSID>CLASS-001</CLASSID>
  <ACCOUNTNO>6000</ACCOUNTNO>
  <EXPENSEREPORTKEY>ER-789</EXPENSEREPORTKEY>
</EEXPENSEENTRIES>
```

---

## Execution Checklist

- [ ] Create `quickbooks/mappers/expense_report_mapper.ex`
- [ ] Create `quickbooks/mappers/expense_line_item_mapper.ex`
- [ ] Create `quickbooks/mappers/ap_payment_mapper.ex`
- [ ] Create `sage_intacct/mappers/expense_line_item_mapper.ex`
- [ ] Update `mapper_registry.ex` with all 4 registrations
- [ ] Run `mix compile` to verify
- [ ] Update session state

---

*Document prepared by Sync Committee for Engineering Subcommittee*

