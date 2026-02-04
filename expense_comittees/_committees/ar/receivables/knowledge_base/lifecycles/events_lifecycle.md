# Events Lifecycle

> **Subcommittee**: SC09  
> **Domain**: `FlamePsAr.Events`  
> **Database**: PostgreSQL  
> **Last Verified**: 2026-01-14

---

## Overview

The Events lifecycle governs the capture of changes from MySQL Classic resources and their dispatch to registered handlers (ERP Push, Webhooks, etc.).

---

## ChangeEvent Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHANGE EVENT LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐     begin_dispatch      ┌─────────────┐                      │
│    │ pending │────────────────────────►│ dispatching │                      │
│    └─────────┘                         └──────┬──────┘                      │
│         ▲                                     │                              │
│         │                    ┌────────────────┼────────────────┐            │
│         │ retry              │                │                │            │
│         │                    ▼                ▼                ▼            │
│         │              ┌───────────┐  ┌─────────────────┐  ┌────────┐      │
│         └──────────────│  failed   │  │ partial_failure │  │completed│     │
│                        └───────────┘  └─────────────────┘  └────────┘      │
│                              │                │                              │
│                              │   retry        │                              │
│                              └────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machine Definition

From `change_event.ex`:

```elixir
state_machine do
  initial_states([:pending])
  default_initial_state(:pending)
  state_attribute(:status)

  transitions do
    transition(:begin_dispatch, from: :pending, to: :dispatching)
    transition(:complete, from: :dispatching, to: :completed)
    transition(:partial_fail, from: :dispatching, to: :partial_failure)
    transition(:fail, from: :dispatching, to: :failed)
    transition(:retry, from: [:partial_failure, :failed], to: :pending)
  end
end
```

---

## State Definitions

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| `pending` | Awaiting dispatch | → `dispatching` |
| `dispatching` | Handlers being executed | → `completed`, → `partial_failure`, → `failed` |
| `completed` | All handlers succeeded | (terminal) |
| `partial_failure` | Some handlers failed | → `pending` (retry) |
| `failed` | All handlers failed | → `pending` (retry) |

---

## HandlerExecution Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HANDLER EXECUTION LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────┐       start        ┌─────────┐                               │
│    │ pending │───────────────────►│ running │                               │
│    └────┬────┘                    └────┬────┘                               │
│         │                              │                                     │
│         │ skip                         │                                     │
│         │                    ┌─────────┼─────────┐                          │
│         ▼                    ▼                   ▼                          │
│    ┌─────────┐         ┌───────────┐       ┌────────┐                       │
│    │ skipped │         │ completed │       │ failed │                       │
│    └────┬────┘         └───────────┘       └───┬────┘                       │
│         │                                       │                            │
│         │              retry                    │                            │
│         └──────────────────────────────────────┘                            │
│                          │                                                   │
│                          ▼                                                   │
│                     ┌─────────┐                                             │
│                     │ pending │                                             │
│                     └─────────┘                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Event Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPLETE EVENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CAPTURE PHASE                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   CaptureWorker (Oban)                                               │   │
│  │         │                                                            │   │
│  │         ▼                                                            │   │
│  │   CaptureChanges Reactor                                             │   │
│  │         │                                                            │   │
│  │         ├───► Get source config from ChangeEventRegistry            │   │
│  │         ├───► Get entities with source enabled                       │   │
│  │         └───► For each entity:                                       │   │
│  │                   │                                                  │   │
│  │                   ├───► Get capture cursor (last_updated)           │   │
│  │                   ├───► Query MySQL: WHERE last_updated > cursor     │   │
│  │                   ├───► Create ChangeEvent records (deduplicated)   │   │
│  │                   └───► Update capture cursor                        │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  2. DISPATCH PHASE                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │   DispatchWorker (Oban)                                              │   │
│  │         │                                                            │   │
│  │         ▼                                                            │   │
│  │   DispatchEvents Reactor                                             │   │
│  │         │                                                            │   │
│  │         ├───► Get handler config from ChangeEventRegistry           │   │
│  │         ├───► Get dispatch cursor (event_nonce)                      │   │
│  │         ├───► Read unprocessed events: WHERE event_nonce > cursor    │   │
│  │         └───► For each event:                                        │   │
│  │                   │                                                  │   │
│  │                   ├───► Create HandlerExecution records             │   │
│  │                   ├───► Execute handler (e.g., ERP Push reactor)    │   │
│  │                   ├───► Update HandlerExecution status              │   │
│  │                   └───► Update ChangeEvent status                    │   │
│  │                                                                       │   │
│  │         └───► Update dispatch cursor                                 │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cursor-Based Processing

### Capture Cursor

- **Key**: `(entity_id, record_type)`
- **Value**: `%{"last_updated" => timestamp}`
- **Purpose**: Track where to resume polling MySQL

### Dispatch Cursor

- **Key**: `(record_type)`
- **Value**: `%{"event_nonce" => integer}`
- **Purpose**: Track which events have been dispatched
- **Performance**: O(1) lookup via auto-incrementing `event_nonce`

---

## Deduplication

Events are deduplicated via identity constraint:

```elixir
identities do
  identity(:unique_event, [:workspace_id, :record_type, :source_id, :data_hash],
    pre_check_with: FlamePsAr.PostgresRepo
  )
end
```

The `data_hash` is a SHA256 hash of the payload, preventing duplicate events for unchanged data.

---

## Handler Tracking

Each event maintains handler progress:

| Attribute | Type | Purpose |
|-----------|------|---------|
| `handlers_pending` | [Atom] | Handlers awaiting processing |
| `handlers_completed` | [Atom] | Successfully processed handlers |
| `handlers_failed` | [Atom] | Failed handlers |

---

## Configuration

Sources and handlers configured in `config/config.exs`:

```elixir
config :flame_ps_ar, FlamePsAr.Events,
  sources: [
    payment: [
      module: FlamePsAr.Classic.Payments.Resources.Payment,
      action: :read_changes,
      schedule: "* * * * *",      # Every minute
      queue: :events_capture,
      batch_size: 1000,
      overlap_seconds: 5
    ]
  ],
  handlers: [
    erp_push: [
      reactor: FlamePsAr.EmberErp.Reactors.Push.Push,
      record_types: [:payment, :transfer],
      schedule: "* * * * *",
      queue: :events_dispatch,
      priority: 10
    ]
  ]
```

---

## Error Handling

### Event-Level Failures

| Outcome | Condition | Result |
|---------|-----------|--------|
| `completed` | All handlers succeeded | Event done |
| `partial_failure` | Some handlers failed | Can retry failed only |
| `failed` | All handlers failed | Can retry all |

### Handler-Level Failures

| Outcome | Stored Data |
|---------|-------------|
| `failed` | `error_message`, `error_details` (stacktrace, etc.) |
| `skipped` | `skip_reason` (`:handler_disabled`, `:no_matching_config`, etc.) |

---

## Retry Behavior

The `:retry` transition moves events back to `pending`:

```elixir
update :retry do
  change(transition_state(:pending))

  change(fn changeset, _context ->
    # Move failed handlers back to pending
    failed = changeset.data.handlers_failed || []
    pending = changeset.data.handlers_pending || []

    changeset
    |> Ash.Changeset.force_change_attribute(:handlers_pending, pending ++ failed)
    |> Ash.Changeset.force_change_attribute(:handlers_failed, [])
    |> Ash.Changeset.force_change_attribute(:dispatched_at, nil)
    |> Ash.Changeset.force_change_attribute(:completed_at, nil)
  end)
end
```

---

## Constitutional Considerations

- **Idempotency**: Handlers MUST be idempotent (events may be retried)
- **Deduplication**: SHA256 hash prevents processing unchanged data
- **Tenant Isolation**: Events scoped by `workspace_id`
- **Performance**: `event_nonce` index enables O(1) cursor lookup
- **Eventual Consistency**: Events bridge MySQL → PostgreSQL with eventual consistency

---

## Code References

```
lib/flame_ps_ar/events/
├── domain.ex                        # Ash domain definition
├── change_event_registry.ex         # GenServer for config
├── resources/
│   ├── change_event/
│   │   └── change_event.ex          # ChangeEvent resource
│   ├── event_cursor/
│   │   └── event_cursor.ex          # EventCursor resource
│   └── handler_execution/
│       └── handler_execution.ex     # HandlerExecution resource
├── reactors/
│   ├── capture_changes/
│   │   ├── capture_changes.ex       # Capture reactor
│   │   └── steps/
│   │       ├── get_source_config.ex
│   │       ├── get_entities.ex
│   │       └── process_entities.ex
│   └── dispatch_events/
│       ├── dispatch_events.ex       # Dispatch reactor
│       └── steps/
│           ├── get_handler_config.ex
│           ├── get_dispatch_cursor.ex
│           ├── read_unprocessed_events.ex
│           ├── execute_handlers.ex
│           └── update_dispatch_cursor.ex
└── workers/
    ├── capture_worker.ex            # Oban capture worker
    └── dispatch_worker.ex           # Oban dispatch worker
```

---

*"Events: the bridge between now and then."*
