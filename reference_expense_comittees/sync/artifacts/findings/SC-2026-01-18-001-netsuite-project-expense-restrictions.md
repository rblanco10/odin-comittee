# Finding: NetSuite Project/Job Expense Restrictions

**Session ID**: SC-2026-01-18-001  
**Date**: 2026-01-18  
**Status**: ✅ CONFIRMED  
**Severity**: HIGH  
**Category**: NetSuite Expense Report Push  

---

## Summary

When pushing expense reports to NetSuite via REST API, a project/job assigned to an expense line may be rejected with an "Invalid Field Value" error on the `customer` field, even when the project appears valid (active, correct subsidiary, `allowexpenses: T`).

---

## Error Observed

```json
{
  "o:errorDetails": [{
    "detail": "Error while accessing a resource. You have entered an Invalid Field Value 53384 for the following field: customer.",
    "o:errorCode": "USER_ERROR",
    "o:errorPath": "expense.items[2]"
  }],
  "status": 400,
  "title": "Bad Request"
}
```

---

## Root Cause (Confirmed)

On the **Project (Job) record** in NetSuite, under **Project Preferences**, two settings control whether a project can be used on expense reports:

### 1. Allow Expenses Checkbox

| Setting | Effect |
|---------|--------|
| ✅ Checked | Project CAN be used on expense reports |
| ❌ Unchecked | Project CANNOT be used - REST API returns "Invalid Field Value" error |

### 2. Limit Time and Expenses to Resources Checkbox

| Setting | Effect |
|---------|--------|
| ❌ Unchecked | ANY employee can enter expenses against this project |
| ✅ Checked | ONLY employees assigned as **Resources** on the project can enter expenses |

**When "Limit Time and Expenses to Resources" is checked and the submitting employee is NOT assigned as a resource:**
- UI: The project shows "No matching records" in the selector
- API: NetSuite returns error as if the "customer" doesn't exist

---

## Investigation Journey

During investigation, we checked:

| Check | Result | Was it the cause? |
|-------|--------|-------------------|
| `isinactive` field | `F` (active) | ❌ No |
| `allowexpenses` field | `T` (true) | ❌ Not directly queryable issue |
| Subsidiary match | Both job and expense report in subsidiary 6 | ❌ No |
| Employee subsidiary | Employee in subsidiary 6 | ❌ No |
| Entity status | "Won" (5) vs typical "In Progress" (2) | ❌ No (red herring) |
| Currency mismatch | Job uses EUR (4), expense uses GBP (2) | ❌ No |
| Parent customer status | Active, same subsidiary | ❌ No |

**The actual issue was the "Limit Time and Expenses to Resources" setting on the Project Preferences subtab, which is NOT queryable via SuiteQL `job.*` fields.**

---

## How to Reproduce

1. Pick a project/job (e.g., internal ID 53384)
2. On that project, do ONE of:
   - Uncheck "Allow Expenses", OR
   - Check "Limit Time and Expenses to Resources" while the submitting employee is NOT a project resource
3. Attempt to create an Expense Report:
   - **UI**: Open expense report → attempt to select project in Customer/Project field → shows "No matching records"
   - **API**: POST expense report with `"customer": {"id": "53384"}` → NetSuite returns "Invalid Field Value" error

---

## Resolution

### Option A: Enable Open Access (Recommended for General Projects)
1. Navigate to project record in NetSuite
2. Go to **Project Preferences** subtab
3. ✅ Check "Allow Expenses"
4. ❌ Uncheck "Limit Time and Expenses to Resources"

### Option B: Add Employee as Resource (For Restricted Projects)
1. Navigate to project record in NetSuite
2. Go to **Resources** subtab
3. Add the employee who will be submitting expenses
4. Ensure "Allow Expenses" is still checked

---

## Technical Details

### NetSuite Field Mapping

In our codebase, the `project` dimension from Teampay is mapped to NetSuite's `customer` field on expense line items:

```elixir
# expense_reports.ex line 593-614
line_customer = Map.get(line, "project_id") || Map.get(line, :project_id) ||
                Map.get(line, "customer_id") || Map.get(line, :customer_id) ||
                dimensions[:project_id] || dimensions["project_id"]

|> add_field("customer", build_record_ref(line_customer))
```

This is correct - NetSuite's REST API uses `customer` for both customers AND jobs/projects since jobs are a subtype of customer records.

### Why SuiteQL Couldn't Detect This

The `allowexpenses` field queryable via SuiteQL (`job.allowexpenses`) only reflects the "Allow Expenses" checkbox, NOT the resource restriction. The "Limit Time and Expenses to Resources" setting creates a dynamic filter based on the current user context, which cannot be queried statically.

---

## Recommendations for Teampay

### Short-term (Error Handling)
1. **Improve error messaging**: When NetSuite returns "Invalid Field Value" for customer field, translate to user-friendly message:
   > "The selected project cannot be used on this expense report. Please verify in NetSuite that:
   > - The project has 'Allow Expenses' enabled
   > - If 'Limit Time and Expenses to Resources' is enabled, the employee must be assigned as a resource on the project"

### Medium-term (Validation)
2. **Pre-push validation**: Before attempting to push, validate that:
   - The project exists and is active
   - The employee has access to the project (may require additional NetSuite queries)

### Long-term (Sync Enhancement)
3. **Sync resource assignments**: Consider syncing project resource assignments to enable pre-validation in Teampay

---

## Related Files

| File | Purpose |
|------|---------|
| `expense_reports.ex` | Expense report push logic |
| `push_reimbursement_complete_reactor.ex` | Reimbursement orchestration |
| `projects.ex` (sync) | Project sync from NetSuite |

---

## Committee Sign-off

- **Scribe**: Documented ✅
- **NetSuite Specialist**: Root cause confirmed ✅
- **Expense Domain Expert**: Business context captured ✅
- **End User Advocate**: Error messaging recommendations provided ✅

---

## Tags

`#netsuite` `#expense-report` `#project` `#job` `#customer-field` `#invalid-field-value` `#allow-expenses` `#resource-restriction` `#rest-api` `#push-error`
