# Session Transcript

**Session**: 2026-01-26_001_receipt-matching-card-transactions  
**Date**: 2026-01-26

---

## Opening Statement

**CHAIR (Victoria Sterling, Payment Systems Architect):**

This is Victoria Sterling, Payment Systems Architect, calling to order session 2026-01-26_001_receipt-matching-card-transactions.

**SESSION GOAL**: Document and understand the receipt matching feature for card transactions in ashwood.

**ACTIVATED MEMBERS:**
- Victoria Sterling (Chair) - Session orchestration
- Research Clerk (Carlos Mendez) - Code investigation
- Recording Clerk (Emily Watson) - Documentation
- Pattern Historian (Dr. Henry Blackwood) - Architecture patterns

**HUMAN DIRECTOR:** Present and active.

The floor is now open for investigation.

---

## Investigation Findings

### 1. Architecture Overview

**Research Clerk (Carlos Mendez):**

I have completed an investigation of the receipt matching feature for card transactions. Here is the architecture:

#### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| **ReceiptService** | `ember_expense_receipt/services/receipt_service.ex` | High-level receipt operations (list, match, upload, dashboard) |
| **MatchComputationService** | `ember_expense_receipt/services/match_computation_service.ex` | Pre-computes match candidates for receipts |
| **LinkTransactionReceiptReactor** | `ember_expense_card/reactors/link_transaction_receipt_reactor.ex` | Orchestrates linking receipt to card transaction |
| **UnlinkTransactionReceiptReactor** | `ember_expense_card/reactors/unlink_transaction_receipt_reactor.ex` | Orchestrates unlinking receipt from transaction |
| **FastProcessDocumentReactor** | `ember_document_intake/reactors/fast_process_document_reactor.ex` | Auto-match flow after document upload |
| **ExpenseCardTransaction** | `ember_expense_card/resources/expense_card_transaction.ex` | Ash resource with receipt_document_id FK |
| **DocumentInbox** | `ember_document_intake/resources/document_inbox.ex` | Receipt storage with linked_record_id/type |

#### Domain Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Receipt Matching Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐         ┌─────────────────────┐               │
│   │  EmberDocumentIntake │         │   EmberExpenseCard   │               │
│   │  ──────────────────  │         │   ────────────────   │               │
│   │  DocumentInbox       │◄───────►│  ExpenseCardTransaction               │
│   │  (receipts)          │         │  (receipt_document_id) │               │
│   │                      │         │                      │               │
│   │  FastProcess         │────────►│  LinkTransaction     │               │
│   │  DocumentReactor     │         │  ReceiptReactor      │               │
│   └─────────────────────┘         └─────────────────────┘               │
│            │                                │                            │
│            ▼                                ▼                            │
│   ┌─────────────────────┐         ┌─────────────────────┐               │
│   │  EmberExpenseReceipt │         │  EmberCommunications │               │
│   │  ──────────────────  │         │  ────────────────── │               │
│   │  ReceiptService      │         │  PrepareDelivery    │               │
│   │  MatchComputation    │         │  Reactor            │               │
│   │  Service             │         │  (notifications)    │               │
│   └─────────────────────┘         └─────────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Match Computation Algorithm

**Research Clerk:**

The matching algorithm uses a weighted scoring system to determine confidence:

#### ReceiptService Scoring (for batch matching)

| Factor | Points | Criteria |
|--------|--------|----------|
| **Amount** | 50 | Within 5% tolerance |
| **Date** | 30 | Within 7 days |
| **Merchant** | 20 | Jaro similarity > 0.8 |

**Total: 100 points → Normalized to 0.0-1.0 confidence**

- **Auto-match threshold**: confidence >= 0.7 (70 points)
- **Below threshold**: Left for manual matching

#### ReceiptMatchingEngine Scoring (for reimbursements, different weights)

| Factor | Weight | Criteria |
|--------|--------|----------|
| **Amount** | 40% | Proportional based on diff |
| **Date** | 30% | Within 7 days, proportional |
| **Merchant** | 30% | Exact match = 1.0, else 0.5 |

**Auto-match threshold**: confidence >= 0.8 (uses `:auto_ocr` method)
**Fuzzy threshold**: confidence >= 0.5 (uses `:auto_fuzzy` method)

---

### 3. Flow Analysis

#### Flow A: Auto-Match (FastProcessDocumentReactor)

This flow triggers automatically when a receipt is uploaded via UI:

```
1. User uploads receipt (web, Teams, Slack)
         │
         ▼
2. FastProcessDocumentReactor starts
         │
         ├─► Step 1: fetch_document
         ├─► Step 2: pre_check_duplicate (hash-based)
         ├─► Step 3: ai_extract_text (Anthropic Claude)
         ├─► Step 4: classify_document (expense_receipt)
         ├─► Step 5: route_to_domain
         │           └─► ReceiptHandler.handle()
         │               └─► MatchComputationService.compute_for_receipt()
         │                   └─► Stores match_candidates on DocumentInbox
         │
         ├─► Step 6: auto_match_receipt (if not skip_auto_match)
         │           └─► Checks match_candidates for high-confidence matches
         │           └─► Calls LinkTransactionReceiptReactor if match found
         │
         ├─► Step 7: send_auto_match_notification
         │           └─► If matched: "Receipt Auto-Matched" notification
         │           └─► If no match: "No Matching Transactions" notification
         │
         ├─► Step 8: update_missing_receipts_card
         │           └─► Updates Teams adaptive card to show "View Receipt ✅"
         │
         └─► Step 9: complete_fast_path
```

**Key Configuration:**
- `skip_auto_match: true` - Used when uploading from transaction context (receipt will be explicitly linked)

#### Flow B: Manual Match (LinkTransactionReceiptReactor)

This flow triggers when user explicitly matches a receipt to a transaction:

```
1. User selects receipt and transaction in UI
         │
         ▼
2. LinkTransactionReceiptReactor starts
         │
         ├─► Step 1: get_transaction
         │           └─► Loads ExpenseCardTransaction with policies
         │           └─► Checks if already has receipt (unless force: true)
         │
         ├─► Step 2: validate_receipt
         │           └─► Loads DocumentInbox
         │           └─► Checks not already linked to reimbursement
         │
         ├─► Step 3: link_receipt
         │           └─► Updates transaction.receipt_document_id
         │           └─► Updates transaction.receipt_status = :attached
         │           └─► Has compensation for rollback on failure
         │
         ├─► Step 4: update_document_link
         │           └─► Sets DocumentInbox.linked_record_type = "ExpenseCardTransaction"
         │           └─► Sets DocumentInbox.linked_record_id = transaction.id
         │
         ├─► Step 5: cancel_receipt_reminders
         │           └─► Cancels pending receipt_reminder messages
         │
         └─► Step 6: send_match_notification
                     └─► "Receipt Matched" notification (unless skip_notification)
```

#### Flow C: Unlink Receipt (UnlinkTransactionReceiptReactor)

```
1. User clicks "Remove Receipt" on transaction
         │
         ▼
2. UnlinkTransactionReceiptReactor starts
         │
         ├─► Clears transaction.receipt_document_id
         ├─► Sets transaction.receipt_status = :missing
         └─► Clears DocumentInbox.linked_record_id/type
```

---

### 4. Data Model

#### ExpenseCardTransaction (relevant fields)

```elixir
# Foreign key to DocumentInbox
attribute :receipt_document_id, :uuid

# Derived status
attribute :receipt_status, ReceiptStatus  # :missing | :pending | :attached

# Timestamp
attribute :receipt_uploaded_at, :utc_datetime_usec

# Action for linking
update :link_receipt do
  argument :receipt_document_id, :uuid, allow_nil?: false
  change set_attribute(:receipt_document_id, arg(:receipt_document_id))
  change set_attribute(:receipt_status, :attached)
  change set_attribute(:receipt_uploaded_at, &DateTime.utc_now/0)
end
```

#### DocumentInbox (relevant fields)

```elixir
# Link to matched record
attribute :linked_record_type, :string  # "ExpenseCardTransaction" or "ReimbursementItem"
attribute :linked_record_id, :uuid

# Pre-computed match candidates (JSON array)
attribute :match_candidates, {:array, :map}
attribute :match_candidates_computed_at, :utc_datetime_usec

# Classification
attribute :document_type, DocumentType  # :expense_receipt
attribute :classification_confidence, :float
```

---

### 5. Key Integration Points

| Integration | Purpose | Notes |
|-------------|---------|-------|
| **Anthropic Claude** | AI text extraction | Extracts merchant, amount, date from receipt image |
| **EmberCommunications** | Notifications | "Receipt Auto-Matched", "No Matches", "Receipt Reminder" |
| **EmberReceiptRules** | Post-match hooks | `ReceiptMonitor.handle_receipt_matched/5` for rule evaluation |
| **Teams Adaptive Cards** | Missing receipts card | Updated when receipt is matched |

---

### 6. Authorization Model

**Research Clerk:**

The authorization follows a "boundary enforcement" pattern:

1. **LiveView Boundary**: User authentication and workspace/entity scoping
2. **Reactor Level**: Actor passed through for Ash policy enforcement
3. **Internal Steps**: May use `authorize?: false` with documented justification

Key policies:
- Users can only link receipts to transactions they have access to
- `expense_requester`: Only their own card transactions
- `expense_finance_admin` / `global_admin`: All transactions (bypass)

---

### 7. Observability

| Service | Purpose |
|---------|---------|
| **TempoTracingService** | Distributed tracing spans |
| **LokiLoggingService** | Structured logging with trace correlation |
| **PrometheusMetricsService** | Metrics (start/stop/error counts) |

Key spans:
- `document_processing` (root)
- `transaction_receipt_link`
- `trigger_receipt_matching`

---

## Gap Analysis for Teampay

**Pattern Historian (Dr. Henry Blackwood):**

For the future teampay implementation, the following gaps need to be addressed:

| Gap ID | Description | Ashwood Component | Teampay Equivalent Needed |
|--------|-------------|-------------------|---------------------------|
| GAP-001 | DocumentInbox resource | ember_document_intake | Bill/Receipt attachment model |
| GAP-002 | MatchComputationService | ember_expense_receipt | Match scoring service |
| GAP-003 | LinkTransactionReceiptReactor | ember_expense_card | Link bill attachment reactor |
| GAP-004 | Auto-match on upload | FastProcessDocumentReactor | Bill processing workflow |
| GAP-005 | AI extraction | Anthropic integration | OCR/AI for invoice data |
| GAP-006 | Notifications | EmberCommunications | Teampay notification system |

---

## Session Summary

**Session Historian (Dr. Henry Blackwood):**

This session documented the receipt matching architecture in ashwood:

1. **Two match flows**: Auto-match (on upload) and Manual match (user-initiated)
2. **Scoring algorithm**: Amount (50pts), Date (30pts), Merchant (20pts) with 70% auto-match threshold
3. **Key components**: 6 main modules across 4 domains
4. **Data model**: FK relationship between ExpenseCardTransaction and DocumentInbox
5. **Observability**: Full tracing, logging, and metrics integration

The architecture is well-designed with clear separation of concerns and robust error handling with compensation.

---

*Transcript recorded by Emily Watson, Recording Clerk*
