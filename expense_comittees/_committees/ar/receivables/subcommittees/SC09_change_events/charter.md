# SC09 Events Domain Charter

> **Code**: SC09  
> **Domain**: `FlamePsAr.Events`  
> **Lifecycle**: events_lifecycle  
> **Lead**: Dr. Sarah Kim (C007)

---

## Purpose

Govern the Events domain which provides change event capture from MySQL Classic resources and dispatch to registered handlers (ERP Push, Webhooks, etc.).

---

## Scope

### Primary Jurisdiction

- **Events Domain** (`FlamePsAr.Events`)
- `ChangeEvent` resource - Captured changes from MySQL sources
- `EventCursor` resource - Tracks sync progress (capture & dispatch)
- `HandlerExecution` resource - Tracks handler execution per event
- `ChangeEventRegistry` - GenServer for source/handler configuration
- Capture and Dispatch Reactors
- Oban Workers for scheduled processing

### Code Focus Areas

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
│   ├── capture_changes/             # Capture reactor + steps
│   └── dispatch_events/             # Dispatch reactor + steps
└── workers/
    ├── capture_worker.ex            # Oban capture worker
    └── dispatch_worker.ex           # Oban dispatch worker
```

### Lifecycle Reference

`_committees/ar/receivables/knowledge_base/lifecycles/events_lifecycle.md`

---

## Key Questions

1. **Capture**: What sources are polled and how frequently?
2. **Deduplication**: How is the SHA256 hash computed for event identity?
3. **Cursor Strategy**: How do capture and dispatch cursors work?
4. **Handler Registration**: How are handlers configured and prioritized?
5. **Failure Handling**: How are partial failures and retries handled?
6. **Performance**: How do event_nonce indexes optimize dispatch queries?
7. **Tenant Isolation**: How is workspace_id enforced across the pipeline?

---

## Domain Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENTS DOMAIN ARCHITECTURE                          │
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
│                                └─────────────────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Dr. Sarah Kim | C007 |
| **Domain Expert** | Lisa Nakamura | DE008 |
| **Critic** | Elena Volkov | C003 |
| **Technical** | Dr. Alan Turing Jr. | TS001 |
| **Technical** | Ken Thompson Jr. | TS005 |
| **Integration** | Hiroshi Tanaka | IS005 |

---

## Constitutional Considerations

- **Tenant Isolation**: Events scoped by `workspace_id`, linked to `entity_id`
- **Deduplication**: SHA256 hash prevents duplicate events for unchanged data
- **Idempotency**: Handlers MUST be idempotent (events may be retried)
- **Performance**: `event_nonce` index enables O(1) cursor-based lookup
- **Eventual Consistency**: Events bridge MySQL → PostgreSQL with eventual consistency
- **Immutability**: Event payload is immutable after creation

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC05 | Payment events triggering handlers |
| SC07 | ERP Pull events (if needed) |
| SC08 | Events triggering ERP Push |
| SC10 | Accounting events |
| SC11 | Legacy MySQL source compatibility |
| SC12 | Event query performance, batch sizes |

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
      batch_size: 1000
    ]
  ],
  handlers: [
    erp_push: [
      reactor: FlamePsAr.EmberErp.Reactors.Push.Push,
      record_types: [:payment, :transfer],
      priority: 10
    ]
  ]
```

---

*"Events: the bridge between now and then."*

