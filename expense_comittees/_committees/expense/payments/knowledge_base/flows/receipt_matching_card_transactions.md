# Receipt Matching for Card Transactions

> **Last Updated**: 2026-01-26  
> **Session**: 2026-01-26_001_receipt-matching-card-transactions  
> **Status**: Verified

---

## Overview

Receipt matching for card transactions allows users to attach receipt documents (images, PDFs) to expense card transactions. The system supports both **automatic matching** (AI-powered) and **manual matching** (user-initiated).

---

## Architecture

### Component Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Receipt Matching Component Architecture                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Upload Sources                    Processing Pipeline                       │
│  ──────────────                    ──────────────────                       │
│  ┌─────────┐                                                                 │
│  │   Web   │──┐                    ┌───────────────────────────────┐        │
│  └─────────┘  │                    │  FastProcessDocumentReactor    │        │
│  ┌─────────┐  │                    │  ─────────────────────────────│        │
│  │  Teams  │──┼──────────────────► │  1. Fetch document            │        │
│  └─────────┘  │                    │  2. Duplicate check (hash)    │        │
│  ┌─────────┐  │                    │  3. AI Extract (Anthropic)    │        │
│  │  Slack  │──┘                    │  4. Classify document         │        │
│  └─────────┘                       │  5. Route to domain           │        │
│                                    │  6. Auto-match receipt        │────┐   │
│                                    │  7. Send notification         │    │   │
│                                    └───────────────────────────────┘    │   │
│                                                                          │   │
│  Manual Match                                                            │   │
│  ────────────                                                            │   │
│  ┌─────────────────────┐           ┌───────────────────────────────┐    │   │
│  │  TransactionsLive   │──────────►│  LinkTransactionReceiptReactor │◄───┘   │
│  │  TransactionDetail  │           │  ─────────────────────────────│        │
│  │  ReceiptsLive       │           │  1. Load transaction          │        │
│  │  ReceiptDetailLive  │           │  2. Validate receipt          │        │
│  └─────────────────────┘           │  3. Link receipt              │        │
│                                    │  4. Update DocumentInbox      │        │
│                                    │  5. Cancel reminders          │        │
│                                    │  6. Send notification         │        │
│                                    └───────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Module Path | Purpose |
|-----------|-------------|---------|
| **ReceiptService** | `lib/flame_teampay_payables/ember_expense_receipt/services/receipt_service.ex` | High-level receipt operations |
| **MatchComputationService** | `lib/flame_teampay_payables/ember_expense_receipt/services/match_computation_service.ex` | Pre-computes match candidates |
| **LinkTransactionReceiptReactor** | `lib/flame_teampay_payables/ember_expense_card/reactors/link_transaction_receipt_reactor.ex` | Links receipt to transaction |
| **UnlinkTransactionReceiptReactor** | `lib/flame_teampay_payables/ember_expense_card/reactors/unlink_transaction_receipt_reactor.ex` | Unlinks receipt |
| **FastProcessDocumentReactor** | `lib/flame_teampay_payables/ember_document_intake/reactors/fast_process_document_reactor.ex` | Auto-match pipeline |
| **ExpenseCardTransaction** | `lib/flame_teampay_payables/ember_expense_card/resources/expense_card_transaction.ex` | Transaction resource |
| **DocumentInbox** | `lib/flame_teampay_payables/ember_document_intake/resources/document_inbox.ex` | Receipt storage |

---

## Matching Algorithms

### Algorithm A: Batch Matching (ReceiptService)

Used for matching multiple receipts to items in a request.

```elixir
# Scoring breakdown (100 points total)
Amount:   50 points - Within 5% tolerance
Date:     30 points - Within 7 days
Merchant: 20 points - Jaro similarity > 0.8

# Thresholds
Auto-match: confidence >= 0.7 (70 points)
Below 0.7:  Left for manual matching
```

**Code Reference**: `lib/flame_teampay_payables/ember_reimbursements/services/receipt_matching_service.ex`

### Algorithm B: Direct Matching (ReceiptMatchingEngine)

Used for matching a single receipt to items.

```elixir
# Scoring breakdown (weighted)
Amount:   40% weight - Proportional to amount difference
Date:     30% weight - Proportional within 7-day window
Merchant: 30% weight - Exact match = 1.0, else 0.5

# Thresholds
auto_ocr:   confidence >= 0.8 (high confidence)
auto_fuzzy: confidence >= 0.5 (acceptable)
Below 0.5:  No match
```

**Code Reference**: `lib/flame_teampay_payables/ember_reimbursements/integrations/document_intake/receipt_matching_engine.ex`

---

## Data Flow: Auto-Match

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Auto-Match Sequence Diagram                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User          UI            FastProcess        MatchComputation    Link     │
│   │            │              Reactor              Service         Reactor   │
│   │            │                │                    │               │       │
│   │──upload───►│                │                    │               │       │
│   │            │──create doc───►│                    │               │       │
│   │            │                │──AI extract───────►│               │       │
│   │            │                │◄─extracted data────│               │       │
│   │            │                │                    │               │       │
│   │            │                │──classify──────────│               │       │
│   │            │                │                    │               │       │
│   │            │                │──route to domain───│               │       │
│   │            │                │   (ReceiptHandler) │               │       │
│   │            │                │                    │               │       │
│   │            │                │──────compute───────►               │       │
│   │            │                │◄──match_candidates─│               │       │
│   │            │                │                    │               │       │
│   │            │                │  [if high confidence match]        │       │
│   │            │                │──────────────────────────────────►│       │
│   │            │                │◄─────────────linked───────────────│       │
│   │            │                │                    │               │       │
│   │            │◄──notification─│                    │               │       │
│   │◄───────────│                │                    │               │       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### ExpenseCardTransaction

```elixir
defmodule FlameTeampayPayables.EmberExpenseCard.Resources.ExpenseCardTransaction do
  # Receipt linking fields
  attribute :receipt_document_id, :uuid        # FK to DocumentInbox
  attribute :receipt_status, ReceiptStatus     # :missing | :pending | :attached
  attribute :receipt_uploaded_at, :utc_datetime_usec
  
  # Unique constraint - one receipt per transaction
  identities do
    identity :unique_receipt, [:receipt_document_id], where: expr(not is_nil(receipt_document_id))
  end
  
  # Action for linking
  update :link_receipt do
    argument :receipt_document_id, :uuid, allow_nil?: false
    change set_attribute(:receipt_document_id, arg(:receipt_document_id))
    change set_attribute(:receipt_status, :attached)
    change set_attribute(:receipt_uploaded_at, &DateTime.utc_now/0)
  end
end
```

### DocumentInbox

```elixir
defmodule FlameTeampayPayables.EmberDocumentIntake.Resources.DocumentInbox do
  # Link tracking
  attribute :linked_record_type, :string    # "ExpenseCardTransaction" or "ReimbursementItem"
  attribute :linked_record_id, :uuid
  
  # Pre-computed matches (for UI suggestions)
  attribute :match_candidates, {:array, :map}
  attribute :match_candidates_computed_at, :utc_datetime_usec
  
  # Receipt classification
  attribute :document_type, DocumentType    # :expense_receipt
  attribute :classification_confidence, :float
  
  # Extracted data (from AI)
  attribute :extracted_text, :string
  attribute :classification_details, :map   # Contains merchant, amount, date
end
```

---

## Match Candidates Structure

The `match_candidates` field stores pre-computed potential matches:

```elixir
[
  %{
    "type" => "card_transaction",
    "id" => "uuid-of-transaction",
    "score" => 0.85,
    "merchant" => "Starbucks",
    "amount" => %{"amount" => 4250, "currency" => "USD"},
    "date" => "2026-01-25",
    "matched" => false
  },
  %{
    "type" => "card_transaction",
    "id" => "uuid-of-another-transaction",
    "score" => 0.62,
    "merchant" => "Coffee Shop",
    "amount" => %{"amount" => 3800, "currency" => "USD"},
    "date" => "2026-01-24",
    "matched" => false
  }
]
```

---

## Authorization

### Policy Model

```elixir
# ExpenseCardTransaction policies
policies do
  # expense_requester can only access their own transactions
  policy action(:link_receipt) do
    authorize_if actor_attribute_equals(:role, :expense_finance_admin)
    authorize_if actor_attribute_equals(:role, :global_admin)
    authorize_if relates_to_actor_through(:expense_card, :user)
  end
end
```

### Boundary Enforcement Pattern

1. **LiveView Mount**: Validates user, workspace, entity
2. **Reactor Input**: Actor struct passed through
3. **Ash Operations**: Use `actor:` for policy enforcement
4. **Internal Steps**: May use `authorize?: false` with documented justification

---

## Notifications

| Event | Message Type | Recipient | Content |
|-------|-------------|-----------|---------|
| Auto-match success | `:receipt_auto_matched` | Uploader | "Receipt matched to [merchant] transaction" |
| Auto-match no match | `:receipt_no_matches` | Uploader | "No matching transactions found" |
| Manual match | `:receipt_manual_matched` | Actor | "Receipt matched to [merchant]" |
| Receipt reminder | `:receipt_reminder` | Cardholder | "Missing receipt for [merchant]" |

---

## Error Handling

### Compensation Pattern

`LinkTransactionReceiptReactor` implements compensation for rollback:

```elixir
# Step 3: link_receipt has compensation
compensate fn args, error, _context ->
  # If link succeeded but later step fails:
  # - Reload transaction
  # - Clear receipt_document_id
  # - Reset receipt_status to :missing
  
  # If error was :receipt_already_linked_to_another_transaction:
  # - No compensation needed (we never linked)
end
```

### Race Condition Protection

Unique constraint on `receipt_document_id` prevents duplicate linking:

```elixir
# If two users try to link same receipt simultaneously:
# - First wins (constraint passes)
# - Second gets :receipt_already_linked_to_another_transaction error
```

---

## Exclusivity Rule

A receipt can be linked to EITHER:
- One `ExpenseCardTransaction`, OR
- One `ReimbursementItem`

**Never both.**

This is enforced in `LinkTransactionReceiptReactor`:

```elixir
defp check_reimbursement_link(document_id) do
  # Query ReimbursementReceipt for existing link
  # Return {:error, :already_linked_to_reimbursement} if found
end
```

---

## Configuration

### Timeouts (configurable in config/runtime.exs)

```elixir
config :flame_teampay_payables, :fast_processor,
  ai_extraction_timeout_ms: 90_000,   # AI extraction (includes S3 + Anthropic)
  classify_timeout_ms: 30_000,         # Classification
  route_timeout_ms: 15_000             # Routing
```

### Feature Flags

```elixir
# Skip auto-match when uploading from transaction context
skip_auto_match: true  # Receipt is explicitly linked, no need to match
```

---

## Observability

### Tracing Spans

| Span | Parent | Purpose |
|------|--------|---------|
| `document_processing` | - | Root span for FastProcessDocumentReactor |
| `transaction_receipt_link` | - | Root span for LinkTransactionReceiptReactor |
| `expense_card.trigger_receipt_matching` | `document_processing` | Auto-match step |

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `ember_expense_card_receipt_link_start` | Counter | workspace_id, entity_id |
| `ember_expense_card_receipt_link_stop` | Counter | workspace_id, entity_id, status |
| `ember_expense_card_receipt_link_duration_ms` | Histogram | workspace_id |

### Logs (Loki)

| Event | Level | Fields |
|-------|-------|--------|
| `receipt_link_start` | INFO | trace_id, document_id, transaction_id |
| `receipt_link_end` | INFO | trace_id, status, duration_ms |

---

## Related Documentation

- [EmberDocumentIntake Architecture](../architecture/ember_document_intake.md)
- [EmberExpenseCard Resources](../resources/expense_card_transaction.md)
- [FastProcessDocumentReactor](../flows/fast_process_document.md)
- [Reimbursement Receipt Matching](../flows/receipt_matching_reimbursements.md)

---

*Documentation created by Ember Payments Committee, Session 2026-01-26_001*
