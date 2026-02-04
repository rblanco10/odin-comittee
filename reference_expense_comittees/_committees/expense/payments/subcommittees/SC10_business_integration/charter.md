# SC10: Business Integration Subcommittee

> **Code**: SC10  
> **Focus**: Cross-domain integration with business layers

---

## Charter

### Purpose
Ensure ember_payments integrates properly with consuming business domains.

### Scope
- ember_expense_card integration
- ember_reimbursements integration
- ember_ap_payments integration
- Cross-domain contracts

---

## Members

**Lead**: Adrian Cross (Vice Chair - Integration Lead)

**Core Members**:
- Sarah Mitchell (Expense Management Expert)
- Daniel Cooper (Reimbursement Expert)
- Karen Walsh (AP Payments Expert)
- Priya Sharma (Integration Pessimist)

---

## Integration Points

```
ember_expense_card → CardIssuance
ember_reimbursements → PayoutBatch/PayoutItem
ember_ap_payments → PayoutBatch/PayoutItem
```

---

*"Integration is where domains meet; clarity prevents chaos."*
