# NetSuite Debug Log Analysis — Session SC-2026-01-13-003

## Log Timeline

| Timestamp | File | Expense Report | accountId | Account Details | Result |
|-----------|------|---------------|-----------|-----------------|--------|
| 01:38:27 | `..._01-38-27_447819.log` | 620769 | `""` (empty) | RESTlet used fallback | ✅ Success (Payment 620770) |
| 01:40:55 | `..._01-40-55_336705.log` | 620866 | `""` (empty) | RESTlet used fallback | ✅ Success (Payment 620771) |
| 02:12:19 | `..._02-12-19_48810.log` | 620966 | `"187"` | 1 Test Nick (LIABILITY) | ❌ INVALID_FLD_VALUE |
| 02:18:06 | `..._02-18-06_925022.log` | 621066 | `"187"` | 1 Test Nick (LIABILITY) | ❌ INVALID_FLD_VALUE |
| 02:33:13 | `..._02-33-13_902080.log` | 621072 | `"1"` | 1000 Checking (Bank, Subsidiary 1) | ❌ INVALID_FLD_VALUE |

---

## Analysis

### GAP-ACH-001: ACH Funding Account Fix — ✅ CONFIRMED WORKING

The latest log (02:12:19) shows:
```json
"accountId": "187"
```

**Before fix:** `accountId` was empty (`""`)  
**After fix:** `accountId` now contains the external_id from the ACH Funding Account configuration

The `resolve_ach_funding_account/3` function is correctly:
1. Querying `AccountMapping` for `:ach_funding_account`
2. Getting the `gl_account_id`
3. Querying `GLAccount` for its `external_id`
4. Returning `"187"` to the payment push

---

### GAP-ACH-002: Account 187 Invalid for Payments — 🔴 ROOT CAUSE IDENTIFIED

**Error from NetSuite:**
```json
{
  "error": "You have entered an Invalid Field Value 187 for the following field: account",
  "errorCode": "INVALID_FLD_VALUE",
  "success": false
}
```

**Database Evidence:**

```sql
-- Account 187 in our database:
SELECT external_id, account_code, account_name, account_type FROM ember_erp_accounting_gl_accounts WHERE external_id = '187';

 external_id | account_code | account_name | account_type 
-------------+--------------+--------------+--------------
 187         | 1            | 1 Test Nick  | liability    ← WRONG TYPE!
```

**🔴 ROOT CAUSE: User selected a LIABILITY account, not a BANK account**

The user selected "1 - 1 Test Nick" as the ACH Funding Account, but this account:
- **Account Type:** `liability` (NOT `asset`/`bank`)
- **NetSuite Requirement:** The `account` field for vendor payments must be a BANK type account

**Available Bank Accounts in NetSuite:**

| external_id | account_code | account_name | account_type |
|-------------|--------------|--------------|--------------|
| 1 | 1000 | 1000 Checking | asset |
| 195 | 1000F | 1000F Checking Foreign | asset |
| 4 | 1006 | 1006 Petty Cash | asset |
| 5 | 1008 | 1008 Cash on Hand | asset |
| 204 | 8001 | 8001 Bank Account Euro | asset |

**Why Earlier Tests Succeeded:**

When `accountId` was empty, the RESTlet used a default/fallback account. This is why:
- Payments 620770 and 620771 were created successfully
- Bill Payments in NetSuite show "111 Another Account" (the RESTlet's fallback, which IS a valid bank account)

**Solution Options:**

| Option | Implementation | Effort |
|--------|----------------|--------|
| **A. User selects correct account** | User changes ACH Funding Account to "1000 Checking" | 🟢 Immediate |
| **B. Filter dropdown to Bank accounts** | UI only shows Bank-type accounts for ACH Funding Account | 🟡 Code change |
| **C. Validate account type in reactor** | Check account_type before push, return clear error | 🟢 Quick fix |

---

### GAP-LINK-001: Payments Not Linked to Expense Reports — 🟡 INVESTIGATION NEEDED

**Human Director Report:** "In the expense report tab from NetSuite and on the related records, the reimbursements are not being linked."

**RESTlet Response (successful cases):**
```json
{
  "success": true,
  "paymentId": "620771",
  "expenseReportId": "620866",
  "recordType": "vendorpayment"
}
```

**Issue:** The RESTlet creates a `vendorpayment` record but may not be **applying** it to the expense report.

**Recall from SC-2026-01-09-002:**
> "VendorPayment's `apply` sublist is designed for **Vendor Bills**, NOT expense reports."

**NetSuite Native Payment Mechanism:**

| Method | Record Type | Links to Expense Report? |
|--------|-------------|--------------------------|
| Set `complete: true` on Expense Report | N/A | ❌ Just marks as paid, no payment record |
| Check with expense sublist | `/check` | ❌ Creates payment but no auto-link |
| VendorPayment with apply sublist | `/vendorpayment` | ❌ `apply` expects Vendor Bill IDs |
| Native "Pay Expense Report" UI | Internal | ✅ Links correctly |

**RESTlet Implementation Question:**
The RESTlet's `createExpenseReportPayment` action needs to be reviewed to understand how it's attempting to link the payment.

---

## Gaps Summary

| Gap ID | Description | Status | Priority |
|--------|-------------|--------|----------|
| **GAP-ACH-001** | ACH Funding Account not used in payment push | ✅ Fixed | - |
| **GAP-ACH-002** | Account 187 invalid for vendor payments | 🔴 New | HIGH |
| **GAP-LINK-001** | Payments not linked to expense reports | 🟡 Investigating | MEDIUM |

---

## Next Steps

1. **Verify Account 187** — Check if it's a Bank account type in NetSuite/GLAccount table
2. **Review RESTlet** — Examine `createExpenseReportPayment` action implementation
3. **Test with Valid Bank Account** — Select a proper Bank account in ERP Setup

---

*Analysis completed: 2026-01-14*
*Session: SC-2026-01-13-003 Turn 3*
