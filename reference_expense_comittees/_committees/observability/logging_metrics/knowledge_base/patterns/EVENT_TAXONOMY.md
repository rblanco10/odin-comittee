# Event Taxonomy

> **Complete catalog of structured log event types by domain**

---

## Event Naming Convention

```
{domain}_{entity}_{action}_{phase}
```

| Component | Description |
|-----------|-------------|
| `domain` | Ember domain: `ember_payments`, `ember_erp`, etc. |
| `entity` | Resource: `payment`, `card`, `sync`, `document` |
| `action` | Operation: `initiation`, `issuance`, `execution` |
| `phase` | Lifecycle: `start`, `end`, `error`, `step` |

---

## Domain: ember_payments

### Payment Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_payment_initiation_start` | start | Payment initiation begins |
| `ember_payments_payment_initiation_end` | end | Payment initiation completes |
| `ember_payments_payment_cancellation_start` | start | Payment cancellation begins |
| `ember_payments_payment_cancellation_end` | end | Payment cancellation completes |

### Card Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_issuance_start` | start | Card issuance begins |
| `ember_payments_card_issuance_end` | end | Card issuance completes |
| `ember_payments_card_activation_start` | start | Card activation begins |
| `ember_payments_card_activation_end` | end | Card activation completes |
| `ember_payments_card_freeze_start` | start | Card freeze begins |
| `ember_payments_card_freeze_end` | end | Card freeze completes |
| `ember_payments_card_unfreeze_start` | start | Card unfreeze begins |
| `ember_payments_card_unfreeze_end` | end | Card unfreeze completes |
| `ember_payments_card_cancel_start` | start | Card cancellation begins |
| `ember_payments_card_cancel_end` | end | Card cancellation completes |
| `ember_payments_card_controls_update_start` | start | Card controls update begins |
| `ember_payments_card_controls_update_end` | end | Card controls update completes |
| `ember_payments_card_limits_update_start` | start | Card limits update begins |
| `ember_payments_card_limits_update_end` | end | Card limits update completes |

### Card Operation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `card_id` | UUID | On end | Internal card ID |
| `external_card_id` | string | On end | Provider's card ID |
| `card_last4` | string | On end | Last 4 digits of card number (for support lookup) |
| `card_request_id` | UUID | ✅ | Card request identifier |
| `provider` | string | ✅ | `wex` or `marqeta` |
| `duration_ms` | integer | On `_end` | Operation latency |
| `status` | string | On `_end` | `success`, `failure`, `error` |

### Card Operation Step-Level Logging (Session 2026-01-21_005)

> **Purpose**: Granular step-by-step logging for card operations to enable flow analysis, duration heatmaps, and error breakdown visualization in Grafana.

#### Card Issuance Steps

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_issuance_step_validate_actor` | step | Actor validation completed |
| `ember_payments_card_issuance_step_get_connection` | step | Connection/credentials resolution completed |
| `ember_payments_card_issuance_step_call_provider` | step | Provider API call completed |
| `ember_payments_card_issuance_step_create_db_record` | step | Database record creation completed |

#### Card Cancel Steps

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_cancel_step_validate_actor` | step | Actor validation completed |
| `ember_payments_card_cancel_step_fetch_card` | step | Card fetch from database completed |
| `ember_payments_card_cancel_step_get_connection` | step | Connection/credentials resolution completed |
| `ember_payments_card_cancel_step_validate_state` | step | State validation for cancel completed |
| `ember_payments_card_cancel_step_call_provider` | step | Provider API call completed |
| `ember_payments_card_cancel_step_update_db` | step | Database update completed |

#### Card Freeze Steps

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_freeze_step_validate_actor` | step | Actor validation completed |
| `ember_payments_card_freeze_step_fetch_card` | step | Card fetch from database completed |
| `ember_payments_card_freeze_step_get_connection` | step | Connection/credentials resolution completed |
| `ember_payments_card_freeze_step_call_provider` | step | Provider API call completed |
| `ember_payments_card_freeze_step_update_db` | step | Database update completed |

#### Card Unfreeze Steps

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_unfreeze_step_validate_actor` | step | Actor validation completed |
| `ember_payments_card_unfreeze_step_fetch_card` | step | Card fetch from database completed |
| `ember_payments_card_unfreeze_step_get_connection` | step | Connection/credentials resolution completed |
| `ember_payments_card_unfreeze_step_call_provider` | step | Provider API call completed |
| `ember_payments_card_unfreeze_step_update_db` | step | Database update completed |

#### Step-Level Labels (Low Cardinality)

| Label | Values | Purpose |
|-------|--------|---------|
| `domain` | `ember_payments` | Always ember_payments |
| `event_type` | `ember_payments_card_{operation}_step_{step}` | Full event identifier |
| `step_name` | `validate_actor`, `fetch_card`, `get_connection`, `validate_state`, `call_provider`, `create_db_record`, `update_db` | Step identifier for filtering |
| `step_status` | `success`, `error` | Step outcome |

#### Step-Level Fields (High Cardinality)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | Human-readable: "Card {operation} step completed: {step_name}" |
| `step_name` | string | ✅ | Step identifier |
| `step_status` | string | ✅ | `success` or `error` |
| `step_duration_ms` | integer | ✅ | Step execution time in milliseconds |
| `card_id` | UUID | When available | Internal card ID |
| `external_card_id` | string | When available | Provider's card ID |
| `workspace_id` | UUID | ✅ | Workspace identifier |
| `entity_id` | UUID | ✅ | Entity identifier |
| `provider` | string | ✅ | `wex` or `marqeta` |
| `card_type` | string | When available | `virtual` or `physical` |
| `connection_type` | string | On get_connection | `platform_model` or `direct_model` |
| `card_state` | string | On validate_state | Current card state before operation |
| `card_request_id` | UUID | On issuance | Card request identifier |
| `skipped` | boolean | When applicable | Whether step was skipped (idempotent) |
| `error_reason` | string | On error | Human-readable error description |
| `trace_id` | string | ✅ | OpenTelemetry trace ID |
| `span_id` | string | ✅ | OpenTelemetry span ID |

#### Grafana Query Examples

**Flow Funnel (Success count by step)**:
```logql
sum by (step_name) (count_over_time(
  {app="ember_payments"} 
  | json 
  | event_type=~"ember_payments_card_issuance_step_.*" 
  | step_status="success" 
  [$__range]
))
```

**Duration Heatmap (Average step duration)**:
```logql
avg by (step_name) (avg_over_time(
  {app="ember_payments"} 
  | json 
  | event_type=~"ember_payments_card_cancel_step_.*" 
  | unwrap step_duration_ms 
  [$__range]
))
```

**Error Breakdown (Errors by step and reason)**:
```logql
sum by (step_name, error_reason) (count_over_time(
  {app="ember_payments"} 
  | json 
  | event_type=~"ember_payments_card_freeze_step_.*" 
  | step_status="error" 
  [$__range]
))
```

### Legacy Card Issuance Steps (Deprecated)

> **Note**: These events are still emitted for backward compatibility but step-level events above are preferred.

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_connection_resolved` | step | Payment connection resolved |
| `ember_payments_card_provider_request` | step | Provider API called |
| `ember_payments_card_provider_response` | step | Provider API responded |
| `ember_payments_card_database_record_created` | step | Card record saved |

### KYB Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_kyb_verification_start` | start | KYB verification begins |
| `ember_payments_kyb_verification_end` | end | KYB verification completes |
| `ember_payments_kyb_application_start` | start | KYB application begins |
| `ember_payments_kyb_application_end` | end | KYB application completes |
| `ember_payments_kyb_document_upload_start` | start | KYB document upload begins |
| `ember_payments_kyb_document_upload_end` | end | KYB document upload completes |
| `ember_payments_beneficial_owner_add_start` | start | Beneficial owner add begins |
| `ember_payments_beneficial_owner_add_end` | end | Beneficial owner add completes |

### Payout Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_payout_batch_start` | start | Payout batch begins |
| `ember_payments_payout_batch_end` | end | Payout batch completes |

### Checkbook Check Operations (GAP-CHK-OBS-001)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_check_payout_start` | start | Check payout creation begins |
| `ember_payments_check_payout_end` | end | Check payout creation completes |
| `ember_payments_check_status_start` | start | Check status query begins |
| `ember_payments_check_status_end` | end | Check status query completes |
| `ember_payments_check_cancel_start` | start | Check cancellation begins |
| `ember_payments_check_cancel_end` | end | Check cancellation completes |

#### Checkbook Check Operation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `check_id` | string | On end | Checkbook check ID |
| `check_type` | string | ✅ | `digital` or `physical` |
| `check_status` | string | On status | Checkbook status: `UNPAID`, `PAID`, `VOID` |
| `workspace_id` | UUID | ✅ | Workspace identifier |
| `entity_id` | UUID | ✅ | Entity identifier |
| `amount` | string | When available | Payment amount |
| `duration_ms` | integer | On `_end` | Operation latency |
| `status` | string | On `_end` | `success`, `failure`, `error` |
| `error_reason` | string | On error | Human-readable error description |

### Checkbook API Operations (GAP-CHK-OBS-001)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_checkbook_api_request` | step | Outbound Checkbook API call |
| `ember_payments_checkbook_api_response_success` | step | Checkbook API success response |
| `ember_payments_checkbook_api_response_error` | error | Checkbook API error response |

#### Checkbook API Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ✅ | Always `checkbook` |
| `endpoint` | string | ✅ | API endpoint: `/check/digital`, `/check/physical` |
| `method` | string | ✅ | HTTP method: `POST`, `GET`, `DELETE` |
| `status_code` | integer | On response | HTTP status code |
| `duration_ms` | integer | On response | Request latency |
| `check_id` | string | On success | Checkbook check ID |
| `check_status` | string | On success | Checkbook status |
| `error_type` | string | On error | Error classification |
| `error_message` | string | On error | Human-readable error |

### Checkbook Webhook Operations (GAP-CHK-OBS-001)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_check_webhook_received` | start | Checkbook webhook received |
| `ember_payments_check_webhook_processed` | end | Checkbook webhook processing completed |
| `ember_payments_check_webhook_error` | error | Checkbook webhook processing failed |

#### Checkbook Webhook Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ✅ | Always `checkbook` |
| `check_id` | string | ✅ | Checkbook check ID |
| `webhook_event_type` | string | ✅ | Event: `CHECK_PAID`, `CHECK_VOID`, `CHECK_MAILED` |
| `check_status` | string | When available | Checkbook status |
| `old_status` | string | On processed | Previous payment status |
| `new_status` | string | On processed | New payment status |
| `duration_ms` | integer | On processed | Processing latency |
| `error_type` | string | On error | Error classification |
| `error_message` | string | On error | Human-readable error |

### Connection Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_connection_setup_start` | start | Connection setup begins |
| `ember_payments_connection_setup_end` | end | Connection setup completes |

### Provider API (Detailed)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `provider_api_request` | step | External API request |
| `provider_api_response` | step | External API response |
| `provider_api_error` | error | External API error |

### Errors

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_error` | error | Generic payment error |

### Webhook Operations (Dwolla/Checkbook)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_webhook_received` | start | Webhook received from provider |
| `ember_payments_webhook_matched` | step | Webhook matched to internal payment record |
| `ember_payments_webhook_processed` | end | Webhook processing completed |
| `ember_payments_webhook_error` | error | Webhook processing failed |

#### Webhook Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ✅ | Provider: `dwolla`, `checkbook` |
| `webhook_type` | string | ✅ | Event type: `transfer_completed`, `transfer_failed`, etc. |
| `provider_resource_id` | string | ✅ | Provider's resource ID (Dwolla transfer ID) |
| `correlation_id` | string | When available | Links webhook to PayoutBatch |
| `payout_batch_id` | UUID | On match | Internal batch ID |
| `reimbursement_payment_id` | UUID | On match | Internal payment ID |
| `old_status` | string | On processed | Previous payment status |
| `new_status` | string | On processed | New payment status |

### Card Provider Webhook Operations (Marqeta/WEX)

> Added in Session 2026-01-20_010_marqeta-webhook-observability

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_webhook_received` | start | Card provider webhook received |
| `ember_payments_card_webhook_processed` | end | Card provider webhook processing completed |
| `ember_payments_card_webhook_error` | error | Card provider webhook processing failed |

#### Card Provider Webhook Labels (Low Cardinality)

| Label | Values | Purpose |
|-------|--------|---------|
| `domain` | `ember_payments` | Always ember_payments |
| `event_type` | `ember_payments_card_webhook_*` | Event type |
| `provider` | `marqeta`, `wex` | Card provider |
| `webhook_category` | See below | Category for filtering |
| `status` | `success`, `ignored`, `retry`, `error` | Processing outcome |

#### Webhook Categories

| Category | Marqeta Event Prefixes | Description |
|----------|------------------------|-------------|
| `transaction` | `transaction.*` | Card spend events |
| `authorization` | `authorization.*` | Real-time auth events |
| `card` | `card.*`, `state.*` | Card lifecycle events |
| `kyc` | `kyc.*` | KYC verification events |
| `user` | `user.*` | User state events |
| `business` | `business.*` | Business entity events |
| `funding` | `fundingsource.*` | Funding source events |
| `digitalwallet` | `digitalwallet.*` | Apple/Google Pay events |
| `chargeback` | `chargeback.*` | Dispute events |
| `directdeposit` | `directdeposit.*` | Direct deposit events |
| `transfer` | `programtransfer.*`, `peertransfer.*`, `pushtocard.*` | Transfer events |
| `threeds` | `threeds.*` | 3DS authentication events |
| `ping` | `ping` | Connectivity test |
| `other` | (anything else) | Unrecognized events |

#### Card Provider Webhook Fields (High Cardinality)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `webhook_event_type` | string | ✅ | Provider's event type: `transaction.created` |
| `webhook_category` | string | ✅ | Category: `transaction`, `authorization`, etc. |
| `webhook_event_id` | string | ✅ | Provider's event ID |
| `card_token` | string | When available | Provider's card token |
| `transaction_token` | string | On transactions | Provider's transaction token |
| `authorization_token` | string | On authorizations | Provider's authorization token |
| `card_id` | UUID | On processed | Internal card ID (if matched) |
| `transaction_id` | UUID | On processed | Internal transaction ID (if created) |
| `connection_id` | UUID | ✅ | PaymentConnection ID |
| `workspace_id` | UUID | ✅ | Workspace ID |
| `processing_result` | string | On processed | `processed`, `ignored`, `retry_later` |
| `duration_ms` | integer | On processed/error | Processing latency |
| `error_type` | string | On error | Error classification |
| `error_message` | string | On error | Human-readable error |

### Card Webhook Handler Events (Session 2026-01-23_001)

> Internal handler logging for CardIssuance capability. Tracks handler processing separately from adapter-level logging, enabling measurement of handler duration vs total webhook duration.

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_card_webhook_handler_start` | start | CardIssuance handler begins processing |
| `ember_payments_card_webhook_handler_end` | end | CardIssuance handler completes successfully |
| `ember_payments_card_webhook_handler_error` | error | CardIssuance handler fails |

#### Handler Event Labels (Low Cardinality)

| Label | Values | Purpose |
|-------|--------|---------|
| `domain` | `ember_payments` | Always ember_payments |
| `event_type` | `ember_payments_card_webhook_handler_*` | Event type |
| `provider` | `marqeta`, `wex` | Card provider |
| `status` | `success`, `ignored`, `retry`, `error` | Processing outcome (on `_end`/`_error`) |

#### Handler Event Fields (High Cardinality)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | Human-readable: "Card webhook handler started/completed/failed: {event_type}" |
| `webhook_event_type` | string | ✅ | Provider's event type (e.g., `transaction.created`) |
| `provider` | string | ✅ | `marqeta` or `wex` |
| `processing_result` | string | On end | `processed`, `ignored`, `retry_later` |
| `handler_duration_ms` | integer | On end/error | Handler processing time (separate from adapter total) |
| `error_type` | string | On error | Error classification per LOGGING_STANDARDS.md |
| `error_message` | string | On error | Human-readable error |
| `connection_id` | UUID | ✅ | PaymentConnection ID |
| `workspace_id` | UUID | ✅ | Workspace ID |

#### Webhook Flow Visibility

After implementation, the full Marqeta webhook flow is observable:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MARQETA WEBHOOK FLOW — OBSERVABILITY                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1] ember_payments_card_webhook_received      ← Adapter receives webhook    │
│       │                                                                      │
│       ▼                                                                      │
│  [2] ember_payments_card_webhook_handler_start ← Handler begins (NEW)        │
│       │                                                                      │
│       ▼                                                                      │
│  [3] ember_payments_card_webhook_handler_end   ← Handler completes (NEW)     │
│       │   └── handler_duration_ms                                            │
│       ▼                                                                      │
│  [4] ember_payments_card_webhook_processed     ← Adapter completes           │
│           └── duration_ms (total)                                            │
│                                                                              │
│  Gap Analysis: handler_duration_ms vs duration_ms reveals where time is spent│
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Grafana Query Examples

**Handler Success Rate**:
```logql
sum(count_over_time({domain="ember_payments", event_type="ember_payments_card_webhook_handler_end", status="success"}[$__range]))
/
sum(count_over_time({domain="ember_payments", event_type=~"ember_payments_card_webhook_handler_end|ember_payments_card_webhook_handler_error"}[$__range]))
```

**Handler Duration Analysis**:
```logql
avg_over_time(
  {domain="ember_payments", event_type="ember_payments_card_webhook_handler_end"}
  | json
  | unwrap handler_duration_ms
  [$__range]
)
```

**Handler Errors by Event Type**:
```logql
sum by (webhook_event_type) (count_over_time(
  {domain="ember_payments", event_type="ember_payments_card_webhook_handler_error"}
  | json
  [$__range]
))
```

### Employee Bank Onboarding (Dwolla)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_employee_bank_onboarding_start` | start | Employee bank linking initiated |
| `ember_payments_dwolla_customer_created` | step | Dwolla receive-only customer created |
| `ember_payments_funding_source_created` | step | Bank funding source created |
| `ember_payments_micro_deposit_initiated` | step | Micro-deposits sent for verification |
| `ember_payments_funding_source_verified` | end | Bank account verified successfully |
| `ember_payments_funding_source_verification_failed` | error | Bank verification failed |

#### Employee Bank Onboarding Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employee_id` | UUID | ✅ | Employee being onboarded |
| `funding_source_id` | string | On creation | Dwolla funding source ID |
| `method` | string | ✅ | Verification method: `plaid`, `micro_deposit` |
| `verification_status` | string | On end | Status: `verified`, `unverified`, `failed` |
| `attempts` | integer | On failure | Number of verification attempts |

### Provider API Operations (Enhanced)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_payments_dwolla_api_request` | step | Outbound Dwolla API call |
| `ember_payments_dwolla_api_response_success` | step | Dwolla API success response |
| `ember_payments_dwolla_api_response_error` | error | Dwolla API error response |

#### Provider API Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ✅ | Provider name: `dwolla` |
| `endpoint` | string | ✅ | API endpoint: `/transfers`, `/customers` |
| `method` | string | ✅ | HTTP method: `POST`, `GET` |
| `status_code` | integer | On response | HTTP status code |
| `duration_ms` | integer | On response | Request latency |
| `dwolla_transfer_id` | string | On transfer | Dwolla's transfer reference |
| `dwolla_status` | string | On transfer | Dwolla status: `pending`, `processed` |
| `error_code` | string | On error | Dwolla error code |
| `embedded_errors` | array | On error | Dwolla embedded error details |

---

## Domain: ember_erp

### Sync Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_erp_sync_execution_start` | start | Sync execution begins |
| `ember_erp_sync_execution_end` | end | Sync execution completes |
| `ember_erp_sync_workspace_start` | start | Workspace sync begins |
| `ember_erp_sync_workspace_end` | end | Workspace sync completes |

### Push Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_erp_push_entity_start` | start | Entity push begins |
| `ember_erp_push_entity_end` | end | Entity push completes |
| `ember_erp_push_batch_start` | start | Batch push begins |
| `ember_erp_push_batch_end` | end | Batch push completes |

### Webhook Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_erp_webhook_received` | start | Webhook received |
| `ember_erp_webhook_processed` | end | Webhook processed |

---

## Domain: ember_documents

### Document Processing

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_documents_upload_start` | start | Document upload begins |
| `ember_documents_upload_end` | end | Document upload completes |
| `ember_documents_extraction_start` | start | AI extraction begins |
| `ember_documents_extraction_end` | end | AI extraction completes |
| `ember_documents_classification_start` | start | Classification begins |
| `ember_documents_classification_end` | end | Classification completes |
| `ember_documents_matching_start` | start | Receipt matching begins |
| `ember_documents_matching_end` | end | Receipt matching completes |

### Quality Checks

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_documents_duplicate_check_start` | start | Duplicate check begins |
| `ember_documents_duplicate_check_end` | end | Duplicate check completes |
| `ember_documents_pii_detection_start` | start | PII detection begins |
| `ember_documents_pii_detection_end` | end | PII detection completes |

---

## Domain: ember_reimbursements

### Reimbursement Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_submission_start` | start | Submission begins |
| `ember_reimbursements_submission_end` | end | Submission completes |
| `ember_reimbursements_approval_start` | start | Approval begins |
| `ember_reimbursements_approval_end` | end | Approval completes |
| `ember_reimbursements_rejection_start` | start | Rejection begins |
| `ember_reimbursements_rejection_end` | end | Rejection completes |
| `ember_reimbursements_payment_start` | start | Payment begins |
| `ember_reimbursements_payment_end` | end | Payment completes |

### Payout Operations (ACH/Dwolla)

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_payout_batch_submit_start` | start | Payout batch submission to provider begins |
| `ember_reimbursements_payout_batch_submit_end` | end | Payout batch submission completes |

### Provider API Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_provider_api_request` | step | Outbound API call to payment provider |
| `ember_reimbursements_provider_api_response` | step | Provider API response received |

### Receipt Matching

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_receipt_matching_start` | start | Receipt matching begins |
| `ember_reimbursements_receipt_matching_end` | end | Receipt matching completes |

### Payment Prerequisite Validation

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_payment_prerequisite_check_start` | start | Checking payment prerequisites |
| `ember_reimbursements_payment_prerequisite_check_end` | end | Prerequisites check completed |
| `ember_reimbursements_payment_blocked_no_bank` | error | Payment blocked - employee has no bank |
| `ember_reimbursements_payment_blocked_no_business_bank` | error | Payment blocked - business has no bank |
| `ember_reimbursements_payment_blocked_insufficient_funds` | error | Payment blocked - insufficient funds |

#### Payment Blocker Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reimbursement_request_id` | UUID | ✅ | Request that was blocked |
| `employee_id` | UUID | ✅ | Employee who would receive payment |
| `employee_email` | string | When available | Employee email for identification |
| `blocker` | string | ✅ | Blocker type: `no_funding_source`, `unverified_funding_source` |
| `blockers` | array | On check end | List of all blockers found |

### Payment Status Lifecycle

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_reimbursements_payment_status_changed` | step | Payment status transition occurred |
| `ember_reimbursements_payment_submitted_summary` | step | Full context summary after Dwolla submission |
| `ember_reimbursements_payment_completed` | end | Payment confirmed complete via webhook |
| `ember_reimbursements_payment_failed` | error | Payment confirmed failed via webhook or API |

#### Payment Lifecycle Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reimbursement_payment_id` | UUID | ✅ | Payment record ID |
| `reimbursement_request_id` | UUID | ✅ | Associated request ID |
| `old_status` | string | On change | Previous status |
| `new_status` | string | On change | New status |
| `trigger` | string | On change | What triggered: `admin_pay_click`, `webhook_transfer_completed`, `webhook_transfer_failed` |
| `dwolla_transfer_id` | string | When available | Dwolla's transfer ID |
| `failure_stage` | string | On failure | Where it failed: `prerequisite_check`, `api_call`, `ach_return`, `webhook_processing` |
| `failure_reason` | string | On failure | Human-readable reason: `R01 - Insufficient Funds` |
| `employee_name` | string | On summary | Employee name for ops readability |
| `employee_email` | string | On summary | Employee email for identification |
| `amount` | string | On summary | Payment amount formatted |
| `total_duration_ms` | integer | On completed | Total time from initiation to completion |

### Payout Labels (Low Cardinality)

| Label | Values | Purpose |
|-------|--------|---------|
| `provider` | `dwolla`, `checkbook` | Payment provider filter |
| `rail` | `ach`, `check` | Payment rail filter |
| `status` | `success`, `failure`, `error` | Outcome filter |

### Payout Fields (High Cardinality)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workspace_id` | UUID | ✅ | Workspace identifier |
| `entity_id` | UUID | ✅ | Legal entity |
| `reimbursement_request_id` | UUID | ✅ | Request being paid |
| `reimbursement_payment_id` | UUID | On end | Payment record created |
| `payout_batch_id` | UUID | On batch events | Batch identifier |
| `employee_id` | UUID | ✅ | Recipient employee |
| `amount` | decimal | ✅ | Payment amount |
| `duration_ms` | integer | On `_end` | Operation latency |
| `correlation_id` | string | When available | Webhook correlation |
| `error_type` | string | On errors | Error classification |
| `error_message` | string | On errors | Human-readable error |

---

## Domain: ember_communications

### Message Operations

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_communications_message_queued` | start | Message queued |
| `ember_communications_message_sent` | end | Message sent |
| `ember_communications_message_failed` | error | Message failed |

### Delivery Channels

| Event Type | Phase | Description |
|------------|-------|-------------|
| `ember_communications_email_delivery_start` | start | Email delivery begins |
| `ember_communications_email_delivery_end` | end | Email delivery completes |
| `ember_communications_slack_delivery_start` | start | Slack delivery begins |
| `ember_communications_slack_delivery_end` | end | Slack delivery completes |
| `ember_communications_teams_delivery_start` | start | Teams delivery begins |
| `ember_communications_teams_delivery_end` | end | Teams delivery completes |

---

## Domain: oban (Auto-Captured)

These events are automatically logged by `ObanLokiTelemetryHandler`:

| Event Type | Phase | Description |
|------------|-------|-------------|
| `oban_job_start` | start | Job execution begins |
| `oban_job_stop` | end | Job execution completes |
| `oban_job_exception` | error | Job raised exception |

---

## Status Values

All `_end` events should include a `status` label:

| Status | Meaning |
|--------|---------|
| `success` | Operation completed successfully |
| `failure` | Operation failed (business logic) |
| `error` | Operation failed (exception/crash) |
| `timeout` | Operation timed out |
| `cancelled` | Operation was cancelled |

---

## Error Types

Use these standardized error types in `error_type` field:

| Error Type | Category |
|------------|----------|
| `ValidationError` | Invalid input |
| `ProviderError` | External provider failed |
| `ProviderTimeout` | External provider timed out |
| `DatabaseError` | Database operation failed |
| `AuthorizationError` | Permission denied |
| `NotFoundError` | Resource not found |
| `ConflictError` | Concurrent modification |
| `RateLimitError` | Rate limit exceeded |
| `NetworkError` | Network connectivity issue |

