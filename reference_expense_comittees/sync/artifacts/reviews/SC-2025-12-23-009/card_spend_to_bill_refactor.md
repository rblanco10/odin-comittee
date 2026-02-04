# Card Spend → Bill + Payment Refactor

> **Session:** SC-2025-12-23-009  
> **Date:** 2025-12-23  
> **Status:** APPROVED by Sync Committee  
> **Topic:** Align Card Transaction Push with ERP Object Model

---

## Problem Statement

Card transactions are pushed to ERPs as **Vendor Bill + Bill Payment**, but the code uses a fake entity type (`:card_transaction`) that doesn't exist in ERPs. This creates:

1. Redundant reconciliation code
2. Confusing naming
3. Broken entity type semantics

---

## Solution

Use the **existing Bill and AP Payment infrastructure** with correct entity types.

### Push Flow

```
ExpenseCardTransaction
        │
        ▼
PushBillWithPaymentReactor (renamed from PushCardTransactionReactor)
        │
        ├──► PushRequest (entity_type: :bill)
        │         └──► Creates Vendor Bill in ERP
        │
        └──► PushRequest (entity_type: :ap_payment)
                  └──► Creates Bill Payment in ERP
```

### Sync Flow (Unchanged)

```
WorkspaceSyncReactor
├──► EntitySyncService.sync_entity(:bills) → Bill Mirror
└──► EntitySyncService.sync_entity(:ap_payments) → APPayment Mirror
```

### Bridge/Reconciliation Flow (Simplified)

```
BridgeReactor
├──► reconcile_bills → BillReconciliationService
│         └──► Links PushRequest(entity_type: :bill) → Bill Mirror
│
└──► reconcile_ap_payments → APPaymentReconciliationService
          └──► Links PushRequest(entity_type: :ap_payment) → APPayment Mirror
```

---

## Changes Required

### 1. Fix Entity Types in Push Reactor

**File:** `ember_erp/resources/reactors/ap/push_card_transaction.ex`

```elixir
# BEFORE
@entity_type :card_transaction

# AFTER - Bill PushRequest
entity_type: :bill

# AFTER - Payment PushRequest  
entity_type: :ap_payment
```

### 2. Delete Redundant Reconciliation Service

**Delete:** `ember_bridge/services/reconciliation/card_transaction_reconciliation_service.ex`

**Reason:** BillReconciliationService already handles all bills regardless of source.

### 3. Delete Redundant Bridge Step

**File:** `ember_bridge/reactors/bridge_reactor.ex`

**Remove:** `step :reconcile_card_transactions`

**Reason:** `reconcile_bills` and `reconcile_ap_payments` already exist.

### 4. Delete Expense Path Reactor

**Delete:** `ember_erp/resources/reactors/expense/push_card_transaction_reactor.ex`

**Reason:** Uses fake "credit card charge" ERP object. The AP path (Bill + Payment) is correct.

---

## Complete Lifecycle After Refactor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. PUSH                                                                    │
│                                                                             │
│  ExpenseCardTransaction → PushBillWithPaymentReactor                        │
│       │                                                                     │
│       ├──► PushRequest (entity_type: :bill, external_id: NS-BILL-789)       │
│       └──► PushRequest (entity_type: :ap_payment, external_id: NS-PAY-101)  │
│                                                                             │
│  2. SYNC                                                                    │
│                                                                             │
│  WorkspaceSyncReactor                                                       │
│       ├──► Bill Mirror (external_id: NS-BILL-789)                           │
│       └──► APPayment Mirror (external_id: NS-PAY-101)                       │
│                                                                             │
│  3. BRIDGE                                                                  │
│                                                                             │
│  BridgeReactor                                                              │
│       ├──► reconcile_bills: PushRequest ←→ Bill Mirror                      │
│       └──► reconcile_ap_payments: PushRequest ←→ APPayment Mirror           │
│                                                                             │
│  4. COMPLETE CHAIN                                                          │
│                                                                             │
│  ExpenseCardTransaction                                                     │
│       ↓ (source_resource_id)                                                │
│  PushRequest (entity_type: :bill)                                           │
│       ↓ (accounting_resource_id)                                            │
│  Bill Mirror                                                                │
│       ↓ (external_id)                                                       │
│  NetSuite Vendor Bill                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verification

After refactor, confirm:

1. Card transaction push creates PushRequests with `entity_type: :bill` and `:ap_payment`
2. `BillReconciliationService` successfully links card-originated bills
3. `APPaymentReconciliationService` successfully links card-originated payments
4. No references to `:card_transaction` entity type remain

---

## Session Reference

- Identified in: SC-2025-12-23-009 Turn 8
- Approved: Same session
- Related: Card Transaction lifecycle investigation

