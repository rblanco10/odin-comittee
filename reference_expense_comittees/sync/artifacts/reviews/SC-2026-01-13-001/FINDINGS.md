# Session Findings: SC-2026-01-13-001

> Critical discoveries from the Bill Payment linking investigation.

---

## FIND-SC-2026-01-13-001: `defaultValues.entity` Required for VendorPayment

**Severity:** Critical
**Status:** Resolved
**Discovered by:** Sync Architect, NetSuite Expert

### Description

When creating a `vendorpayment` record in SuiteScript to pay an employee's expense report, you **MUST** pass the employee ID via `defaultValues.entity`:

```javascript
// ❌ WRONG - apply sublist will be empty
var payment = record.create({
    type: record.Type.VENDOR_PAYMENT,
    isDynamic: true
});
payment.setValue({ fieldId: 'entity', value: employeeId });  // Too late!

// ✅ CORRECT - NetSuite pre-populates apply sublist
var payment = record.create({
    type: record.Type.VENDOR_PAYMENT,
    isDynamic: true,
    defaultValues: { entity: employeeId }  // CRITICAL!
});
```

### Root Cause

NetSuite uses `defaultValues` to pre-populate the `apply` sublist with the entity's unpaid transactions at record creation time. Setting the `entity` field after creation does NOT retroactively populate this sublist.

### Resolution

Updated `teampay_file_upload_restlet.js` to use the correct pattern.

---

## FIND-SC-2026-01-13-002: `accountingApproval` Enables Payment Eligibility

**Severity:** Critical
**Status:** Resolved
**Discovered by:** NetSuite Expert

### Description

Expense reports created with `approvalstatus: "2"` (Approved) and `complete: true` may still NOT appear in the payment `apply` sublist unless `accountingApproval: true` is also set.

```json
{
  "complete": true,
  "approvalstatus": { "id": "2" },
  "accountingApproval": true  // Required for payment eligibility!
}
```

### Root Cause

NetSuite treats accounting approval as a separate gate from supervisor approval. Without this flag, the expense report enters "Pending Accounting Approval" status and cannot be paid.

### Resolution

Modified `expense_reports.ex` to add `accountingApproval: true` when a payment exists.

---

## FIND-SC-2026-01-13-003: Timing Gap Between Creation and Indexing

**Severity:** High
**Status:** Resolved (Workaround)
**Discovered by:** Edge Case Hunter

### Description

Newly created expense reports may take 1-3 seconds to appear in NetSuite's internal indices. Attempting to create a payment immediately after expense report creation can fail because the expense report doesn't appear in the `apply` sublist.

### Evidence

First attempt (no delay): Expense report 619369 not found in apply sublist
Second attempt (3s delay): Expense report 619370 found and linked successfully

### Workaround

Added `Process.sleep(3_000)` between expense report creation and payment creation.

### Recommended Production Solution

Replace fixed delay with polling:
```elixir
def wait_for_payable(config, expense_report_id, max_attempts \\ 5) do
  Enum.reduce_while(1..max_attempts, nil, fn attempt, _acc ->
    case check_payable(config, expense_report_id) do
      {:ok, true} -> {:halt, :ok}
      _ -> Process.sleep(1_000); {:cont, nil}
    end
  end)
end
```

---

## FIND-SC-2026-01-13-004: SuiteScript Log Levels

**Severity:** Low
**Status:** Resolved
**Discovered by:** Observability Specialist

### Description

SuiteScript's `N/log` module does NOT have a `warning()` function. Valid log levels are:
- `log.debug()`
- `log.audit()`
- `log.error()`
- `log.emergency()`

Using `log.warning()` causes a `TypeError`.

### Resolution

Changed all `log.warning()` calls to `log.audit()` with "WARNING:" prefix in title.

---

## FIND-SC-2026-01-13-005: REST API Cannot Manipulate `apply` Sublist

**Severity:** High
**Status:** Resolved
**Discovered by:** Sync Architect

### Description

NetSuite's standard REST API for `vendorpayment` records does NOT allow manipulation of the `apply` sublist. Attempts to POST with an `apply` array result in the field being ignored.

The `apply` sublist is a "special" sublist type in NetSuite that can only be manipulated via:
1. SuiteScript with dynamic mode
2. SOAP Web Services
3. NetSuite UI

### Resolution

Implemented a RESTlet (`createExpenseReportPayment` action) to handle payment creation via SuiteScript.

---

## Cross-Reference

| Finding | Related Gap | Related Decision |
|---------|-------------|------------------|
| FIND-001 | GAP-PAYMENT-LINK-001 | DEC-001 |
| FIND-002 | GAP-PAYMENT-LINK-001 | DEC-002 |
| FIND-003 | GAP-PROD-002 | DEC-003 |
| FIND-004 | — | — |
| FIND-005 | GAP-PAYMENT-LINK-001 | DEC-001 |

---

*Recorded by: Scribe*
*Session: SC-2026-01-13-001*
*Date: 2026-01-13*
