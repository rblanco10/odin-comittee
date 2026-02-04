# Requirements Part 3: Vendor Auto-Creation Policy

> **Session:** SC-2025-12-29-001  
> **Source:** Product Requirements  
> **Captured:** 2025-12-29  
> **Status:** Documented (Pending Implementation)  
> **Related:** Part 1 (Auto Sync), Part 2 (Manual Sync)

---

## Executive Summary

This document captures the Vendor Auto-Creation Policy requirements, defining when and how vendors are automatically created in the ERP during sync operations. It covers threshold-based policies and the option to disable auto-creation entirely.

---

## 1. Policy Definition

> New vendors may be auto-created in the ERP for **card/AP spend only**, up to a **$5,000 transaction amount**. Transactions above the threshold require **explicit finance approval** before vendor creation and ERP posting.

### 1.1 Key Policy Rules

| Rule | Description |
|------|-------------|
| **Per-transaction threshold** | Threshold applies per transaction, NOT cumulative spend (simpler, safer MVP) |
| **Card/AP spend only** | Only applies to card and AP transactions |
| **Reimbursements excluded** | Reimbursements **never** auto-create ERP vendors |
| **Enforcement timing** | Policy is enforced at **sync time**, not at transaction time |

### 1.2 Policy Configuration Options

| Setting | Options |
|---------|---------|
| Auto-create vendors | ON (with threshold) / OFF |
| Threshold amount | e.g., $5,000 (configurable) |
| Applies to | Card/AP spend only |

---

## 2. Scenario Set A — Threshold-Based Auto Vendor Creation ($5,000)

### Flow A1: Card Transaction — New Vendor Below Threshold

**Scenario:**
- Vendor auto-create threshold = **$5,000**
- Accounting period is **open**
- Vendor does **not** exist in ERP
- Card Transaction amount = **$2,400**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes a $2,400 card transaction at Linear Labs |
| 2 | Transaction settles and appears in the Transactions tab |
| 3 | Receipt is submitted and auto-matched |
| 4 | Auto-coding applies |
| 5 | **Finance initiates Manual Batch Sync** |
| 6 | At sync time, Teampay evaluates vendor policy: |
| | • Vendor is new |
| | • Amount is **below $5,000 threshold** |
| 7 | **Vendor is auto-created in NetSuite** |
| 8 | Vendor Bill and Bill Payment are created |

**NetSuite Result:**

| Record | Details |
|--------|---------|
| **New Vendor** | Linear Labs |
| **Vendor Bill** | Amount: $2,400, Transaction Date = Posting Date (period open), Coding applied per rules, Receipt attached |
| **Bill Payment** | Applied via AP Clearing |

**Verification:**
- ✅ **Vendor created automatically**
- ✅ Transaction synced successfully
- ✅ Status = **Synced**

---

### Flow A2: Card Transaction — New Vendor Above Threshold

**Scenario:**
- Vendor auto-create threshold = **$5,000**
- Accounting period is **open**
- Vendor does **not** exist in ERP
- Transaction amount = **$8,750**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes an $8,750 card transaction at Quantum Systems |
| 2 | Transaction settles; receipt is submitted |
| 3 | Auto-coding applies |
| 4 | **Finance initiates Manual Batch Sync** |
| 5 | At sync time, Teampay evaluates vendor policy: |
| | • Vendor is new |
| | • Amount **exceeds $5,000 threshold** |
| 6 | **Sync is blocked for this transaction** |
| 7 | Admin is notified |

**System Behavior:**
- Transaction remains **Not Synced**
- A blocking message is shown:

**Blocking Message:**
> "Vendor auto-creation is restricted for transactions over $5,000. Please create or approve this vendor in the ERP and retry sync."

**Resolution Paths (Finance-controlled):**

| Option | Action |
|--------|--------|
| **Option 1** | Finance manually creates the vendor in NetSuite, then re-runs sync |

**Verification:**
- ❌ **No ERP vendor created automatically**
- ❌ No Vendor Bill created until resolved
- ❌ **No silent posting**

---

### Flow A3: Card Transaction — Vendor Created After Approval

**Scenario:**
- Continuation of Flow A2

**Flow:**

| Step | Action |
|------|--------|
| 1 | Finance creates Quantum Systems vendor in NetSuite |
| 2 | Finance returns to Teampay and re-runs Manual Batch Sync |
| 3 | Teampay detects vendor now exists |
| 4 | Vendor Bill and Bill Payment are created |

**Verification:**
- ✅ **Vendor creation is intentional**
- ✅ Transaction sync succeeds
- ✅ Status = **Synced**

---

## 3. Scenario Set B — Vendor Policy: Do Not Auto-Create Vendors

### Policy Definition

> New vendors are **never** auto-created in the ERP. All vendors must exist in the ERP before transactions can be posted.

---

### Flow B1: Card Transaction — Existing Vendor

**Scenario:**
- Auto-create vendors = **OFF**
- Vendor **exists** in ERP
- Accounting period is **open**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes a $1,200 card transaction at Figma |
| 2 | Receipt is submitted; auto-coding applies |
| 3 | **Finance initiates Manual Batch Sync** |
| 4 | Vendor exists → transaction syncs normally |

**Verification:**
- ✅ No change from standard flow
- ✅ Vendor Bill + Bill Payment created
- ✅ Status = **Synced**

---

### Flow B2: Card Transaction — New Vendor (Auto-Create Disabled)

**Scenario:**
- Auto-create vendors = **OFF**
- Vendor does **not** exist in ERP
- Transaction amount = **$450**

**Flow:**

| Step | Action |
|------|--------|
| 1 | Employee makes a $450 card transaction at Airtable Pro Services |
| 2 | Receipt is submitted; auto-coding applies |
| 3 | **Finance initiates Manual Batch Sync** |
| 4 | Teampay evaluates vendor policy: |
| | • Vendor is new |
| | • **Auto-create disabled** |
| 5 | **Sync is blocked** |

**System Behavior:**
- Transaction remains **Not Synced**
- Blocking message shown:

**Blocking Message:**
> "This vendor does not exist in the ERP. Please create the vendor before syncing."

**Resolution:**

| Step | Action |
|------|--------|
| 1 | Finance creates vendor in NetSuite |
| 2 | Finance re-runs Manual Batch Sync |

**Verification:**
- ✅ **Vendor created explicitly**
- ❌ No automatic vendor creation
- ✅ Transaction syncs only after ERP vendor exists

---

## 4. Policy Decision Matrix

### 4.1 Auto-Create Enabled (with Threshold)

| Vendor Status | Amount vs Threshold | Sync Result |
|---------------|---------------------|-------------|
| Exists | Any | ✅ Sync proceeds |
| New | **Below** threshold | ✅ Auto-create vendor, sync proceeds |
| New | **Above** threshold | ❌ Blocked, requires manual vendor creation |

### 4.2 Auto-Create Disabled

| Vendor Status | Sync Result |
|---------------|-------------|
| Exists | ✅ Sync proceeds |
| New | ❌ Blocked, requires manual vendor creation |

---

## 5. Blocking Messages Reference

| Scenario | Message |
|----------|---------|
| New vendor, above threshold | "Vendor auto-creation is restricted for transactions over $5,000. Please create or approve this vendor in the ERP and retry sync." |
| New vendor, auto-create disabled | "This vendor does not exist in the ERP. Please create the vendor before syncing." |

---

## 6. Policy Enforcement Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC TIME VENDOR POLICY CHECK                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Transaction ready to sync                                      │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────────┐                                       │
│   │ Does vendor exist   │                                       │
│   │ in ERP?             │                                       │
│   └─────────────────────┘                                       │
│            │                                                     │
│     ┌──────┴──────┐                                             │
│     │             │                                              │
│    YES           NO                                              │
│     │             │                                              │
│     ▼             ▼                                              │
│   ┌───────┐   ┌─────────────────────┐                           │
│   │ SYNC  │   │ Is auto-create      │                           │
│   │       │   │ enabled?            │                           │
│   └───────┘   └─────────────────────┘                           │
│                        │                                         │
│                 ┌──────┴──────┐                                 │
│                 │             │                                  │
│                YES           NO                                  │
│                 │             │                                  │
│                 ▼             ▼                                  │
│   ┌─────────────────────┐   ┌───────────────────┐              │
│   │ Is amount ≤         │   │ BLOCK             │              │
│   │ threshold?          │   │ "Vendor does not  │              │
│   └─────────────────────┘   │  exist in ERP"    │              │
│                 │           └───────────────────┘              │
│          ┌──────┴──────┐                                        │
│          │             │                                         │
│         YES           NO                                         │
│          │             │                                         │
│          ▼             ▼                                         │
│   ┌─────────────┐   ┌───────────────────┐                       │
│   │ AUTO-CREATE │   │ BLOCK             │                       │
│   │ VENDOR      │   │ "Restricted for   │                       │
│   │ + SYNC      │   │  transactions     │                       │
│   └─────────────┘   │  over $5,000"     │                       │
│                     └───────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Key Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Per-transaction threshold** | Simpler, safer MVP — avoids complexity of cumulative tracking |
| **Sync-time enforcement** | Allows transactions to proceed normally; control at posting |
| **Explicit resolution** | No silent failures; clear blocking messages with resolution paths |
| **Finance control** | Finance makes intentional decisions for high-value/new vendors |
| **Reimbursement exclusion** | Maintains invariant: reimbursements never create ERP vendors |

---

## 8. Configuration Summary

| Policy | Auto-Create | Threshold | Behavior |
|--------|-------------|-----------|----------|
| **Full Auto** | ON | None (∞) | All new vendors auto-created |
| **Threshold** | ON | $5,000 | Auto-create below threshold, block above |
| **Manual Only** | OFF | N/A | All vendors must exist in ERP |

---

## 9. Cross-Reference Tags

For future committee sessions, this document covers:

- `#vendor-policy` — Vendor creation policy configuration
- `#threshold` — Amount-based auto-creation threshold
- `#blocking` — Sync blocking scenarios and messages
- `#resolution` — Resolution paths for blocked transactions
- `#finance-approval` — Finance-controlled vendor creation

---

*Captured by Sync Committee Intake Coordinator*  
*Session: SC-2025-12-29-001*

