# Dual Payment Implementation Experiment

## 🚨 WARNING: EXPERIMENTAL CODE — NOT FOR PRODUCTION 🚨

This document describes the **dual payment implementation test** added in session SC-2026-01-10-001. This experiment exists solely to determine which NetSuite payment approach will successfully create a payment record that links to an expense report.

---

## Background

### The Problem

When syncing a reimbursement to NetSuite, we need to:

1. Create an **Expense Report** (✅ Working)
2. Create a **Payment Record** that:
   - Pays the employee
   - Links to the expense report in NetSuite's "Related Records"
   - Updates the expense report status to "Paid in Full"

### The Challenge

NetSuite has multiple record types that could potentially be used for employee reimbursement payments:

| Record Type | Endpoint | Primary Use |
|-------------|----------|-------------|
| **Check** | `/check` | General disbursements, can pay employees |
| **VendorPayment** | `/vendorpayment` | Pay vendor bills |
| **Customer Payment** | `/customerPayment` | Receive customer payments |

The prior Teampay project documentation references `VendorPayment` for employee reimbursements, but the exact implementation pattern is unclear.

---

## The Experiment

### What We're Testing

The code simultaneously attempts **two different payment approaches** for every reimbursement sync:

| Approach | Record Type | Endpoint | Strategy |
|----------|-------------|----------|----------|
| **A** | Check with Expense Sublist | `POST /check` | Creates a Check with expense line items |
| **B** | VendorPayment | `POST /vendorpayment` | Creates VendorPayment applying to expense report |

### How It Works

```elixir
# expense_report_payments.ex

@dual_test_mode true  # ← EXPERIMENTAL FLAG

def push(config, data, opts) do
  if @dual_test_mode do
    push_dual_test(config, data, opts)  # ← Tries BOTH approaches
  else
    push_check_legacy(config, data, opts)  # ← Single approach
  end
end

def push_dual_test(config, data, opts) do
  # Attempt 1: Check with Expense Sublist
  check_result = push_check_with_expense(config, data, opts)
  
  # Attempt 2: VendorPayment
  vendor_result = push_vendorpayment(config, data, opts)
  
  # Return first success, or last error
  cond do
    match?({:ok, _}, check_result) -> check_result
    match?({:ok, _}, vendor_result) -> vendor_result
    true -> vendor_result  # Both failed
  end
end
```

### Identification in NetSuite

Each approach adds a **suffix to the memo** for easy identification in NetSuite:

| Approach | Memo Suffix | Example |
|----------|-------------|---------|
| Check | `[CHECK-TEST]` | `Payment for reimbursement REIM-2026-0063 [CHECK-TEST]` |
| VendorPayment | `[VENDORPAY-TEST]` | `Payment for reimbursement REIM-2026-0063 [VENDORPAY-TEST]` |

---

## Approach Details

### Approach A: Check with Expense Sublist

**Record Type:** Check (`/check`)

**Key Insight:** NetSuite Check records **require** at least one line in the `expense` or `item` sublist. A Check with only an `apply` sublist is rejected.

**Payload Structure:**

```json
{
  "entity": {"id": "1640"},
  "account": {"id": "123"},  // Bank account (source of funds)
  "trandate": "2026-01-10",
  "memo": "Payment for reimbursement REIM-2026-0063 [CHECK-TEST]",
  "expense": {
    "items": [{
      "account": {"id": "456"},  // Expense GL Account
      "amount": 101.00,
      "memo": "Reimbursement for Expense Report 618166"
    }]
  }
}
```

**Requirements:**
- `entity` → Employee ID (✅ Works with employees)
- `account` → Bank account for funds source
- `expense.items[].account` → GL Account for expense line (**This was failing as null**)

**Current Status:** ❌ Failed — `expense.items[0].account` was `null`

**Fix Applied:** Added `ensure_expense_account_id/2` fallback

### Approach B: VendorPayment

**Record Type:** VendorPayment (`/vendorpayment`)

**Key Insight:** VendorPayment's `apply` sublist is designed for **Vendor Bills**, NOT expense reports.

**Payload Structure:**

```json
{
  "entity": {"id": "789"},  // Must be a VENDOR, not Employee
  "account": {"id": "123"},  // Bank account
  "trandate": "2026-01-10",
  "memo": "Payment for reimbursement REIM-2026-0063 [VENDORPAY-TEST]",
  "apply": {
    "items": [{
      "doc": {"id": "618166"},  // Expense Report ID
      "apply": true,
      "amount": 101.00
    }]
  }
}
```

**Requirements:**
- `entity` → **Must be a Vendor ID** (Employees don't work directly)
- `apply.items[].doc` → **Must be a Vendor Bill ID** (Expense Reports don't work)

**Current Status:** ❌ Failed — "Invalid sublist/line item operation"

**Why It Fails:**
1. VendorPayment requires `entity` to be a Vendor, not an Employee
2. The `apply` sublist's `doc` field expects Vendor Bill IDs, not Expense Report IDs

**Potential Workaround (Not Yet Implemented):**
- Create a Vendor record for each employee ("employee-as-vendor" pattern)
- Create Vendor Bills instead of Expense Reports
- Apply VendorPayment to those Vendor Bills

---

## Test Results Log

| Date | Session | Approach A (Check) | Approach B (VendorPayment) |
|------|---------|-------------------|---------------------------|
| 2026-01-10 | SC-2026-01-10-001 | ❌ `account: null` | ❌ Invalid sublist operation |

---

## Next Steps

1. **Restart Server** — Validate fallback account resolution
2. **Re-test Check Approach** — Should now have valid `expense_account_id`
3. **If Check Works:**
   - Verify payment appears in "Related Records" on expense report
   - Verify expense report status changes
   - Document the working pattern
4. **If Check Doesn't Link:**
   - Investigate `complete: true` behavior
   - Explore NetSuite's native expense report payment mechanism
5. **Choose Production Approach** — Based on test results

---

## Disabling the Experiment

**Before production deployment, you MUST:**

1. **Set the flag to false:**
   ```elixir
   @dual_test_mode false
   ```

2. **Choose a single approach** in the `push/3` function

3. **Remove test suffixes** from memo generation

4. **Clean up test records** from NetSuite sandbox

---

## Related Files

| File | Description |
|------|-------------|
| `expense_report_payments.ex` | Contains dual test implementation |
| `push_reimbursement_complete_reactor.ex` | Orchestrates payment push, passes account IDs |
| `expense_reports.ex` | Creates expense reports with approval bypass |

---

*Created: Session SC-2026-01-10-001*
*Status: EXPERIMENT IN PROGRESS*

