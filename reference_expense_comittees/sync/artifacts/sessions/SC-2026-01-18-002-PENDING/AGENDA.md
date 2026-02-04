# Pending Session: SC-2026-01-18-002

## Title: NetSuite Project Expense Restriction Sync Strategy

**Status:** ⏸️ PENDING  
**Priority:** Medium  
**Depends On:** SC-2026-01-18-001 (Completed - Root cause documented)  
**Created:** 2026-01-18  

---

## Problem Statement

NetSuite projects can have restrictions that prevent them from being used on expense reports:

1. **"Allow Expenses"** checkbox - if unchecked, project cannot be used
2. **"Limit Time and Expenses to Resources"** checkbox - if checked, only assigned resources can use the project

Currently, these restrictions are **not synced** to Teampay, causing:
- Users to select invalid projects in the UI
- Push failures with cryptic "Invalid Field Value" errors
- Support burden to diagnose the issue

---

## Proposed Solutions to Evaluate

### Option A: Sync Restriction Fields to Project Table

**Add columns to `ember_erp_accounting_projects`:**
```sql
ALTER TABLE ember_erp_accounting_projects ADD COLUMN allow_expenses BOOLEAN DEFAULT true;
ALTER TABLE ember_erp_accounting_projects ADD COLUMN limit_to_resources BOOLEAN DEFAULT false;
```

**Sync from NetSuite:**
- `allowexpenses` → `allow_expenses`
- `limittimetoassignees` → `limit_to_resources`

**Filter in UI:** Hide projects where `allow_expenses = false` from dropdowns.

**Pros:**
- Simple to implement
- Prevents users from selecting invalid projects
- Can filter at query level

**Cons:**
- Doesn't handle resource assignment (would need to sync project resources too)
- Stale data risk (project settings changed in NS after sync)

---

### Option B: Sync Project Resources (Full Solution)

**Additional sync of project resources:**
- New table: `ember_erp_project_resources`
- Links: project_id, employee_id, erp_employee_id

**Full validation at selection time:**
1. Check `allow_expenses = true`
2. If `limit_to_resources = true`, check if current user is in project resources

**Pros:**
- Complete validation before push
- No surprise failures

**Cons:**
- More complex sync
- Additional storage
- Need to keep resources in sync

---

### Option C: Hybrid Approach

1. Sync `allow_expenses` and `limit_to_resources` flags
2. Filter UI by `allow_expenses` only
3. If `limit_to_resources` = true, show warning in UI: "This project may be restricted to assigned resources"
4. Keep the error message for push failures (catch edge cases)

**Pros:**
- Balances complexity vs user experience
- Prevents most errors
- Graceful degradation for edge cases

**Cons:**
- Warning might be confusing if user IS a resource

---

## Questions for Committee

1. How many customers use "Limit Time and Expenses to Resources"? Is this common?
2. What's the acceptable sync frequency for project restriction changes?
3. Should we pre-validate before push or just handle errors gracefully?
4. Is syncing project resources worth the complexity?

---

## Recommended Approach

**Phase 1 (Immediate - Done):** 
- Implement user-friendly error message ✅

**Phase 2 (This Session):**
- Evaluate Option C (Hybrid) as default recommendation
- Sync `allowexpenses` and `limittimetoassignees` fields
- Filter dimension dropdown by `allow_expenses = true`

**Phase 3 (Future):**
- If customer demand exists, implement Option B (full resource sync)

---

## Files to Modify

| File | Change |
|------|--------|
| `projects.ex` (sync) | Add `allowexpenses`, `limittimetoassignees` to SELECT |
| `project_mapper.ex` | Map new fields to Project resource |
| `ember_erp_accounting_projects` | Add columns via migration |
| `Project` resource | Add attributes |
| `DimensionFilterService` | Add `allow_expenses` filter |
| Dimension dropdown components | Hide restricted projects |

---

## Session Participants Needed

| Member | Reason |
|--------|--------|
| **Sync Architect** | Design sync changes |
| **NetSuite Specialist** | Validate NetSuite field availability |
| **Data Mapping Expert** | Schema changes |
| **End User Advocate** | UX for filtering and warnings |

---

## To Resume This Session

```
/sync-committee resume SC-2026-01-18-002
```

Or invoke and request:
> "Let's continue the project expense restriction sync strategy session (SC-2026-01-18-002)"

---

*Created by Sync Committee Scribe*
