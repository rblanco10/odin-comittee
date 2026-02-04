# Session Goal

**Session ID**: 2026-01-15_004_transaction-card-not-found-retry  
**Opened**: 2026-01-15  
**Type**: Testing Session

---

## Primary Objective

Test and verify the "Transaction Card Not Found (Retry)" flow in Marqeta webhook processing.

---

## Success Criteria

- [ ] Explain the flow clearly with visual diagrams
- [ ] Understand the race condition scenario
- [ ] Design and execute test to trigger the retry behavior
- [ ] Verify retry mechanism works correctly
- [ ] Document findings

---

## Scope Boundaries

**IN SCOPE**:
- Marqeta transaction.created webhook processing
- Card not found retry logic
- Webhook processing order race conditions
- The :retry_later mechanism

**OUT OF SCOPE**:
- Other providers (Checkbook, Dwolla, WEX)
- Non-transaction webhook types
- Webhook signature validation

---

## Expected Outputs

- [ ] Clear understanding of the flow (documented in transcript)
- [ ] Successful test execution
- [ ] Verification of retry behavior
