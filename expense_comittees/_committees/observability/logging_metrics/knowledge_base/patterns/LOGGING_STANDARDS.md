# Logging Standards for Loki/Grafana Observability

> **Observability Committee — Logging Standards Working Group**  
> **Version:** 1.0  
> **Date:** 2026-01-17  
> **Status:** APPROVED  
> **Authors:** SC01 (Logging Architecture), SC05 (Elixir/Ash), SC18 (Standards), SC14 (Developer Experience)

---

## 1. Purpose

This document establishes world-class logging standards for the FlameTeampayPayables application. These standards ensure logs are:

- **Queryable** — Easily filtered and searched in Grafana/Loki
- **Consistent** — Same patterns across all domains
- **Cost-Effective** — Proper label cardinality to avoid Loki cost explosion
- **Dashboard-Ready** — Structured for building metrics and visualizations
- **Debuggable** — Contains all context needed to investigate issues

---

## 2. Core Principles

### 2.1 Event-Oriented Logging

**DO NOT** log debug statements. **DO** log structured events.

```elixir
# ❌ BAD: Debug statement
Logger.info("Processing payment for user")

# ✅ GOOD: Structured event
LokiLoggingService.log_payment_initiation_start(
  workspace_id: workspace.id,
  payment_id: payment.id,
  amount: payment.amount,
  provider: :dwolla,
  rail: :ach
)
```

### 2.2 Start/End Pattern

Every significant operation MUST have start and end events:

```
Operation Start ──► [Optional Steps] ──► Operation End (with status + duration)
                                    └──► Operation Error (on failure)
```

### 2.3 Labels vs. Fields

| Type | Purpose | Cardinality | Example |
|------|---------|-------------|---------|
| **Labels** | Indexed filtering | LOW (< 100 values) | `domain`, `event_type`, `status` |
| **Fields** | JSON body search | HIGH (unlimited) | `payment_id`, `amount`, `user_id` |

> ⚠️ **CRITICAL**: High-cardinality labels (like UUIDs) will cause Loki performance issues and cost explosion. NEVER use IDs as labels.

---

## 3. Event Naming Convention

### 3.1 Event Type Format

```
{domain}_{entity}_{action}_{phase}
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `domain` | Ember domain name | `ember_payments`, `ember_erp`, `ember_documents` |
| `entity` | Resource being operated on | `payment`, `card`, `sync`, `push`, `document` |
| `action` | What's being done | `initiation`, `issuance`, `execution`, `extraction` |
| `phase` | Lifecycle phase | `start`, `end`, `error`, `step` |

### 3.2 Examples

```
ember_payments_payment_initiation_start
ember_payments_payment_initiation_end
ember_payments_card_issuance_start
ember_payments_card_issuance_end
ember_payments_card_issuance_error

ember_erp_sync_execution_start
ember_erp_sync_execution_end
ember_erp_push_entity_start
ember_erp_push_entity_end

ember_documents_extraction_start
ember_documents_extraction_end
ember_documents_classification_start
ember_documents_classification_end
```

---

## 4. Required Labels

### 4.1 Universal Labels (ALL events)

| Label | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | ✅ YES | Ember domain: `ember_payments`, `ember_erp`, etc. |
| `event_type` | string | ✅ YES | Full event name: `ember_payments_payment_initiation_start` |
| `level` | string | ✅ YES | Log level: `debug`, `info`, `warning`, `error` |

### 4.2 Operation Labels (for operations with outcomes)

| Label | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | For `_end` events | `success`, `failure`, `error`, `timeout` |
| `provider` | string | When applicable | `dwolla`, `checkbook`, `wex`, `netsuite`, `quickbooks` |

### 4.3 Optional Labels (LOW cardinality only!)

| Label | Type | Use When | Description |
|-------|------|----------|-------------|
| `rail` | string | Payments | `ach`, `wire`, `card`, `check` |
| `entity_type` | string | ERP | `bill`, `vendor`, `expense_report`, `employee` |
| `card_type` | string | Cards | `virtual`, `physical` |
| `queue` | string | Oban jobs | Queue name |

---

## 5. Required Fields

### 5.1 Universal Fields (ALL events)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ YES | Human-readable description |
| `timestamp` | ISO8601 | ✅ YES | Event time (auto-added by Loki) |
| `trace_id` | string | When available | OpenTelemetry trace ID |
| `span_id` | string | When available | OpenTelemetry span ID |

### 5.2 Context Fields (as applicable)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | UUID | ✅ For multi-tenant | Workspace identifier |
| `entity_id` | UUID | When applicable | Legal entity ID |
| `user_id` | UUID | When applicable | Acting user ID |

### 5.3 Operation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `duration_ms` | integer | For `_end` events | Operation duration in milliseconds |
| `{resource}_id` | UUID | When applicable | Primary resource ID (payment_id, card_id, etc.) |

### 5.4 Error Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error_type` | string | For errors | Error classification: `ValidationError`, `ProviderError`, `TimeoutError` |
| `error_message` | string | For errors | Human-readable error message |
| `error_code` | string | When available | Provider error code |
| `stacktrace` | string | For exceptions | Truncated to 2000 chars |

---

## 6. Log Levels

| Level | Use For | Example |
|-------|---------|---------|
| `debug` | Detailed debugging info (disabled in prod) | Query parameters, intermediate states |
| `info` | Normal operations | Operation start/end, state transitions |
| `warning` | Unexpected but handled situations | Retry, fallback, deprecation |
| `error` | Failures requiring attention | Operation failure, provider error |

### 6.1 Level Guidelines

```elixir
# DEBUG: Very detailed, only in dev
Logger.debug("Query executed", sql: query, params: params)

# INFO: Normal operations (start/end events)
LokiLoggingService.log_payment_initiation_start(...)

# WARNING: Something unexpected but recovered
Logger.warning("Retrying payment after timeout", attempt: 2, max_attempts: 3)

# ERROR: Operation failed
LokiLoggingService.log_error(error_type: "ProviderTimeout", ...)
```

---

## 7. Implementation Patterns

### 7.1 Using Domain LokiLoggingService

Each domain has a dedicated logging service. **USE IT**.

```elixir
# Payments domain
alias FlameTeampayPayables.EmberPayments.Observability.Services.LokiLoggingService

# At operation start
LokiLoggingService.log_payment_initiation_start(
  workspace_id: workspace.id,
  entity_id: entity.id,
  amount: payment.amount,
  provider: :dwolla,
  rail: :ach,
  trace_id: get_trace_id()
)

# At operation end
LokiLoggingService.log_payment_initiation_end(
  payment_id: payment.id,
  status: "success",
  duration_ms: elapsed_ms,
  provider: :dwolla,
  trace_id: get_trace_id()
)

# On error
LokiLoggingService.log_error(
  error_type: "ProviderTimeout",
  error_message: "Dwolla API timeout after 30s",
  operation_type: :payment_initiation,
  provider: :dwolla,
  workspace_id: workspace.id
)
```

### 7.2 Using Logger Metadata (Auto-Enrichment)

Set metadata at operation boundaries for automatic enrichment:

```elixir
def process_payment(workspace, payment) do
  # Set context at start - all Logger calls will include this
  Logger.metadata(
    domain: :ember_payments,
    workspace_id: workspace.id,
    payment_id: payment.id,
    provider: :dwolla
  )
  
  # Now any Logger.info in this process is enriched
  Logger.info("Validating payment amount")  # ← Has all metadata!
  
  # ... do work ...
  
  # Clear sensitive context at end
  Logger.metadata(payment_id: nil)
end
```

### 7.3 Instrumenting External API Calls

```elixir
def call_provider_api(request) do
  start_time = System.monotonic_time(:millisecond)
  
  LokiLoggingService.log_event("provider_api_request", %{
    message: "Calling provider API",
    provider: :dwolla,
    endpoint: request.endpoint,
    method: request.method
  }, %{"domain" => "ember_payments", "event_type" => "provider_api_request"})
  
  result = do_api_call(request)
  duration_ms = System.monotonic_time(:millisecond) - start_time
  
  case result do
    {:ok, response} ->
      LokiLoggingService.log_event("provider_api_response", %{
        message: "Provider API success",
        provider: :dwolla,
        status_code: response.status,
        duration_ms: duration_ms
      }, %{"domain" => "ember_payments", "event_type" => "provider_api_response", "status" => "success"})
      
    {:error, error} ->
      LokiLoggingService.log_event("provider_api_error", %{
        message: "Provider API failed",
        provider: :dwolla,
        error_type: classify_error(error),
        error_message: format_error(error),
        duration_ms: duration_ms
      }, %{"domain" => "ember_payments", "event_type" => "provider_api_error", "status" => "error"})
  end
  
  result
end
```

### 7.4 Oban Job Logging (Already Implemented!)

Oban jobs are automatically logged via `ObanLokiTelemetryHandler`. You get:

- `oban_job_start` — Job started
- `oban_job_stop` — Job completed (with duration, status)
- `oban_job_exception` — Job raised exception

**Inside your worker**, set additional context:

```elixir
defmodule MyWorker do
  use Oban.Worker

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"workspace_id" => ws_id, "payment_id" => pay_id}}) do
    # Metadata is auto-set by ObanLokiTelemetryHandler for oban_job_id
    # Add domain-specific context:
    Logger.metadata(domain: :ember_payments, payment_id: pay_id)
    
    # Your logic here - all logs enriched with context
    Logger.info("Processing payment in worker")
    
    :ok
  end
end
```

### 7.5 Step-Level Logging in Reactors (Session 2026-01-21_005)

For multi-step workflows in Ash Reactors, use **step-level logging** to enable flow analysis and debugging:

```elixir
step :my_step do
  argument :input, input(:input)
  argument :trace_ctx, result(:previous_step)  # Propagate trace context

  run fn args, _context ->
    # 1. Capture step start time
    step_start_time = System.monotonic_time(:millisecond)
    
    # 2. Get trace context (from args or Process dictionary)
    trace_ctx = args[:trace_ctx] || %{}
    trace_id = trace_ctx[:trace_id] || Process.get(:my_op_trace_id)
    span_id = trace_ctx[:span_id] || Process.get(:my_op_span_id)
    
    # 3. Wrap step logic with ReactorInstrumentation
    RI.with_step("my_step", [reactor: :my_reactor, id: args.id], fn ->
      # Your step logic here
      result = do_step_work(args)
      
      # 4. Calculate duration and determine status
      step_duration_ms = System.monotonic_time(:millisecond) - step_start_time
      {step_status, error_reason} = case result do
        {:ok, _} -> {"success", nil}
        {:error, reason} -> {"error", inspect(reason)}
      end
      
      # 5. Emit step-level log
      LokiLoggingService.log_card_issuance_step_my_step(
        workspace_id: args.workspace_id,
        entity_id: args.entity_id,
        provider: args.provider,
        step_status: step_status,
        step_duration_ms: step_duration_ms,
        error_reason: error_reason,
        trace_id: trace_id,
        span_id: span_id
      )
      
      result
    end)
  end
end
```

**Key Requirements:**

1. **Timing**: Capture `step_start_time` at the beginning of the step
2. **Trace Propagation**: Pass `trace_ctx` between steps (Process dictionary as fallback)
3. **RI Wrapping**: Use `RI.with_step/3` for automatic span creation
4. **Status Extraction**: Pattern match on result to determine `step_status`
5. **Log Emission**: Call the appropriate `log_*_step_*` function with all fields

**Naming Convention for Step Log Functions:**

```
log_card_{operation}_step_{step_name}(opts)
```

Examples:
- `log_card_issuance_step_validate_actor/1`
- `log_card_cancel_step_call_provider/1`
- `log_card_freeze_step_update_db/1`

### 7.6 Operation-End Event for ALL Failure Paths (Session 2026-01-21_007)

**CRITICAL:** Every step that can fail MUST emit an operation-end event on failure. This ensures Tier 2 dashboards (which query `*_end` events) accurately reflect all failures.

**The Gap We're Fixing:**

Previously, operation-end events with `status="error"` were only emitted when the `call_provider` step failed. If earlier steps (like `get_connection`) failed, no end event was emitted, making Tier 2 dashboards blind to these failures.

**Pattern: Centralized Error Handler**

Add a private helper function in each reactor that logs the operation-end event for any failure:

```elixir
# In each reactor module, add:
defp log_operation_end_on_step_error(step_name, card_or_nil, reason) do
  trace_id = Process.get(:card_freeze_trace_id)
  span_id = Process.get(:card_freeze_span_id)
  start_time = Process.get(:card_freeze_start_time)
  duration_ms = System.monotonic_time(:millisecond) - (start_time || 0)

  LokiLoggingService.log_card_freeze_end([
    card_id: card_or_nil && card_or_nil.id,
    external_card_id: card_or_nil && card_or_nil.external_card_id,
    card_last4: card_or_nil && card_or_nil.last_four,
    status: "error",
    error_reason: inspect(reason),
    failed_at_step: step_name,  # NEW FIELD: Identifies which step failed
    duration_ms: duration_ms,
    provider: card_or_nil && card_or_nil.provider,
    workspace_id: card_or_nil && card_or_nil.workspace_id,
    entity_id: card_or_nil && card_or_nil.entity_id,
    trace_id: trace_id,
    span_id: span_id
  ])

  PrometheusMetricsService.emit_card_freeze_error([
    workspace_id: card_or_nil && card_or_nil.workspace_id,
    provider: card_or_nil && card_or_nil.provider,
    trace_id: trace_id,
    span_id: span_id
  ], reason)

  TempoTracingService.mark_span_error(:step_failed, "#{step_name}: #{inspect(reason)}")
  TempoTracingService.end_card_freeze_span(:error)
end
```

**Then in EACH step that can fail, add:**

```elixir
# At the end of each step's run function, after step-level logging:
case result do
  {:error, reason} ->
    log_operation_end_on_step_error("step_name", card_if_available, reason)
    result
  ok -> ok
end
```

**Important Notes:**

1. **No Double Logging**: The `call_provider` step should use the existing `log_*_error` function (which already logs the end event). Only add this to steps that DON'T already emit end events.

2. **Card Availability**: Early steps (like `validate_actor`) may not have a card yet. Pass `nil` and the function handles it gracefully.

3. **New Field `failed_at_step`**: This field identifies exactly which step caused the operation failure, enabling precise debugging in dashboards.

**Steps Requiring This Pattern:**

| Reactor | Steps Needing End Event on Error |
|---------|----------------------------------|
| FreezeCardReactor | validate_actor, fetch_card, get_connection, validate_state |
| UnfreezeCardReactor | validate_actor, fetch_card, get_connection, validate_state, extract_original_limits |
| CancelCardReactor | validate_actor, fetch_card, get_connection, validate_state |
| IssueCardReactor | validate_actor, get_connection |
| UpdateSpendingLimitsReactor | validate_actor, fetch_card, get_connection, store_current_limits |

---

## 8. Query Patterns

### 8.1 Basic Queries

```logql
# All logs from payments domain
{domain="ember_payments"}

# Payment initiation events
{domain="ember_payments", event_type="ember_payments_payment_initiation_start"}

# All errors
{domain="ember_payments"} | json | status="error"

# Errors by provider
{domain="ember_payments", status="error"} | json | provider="dwolla"
```

### 8.2 Duration Analysis

```logql
# Find slow payments (> 5 seconds)
{domain="ember_payments", event_type="ember_payments_payment_initiation_end"} 
| json 
| duration_ms > 5000

# Average duration (requires Grafana panel)
avg_over_time(
  {domain="ember_payments", event_type="ember_payments_payment_initiation_end"} 
  | json 
  | unwrap duration_ms [5m]
)
```

### 8.3 Error Analysis

```logql
# Count errors by type
sum by (error_type) (
  count_over_time(
    {domain="ember_payments", status="error"} | json [1h]
  )
)

# Find specific error
{domain="ember_payments"} | json | error_type="ProviderTimeout"
```

### 8.4 Trace Correlation

```logql
# All logs for a specific trace
{domain=~"ember_.*"} | json | trace_id="abc123def456"
```

---

## 9. Domain Logging Services

Each domain has a dedicated LokiLoggingService with domain-specific functions:

| Domain | Service | Key Functions |
|--------|---------|---------------|
| `ember_payments` | `EmberPayments.Observability.Services.LokiLoggingService` | `log_payment_initiation_start/end`, `log_card_issuance_start/end`, `log_error` |
| `ember_erp` | `EmberErp.Observability.Services.LokiLoggingService` | `log_sync_start/end`, `log_push_start/end`, `log_error` |
| `ember_documents` | `EmberDocumentIntake.Observability.Services.LokiLoggingService` | `log_extraction_start/end`, `log_classification_start/end` |
| `ember_budget` | `EmberBudget.Observability.Services.LokiLoggingService` | `log_budget_check_start/end`, `log_alert_triggered` |

---

## 10. Cost Management

### 10.1 Label Cardinality Rules

| ✅ ALLOWED as Labels | ❌ NEVER as Labels |
|---------------------|-------------------|
| `domain` (~20 values) | `payment_id` (millions) |
| `event_type` (~100 values) | `user_id` (thousands) |
| `provider` (~10 values) | `amount` (infinite) |
| `status` (4 values) | `timestamp` (infinite) |
| `level` (4 values) | `trace_id` (millions) |
| `step_name` (~10 values per operation) | `card_id` (millions) |
| `step_status` (2 values) | `error_reason` (high variance) |

### 10.2 Log Volume Guidelines

- **DEBUG**: Only in development, never in production
- **INFO**: All operation start/end events
- **WARNING**: Unusual situations only
- **ERROR**: Failures only

### 10.3 Batching

All logs go through `LogBatchingGenServer` which batches 100 logs or flushes every 100ms. This is already configured and should NOT be bypassed.

---

## 11. Checklist for New Features

When implementing a new feature, ensure:

- [ ] Operation has `_start` event with context IDs
- [ ] Operation has `_end` event with `status` and `duration_ms`
- [ ] Errors have `error_type`, `error_message`
- [ ] `workspace_id` is included for multi-tenant filtering
- [ ] Event type follows naming convention: `{domain}_{entity}_{action}_{phase}`
- [ ] High-cardinality values are in fields, NOT labels
- [ ] Using domain's LokiLoggingService (not bare Logger for key events)

### 11.1 Additional Checklist for Reactor-Based Flows

For multi-step Reactor workflows, also ensure:

- [ ] Each step captures `step_start_time` at the beginning
- [ ] Each step is wrapped with `RI.with_step/3` for tracing
- [ ] Trace context (`trace_id`, `span_id`) is propagated between steps
- [ ] Each step emits a `log_*_step_*` event with:
  - [ ] `step_status` (`success` or `error`)
  - [ ] `step_duration_ms` (milliseconds)
  - [ ] `error_reason` (on error)
  - [ ] `trace_id` and `span_id`
- [ ] Step log functions follow naming: `log_card_{operation}_step_{step_name}`
- [ ] `step_name` label is LOW cardinality (use consistent step names)
- [ ] Document new step events in `EVENT_TAXONOMY.md`

---

## 12. Migration Guide

### Converting Bare Logger Calls

```elixir
# BEFORE: Bare Logger
Logger.info("Processing payment for workspace #{workspace.id}")
Logger.error("Payment failed: #{inspect(reason)}")

# AFTER: Structured Loki Logging
alias FlameTeampayPayables.EmberPayments.Observability.Services.LokiLoggingService

LokiLoggingService.log_payment_initiation_start(
  workspace_id: workspace.id,
  provider: :dwolla
)

LokiLoggingService.log_error(
  error_type: "PaymentFailed",
  error_message: inspect(reason),
  workspace_id: workspace.id,
  operation_type: :payment_initiation
)
```

---

## Appendix A: Example Dashboard Queries

Once logs follow these standards, these dashboard panels become trivial:

### Payment Success Rate
```logql
sum(count_over_time({domain="ember_payments", event_type=~".*_end", status="success"}[5m]))
/
sum(count_over_time({domain="ember_payments", event_type=~".*_end"}[5m]))
```

### Error Rate by Provider
```logql
sum by (provider) (
  count_over_time({domain="ember_payments", status="error"} | json [5m])
)
```

### P95 Duration
```logql
quantile_over_time(0.95,
  {domain="ember_payments", event_type="ember_payments_payment_initiation_end"} 
  | json 
  | unwrap duration_ms [5m]
)
```

---

## Appendix B: Quick Reference Card

```
┌────────────────────────────────────────────────────────────────────┐
│                    LOGGING QUICK REFERENCE                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EVENT NAMING:  {domain}_{entity}_{action}_{phase}                  │
│  Example:       ember_payments_payment_initiation_start             │
│                                                                     │
│  REQUIRED LABELS:                                                   │
│  • domain (ember_payments, ember_erp, ...)                          │
│  • event_type (full event name)                                     │
│  • level (info, warning, error)                                     │
│  • status (success, failure, error) — for _end events              │
│                                                                     │
│  REQUIRED FIELDS:                                                   │
│  • message (human readable)                                         │
│  • workspace_id (for multi-tenant)                                  │
│  • duration_ms (for _end events)                                    │
│  • error_type, error_message (for errors)                           │
│                                                                     │
│  NEVER USE AS LABELS:                                               │
│  • UUIDs (payment_id, user_id, trace_id)                            │
│  • Amounts, timestamps, or any high-cardinality value               │
│                                                                     │
│  USE DOMAIN LOGGING SERVICE:                                        │
│  • alias ...EmberPayments.Observability.Services.LokiLoggingService │
│  • LokiLoggingService.log_payment_initiation_start(opts)            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

**Document End**

*Approved by: SC01, SC05, SC14, SC18 Joint Working Group*

