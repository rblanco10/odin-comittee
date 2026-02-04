# Sync Committee Session SC-2026-01-02-007

## Session Metadata

| Field | Value |
|-------|-------|
| **Session ID** | SC-2026-01-02-007 |
| **Date** | 2026-01-02 |
| **Status** | COMPLETED |
| **Topic** | Binary UUID Serialization Error in PushRequest Metadata |
| **Outcome** | APPROVED & IMPLEMENTED |

---

## Problem Statement

When attempting to create a `PushRequest` for a reimbursement sync, the operation failed with:

```
Failed to create push request: %Ash.Error.Unknown{errors: [%Ash.Error.Unknown.UnknownError{
  error: "** (Jason.EncodeError) invalid byte 0x84 in <<85, 14, 132, 0, 226, 155, 65, 212, 167, 22, 68, 102, 85, 68, 0, 0>>"
}]}
```

The error occurred when trying to JSON-encode the `push_metadata` field of `PushRequest`.

---

## Root Cause Analysis

### Investigation Steps

1. **Error Location**: The `Jason.EncodeError` indicated a binary value was being passed to a JSON field
2. **Binary Pattern**: The 16-byte binary `<<85, 14, 132, 0, 226, 155, 65, 212, ...>>` is a raw UUID
3. **Source Traced**: `WorkspaceDenormalizationService.get_workspace_id_from_connection/1`

### Root Cause

The `get_workspace_id_from_connection/1` function uses a raw Ecto query to fetch the workspace_id:

```elixir
query = from(c in "ember_erp_connections",
  where: c.id == ^connection_id,
  select: c.workspace_id
)

case FlameTeampayPayables.Repo.one(query) do
  nil -> {:error, :connection_not_found}
  workspace_id -> {:ok, workspace_id}  # <- Returns 16-byte binary!
end
```

**Why This Happens:**
- Raw Ecto table queries (using string table names) return UUIDs as 16-byte binaries
- Ash resources automatically cast UUIDs to string format
- This workspace_id was then stored in `PushRequest.push_metadata` (a JSON field)
- `Jason.encode!/1` cannot serialize raw binary UUIDs

### Data Flow

```
get_workspace_id_from_connection/1
  └── Returns: <<85, 14, 132, 0, ...>> (16-byte binary)
      └── Stored in: push_metadata.actor_context.workspace_id
          └── PushRequest.create attempts JSON encode
              └── Jason.EncodeError!
```

---

## Solution

### Approved Fix

Explicitly cast the binary UUID to string format using `Ecto.UUID.cast!/1`:

```elixir
case FlameTeampayPayables.Repo.one(query) do
  nil ->
    {:error, :connection_not_found}

  # Raw Ecto table queries return UUIDs as binary (16 bytes).
  # Convert to string format for JSON serialization compatibility.
  # SC-2026-01-02-007: Fix binary UUID causing Jason.EncodeError in push_metadata
  workspace_id when is_binary(workspace_id) ->
    {:ok, Ecto.UUID.cast!(workspace_id)}
end
```

### Why This Works

- `Ecto.UUID.cast!/1` accepts both binary and string UUID formats
- For 16-byte binaries, it converts to the standard string format: `"550e8400-e29b-41d4-a716-446655440000"`
- String UUIDs are JSON-serializable

---

## Files Changed

| File | Change |
|------|--------|
| `lib/flame_teampay_payables/ember_erp/services/workspace_denormalization_service.ex` | Added `Ecto.UUID.cast!/1` conversion |

---

## Validation

### Before Fix
```
Failed to create push request: Jason.EncodeError invalid byte 0x84
```

### After Fix
```
[info] Created push request df8033db-b3f5-4fda-9ca8-ec518a532c0d for expense/expense_report
```

---

## Committee Approval

| Role | Decision |
|------|----------|
| **Sync Architect** | ✅ Approved - Standard pattern for raw Ecto queries |
| **Data Mapping Specialist** | ✅ Approved - Maintains data integrity |
| **Standards Enforcer** | ✅ Approved - Follows defensive coding practices |

---

## Related Sessions

- **SC-2026-01-02-005**: PushConfiguration entity_type mismatch (preceding issue)
- **SC-2026-01-02-008**: AshOban trigger configuration (subsequent issue)

---

## Lessons Learned

1. **Raw Ecto queries require explicit type handling** - Unlike Ash resources, they don't auto-cast UUIDs
2. **JSON fields need serializable values** - Always validate data types before storing in JSON columns
3. **Guard clauses for type safety** - Use `when is_binary(workspace_id)` to catch unexpected types early

