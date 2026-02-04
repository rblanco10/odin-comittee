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

