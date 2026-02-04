# Flow 1: Card Transaction → Existing Vendor (Open Period)

> **Session:** SC-2025-12-29-001  
> **Category:** Card Transaction  
> **Period:** Open  
> **Vendor:** Existing  
> **Status:** Gap Analysis Complete

---

## Scenario

- Accounting period is **open**
- Vendor (e.g., Figma) **exists** in ERP
- Employee makes card purchase

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FLOW 1: CARD → EXISTING VENDOR (OPEN)                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   TEAMPAY PRODUCT DOMAIN                                                        │
│   ┌──────────────────────┐                                                      │
│   │ ExpenseCardTransaction│ ← Card settles, receipt attached, auto-coded        │
│   │ - amount: $120        │                                                     │
│   │ - vendor: Figma       │                                                     │
│   │ - coding: 6100/Eng/SF │                                                     │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│              │ [PUSH TRIGGER]                                                   │
│              │ Auto-sync: On settlement                                         │
│              │ Manual sync: Finance clicks "Sync" button                        │
│              ▼                                                                  │
│   ┌──────────────────────┐                                                      │
│   │    PushOrchestrator  │ → Creates PushRequest(entity_type: :card_spend)      │
│   └──────────┬───────────┘                                                      │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    P U S H   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │ PushCardSpendReactor   │                                              │
│   │                              │                                              │
│   │ 1. Validate push request     │                                              │
│   │ 2. Load ExpenseCardTxn       │                                              │
│   │ 3. Load coding assignments   │                                              │
│   │ 4. Check vendor exists ────────────► Figma vendor exists ✓                  │
│   │ 5. Validate period open ─────────────────────────────────► [?] GAP-PERIOD   │
│   │ 6. Transform to Bill format  │                                              │
│   │ 7. Push Bill to NetSuite     │ → Vendor Bill created (external_id: 12345)   │
│   │ 8. Push Bill Payment         │ → Bill Payment created (external_id: 12346)  │
│   │ 9. Store external_ids        │                                              │
│   │ 10. Mark PushRequest=pushed  │                                              │
│   └──────────────────────────────┘                                              │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    S Y N C   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │ (Next scheduled sync, every 2 min)                               │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │   WorkspaceSyncReactor       │                                              │
│   │                              │                                              │
│   │ → Fetches bills from NetSuite│                                              │
│   │ → Finds Bill #12345          │                                              │
│   │ → Upserts to Bill mirror     │                                              │
│   └──────────┬───────────────────┘                                              │
│              │                                                                  │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │    ERP MIRROR TABLES         │                                              │
│   │  ┌────────────────────┐      │                                              │
│   │  │ Bill               │      │                                              │
│   │  │ - external_id:12345│      │                                              │
│   │  │ - amount: $120     │      │                                              │
│   │  │ - coding: synced   │      │                                              │
│   │  └────────────────────┘      │                                              │
│   └──────────┬───────────────────┘                                              │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                   B R I D G E   P H A S E                        │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │      BridgeReactor           │                                              │
│   │                              │                                              │
│   │ Step 9: BillReconciliation   │                                              │
│   │ → Find PushRequest with      │                                              │
│   │   external_id: 12345         │                                              │
│   │ → Link to Bill mirror        │                                              │
│   │ → Update Invoice.erp_bill_id │                                              │
│   │ → Status = SYNCED            │                                              │
│   └──────────────────────────────┘                                              │
│                                                                                 │
│   RESULT: Transaction synced, Bill + Payment in ERP, linked back to Teampay    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ERP Records Created

### Vendor Bill

| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $120 |
| Transaction Date (trandate) | Card settlement date |
| Posting Period | Matches transaction date (open) |
| GL Account | 6100 (Software Subscriptions) |
| Department | Engineering |
| Location | SF |
| Class | Opex |
| Project | Platform |
| Attachments | Receipt image |

### Bill Payment

| Field | Value |
|-------|-------|
| Vendor | Figma |
| Amount | $120 |
| Account | AP Clearing (card clearing) |
| Applied To | Vendor Bill |
| Coding | Inherited from Bill |

---

## Verification Checklist

- [ ] Transaction Date = ERP Posting Date
- [ ] Vendor already exists → no vendor creation
- [ ] Status = **Synced** in Teampay
- [ ] Receipt attached to Vendor Bill
- [ ] Coding applied correctly

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-PERIOD-001 | Push Step 5 | Period validation may be missing in `PushCardSpendReactor` | 🔴 High | ⚠️ Needs verification |
| GAP-UI-001 | Push Trigger | No "Sync" button on transaction list (manual mode) | 🔴 High | 🔴 Missing |
| GAP-UI-002 | Push Trigger | No "Sync" button on transaction detail (manual mode) | 🔴 High | 🔴 Missing |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Push | `PushCardSpendReactor` | ✅ Exists |
| Sync | `WorkspaceSyncReactor` → Bills | ✅ Exists |
| Bridge | `BillReconciliationService` | ✅ Exists |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 1 |
| Manual Sync | Part 2 | Flow 1 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

