# SC-2026-01-05-005: Engineering Handoff — Data Discrepancy Fixes

**Session:** SC-2026-01-05-005  
**Date:** 2026-01-05  
**Priority:** HIGH — Affects data integrity in NetSuite  
**Status:** Ready for Implementation

---

## Executive Summary

Post-push analysis revealed several critical gaps in the expense report push flow. The most severe is that reimbursements can be attributed to the **WRONG employee** in NetSuite due to silent fallback logic.

---

## Gap Summary

| Gap ID | Severity | Description | Status |
|--------|----------|-------------|--------|
| **GAP-EMP-001** | 🔴 CRITICAL | Employee fallback selects wrong person | Fix Required |
| GAP-CAT-001 | 🟡 HIGH | Category fallback uses NetSuite default instead of local lookup | Fix Required |
| GAP-DIM-001 | 🟡 HIGH | Department not extracted from CodingAssignment/Employee | Fix Required |
| GAP-DIM-002 | 🟡 HIGH | Location not extracted from CodingAssignment | Fix Required |
| GAP-DIM-003 | 🟡 HIGH | Class not extracted from CodingAssignment | Fix Required |
| GAP-MEMO-001 | 🟢 MEDIUM | Request description not sent as expense report memo | Fix Required |
| GAP-CURR-001 | 🟢 MEDIUM | Currency fallback queries NetSuite instead of using source | Document |
| GAP-XR-001 | 🟢 LOW | Exchange rate hardcoded to 1.0 | Document |
| GAP-SEED-001 | 🟢 MEDIUM | Demo seed lacks ERP-ready reimbursements | Enhancement |

---

## GAP-EMP-001: Employee Fallback Selects Wrong Person (CRITICAL)

### Problem

When a `WorkforceEmployee` has no `erp_employee_id` link, the fallback logic in `resolve_employee_external_id()` silently selects the **first active Accounting Employee** from the ERP connection:

```elixir
# push_expense_report_reactor.ex lines 989-1018
defp resolve_employee_external_id_from_erp(erp_connection_id, workspace_id) do
  query = Employee
          |> Ash.Query.filter(erp_connection_id == ^erp_connection_id and status == :active)
          |> Ash.Query.sort(inserted_at: :asc)  # ← First synced employee wins
          |> Ash.Query.limit(1)
  # ...
end
```

### Evidence

| Source | Employee |
|--------|----------|
| Reimbursement (our system) | Demo Admin (admin@demo.local) |
| NetSuite Expense Report | Jan Bucoy (jbucoy@netsuite.com) |

Jan Bucoy was selected because he was the first employee synced from NetSuite (`inserted_at: 2026-01-05 19:37:51`).

### Fix Required

**Option A (Recommended): Fail Fast with Clear Error**

```elixir
defp resolve_employee_external_id(workforce_employee_id, erp_connection_id, workspace_id)
     when not is_nil(workforce_employee_id) do
  # ... existing lookup logic ...
  
  case workforce_employee.erp_employee do
    %{external_id: ext_id} when not is_nil(ext_id) ->
      ext_id
      
    _ ->
      # INSTEAD OF FALLBACK: Return error
      Logger.error("PushExpenseReportReactor: Workforce Employee has no ERP link",
        workforce_employee_id: workforce_employee_id,
        employee_name: "#{workforce_employee.first_name} #{workforce_employee.last_name}",
        employee_email: workforce_employee.email
      )
      {:error, :employee_not_linked_to_erp}
  end
end
```

**Option B: Attempt Email/Name Matching First**

If we want to try automatic matching before failing:

```elixir
defp resolve_employee_external_id_legacy(workforce_employee, erp_connection_id, workspace_id) do
  # Try to match by email (case-insensitive)
  query = Employee
    |> Ash.Query.filter(
      erp_connection_id == ^erp_connection_id and 
      status == :active and
      fragment("LOWER(email) = LOWER(?)", ^to_string(workforce_employee.email))
    )
  
  case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
    {:ok, match} when not is_nil(match) ->
      Logger.info("Found ERP employee by email match: #{match.external_id}")
      match.external_id
      
    _ ->
      # NO SILENT FALLBACK - return error
      {:error, :no_erp_employee_match}
  end
end
```

### Files to Modify

- `lib/flame_teampay_payables/ember_erp/resources/reactors/expense/push_expense_report_reactor.ex`
  - `resolve_employee_external_id/3`
  - `resolve_employee_external_id_from_erp/2`
  - `resolve_employee_external_id_legacy/3`

---

## GAP-CAT-001: Category Fallback Uses NetSuite Default

### Problem

When line items don't have a mapped category, the system falls back to fetching the first expense category from NetSuite:

```elixir
# expense_reports.ex line 336-355
Logger.info("[NetSuite Push] ExpenseReports - Fetching default expense category from NetSuite")
```

This results in all items being coded to "Accounting" (ID 18) regardless of the item's actual category.

### Evidence

- Item category in our system: "Receipt" (from `item.description`)
- Category sent to NetSuite: ID 18 ("Accounting")

### Fix Required

**Look up local ExpenseCategory by name before falling back:**

```elixir
defp resolve_category_external_id(category_name, erp_connection_id, workspace_id) do
  # First try to find in synced categories
  query = ExpenseCategory
    |> Ash.Query.filter(
      erp_connection_id == ^erp_connection_id and
      active == true and
      (category_name == ^category_name or category_code == ^category_name)
    )
  
  case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
    {:ok, category} when not is_nil(category) ->
      category.external_id
      
    _ ->
      Logger.warning("No matching ExpenseCategory for: #{category_name}, will use NetSuite fallback")
      nil  # Let existing fallback handle
  end
end
```

### Files to Modify

- `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/push/expense_reports.ex`
  - `build_expense_line/3`
  - Add `resolve_category_external_id/3`

---

## GAP-DIM-001/002/003: Dimensions Not Extracted

### Problem

The `PushExpenseReportReactor` does NOT extract dimensions from:
- `CodingAssignment` records linked to the reimbursement
- `WorkforceEmployee.department_id`

### Evidence

- No `department`, `class`, or `location` fields in the NetSuite payload
- NetSuite shows empty values for these dimensions

### Fix Required

**Add dimension extraction step in reactor:**

```elixir
# In prepare_source_data step
defp extract_dimensions_for_push(reimbursement_request, workspace_id) do
  # 1. Try CodingAssignment at request level
  request_dims = extract_coding_assignments(
    workspace_id, 
    "reimbursement_request", 
    reimbursement_request.id
  )
  
  # 2. Fallback to employee department
  department_id = if Map.get(request_dims, :department) == nil do
    case reimbursement_request.employee do
      %{department_id: dept_id} when not is_nil(dept_id) ->
        resolve_department_external_id(dept_id, workspace_id)
      _ -> nil
    end
  else
    request_dims[:department]
  end
  
  %{
    department: department_id,
    location: request_dims[:location],
    class: request_dims[:class]
  }
end
```

### Files to Modify

- `lib/flame_teampay_payables/ember_erp/resources/reactors/expense/push_expense_report_reactor.ex`
  - Add `extract_dimensions_for_push/2`
  - Modify `prepare_source_data` step to include dimensions
- `lib/flame_teampay_payables/ember_erp/adapters/providers/netsuite/capabilities/push/expense_reports.ex`
  - Add dimension fields to `build_payload/1`

---

## GAP-MEMO-001: Request Description Not Sent

### Problem

`ReimbursementRequest.description` is not included in the expense report payload.

### Fix Required

```elixir
# In expense_reports.ex build_payload/1
|> add_field("memo", data[:description] || data["description"])
```

---

## GAP-CURR-001 / GAP-XR-001: Currency and Exchange Rate Fallbacks

### Current Behavior (Documented)

| Field | Source Priority | Fallback |
|-------|-----------------|----------|
| Currency | `data[:currency_id]` → `data[:currency_code]` | Query NetSuite for first currency |
| Exchange Rate | `data[:exchange_rate]` | Hardcoded `1.0` |

### Recommendation

- **Currency:** Add mapping from `ReimbursementRequest.currency` ("USD") to NetSuite currency ID
- **Exchange Rate:** Acceptable for same-currency transactions; add warning for multi-currency

---

## GAP-SEED-001: Demo Seed Data Enhancement

### Current State

- `priv/repo/seeds/dev/demo/09_reimbursements.exs` creates reimbursements
- No `CodingAssignment` records for dimensions
- No `erp_employee_id` links

### Proposed Enhancement

Create: `priv/repo/seeds/dev/ember_erp/02_reimbursement_erp_test_data.exs`

```elixir
# 10 ERP-ready reimbursements with:
# - Valid employee with erp_employee_id link
# - CodingAssignment records for department/location
# - Categories matching synced ExpenseCategory names
# - Status :paid for immediate testing

@erp_test_reimbursements [
  %{
    employee_email: "MeganB@2y2lvy.onmicrosoft.com",
    erp_employee_external_id: "1640",  # Link to Jan Bucoy
    description: "Q1 Team Offsite - San Francisco",
    items: [
      %{amount: 450, category: "Meals & Entertainment", merchant: "United Airlines"},
      %{amount: 225, category: "Conference Fees", merchant: "Marriott SF"},
    ],
    dimensions: %{department: "Engineering", location: "San Francisco"}
  },
  # ... 9 more examples
]
```

---

## Implementation Order

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | GAP-EMP-001 | Medium | 🔴 Critical - Wrong data |
| 2 | GAP-CAT-001 | Low | 🟡 Incorrect categorization |
| 3 | GAP-DIM-001/002/003 | Medium | 🟡 Missing dimensions |
| 4 | GAP-MEMO-001 | Low | 🟢 Missing info |
| 5 | GAP-SEED-001 | Medium | 🟢 Debugging speed |

---

## Testing Checklist

After implementation:

- [ ] Push reimbursement with NO `erp_employee_id` → Should FAIL with clear error
- [ ] Push reimbursement with `erp_employee_id` → Should use correct employee
- [ ] Push with item category matching synced ExpenseCategory → Should use local lookup
- [ ] Push with item category NOT matching → Should warn and use fallback
- [ ] Push with CodingAssignment dimensions → Should include department/class/location
- [ ] Seed data creates valid reimbursements → Should push successfully

---

## Appendix: Field Mapping Matrix

| Our System | NetSuite Field | Current Source | Proposed Source |
|------------|----------------|----------------|-----------------|
| employee_id → erp_employee.external_id | entity | Fallback to first employee | Fail if no link |
| item.category | expense.items[].category | NetSuite fallback (ID 18) | Local ExpenseCategory lookup |
| CodingAssignment(department) | department | Not sent | Extract from CodingAssignment |
| CodingAssignment(location) | location | Not sent | Extract from CodingAssignment |
| CodingAssignment(class) | class | Not sent | Extract from CodingAssignment |
| request.description | memo | Not sent | Include from request |
| request.currency | currency | NetSuite fallback | Map from currency code |
| (none) | exchangerate | Hardcoded 1.0 | Keep (acceptable for USD) |

---

*Prepared by: Sync Committee — Session SC-2026-01-05-005*

