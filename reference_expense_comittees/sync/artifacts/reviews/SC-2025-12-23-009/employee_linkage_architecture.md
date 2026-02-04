# Employee Linkage Architecture

> **Session:** SC-2025-12-23-009  
> **Date:** 2025-12-23  
> **Status:** APPROVED by Sync Committee  
> **Topic:** Employee ↔ ExpenseReport ↔ Workforce Linkage

---

## Problem Statement

Expense reports pushed to ERPs (NetSuite, Sage Intacct) **require** an employee reference:
- **NetSuite:** `entity` field with internal employee ID
- **Sage Intacct:** `EMPLOYEEID` field with Intacct employee ID

The current system has two separate employee domains with no direct linkage:
- **Workforce Employee** (from HRIS: Merge, Okta, Azure AD)
- **ERP Employee** (from ERP: NetSuite, Sage, QuickBooks)

---

## Current Architecture (Runtime Lookup)

```
ReimbursementRequest
        │
        │ employee_id → Workforce Employee UUID
        │
        ▼
PushExpenseReportReactor.resolve_employee_external_id()
        │
        ├─► Load Workforce Employee by ID
        │       │
        │       ▼
        │   Get employee_number or email
        │       │
        │       ▼
        │   Query ERP Employee by employee_number/email
        │       │
        │       ├─► Found → Return external_id ✅
        │       │
        │       └─► Not found → Fallback to first ERP employee ⚠️
        │
        └─► Fallback may use WRONG employee
```

**Problems:**
1. Runtime query on every push (performance)
2. Soft matching by employee_number/email can fail
3. No explicit link survives field changes
4. Fallback uses "first available" employee (incorrect)

---

## Approved Architecture (Direct Link)

Add `erp_employee_id` to Workforce Employee for direct O(1) lookup:

```
Workforce Employee                    ERP Employee Mirror
┌─────────────────────┐              ┌─────────────────────┐
│ id: "abc-123"       │              │ id: "def-456"       │
│ employee_number: "E1"│  ──────────▶│ employee_number: "E1"│
│ email: "j@co.com"   │  HARD LINK   │ email: "j@co.com"   │
│ erp_employee_id: ───┼──────────────│ external_id: "789"  │
│   "def-456"         │              │ erp_connection_id: X│
└─────────────────────┘              └─────────────────────┘
```

---

## Implementation Plan

### 1. Add Field to Workforce Employee

**File:** `ember_workforce/resources/employee/employee.ex`

```elixir
attribute :erp_employee_id, :uuid do
  public? true
  description "Link to EmberErp.Accounting.Parties.Employee"
end

belongs_to :erp_employee, FlameTeampayPayables.EmberErp.Resources.Accounting.Parties.Employee do
  source_attribute :erp_employee_id
  destination_attribute :id
  allow_nil? true
  attribute_writable? true
end
```

**Action:** Add `link_erp_employee` update action.

---

### 2. Implement ExecuteTask Handler

**File:** `ember_erp/resources/domain_sync_task/manual_actions/execute_task.ex`

Add handler for `{:expense, :employee}`:

```elixir
defp process_sync(:expense, :employee, accounting_id, workspace_id) do
  with {:ok, erp_employee} <- load_erp_employee(accounting_id, workspace_id),
       {:ok, linked?} <- EmployeeLinkingService.link_erp_to_workforce(erp_employee, workspace_id) do
    if linked? do
      {:ok, erp_employee.id}
    else
      {:ok, :no_match_found}
    end
  end
end
```

---

### 3. Create Employee Linking Service

**File:** `ember_workforce/services/employee_linking_service.ex`

```elixir
defmodule FlameTeampayPayables.EmberWorkforce.Services.EmployeeLinkingService do
  @moduledoc """
  Links Workforce Employees to their ERP Employee mirrors.
  
  Matching strategy (in order):
  1. employee_number exact match
  2. email exact match (case-insensitive)
  """
  
  def link_erp_to_workforce(erp_employee, workspace_id) do
    # Find matching Workforce Employee
    # Link via erp_employee_id
  end
end
```

---

### 4. Update PushExpenseReportReactor

**File:** `ember_erp/resources/reactors/expense/push_expense_report_reactor.ex`

Update `resolve_employee_external_id/3` to check direct link first:

```elixir
defp resolve_employee_external_id(workforce_employee_id, erp_connection_id, workspace_id) do
  case load_workforce_employee_with_erp_link(workforce_employee_id, workspace_id) do
    {:ok, %{erp_employee: %{external_id: ext_id}}} when not is_nil(ext_id) ->
      # Direct link exists - use it
      ext_id
      
    _ ->
      # Fallback to existing employee_number/email matching
      resolve_employee_external_id_legacy(...)
  end
end
```

---

## Flow After Implementation

```
ReimbursementRequest.employee_id
        │
        ▼
Workforce Employee (preload :erp_employee)
        │
        │ .erp_employee_id → Direct Link
        │
        ▼
ERP Employee.external_id
        │
        ▼
NetSuite/Sage push with correct entity ID ✅
```

---

## Migration Note

Existing Workforce Employees will have `erp_employee_id = nil`.

The `EmployeeLinkingService` will be triggered:
1. When new ERP Employees sync (via ExecuteTask handler)
2. Manually via admin reconciliation action

---

## Session Reference

- Approved in: SC-2025-12-23-009 Turn 5
- Related: SC-2025-12-23-008 (Vendor Wrapper Pattern)
- Related: SC-2025-12-23-007 (Entity-Specific Reconciliation)

