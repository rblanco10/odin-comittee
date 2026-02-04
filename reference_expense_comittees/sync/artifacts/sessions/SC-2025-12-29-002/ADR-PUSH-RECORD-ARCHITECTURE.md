# ADR: PushEntityRecord Architecture

**Session**: SC-2025-12-29-002  
**Date**: 2025-12-29  
**Status**: APPROVED

## Context

During Flow-02 planning, we identified a fundamental architectural issue:

- `PushRequest` represents a business intent (e.g., "push this card transaction")
- But card transactions create MULTIPLE ERP entities: Vendor (maybe), Bill, Bill Payment
- Currently, only the Bill's `external_id` goes in `PushRequest.external_id`
- Bill Payment's ID is buried in `push_metadata.payment_external_id`
- Reconciliation services filter by `entity_type` on PushRequest
- Result: Bill Payment (and any auto-created Vendor) NEVER gets reconciled

## Decision

Introduce `PushEntityRecord` as a one-to-many child of `PushRequest`:

```
PushRequest (business intent)           PushEntityRecord (ERP entity)
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ entity_type: :card_spend     │       │ entity_type: :vendor         │
│ source_resource_id: txn_id   │───┬──►│ external_id: "VEND-123"      │
│ status: :pushed (computed)   │   │   │ status: :pushed              │
└──────────────────────────────┘   │   └──────────────────────────────┘
                                   │   ┌──────────────────────────────┐
                                   ├──►│ entity_type: :bill           │
                                   │   │ external_id: "BILL-456"      │
                                   │   │ status: :pushed              │
                                   │   └──────────────────────────────┘
                                   │   ┌──────────────────────────────┐
                                   └──►│ entity_type: :bill_payment   │
                                       │ external_id: "PAY-789"       │
                                       │ status: :pushed              │
                                       └──────────────────────────────┘
```

Note: Named `PushEntityRecord` to avoid conflict with existing `PushLog.PushRecord` (audit logging).

## Changes Required

### New Resource: `PushEntityRecord`
- `entity_type`: :vendor, :bill, :bill_payment, :expense_report, etc.
- `external_id`: ERP's ID after push
- `status`: :pending, :pushed, :failed
- `accounting_resource_id`: Link to mirror after reconciliation
- `belongs_to :push_request`

### Modified: `PushRequest`
- Remove: `external_id`, `accounting_resource_id`, `accounting_resource_type`, `sync_verified_at`
- Add: `has_many :push_entity_records`
- Status can be computed from children (all pushed = pushed, any failed = partial, etc.)

### All Push Reactors (11 total)
Create `PushEntityRecord` for each ERP entity pushed instead of storing in `push_metadata`.

### All Reconciliation Services (10 total)
Query `PushEntityRecord` instead of `PushRequest`.

## Benefits

1. **Clean reconciliation** - Every pushed ERP entity has its own record
2. **Proper linkage** - APPaymentApplication can link to both Bill and BillPayment records
3. **Extensible** - Adding new entities (vendor auto-create) is natural
4. **Auditable** - Clear history of what was pushed and when

## Migration

Not needed - we are not in production.

## Scope

| Component | Count | Action |
|-----------|-------|--------|
| PushEntityRecord resource | 1 | CREATE |
| PushRequest resource | 1 | MODIFY |
| Push reactors | 11 | REFACTOR |
| Reconciliation services | 10 | REFACTOR |
| Tests | many | UPDATE |

