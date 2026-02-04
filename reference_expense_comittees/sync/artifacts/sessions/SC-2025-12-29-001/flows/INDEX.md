# Flow Documentation Index

> **Session:** SC-2025-12-29-001  
> **Total Flows:** 14  
> **Status:** All Documented

---

## Overview

These 14 flows comprehensively cover the 3-part product requirements:
- **Part 1:** Auto Sync (10 flows)
- **Part 2:** Manual Sync (8 flows)
- **Part 3:** Vendor Auto-Creation Policy (5 flows)

---

## Card Transaction Flows (6)

| Flow | Document | Period | Vendor | Key Behavior |
|------|----------|--------|--------|--------------|
| 1 | [FLOW-01-CARD-EXISTING-VENDOR-OPEN.md](./FLOW-01-CARD-EXISTING-VENDOR-OPEN.md) | Open | Exists | Happy path - push Bill + Payment |
| 2 | [FLOW-02-CARD-NEW-VENDOR-BELOW-THRESHOLD.md](./FLOW-02-CARD-NEW-VENDOR-BELOW-THRESHOLD.md) | Open | New (below) | Auto-create vendor, then push |
| 3 | [FLOW-03-CARD-NEW-VENDOR-ABOVE-THRESHOLD.md](./FLOW-03-CARD-NEW-VENDOR-ABOVE-THRESHOLD.md) | Open | New (above) | **BLOCKED** - threshold exceeded |
| 4 | [FLOW-04-CARD-CLOSED-PERIOD-FALLBACK.md](./FLOW-04-CARD-CLOSED-PERIOD-FALLBACK.md) | Closed | Exists | Post to next open period |
| 5 | [FLOW-05-CARD-NEW-VENDOR-CLOSED-PERIOD.md](./FLOW-05-CARD-NEW-VENDOR-CLOSED-PERIOD.md) | Closed | New (below) | ✅ **COMPLETE** - Auto-create + period fallback |
| 6 | [FLOW-06-CARD-AUTO-CREATE-DISABLED.md](./FLOW-06-CARD-AUTO-CREATE-DISABLED.md) | Open | New | ✅ **COMPLETE** - auto-create disabled |

---

## Reimbursement Flows (3)

| Flow | Document | Period | Vendor | Key Invariant |
|------|----------|--------|--------|---------------|
| 7 | [FLOW-07-REIMBURSEMENT-EXISTING-VENDOR.md](./FLOW-07-REIMBURSEMENT-EXISTING-VENDOR.md) | Open | Exists | No vendor bill; payment to employee |
| 8 | [FLOW-08-REIMBURSEMENT-NEW-VENDOR.md](./FLOW-08-REIMBURSEMENT-NEW-VENDOR.md) | Open | New | **NO ERP vendor created** |
| 9 | [FLOW-09-REIMBURSEMENT-CLOSED-PERIOD.md](./FLOW-09-REIMBURSEMENT-CLOSED-PERIOD.md) | Closed | Any | Period fallback |

---

## Edit & Sync Flows (4)

| Flow | Document | Period | Direction | Key Behavior |
|------|----------|--------|-----------|--------------|
| 10 | [FLOW-10-ERP-EDIT-BIDIRECTIONAL.md](./FLOW-10-ERP-EDIT-BIDIRECTIONAL.md) | Open | ERP → Teampay | Bi-directional coding sync |
| 11 | [FLOW-11-ERP-EDIT-CLOSED-NO-SYNC.md](./FLOW-11-ERP-EDIT-CLOSED-NO-SYNC.md) | Closed | ERP only | ERP authoritative, no sync back |
| 12 | [FLOW-12-TEAMPAY-EDIT-BLOCKED.md](./FLOW-12-TEAMPAY-EDIT-BLOCKED.md) | Closed | Blocked | Teampay edits blocked |
| 13 | [FLOW-13-MANUAL-SYNC-TRIGGER.md](./FLOW-13-MANUAL-SYNC-TRIGGER.md) | Any | Teampay → ERP | Manual push via UI button |

---

## Resolution Flows (1)

| Flow | Document | Trigger | Key Behavior |
|------|----------|---------|--------------|
| 14 | [FLOW-14-RESOLUTION-VENDOR-RETRY.md](./FLOW-14-RESOLUTION-VENDOR-RETRY.md) | After blocking | Vendor created in ERP → retry sync |

---

## Gap Summary

### Critical Gaps (🔴)

| Gap ID | Issue | Flows Affected |
|--------|-------|----------------|
| GAP-PERIOD-001 | Period validation missing in push reactors | 1, 4, 5, 9 |
| GAP-VENDOR-001 | Vendor policy check missing in push reactor | 2, 3, 5, 6 |
| GAP-UI-001..005 | Manual sync buttons missing | 1, 7, 13 |
| GAP-BIDI-001 | Bi-directional sync not implemented | 10, 11 |

### High Priority Gaps (🟠)

| Gap ID | Issue | Flows Affected |
|--------|-------|----------------|
| GAP-PERIOD-002 | Closed period edit blocking | 12 |
| GAP-PERIOD-003 | Correct trandate vs postingperiod | 4, 5, 9 |
| GAP-VENDOR-002 | Blocking message UI | 3, 6 |
| GAP-UI-006 | Blocked status display | 3, 6, 14 |

### Medium Priority Gaps (🟡)

| Gap ID | Issue | Flows Affected |
|--------|-------|----------------|
| GAP-VENDOR-003 | Verify reimbursement skips vendor creation | 8 |
| GAP-BIDI-002 | ERP-originated audit flag | 10 |
| GAP-UI-007 | Vendor availability indicator | 14 |

---

## Requirements Traceability

### Part 1: Auto Sync

| Req Flow | Covered By |
|----------|------------|
| Flow 1: Card → Existing | Flow 1 |
| Flow 2: Reimbursement → Existing | Flow 7 |
| Flow 3: Card → New Vendor | Flows 2, 3 |
| Flow 4: Reimbursement → New Vendor | Flow 8 |
| Flow 5: ERP Edit (Open) | Flow 10 |
| Flow 6: Card → Closed Period | Flow 4 |
| Flow 7: Reimbursement → Closed | Flow 9 |
| Flow 8: Card → New + Closed | Flow 5 |
| Flow 9: ERP Edit (Closed) | Flow 11 |
| Flow 10: Teampay Edit Blocked | Flow 12 |

### Part 2: Manual Sync

| Req Flow | Covered By |
|----------|------------|
| Flows 1-4: Same as Auto | Flows 1-8 + 13 |
| Flow 5: ERP Edit → Next Sync | Flows 10, 13 |
| Flows 6-8: Closed period | Flows 4, 9, 11 |

### Part 3: Vendor Policy

| Req Flow | Covered By |
|----------|------------|
| A1: Below Threshold | Flow 2 |
| A2: Above Threshold | Flow 3 |
| A3: Resolution | Flow 14 |
| B1: Existing (Disabled) | Flow 1 |
| B2: New (Disabled) | Flow 6 |

---

*Sync Committee Session SC-2025-12-29-001*

