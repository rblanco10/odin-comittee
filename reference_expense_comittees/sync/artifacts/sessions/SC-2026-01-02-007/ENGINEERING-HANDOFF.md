# Engineering Handoff: SC-2026-01-02-007

## Binary UUID Serialization Fix

### Quick Reference

| Item | Value |
|------|-------|
| **Session** | SC-2026-01-02-007 |
| **Priority** | P1 - Blocker |
| **Status** | ✅ IMPLEMENTED |
| **Commit** | `1e0626552` |

---

## The Bug

**Symptom**: `Jason.EncodeError: invalid byte 0x84` when creating PushRequest

**Root Cause**: `WorkspaceDenormalizationService.get_workspace_id_from_connection/1` returns a 16-byte binary UUID from a raw Ecto query, which cannot be JSON-encoded.

---

## The Fix

```elixir
# lib/flame_teampay_payables/ember_erp/services/workspace_denormalization_service.ex

case FlameTeampayPayables.Repo.one(query) do
  nil ->
    {:error, :connection_not_found}

  # SC-2026-01-02-007: Fix binary UUID causing Jason.EncodeError
  workspace_id when is_binary(workspace_id) ->
    {:ok, Ecto.UUID.cast!(workspace_id)}
end
```

---

## Why Raw Ecto Queries Return Binary UUIDs

When using raw table names in Ecto queries:

```elixir
from(c in "ember_erp_connections", ...)  # String table name = raw query
```

PostgreSQL returns UUID columns as 16-byte binaries. Ash resources handle this automatically, but raw queries don't.

---

## Testing

```elixir
# Before fix:
iex> WorkspaceDenormalizationService.get_workspace_id_from_connection(conn_id)
{:ok, <<85, 14, 132, 0, 226, 155, 65, 212, 167, 22, 68, 102, 85, 68, 0, 0>>}

# After fix:
iex> WorkspaceDenormalizationService.get_workspace_id_from_connection(conn_id)
{:ok, "550e8400-e29b-41d4-a716-446655440000"}
```

---

## Impact

This fix unblocks manual sync operations for reimbursements. Without it, clicking "Sync to ERP" would always fail with a JSON encoding error.

