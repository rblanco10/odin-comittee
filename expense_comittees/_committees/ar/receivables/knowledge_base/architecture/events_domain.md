# Events Domain

> **Module**: `FlamePsAr.Events`  
> **Database**: PostgreSQL  
> **Tenant**: `workspace_id` (UUID)  
> **Subcommittee**: SC09  
> **Last Verified**: 2026-01-14

---

## Overview

The Events domain provides domain-agnostic event infrastructure for capturing changes from MySQL Classic resources and dispatching them to registered handlers.

This is a **separate Ash domain** from Classic and EmberERP, with its own resources stored in PostgreSQL.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENTS DOMAIN ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────┐        ┌─────────────────────┐                      │
│  │   Classic Domain   │        │   Events Domain     │                      │
│  │   (MySQL)          │        │   (PostgreSQL)      │                      │
│  │                    │        │                     │                      │
│  │  Payment           │ poll   │  ChangeEvent        │                      │
│  │  Transfer          ├───────►│  EventCursor        │                      │
│  │  Receivable        │        │  HandlerExecution   │                      │
│  │                    │        │                     │                      │
│  └────────────────────┘        └──────────┬──────────┘                      │
│                                           │                                  │
│                                           │ dispatch                         │
│                                           ▼                                  │
│                                ┌─────────────────────┐                      │
│                                │   Handlers          │                      │
│                                │   - ERP Push        │                      │
│                                │   - Webhooks        │                      │
│                                │   - etc.            │                      │
│                                └─────────────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Resources

| Resource | Table | Purpose |
|----------|-------|---------|
| `ChangeEvent` | `events_change_events` | Captured changes from MySQL sources |
| `EventCursor` | `events_cursors` | Tracks sync progress (capture & dispatch) |
| `HandlerExecution` | `events_handler_executions` | Tracks handler execution per event |

### Supporting Modules

| Module | Purpose |
|--------|---------|
| `ChangeEventRegistry` | GenServer holding source/handler config |
| `CaptureChanges` Reactor | Polls MySQL for changes, creates events |
| `DispatchEvents` Reactor | Processes events through handlers |
| `CaptureWorker` | Oban worker for scheduled capture |
| `DispatchWorker` | Oban worker for scheduled dispatch |

---

## ChangeEvent Resource

**State Machine**:

```
pending → dispatching → completed
                      → partial_failure
                      → failed
```

**Key Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `workspace_id` | UUID | Tenant identifier |
| `entity_id` | UUID | Entity providing `classic_owner_id` |
| `record_type` | Atom | Type of record (`:payment`, `:transfer`) |
| `source_id` | String | Record ID from MySQL |
| `payload` | Map | Data from source record |
| `data_hash` | String | SHA256 hash for deduplication |
| `event_nonce` | Integer | Auto-incrementing for cursor-based dispatch |
| `handlers_pending` | [Atom] | Handlers awaiting processing |
| `handlers_completed` | [Atom] | Successfully processed handlers |
| `handlers_failed` | [Atom] | Failed handlers |

**Deduplication**: Events are deduplicated via identity on `(workspace_id, record_type, source_id, data_hash)`.

---

## EventCursor Resource

**Two Cursor Types**:

| Type | Scope | Purpose | Key |
|------|-------|---------|-----|
| `:capture` | Per entity + record_type | Track MySQL sync position | `last_updated` timestamp |
| `:dispatch` | Per record_type | Track event processing position | `event_nonce` integer |

**Usage Pattern**:

```elixir
# Capture: Get where we left off for this entity
EventCursor.get_capture_cursor(entity_id, :payment)
# => %{cursor_value: %{"last_updated" => ~U[2026-01-14 10:00:00Z]}}

# Dispatch: Get last processed event nonce
EventCursor.get_dispatch_cursor(:payment)
# => %{cursor_value: %{"event_nonce" => 12345}}
```

---

## HandlerExecution Resource

**State Machine**:

```
pending → running → completed
                  → failed
                  → skipped
```

**Key Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| `handler_type` | Atom | Type of handler (`:erp_push`) |
| `status` | Atom | Execution status |
| `result` | Map | Handler result on success |
| `error_message` | String | Error description on failure |
| `error_details` | Map | Structured error data |
| `skip_reason` | Atom | Why skipped (`:handler_disabled`, etc.) |
| `duration_ms` | Integer | Execution duration |

---

## Configuration

Sources and handlers are configured in `config/config.exs`:

```elixir
config :flame_ps_ar, FlamePsAr.Events,
  sources: [
    payment: [
      module: FlamePsAr.Classic.Payments.Resources.Payment,
      action: :read_changes,
      schedule: "* * * * *",
      queue: :events_capture,
      batch_size: 1000,
      overlap_seconds: 5
    ],
    transfer: [
      module: FlamePsAr.Classic.Transfers.Resources.Transfer,
      action: :read_changes,
      # ...
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

## Reactors

### CaptureChanges Reactor

**Flow**:
1. Get source configuration from registry
2. Get all entities with source enabled
3. For each entity:
   - Get/create capture cursor
   - Query MySQL for changes since cursor
   - Create ChangeEvent records
   - Update cursor

**Inputs**: `record_type` (e.g., `:payment`)

### DispatchEvents Reactor

**Flow**:
1. Get handler configuration from registry
2. Get dispatch cursor for handler/record_type
3. Read unprocessed events since cursor
4. Execute handler for each event
5. Update dispatch cursor

**Inputs**: `handler_type`, `record_type`

---

## Cross-Domain Interactions

| From | To | Mechanism |
|------|----|-----------|
| Classic (MySQL) | Events | Capture worker polls via `last_updated` |
| Events | EmberERP | Dispatch worker invokes Push reactor |
| Events | External | Dispatch worker invokes Webhook handler |

---

## Constitutional Considerations

- **Tenant Isolation**: Events scoped by `workspace_id`, linked to `entity_id`
- **Deduplication**: SHA256 hash prevents duplicate events
- **Performance**: Cursor-based dispatch with `event_nonce` index
- **Idempotency**: Handlers should be idempotent (events may be retried)

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
│   │   └── steps/                   # Reactor steps
│   └── dispatch_events/
│       ├── dispatch_events.ex       # Dispatch reactor
│       └── steps/                   # Reactor steps
└── workers/
    ├── capture_worker.ex            # Oban capture worker
    └── dispatch_worker.ex           # Oban dispatch worker
```

---

*"Events bridge the gap between Classic and the future."*
