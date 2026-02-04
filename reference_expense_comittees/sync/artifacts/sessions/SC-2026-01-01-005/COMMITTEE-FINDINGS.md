# Committee Findings: Flow-08

**Session:** SC-2026-01-01-005  
**Topic:** Flow-08: Reimbursement → New Vendor (NO ERP Vendor Creation)  
**Status:** Research Complete

---

## Executive Summary

The committee has thoroughly researched Flow-08 and confirmed that **the implementation is already correct** in `PushExpenseReportReactor`. The reactor does NOT contain any vendor creation logic, which is exactly the required behavior for reimbursements.

**Key Finding:** Unlike card flows (which have extensive vendor policy checks and auto-creation logic), the expense report reactor simply records the vendor/merchant name as line-item attribution data without any attempt to create an ERP vendor record.

---

## Research Findings

### Member 1: Comparison with Card Flows (Flow-02/03)

**PushCardSpendReactor Analysis (Lines 328-533):**

```elixir
# CARD FLOW: Has resolve_vendor step with policy checks
step :resolve_vendor do
  ...
  handle_missing_vendor(transaction, push_request, actor)
end

defp handle_missing_vendor(transaction, push_request, actor) do
  # Load vendor policy
  case load_vendor_policy(push_request, actor) do
    {:ok, policy} ->
      if VendorPolicy.should_auto_create?(policy, amount) do
        # Flow 2, 5: Auto-create vendor
        auto_create_vendor(transaction, push_request, actor)
      else
        # Flow 3, 6: Block with message
        {:error, blocking_message}
      end
  end
end
```

**Conclusion:** Card flows have sophisticated vendor handling with policy-based decisions.

---

### Member 2: PushExpenseReportReactor Analysis

**Critical Confirmation:**
```bash
grep -i "vendor" push_expense_report_reactor.ex
# Result: NO MATCHES FOUND
```

The expense report reactor has:
- ✅ Employee resolution (lines 150-200)
- ✅ Line item loading with `merchant` field for attribution
- ❌ NO vendor policy checks
- ❌ NO `handle_missing_vendor` function
- ❌ NO `auto_create_vendor` function
- ❌ NO calls to `VendorPolicy`

**Step-by-Step Flow:**
1. `validate_push_request` — Validates the push request
2. `load_source_expense_report` — Loads from ReimbursementRequest, resolves **EMPLOYEE** external_id
3. `load_related_line_items` — Loads ReimbursementItems, includes `merchant` as attribution
4. `transform_to_erp_format` — Transforms to ERP format
5. `push_to_erp` — Sends ExpenseReport to ERP (employee is payee)
6. `complete_push_request` — Marks as pushed

**Line Item Structure (Line 245-255):**
```elixir
%{
  source_line_id: item.id,
  line_number: item.line_number || 1,
  description: item.description,
  amount: amount,
  expense_date: item.expense_date,
  merchant: item.merchant,   # ← ATTRIBUTION ONLY (not linked to ERP vendor)
  category: item.category,
}
```

**Conclusion:** Expense reports correctly handle vendors as attribution only.

---

### Member 3: Comparison with Flow-07 (Existing Vendor)

| Aspect | Flow-07 (Existing) | Flow-08 (New) |
|--------|-------------------|---------------|
| Vendor in ERP? | Already exists | Does NOT exist |
| ERP Vendor Created? | No | **No (NEVER)** |
| Reactor Used | PushExpenseReportReactor | PushExpenseReportReactor |
| Employee Resolution | ✅ Yes | ✅ Yes |
| Vendor Resolution | ✅ From existing mirror | ❌ N/A |
| VendorDetail | Has `erp_vendor_id` | `erp_vendor_id: NULL` |

**Key Insight:** Both flows use the same reactor. The difference is:
- Flow-07: Vendor already exists in ERP (can be referenced on expense line if ERP supports it)
- Flow-08: Vendor never created — merchant name is just for Teampay attribution/reporting

---

### Member 4: VendorDetail Handling

For reimbursements with new vendors:
1. VendorDetail is created in Teampay with `source: :reimbursement`
2. VendorDetail.erp_vendor_id = **NULL** (never linked to ERP)
3. Used for:
   - Attribution ("Who was the vendor?")
   - Reporting ("Spend by vendor")
   - Auto-coding ("Future expenses at this vendor")
4. NOT used for:
   - ERP vendor record
   - Vendor payable/liability

---

## Test Strategy for Flow-08

Given that the reactor behavior is the same as Flow-07, the key test differences are:

### What to Test

1. **Same as Flow-07:**
   - ExpenseReport is created (not Vendor Bill)
   - Payment payee is EMPLOYEE (not vendor)
   - Employee verification assertions
   - PushEntityRecord created for expense_report
   - Reconciliation links correctly

2. **Unique to Flow-08:**
   - Verify NO vendor-related PushEntityRecord is created
   - Confirm no calls to vendor policy (implicit in reactor)
   - Test that vendor name appears in line item attribution

### Test Cases

| # | Test Case | Purpose |
|---|-----------|---------|
| 1 | Complete lifecycle (new vendor) | Push → Sync → Bridge with new vendor |
| 2 | Verify NO vendor entity record | Confirm only :expense_report entity type |
| 3 | Line item attribution | Merchant name preserved on expense lines |
| 4 | Employee verification | Payment to employee, not vendor |

---

## Recommendation

**Proceed with Implementation.**

The existing reactor already handles Flow-08 correctly. The test file needs to verify:
1. The same lifecycle as Flow-07 works
2. NO vendor PushEntityRecord is created
3. Merchant name is preserved as attribution

**Risk Level:** LOW — Reactor behavior already verified via grep analysis.

---

*Documented by Sync Committee*  
*Session: SC-2026-01-01-005*

