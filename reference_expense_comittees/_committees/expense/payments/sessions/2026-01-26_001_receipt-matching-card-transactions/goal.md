# Session Goal

**Session**: 2026-01-26_001_receipt-matching-card-transactions  
**Opened**: 2026-01-26  
**Human Director**: Present

---

## Primary Objective

Document and understand the receipt matching feature for card transactions in ashwood, with the goal of later building and documenting an equivalent feature in teampay.

## Success Criteria

- [ ] Document the complete receipt matching architecture
- [ ] Identify all key components (reactors, services, resources)
- [ ] Understand the matching algorithm and confidence scoring
- [ ] Document the auto-match flow vs manual match flow
- [ ] Identify integration points between domains (EmberExpenseReceipt, EmberExpenseCard, EmberDocumentIntake)
- [ ] Create a knowledge base entry for receipt matching

## Scope Boundaries

**IN SCOPE:**
- Receipt matching for **card transactions** (ExpenseCardTransaction)
- Auto-match flow triggered by FastProcessDocumentReactor
- Manual match flow via LinkTransactionReceiptReactor
- Match computation and confidence scoring
- Receipt upload and processing pipeline

**OUT OF SCOPE:**
- Receipt matching for **reimbursement items** (separate domain, already documented)
- Three-way matching (PO ↔ Invoice ↔ Receipt) in ember_ap_matching
- ERP sync of receipt data
- Building the teampay implementation (future session)

## Expected Outputs

- [ ] Architecture diagram showing components and data flow
- [ ] Documentation of matching algorithm
- [ ] Knowledge base entry: `knowledge_base/flows/receipt_matching_card_transactions.md`
- [ ] Gap analysis for teampay implementation
