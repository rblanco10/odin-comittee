# Reactor Pattern

> **Historian**: Catherine Wells (H002)  
> **Last Verified**: 2026-01-14

---

## Overview

Reactors are used for orchestrating multi-step workflows in Ash. They provide transaction management, error handling, and step composition.

---

## When to Use Reactors

✅ **Use Reactors For**:
- Multi-step workflows
- Operations spanning multiple resources
- Async operations with dependencies
- Complex business logic requiring orchestration

❌ **Don't Use Reactors For**:
- Single resource operations
- Simple CRUD actions
- Operations that could be a single action

---

## Basic Pattern

```elixir
defmodule CreateCollectionPlanReactor do
  use Ash.Reactor

  input :receivable_id
  input :actor

  step :get_receivable do
    run fn _args, %{receivable_id: id, actor: actor} ->
      Receivable
      |> Ash.get!(id, actor: actor)
    end
  end

  step :create_plan, depends_on: [:get_receivable] do
    run fn _args, %{get_receivable: receivable} ->
      CollectionPlan
      |> Ash.Changeset.new(%{
        receivable_id: receivable.id,
        customer_id: receivable.customer_id
      })
      |> Ash.create!()
    end
  end

  step :create_schedule, depends_on: [:create_plan] do
    run fn _args, %{create_plan: plan} ->
      # Generate schedule based on plan
    end
  end

  return :create_plan
end
```

---

## Error Handling

```elixir
step :create_plan do
  run fn _args, context ->
    case create_plan(context) do
      {:ok, plan} -> {:ok, plan}
      {:error, reason} -> {:error, reason}
    end
  end
  
  compensate fn _args, _context ->
    # Rollback logic if subsequent step fails
    :ok
  end
end
```

---

## Existing Reactor Examples

```
lib/flame_ps_ar/classic/domain/reactors/
├── create_collection_plan.ex
├── apply_payment.ex
└── compile_plan.ex
```

---

## Constitutional Considerations

- Reactors must maintain legacy compatibility
- All operations within reactor share transaction
- Failed reactors should leave no partial state
- Performance budget applies to complete reactor execution

---

*"Reactors orchestrate complexity; they don't create it."*

