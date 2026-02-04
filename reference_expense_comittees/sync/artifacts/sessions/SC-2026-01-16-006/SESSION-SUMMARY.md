# Session Summary: SC-2026-01-16-006

## Executive Summary

**Topic:** Identity.User Creation During Employee Invitation — Elliot's Model Compliance

**Status:** ✅ IMPLEMENTATION COMPLETE

**Key Finding:** The `ProvisionEmployeeReactor` existed with correct user creation logic, but was **never invoked** from the invitation flow. Identity.User records were only created at first login via OAuth/SSO, not when admins invited employees.

**Fix Applied:** Integrated `ProvisionEmployeeReactor` into the `send_user_invitation/4` function in `workforce_live.ex`.

---

## GAP Addressed

### GAP-PROVISION-001: Identity.User Not Created During Invitation

| Attribute | Value |
|-----------|-------|
| **Severity** | 🔴 HIGH |
| **Component** | `UserProvisioningService`, `workforce_live.ex` |
| **Root Cause** | `ProvisionEmployeeReactor` was never called from invitation flow |
| **Status** | ✅ FIXED |

---

## Elliot's Identity Model Requirements

### When Identity.User IS Created:

1. ✅ **Employee Invitation** — When admin invites employee from Workforce Setup
2. ✅ **First OAuth Login** — Via `OAuthService.find_or_create_user()`
3. ✅ **First SSO Login** — Via `JitProvisioningService.provision_from_sso()`

### When Identity.User is NOT Created:

1. ✅ **ERP Sync** — Only creates `Erp.Employee` mirror records
2. ✅ **CSV Import** — Only creates `Employee` (or `AdmittedUser`) records
3. ✅ **Teams/Slack Sync** — Only creates `Employee` + `AdmittedUser` records

### User Creation Pattern:

```elixir
# Find-first-then-create pattern (correct implementation)
case User.by_email(email) do
  {:ok, [existing_user]} -> {:ok, %{user: existing_user, created: false}}
  {:ok, []} -> User.create(%{email: email, name: name})
end
```

---

## Implementation Changes

### File 1: `workforce_live.ex`

**Function Modified:** `send_user_invitation/4`

**Before (BROKEN):**
```elixir
defp send_user_invitation(user_id, workspace_id, entity_id, actor) do
  with {:ok, user} <- Ash.get(Employee, user_id, actor: actor) do
    # Only sent notification - NO USER CREATED
    UserProvisioningService.send_channel_invitation(user, workspace_id, entity_id, actor)
  end
end
```

**After (FIXED):**
```elixir
defp send_user_invitation(employee_id, workspace_id, entity_id, actor) do
  # Step 1: Provision the employee (creates Identity.User + IdentityBinding)
  provision_result = Reactor.run(
    ProvisionEmployeeReactor,
    %{
      employee_id: employee_id,
      workspace_id: workspace_id,
      binding_type: :invitation,
      actor: actor
    },
    %{},
    async?: false
  )

  case provision_result do
    {:ok, %{user_id: user_id, user_created: user_created}} ->
      # Step 2: Load employee and send notification
      with {:ok, employee} <- Ash.get(Employee, employee_id, actor: actor) do
        UserProvisioningService.send_channel_invitation(employee, workspace_id, entity_id, actor)
      end
    # ... error handling
  end
end
```

### File 2: `provision_employee_reactor.ex`

**Changes:**
1. Updated moduledoc to reflect Elliot's model compliance
2. Added Step 5: `link_employee_to_user` — Sets `Employee.user_id` field
3. Renumbered subsequent steps (6: Send Welcome, 7: Notify Role Assignment, 8: Complete)
4. Updated return value documentation

**New Step Added:**
```elixir
step :link_employee_to_user do
  argument :employee, result(:fetch_employee)
  argument :user_result, result(:find_or_create_user)
  wait_for :create_identity_binding

  run fn %{employee: employee, user_result: user_result}, _context ->
    user = extract_user(user_result)
    if is_nil(employee.user_id) do
      Ash.update(employee, %{user_id: user.id}, authorize?: false)
    else
      {:ok, employee}
    end
  end
end
```

---

## Flow After Fix

```
Admin clicks "Invite" in Workforce Setup
  │
  ├─► workforce_live.ex:handle_event("bulk_send_invitations")
  │     │
  │     ├─► send_user_invitation(employee_id, workspace_id, entity_id, actor)
  │     │     │
  │     │     ├─► ProvisionEmployeeReactor.run() ─────────────────┐
  │     │     │                                                    │
  │     │     │   Step 1: Fetch Employee                          │
  │     │     │   Step 2: Check existing IdentityBinding          │
  │     │     │   Step 3: Find or Create Identity.User  ◄─────────┤ USER CREATED HERE
  │     │     │   Step 4: Create IdentityBinding                  │
  │     │     │   Step 5: Set Employee.user_id  ◄─────────────────┤ LINK CREATED HERE
  │     │     │   Step 6: Send Welcome Notification               │
  │     │     │   Step 7: Notify Admins if Role Needed            │
  │     │     │   Step 8: Return result                           │
  │     │     │                                                    │
  │     │     ├─► UserProvisioningService.send_channel_invitation()
  │     │           │
  │     │           ├─► Send Teams/Slack/Email notification
  │     │           └─► Update Employee.invited_at
  │     │
  │     └─► sync_invited_employees_to_erp() (if ERP configured)
  │
  └─► Display success message
```

---

## AdmittedUser Status (Secondary Finding)

During investigation, committee found that `AdmittedUser` is still in use by several components:

| Component | Uses AdmittedUser | Refactor Status |
|-----------|------------------|-----------------|
| `workforce_live.ex` | Variable names only (uses Employee) | ✅ Refactored |
| `UserProvisioningService` | No (uses Employee) | ✅ Refactored |
| `UserProvisioningReactor` | Yes | ❌ Not refactored |
| `TeamsUserImportService` | Yes | ❌ Not refactored |
| `SlackUserImportService` | Yes | ❌ Not refactored |
| `UserManagementCsvImportService` | Yes | ❌ Not refactored |

**Note:** This is tracked separately from this session's scope. The primary goal (Identity.User creation during invitation) has been addressed.

---

## Committee Participation

| Member | Contribution |
|--------|-------------|
| Chair | Directed investigation flow, summarized findings |
| Code Fidelity Auditor | Traced execution paths, identified missing reactor call |
| Sync Architect | Analyzed data flow, documented before/after flows |
| Standards Enforcer | Verified compliance with Elliot's model |
| End User Advocate | Analyzed user experience impact |
| Architecture Presenter | Documented implementation approaches |
| NetSuite Domain Expert | Assessed ERP integration implications |
| Implementation Consultant | Executed code changes |
| Scribe | Documented session, created artifacts |

---

## Knowledge Captured

### Elliot's Identity Model — Core Principles

1. **Employee (Workforce)** = Who you are as an employee of a specific company
   - Fed from Teams/Slack, CSV, ERP
   - Central employee table
   - NOT a login user

2. **Identity User (Auth)** = Who you are for login and permissions
   - One identity can link to many employees (multiple entities)
   - Workforce creates/links; does NOT govern Identity

3. **Provisioning** = Creates/links Employee ↔ Identity ↔ Workspace
   - Identity.User created when admin invites employee
   - Uses find-first-then-create pattern

4. **Deprovisioning** = Marks link as inactive
   - Does NOT delete Identity or Employee

---

## Files Changed

| File | Lines Changed | Change Type |
|------|--------------|-------------|
| `workforce_live.ex` | ~50 | Modified `send_user_invitation/4` |
| `provision_employee_reactor.ex` | ~70 | Added Step 5, updated moduledoc |

---

## Session Metadata

- **Session ID:** SC-2026-01-16-006
- **Turns:** 3
- **Started:** 2026-01-16
- **Focus:** Identity.User Creation During Invitation
- **Human Director Request:** Verify and fix Identity.User creation during invitation flow
- **Status:** ✅ APPROVED & IMPLEMENTED
