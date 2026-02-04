# Flow 10: ERP Edit → Teampay (Bi-directional Sync, Open Period)

> **Session:** SC-2025-12-29-001  
> **Category:** Edit/Sync  
> **Period:** Open  
> **Direction:** ERP → Teampay  
> **Status:** Gap Analysis Complete

---

## Scenario

- Transaction was pushed from Teampay to ERP
- Finance admin edits coding in NetSuite (period is **open**)
- Next sync pulls ERP changes back to Teampay
- Teampay product domain updated

---

## Key Invariants

> **Bi-directional sync applies ONLY when the accounting period is OPEN.**
>
> - ERP is authoritative for coding when period is open
> - Coding rules **remain protected** - cannot change protected coding
> - Changes to "coding" fields only, not core transaction data

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FLOW 10: ERP EDIT → TEAMPAY (BI-DIRECTIONAL, OPEN)                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   INITIAL STATE (After previous sync)                                           │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │ Teampay             │         │ NetSuite            │                       │
│   │                     │         │                     │                       │
│   │ CardTransaction     │◀───────▶│ Vendor Bill         │                       │
│   │ - Department: Sales │  SYNCED │ - Department: Sales │                       │
│   │ - Location: NYC     │         │ - Location: NYC     │                       │
│   └─────────────────────┘         └─────────────────────┘                       │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                        ADMIN EDITS IN NETSUITE                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │ NetSuite UI                                                             │   │
│   │                                                                         │   │
│   │ Finance admin opens Vendor Bill                                         │   │
│   │                                                                         │   │
│   │ BEFORE:                        AFTER:                                   │   │
│   │ Department: Sales      →       Department: Marketing ← CHANGE           │   │
│   │ Location: NYC                  Location: NYC                            │   │
│   │                                                                         │   │
│   │ [Save]                                                                  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                        NEXT SCHEDULED SYNC (Every 2 min)                        │
│   ═══════════════════════════════════════════════════════════════════════════   │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                    S Y N C   P H A S E                           │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────┐                                              │
│   │   WorkspaceSyncReactor       │                                              │
│   │                              │                                              │
│   │ 1. Fetch bills from NS       │                                              │
│   │ 2. Find Bill with changes    │                                              │
│   │    - Department: Marketing   │ ← Detects change                             │
│   │ 3. Upsert to Bill mirror     │                                              │
│   └──────────┬───────────────────┘                                              │
│              │                                                                  │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              │                   B R I D G E   P H A S E                        │
│   ═══════════╪══════════════════════════════════════════════════════════════    │
│              ▼                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ BridgeReactor                                                        │      │
│   │                                                                      │      │
│   │ Step 9: BillReconciliationService                                    │      │
│   │ ┌────────────────────────────────────────────────────────────────┐   │      │
│   │ │  1. Find linked transaction in product domain                  │   │      │
│   │ │     Invoice.erp_bill_id → Bill mirror                          │   │      │
│   │ │                                                                │   │      │
│   │ │  2. Check: Is period OPEN?                                     │   │      │
│   │ │     → YES (April 2025 is open)                                 │   │      │
│   │ │                                                                │   │      │
│   │ │  3. Compare coding values:                                     │   │      │
│   │ │     Teampay Department: Sales                                  │   │      │
│   │ │     ERP Department: Marketing                                  │   │      │
│   │ │     → DIFFERENCE DETECTED                                      │   │      │
│   │ │                                                                │   │      │
│   │ │  4. Check coding rules:                                        │   │      │
│   │ │     Is Department protected? → NO                              │   │      │
│   │ │     (If YES, skip update and log)                              │   │      │
│   │ │                                                                │   │      │
│   │ │  5. PROPAGATE to product domain:                               │   │      │
│   │ │     → Update CardTransaction.department = "Marketing"          │   │      │
│   │ │     → Add audit entry: "Coding updated from ERP"               │   │      │
│   │ │                                                                │   │      │
│   │ └────────────────────────────────────────────────────────────────┘   │      │
│   │                                                       GAP-BIDI-001   │      │
│   │                                                       GAP-BIDI-002   │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
│   RESULT:                                                                       │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │ Teampay             │         │ NetSuite            │                       │
│   │                     │         │                     │                       │
│   │ CardTransaction     │◀───────▶│ Vendor Bill         │                       │
│   │ - Department:       │  SYNCED │ - Department:       │                       │
│   │   Marketing ← UPD   │         │   Marketing         │                       │
│   │ - Location: NYC     │         │ - Location: NYC     │                       │
│   └─────────────────────┘         └─────────────────────┘                       │
│                                                                                 │
│   Audit Log: "Department changed from 'Sales' to 'Marketing' (ERP edit)"        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Coding Rules Protection

Not all coding changes from ERP should be accepted:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CODING RULES CHECK                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   For each coding dimension changed in ERP:                                     │
│                                                                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │ Is there a coding rule that protects this dimension?                 │      │
│   │                                                                      │      │
│   │ Examples of protected coding:                                        │      │
│   │ - Budget-locked department assignments                               │      │
│   │ - Policy-mandated expense categories                                 │      │
│   │ - Auto-coded vendor-specific GL accounts                             │      │
│   │                                                                      │      │
│   │ IF protected:                                                        │      │
│   │   → Do NOT update product domain                                     │      │
│   │   → Log warning: "ERP change to protected field ignored"             │      │
│   │   → Next push will restore Teampay value                             │      │
│   │                                                                      │      │
│   │ IF not protected:                                                    │      │
│   │   → Update product domain                                            │      │
│   │   → Add audit entry                                                  │      │
│   └──────────────────────────────────────────────────────────────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

- [ ] ERP edit detected during sync
- [ ] Period is **open** → bi-directional sync allowed
- [ ] Coding rules checked before propagation
- [ ] Product domain updated with ERP values
- [ ] Audit log entry created with "ERP-originated" flag

---

## Gap Analysis

| Gap ID | Location | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| GAP-BIDI-001 | Bridge | Mechanism to propagate ERP coding changes to product domain not implemented | 🔴 Critical | 🔴 Missing |
| GAP-BIDI-002 | Bridge | "ERP-originated" flag in audit log | 🟡 Medium | 🔴 Missing |
| GAP-CODING-001 | Bridge | Coding rules check before bi-directional update | 🔴 High | ⚠️ Needs verification |

---

## Current Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| Sync | Bill sync pulls ERP changes | ✅ Exists |
| Bridge | Detect coding differences | ⚠️ Needs verification |
| Bridge | Propagate to product domain | 🔴 Missing |
| Bridge | Coding rules protection | ⚠️ Needs verification |
| Audit | ERP-originated flag | 🔴 Missing |

---

## Requirements Trace

| Requirement | Part | Flow |
|-------------|------|------|
| Auto Sync | Part 1 | Flow 5 |
| Manual Sync | Part 2 | Flow 5 |

---

*Documented by Sync Committee*  
*Session: SC-2025-12-29-001*

