# Session Decisions

**Session**: 2026-01-15_004_transaction-card-not-found-retry

---

## Decision 1: Card Not Found Retry Flow Verified

**Proposed by**: David Kim (Marqeta Expert)  
**Seconded by**: Victoria Sterling (Chair)

**Description**: The "Transaction Card Not Found (Retry)" flow has been tested and verified working. When a transaction/authorization webhook arrives before the card exists in the database, the system correctly returns `:retry_later` and Oban reschedules the webhook for later processing.

**Vote**: Unanimous approval

**Result**: ✅ VERIFIED - Flow works as designed
