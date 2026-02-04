# Multi-Tenancy Guide

> **Pattern**: Workspace-scoped data isolation

---

## Overview

ember_payments isolates data by workspace. Each workspace has its own provider credentials and payment records.

---

## Scoping Pattern

### Resources
All payment resources include workspace_id:

```elixir
attribute :workspace_id, :uuid do
  allow_nil? false
end
```

### Policies
Ash policies enforce scoping:

```elixir
policies do
  policy action_type(:read) do
    authorize_if actor_attribute_equals(:workspace_id, :workspace_id)
  end
end
```

---

## Credential Isolation

Each workspace has separate PaymentConnection per provider:

```elixir
# Workspace A
%PaymentConnection{
  workspace_id: "workspace-a",
  provider: :checkbook,
  credentials_encrypted: "..."
}

# Workspace B  
%PaymentConnection{
  workspace_id: "workspace-b",
  provider: :checkbook,
  credentials_encrypted: "..."  # Different credentials
}
```

---

## Credential Resolution

```elixir
def get_credentials(provider, workspace_id, actor) do
  PaymentConnection
  |> Ash.Query.filter(provider == ^provider)
  |> Ash.Query.filter(workspace_id == ^workspace_id)
  |> Ash.read_one!(actor: actor)
  |> decrypt_credentials()
end
```

---

## Cross-Tenant Prevention

1. **Never** query without workspace filter
2. **Always** include actor in Ash calls
3. **Verify** workspace_id matches in multi-step operations
4. **Test** for cross-tenant access attempts

---

*"Workspace isolation is non-negotiable; breaches are unacceptable."*
