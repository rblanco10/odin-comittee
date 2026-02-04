# State Machines

> **Constitutional Reference**: Article II, Section 2.4  
> **Last Verified**: 2026-01-14

---

## Standard State Machine (Constitutional)

Per Article II, Section 2.4, all resources MUST follow the standard state machine pattern:

```
┌─────────────────────────────────────────┐
│        STANDARD STATE MACHINE           │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────┐                     │
│         │ created │                     │
│         └────┬────┘                     │
│              │                          │
│              ▼                          │
│         ┌─────────┐                     │
│    ┌───►│ active  │◄───┐               │
│    │    └────┬────┘    │               │
│    │         │         │               │
│    │         ▼         │               │
│    │    ┌──────────┐   │               │
│    └────│ inactive │───┘               │
│         └──────────┘                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Valid States

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| `created` | Initial state after record creation | Record created |
| `active` | Normal operating state | Activation action |
| `inactive` | Soft-deleted or paused state | Deactivation action |

---

## Valid Transitions

| From | To | Action | Reversible |
|------|-----|--------|------------|
| `created` | `active` | Activate | No |
| `active` | `inactive` | Deactivate | Yes |
| `inactive` | `active` | Reactivate | Yes |

---

## PROHIBITED States

⛔ **"removed" is NOT a valid status**

Use `inactive` for soft deletes. The "removed" status breaks legacy compatibility and violates constitutional rules.

---

## Resource-Specific State Machines

Some resources have additional domain-specific states that extend the standard pattern:

### Receivable States

```
created → pending → posted → partial → paid
                       ↓
                     void
```

### Payment States

```
pending → processing → completed
                ↓           ↓
             failed     refunded
```

### Collection Plan States

```
created → active → completed
             ↓
          cancelled
```

---

## Verification Checklist

For any new resource or status change:

- [ ] Uses standard states (created, active, inactive)
- [ ] Does NOT use "removed" status
- [ ] All transitions are explicit actions
- [ ] Transitions match legacy system expectations
- [ ] State machine guardian (C006) has reviewed

---

## Implementation Pattern

```elixir
defmodule Resource do
  use Ash.Resource

  attributes do
    attribute :status, :atom do
      constraints [one_of: [:created, :active, :inactive]]
      default :created
    end
  end

  actions do
    update :activate do
      change set_attribute(:status, :active)
    end

    update :deactivate do
      change set_attribute(:status, :inactive)
    end

    update :reactivate do
      change set_attribute(:status, :active)
    end
  end
end
```

---

## Related Documentation

- Legacy status values: `knowledge_base/legacy/status_values.md`

---

*"A well-defined state machine is a gift to future maintainers."*

