# Checkbook.io Observability Implementation Plan

> **Session**: 2026-01-19_007_checkbook-observability-planning  
> **Prepared by**: Observability Committee  
> **Status**: ✅ IMPLEMENTED — 2026-01-19

---

## Executive Summary

Checkbook.io is a **payout provider** (like Dwolla) that supports digital checks, physical checks, and ACH payments. Currently, Checkbook has **partial observability** — the Tier 1 dashboard has a Checkbook panel, but it uses **Prometheus metrics** rather than **Loki logs**.

To achieve parity with WEX, Marqeta, and Dwolla, we need to add structured Loki logging to all Checkbook operations.

---

## Part 1: Current State Analysis

### 1.1 What Checkbook Supports

| Capability | Status | Implementation |
|------------|--------|----------------|
| Digital Checks | ✅ Active | `POST /check/digital` |
| Physical Checks | ✅ Active | `POST /check/physical` |
| ACH Payments | ✅ Active | Via check settlement |
| Payout Status | ✅ Active | `GET /check/{id}` |
| Payout Cancellation | ✅ Active | `DELETE /check/{id}` |
| Webhooks | ✅ Active | Check lifecycle events |
| Batch Operations | ❌ Not supported | Must iterate per check |

### 1.2 Current Observability State

| Component | Current State | Gap |
|-----------|---------------|-----|
| **Logging** | Uses bare `Logger.info/error` | Missing structured LokiLoggingService calls |
| **Tracing** | Has OpenTelemetry spans | No Loki log correlation |
| **Metrics** | Prometheus metrics exist | No Loki-based success rate |
| **Tier 1 Dashboard** | Panel exists BUT uses Prometheus | Should use Loki like others |
| **Tier 2 Dashboard** | None | **NOT NEEDED** — Checkbook is a payout provider (like Dwolla) |
| **EVENT_TAXONOMY** | Not documented | Need to add Checkbook events |

### 1.3 Files Involved

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `ember_payments/observability/services/loki_logging_service.ex` | Shared EmberPayments logging | Add Checkbook-specific functions |
| `adapters/providers/checkbook/capabilities/payout_disbursement.ex` | Create/cancel payouts | Add Loki logging calls |
| `adapters/providers/checkbook/adapter.ex` | Webhook processing | Add Loki logging calls |
| `webhooks/webhook_handler.ex` (CheckbookWebhookHandler) | Check lifecycle updates | Add Loki logging calls |
| `tier1-business-overview.json` | Tier 1 dashboard | Update Checkbook panel to use Loki |
| `tier2-card-operations.json` or new file | Tier 2 dashboard | Add Checkbook filter OR create new |

---

## Part 2: Gap Analysis vs Other Providers

### 2.1 Compared to Dwolla (Closest Match)

Dwolla is also a payout provider. Here's what Dwolla has that Checkbook is missing:

| Feature | Dwolla | Checkbook | Gap |
|---------|--------|-----------|-----|
| `log_*_start` functions | ✅ | ❌ | Need to add |
| `log_*_end` functions | ✅ | ❌ | Need to add |
| `log_error` function | ✅ | ❌ | Need to add |
| Provider API logging | ✅ | ❌ | Need to add |
| Webhook received logging | ✅ | ❌ | Need to add |
| Webhook processed logging | ✅ | ❌ | Need to add |
| Dashboard uses Loki | ✅ | ❌ | Need to update |
| `rail` label (ach/check) | ✅ | ❌ | Need to add |

### 2.2 Compared to WEX/Marqeta (Card Providers)

Card providers use the same `ember_payments` domain. Checkbook can reuse the existing `EmberPayments.Observability.Services.LokiLoggingService` with Checkbook-specific functions.

---

## Part 3: Event Taxonomy for Checkbook

Following the standard naming convention: `{domain}_{entity}_{action}_{phase}`

### 3.1 Payout Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_check_payout_start` | start | Check payout creation initiated |
| `ember_payments_check_payout_end` | end | Check payout creation completed |
| `ember_payments_check_status_start` | start | Check status query initiated |
| `ember_payments_check_status_end` | end | Check status query completed |
| `ember_payments_check_cancel_start` | start | Check cancellation initiated |
| `ember_payments_check_cancel_end` | end | Check cancellation completed |

### 3.2 Provider API Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_checkbook_api_request` | step | Outbound API call to Checkbook |
| `ember_payments_checkbook_api_response` | step | Checkbook API response |
| `ember_payments_checkbook_api_error` | error | Checkbook API error |

### 3.3 Webhook Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_check_webhook_received` | start | Checkbook webhook received |
| `ember_payments_check_webhook_matched` | step | Webhook matched to internal record |
| `ember_payments_check_webhook_processed` | end | Webhook processing completed |
| `ember_payments_check_webhook_error` | error | Webhook processing failed |

### 3.4 Labels for Checkbook Events

| Label | Values | Purpose |
|-------|--------|---------|
| `domain` | `ember_payments` | Domain filtering |
| `event_type` | Full event name | Event filtering |
| `provider` | `checkbook` | Provider filtering |
| `status` | `success`, `failure`, `error` | Outcome filtering |
| `check_type` | `digital`, `physical` | Check type filtering |
| `rail` | `check`, `ach` | Payment rail filtering |

### 3.5 Fields for Checkbook Events

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | UUID | ✅ | Workspace identifier |
| `entity_id` | UUID | ✅ | Entity identifier |
| `check_id` | string | On end | Checkbook check ID |
| `check_type` | string | ✅ | `digital` or `physical` |
| `amount` | string | When applicable | Payment amount |
| `duration_ms` | integer | On `_end` | Operation duration |
| `error_type` | string | On error | Error classification |
| `error_message` | string | On error | Human-readable error |
| `trace_id` | string | When available | OpenTelemetry trace ID |
| `span_id` | string | When available | OpenTelemetry span ID |

---

## Part 4: Implementation Todo List

### Phase 1: LokiLoggingService Functions (Estimated: 2-3 hours)

**Location**: `lib/flame_teampay_payables/ember_payments/observability/services/loki_logging_service.ex`

Add the following functions:

- [ ] **1.1** `log_check_payout_start/1` - Log when check payout creation starts
- [ ] **1.2** `log_check_payout_end/1` - Log when check payout creation ends (with status, duration_ms, check_id)
- [ ] **1.3** `log_check_status_start/1` - Log when check status query starts
- [ ] **1.4** `log_check_status_end/1` - Log when check status query ends
- [ ] **1.5** `log_check_cancel_start/1` - Log when check cancellation starts
- [ ] **1.6** `log_check_cancel_end/1` - Log when check cancellation ends
- [ ] **1.7** `log_checkbook_api_request/1` - Log outbound Checkbook API call
- [ ] **1.8** `log_checkbook_api_response_success/1` - Log successful API response
- [ ] **1.9** `log_checkbook_api_response_error/1` - Log failed API response
- [ ] **1.10** `log_check_webhook_received/1` - Log incoming webhook
- [ ] **1.11** `log_check_webhook_processed/1` - Log webhook processing complete
- [ ] **1.12** `log_check_webhook_error/1` - Log webhook processing failure

Private helpers:
- [ ] **1.13** `build_check_payout_start_data/1` - Build data for payout start
- [ ] **1.14** `build_check_payout_end_data/1` - Build data for payout end

### Phase 2: Payout Disbursement Instrumentation (Estimated: 1-2 hours)

**Location**: `lib/flame_teampay_payables/ember_payments/adapters/providers/checkbook/capabilities/payout_disbursement.ex`

- [ ] **2.1** Add `alias FlameTeampayPayables.EmberPayments.Observability.Services.LokiLoggingService`
- [ ] **2.2** In `create_payout/3`:
  - Add `start_time = System.monotonic_time(:millisecond)` at function start
  - Add `LokiLoggingService.log_check_payout_start(...)` before API call
  - Add `LokiLoggingService.log_checkbook_api_request(...)` before `Client.post`
  - Add `LokiLoggingService.log_checkbook_api_response_success(...)` on `{:ok, response}`
  - Add `LokiLoggingService.log_checkbook_api_response_error(...)` on `{:error, error}`
  - Add `LokiLoggingService.log_check_payout_end(...)` with status and duration_ms
- [ ] **2.3** In `get_payout_status/2`:
  - Add timing and Loki logging (start/end)
- [ ] **2.4** In `cancel_payout/2`:
  - Add timing and Loki logging (start/end)

### Phase 3: Webhook Handler Instrumentation (Estimated: 1-2 hours)

**Location**: `lib/flame_teampay_payables/ember_payments/adapters/providers/checkbook/adapter.ex`

- [ ] **3.1** In `process_webhook_event/2`:
  - Add `LokiLoggingService.log_check_webhook_received(...)` at entry
  - Add `LokiLoggingService.log_check_webhook_processed(...)` on success
  - Add `LokiLoggingService.log_check_webhook_error(...)` on failure
- [ ] **3.2** In `handle_check_webhook/3`:
  - Add logging for each state transition (processed, failed, voided, etc.)
- [ ] **3.3** Consider instrumenting `CheckbookWebhookHandler.handle/2` in `webhook_handler.ex`

### Phase 4: Dashboard Updates (Estimated: 30 min - 1 hour)

**Location**: `campsite/pit/docker/grafana/provisioning/dashboards/`

#### 4.1 Tier 1 Dashboard Updates

**File**: `tier1-business-overview.json`

- [ ] **4.1.1** Update Checkbook panel (currently id: 13) to use Loki query:
  ```logql
  sum(count_over_time({domain="ember_payments", event_type="ember_payments_check_payout_end", provider="checkbook", status="success"}[5m])) 
  / sum(count_over_time({domain="ember_payments", event_type="ember_payments_check_payout_end", provider="checkbook"}[5m]))
  ```
- [ ] **4.1.2** Update description to mention check operations (digital/physical checks)
- [ ] **4.1.3** Change datasource from Prometheus to Loki (like Dwolla)

#### 4.2 Tier 2 Dashboard — NOT NEEDED

**Rationale**: Tier 2: Card Operations is specifically for card providers (WEX, Marqeta). Checkbook is a **payout provider** (like Dwolla), and Dwolla only has Tier 1 representation. Checkbook should follow the same pattern.

If deep-dive debugging is needed for Checkbook in the future, we could create a "Tier 2: Payout Operations" dashboard that covers both Dwolla and Checkbook, but this is out of scope for this session.

### Phase 5: Documentation Updates (Estimated: 30 min)

- [ ] **5.1** Update `knowledge_base/patterns/EVENT_TAXONOMY.md` with Checkbook events
- [ ] **5.2** Update `knowledge_base/patterns/LOGGING_STANDARDS.md` if needed
- [ ] **5.3** Add Checkbook to dashboard README

### Phase 6: Testing & Verification (Estimated: 1-2 hours)

- [ ] **6.1** Trigger a digital check payout and verify logs appear in Loki
- [ ] **6.2** Trigger a physical check payout and verify logs appear in Loki
- [ ] **6.3** Trigger a check cancellation and verify logs appear in Loki
- [ ] **6.4** Simulate a webhook and verify webhook logs appear in Loki
- [ ] **6.5** Verify Tier 1 dashboard shows Checkbook data
- [ ] **6.6** Verify Tier 2 dashboard (if created) works

---

## Part 5: Detailed Implementation Specifications

### 5.1 LokiLoggingService Function Signatures

```elixir
# ============================================================================
# CHECKBOOK CHECK PAYOUT LOGGING
# ============================================================================

@doc """
Logs when a check payout creation starts.

## Options
- `:workspace_id` - Workspace UUID
- `:entity_id` - Entity UUID
- `:check_type` - :digital or :physical
- `:amount` - Payment amount
- `:trace_id` - OpenTelemetry trace ID
- `:span_id` - OpenTelemetry span ID
"""
def log_check_payout_start(opts) do
  labels =
    extract_labels(opts)
    |> Map.put("event_type", "ember_payments_check_payout_start")
    |> Map.put("domain", "ember_payments")
    |> maybe_put_label("provider", :checkbook)
    |> maybe_put_label("check_type", Keyword.get(opts, :check_type))

  log_event("ember_payments_check_payout_start", build_check_payout_start_data(opts), labels)
end

@doc """
Logs when a check payout creation ends.

## Options
- `:check_id` - Checkbook check ID
- `:status` - "success" or "error"
- `:duration_ms` - Operation duration
- `:check_type` - :digital or :physical
- `:workspace_id` - Workspace UUID
- `:entity_id` - Entity UUID
- `:error_reason` - Error reason (on failure)
"""
def log_check_payout_end(opts) do
  labels =
    extract_labels(opts)
    |> Map.put("event_type", "ember_payments_check_payout_end")
    |> Map.put("domain", "ember_payments")
    |> maybe_put_label("provider", :checkbook)
    |> maybe_put_label("status", Keyword.get(opts, :status))
    |> maybe_put_label("check_type", Keyword.get(opts, :check_type))

  log_event("ember_payments_check_payout_end", build_check_payout_end_data(opts), labels)
end
```

### 5.2 Integration Example in payout_disbursement.ex

```elixir
def create_payout(credentials_or_connection, payout_params, opts \\ []) do
  start_time = System.monotonic_time(:millisecond)
  check_type = Map.get(payout_params, :check_type) || :digital

  # Log operation start
  LokiLoggingService.log_check_payout_start(
    workspace_id: Keyword.get(opts, :workspace_id),
    entity_id: Keyword.get(opts, :entity_id),
    check_type: check_type,
    amount: Map.get(payout_params, :amount),
    trace_id: Keyword.get(opts, :trace_id),
    span_id: Keyword.get(opts, :span_id)
  )

  config = extract_config(credentials_or_connection)
  body = PayoutMapper.map_payout_params_to_checkbook(payout_params)
  endpoint = if check_type == :physical, do: "/check/physical", else: "/check/digital"

  # Log API request
  LokiLoggingService.log_checkbook_api_request(
    endpoint: endpoint,
    method: :post,
    check_type: check_type
  )

  case Client.post(config, endpoint, body) do
    {:ok, response} ->
      duration_ms = System.monotonic_time(:millisecond) - start_time
      check_id = Map.get(response, "id")

      # Log API success
      LokiLoggingService.log_checkbook_api_response_success(
        endpoint: endpoint,
        duration_ms: duration_ms,
        check_id: check_id
      )

      # Log operation end
      LokiLoggingService.log_check_payout_end(
        check_id: check_id,
        check_type: check_type,
        status: "success",
        duration_ms: duration_ms,
        workspace_id: Keyword.get(opts, :workspace_id),
        entity_id: Keyword.get(opts, :entity_id)
      )

      {:ok, PayoutMapper.map_checkbook_response_to_payout_result(response)}

    {:error, error} ->
      duration_ms = System.monotonic_time(:millisecond) - start_time

      # Log API error
      LokiLoggingService.log_checkbook_api_response_error(
        endpoint: endpoint,
        duration_ms: duration_ms,
        error_type: classify_error(error),
        error_message: format_error(error)
      )

      # Log operation end (error)
      LokiLoggingService.log_check_payout_end(
        check_type: check_type,
        status: "error",
        duration_ms: duration_ms,
        error_reason: inspect(error),
        workspace_id: Keyword.get(opts, :workspace_id),
        entity_id: Keyword.get(opts, :entity_id)
      )

      {:error, error}
  end
end
```

### 5.3 Dashboard Query for Tier 1

```json
{
  "datasource": { "type": "loki", "uid": "Loki" },
  "description": "Checkbook check payment success rate (from Loki logs)",
  "targets": [
    {
      "datasource": { "type": "loki", "uid": "Loki" },
      "expr": "sum(count_over_time({domain=\"ember_payments\", event_type=\"ember_payments_check_payout_end\", provider=\"checkbook\", status=\"success\"}[5m])) / sum(count_over_time({domain=\"ember_payments\", event_type=\"ember_payments_check_payout_end\", provider=\"checkbook\"}[5m]))",
      "legendFormat": "Checkbook",
      "refId": "A"
    }
  ],
  "title": "Checkbook",
  "type": "stat"
}
```

---

## Part 6: Effort Estimation

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1 | LokiLoggingService functions | 2-3 hours |
| Phase 2 | Payout disbursement instrumentation | 1-2 hours |
| Phase 3 | Webhook handler instrumentation | 1-2 hours |
| Phase 4 | Tier 1 dashboard update (Checkbook panel only) | 30 min - 1 hour |
| Phase 5 | Documentation | 30 min |
| Phase 6 | Testing & verification | 1-2 hours |
| **TOTAL** | | **6-10 hours** |

> **Note**: Tier 2 dashboard is NOT needed for Checkbook (payout provider). Dwolla follows the same pattern — Tier 1 only.

---

## Part 7: Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Loki batching not working | Logs don't appear | Test with existing LogBatchingGenServer |
| Check operations not passing opts | Missing workspace_id/entity_id | Trace through call chain |
| Dashboard won't load | Can't verify | Test with simple query first |
| Webhook handler hard to instrument | Missing events | Add logging at adapter level |

---

## Part 8: Decision Required

**Human Director**: Please review this plan and confirm:

1. ✅ The scope is correct (payout operations + webhooks)
2. ✅ The event naming convention is acceptable
3. ✅ The estimated effort is reasonable (6-10 hours)
4. ✅ Tier 2 dashboard is NOT needed (Checkbook follows Dwolla pattern — Tier 1 only)
5. ✅ We should proceed with implementation

**Upon approval**, the committee will execute the todo list in phases.

---

## Appendix: Reference Implementation

For reference, see how Dwolla logging is implemented:
- `lib/flame_teampay_payables/ember_reimbursements/observability/services/loki_logging_service.ex`
- `lib/flame_teampay_payables/ember_payments/observability/services/loki_logging_service.ex` (webhook logging)

The Checkbook implementation should follow the same pattern.

---

*Plan prepared by the Observability Committee*  
*Awaiting Human Director approval before implementation*
