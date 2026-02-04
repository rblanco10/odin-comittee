# Action Items

**Session**: 2026-01-15_004_transaction-card-not-found-retry

---

## AI-009: Restore ExpenseCard Record for Adele Vance (0364)

**Assigned To**: Human Director  
**Priority**: High  
**Status**: Pending

**Description**: During testing, the ExpenseCard record linked to CardIssuance `50a5a182-af53-4b46-8f1c-00f604596443` was deleted. The CardIssuance was restored, but the ExpenseCard needs to be recreated for the card to appear in the UI.

**Action**: Recreate ExpenseCard with `card_issuance_id` pointing to the restored CardIssuance.
