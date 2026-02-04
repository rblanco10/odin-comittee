# Multi-tenancy

> **Constitutional Reference**: Article II, Section 2.3  
> **Last Verified**: 2026-01-14

---

## Overview

The `flame_ps_ar` application is multi-tenant. All data access MUST be scoped to a specific tenant.

---

## Tenant Identifiers

| Domain | Tenant Field | Type | Format |
|--------|--------------|------|--------|
| `FlamePsAr.Classic.Domain` | `owner_id` | KSUID | 27-char string |
| `FlamePsAr.Classic.Payments` | `owner_id` | KSUID | 27-char string |
| `FlamePsAr.EmberErp` | `workspace_id` | UUID | Standard UUID |

---

## Constitutional Rule (Article II, Section 2.3)

```
All queries MUST include tenant (owner_id or workspace_id).
Missing tenant = full table scan = BLOCKED.
```

---

## Tenant Context Propagation

### Actor Context

Tenant context is carried through the actor:

```elixir
%{
  actor: actor,
  tenant: owner_id  # or workspace_id
}
```

### Query Filtering

All queries MUST filter by tenant:

```elixir
# Good
Ash.Query.filter(Receivable, owner_id == ^owner_id)

# BAD - NO TENANT FILTER
Ash.Query.filter(Receivable, amount > 100)
```

---

## Implementation Patterns

### Resource Definition

```elixir
defmodule Receivable do
  use Ash.Resource

  attributes do
    attribute :owner_id, :string do
      allow_nil? false
    end
  end

  identities do
    identity :tenant_primary, [:owner_id, :id]
  end
end
```

### Policy Enforcement

```elixir
policies do
  policy action_type(:read) do
    authorize_if expr(owner_id == ^actor(:tenant))
  end
end
```

---

## Cross-Tenant Access

Cross-tenant access is:
- ❌ **PROHIBITED** for normal operations
- ⚠️ **Requires explicit Human Director approval** for admin/support operations
- ✅ **Must be logged** when admin access occurs

---

## Verification Checklist

For any new query or operation:

- [ ] Tenant filter present in query
- [ ] Tenant filter at database level (not just application)
- [ ] Policy enforces tenant match
- [ ] Bulk operations scoped to single tenant
- [ ] No cross-tenant data access possible

---

## Common Violations

### Missing Tenant Filter

```elixir
# VIOLATION
def get_all_receivables() do
  Ash.read!(Receivable)  # No tenant filter!
end

# CORRECT
def get_receivables(owner_id) do
  Receivable
  |> Ash.Query.filter(owner_id == ^owner_id)
  |> Ash.read!()
end
```

### Bulk Update Without Tenant

```elixir
# VIOLATION
def update_all_amounts(new_amount) do
  Ash.bulk_update!(Receivable, :update_amount, %{amount: new_amount})
end

# CORRECT
def update_amounts(owner_id, new_amount) do
  Receivable
  |> Ash.Query.filter(owner_id == ^owner_id)
  |> Ash.bulk_update!(:update_amount, %{amount: new_amount})
end
```

---

## Related Documentation

- Domain boundaries: `knowledge_base/architecture/domain_boundaries.md`

---

*"One tenant's data is never another tenant's business."*

