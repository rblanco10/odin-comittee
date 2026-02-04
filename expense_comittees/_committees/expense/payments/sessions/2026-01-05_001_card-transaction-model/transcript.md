# Session Transcript

> **Session ID**: 2026-01-05_001_card-transaction-model  
> **Topic**: Card Transaction Model Architecture  
> **Started**: 2026-01-05  
> **Closed**: 2026-01-06

---

## Session Opening

**Victoria Sterling, Chair**: This session is now called to order. Session ID: 2026-01-05_001_card-transaction-model.

The Human Director has requested clarity on our card transaction model, specifically:
- What is a "primary transaction"?
- How do Marqeta events relate to each other?
- Is "transaction" overloaded?
- What is industry standard?

**Activated Members:**
- David Kim (PS003) - Marqeta Specialist
- Marcus Chen (DC001) - Card Issuance Expert
- Samantha Price (DC002) - Authorization Expert
- Kevin O'Brien (DC003) - Transaction Expert
- Dr. William Chang (AS001) - Capability Patterns Expert
- Gregory Stein (C006) - Consistency Challenger
- Dr. Raymond Walsh (C004) - Complexity Critic
- Dr. Henry Blackwood (H001) - Session Historian
- Catherine Wells (H002) - Pattern Historian
- Emily Watson (CL001) - Recording Clerk
- Carlos Mendez (CL002) - Research Clerk

**Assigned Critics:**
- Gregory Stein - Terminology consistency
- Dr. Raymond Walsh - Complexity of the model

Recording Clerk, begin transcript. Kevin O'Brien, please lead us off with an industry overview.

---

## Human Director Transition

*Note: At this point, a new Human Director took over the session. They requested full orientation before proceeding with the original topic.*

---

## Orientation Phase

**Victoria Sterling, Chair**: Acknowledged. New Human Director requires orientation. Adjusting session to provide full context.

### Project Orientation Provided:
1. **Ashwood Platform** — Distributed Elixir monorepo for fintech applications
2. **Campfire Metaphor** — flames (services), kindling (libraries), pit (infrastructure)
3. **flame_teampay_payables** — Corporate expense management application
4. **ember_payments** — Payment infrastructure layer (committee jurisdiction)
5. **Committee Role** — Governs payment provider integrations, card issuance, ACH, checks

---

## Deliberation: Card Transaction Model

### Turn 1: Kevin O'Brien (Transaction Expert)
- Explained industry standard card payment lifecycle
- Authorization → Capture → Refund sequence
- Authorization amount may differ from capture (e.g., tips)

### Turn 2: David Kim (Marqeta Specialist)
- Explained Marqeta webhook event types
- `authorization.created`, `transaction.clearing`, `refund`
- `preceding_related_transaction_token` links events together

### Turn 3: Samantha Price (Authorization Expert)
- Explained authorization creates TWO records: CardAuthorization + CardTransaction
- CardAuthorization = decision log (approved/declined)
- CardTransaction (type: :authorization) = placeholder for expected capture

### Turn 4: Kevin O'Brien (Transaction Expert)
- Explained capture (settlement/clearing) processing
- Creates new CardTransaction with type: :capture
- Links to authorization via parent_transaction_id

### Turn 5: Marcus Chen (Card Issuance Expert)
- Provided context on CardIssuance → CardTransaction relationship
- Explained two-layer architecture (ember_payments / ember_expense_card)

### Turn 6: Dr. William Chang (Capability Patterns Expert)
- Explained wrapper pattern architecture
- Provider layer (CardTransaction) wrapped by business layer (ExpenseCardTransaction)
- Defined `is_primary_transaction` = capture = the "real" expense

### Turn 7: Catherine Wells (Pattern Historian)
- Documented transaction grouping pattern (transaction_group_id)
- Documented provider/business separation pattern

### Turn 8: Gregory Stein (Consistency Challenger)
- Raised terminology concern: "transaction" used in multiple contexts
- Provided disambiguation table
- Concluded: terminology follows industry standards, is internally consistent

### Turn 9: Dr. Raymond Walsh (Complexity Critic)
- Assessed architecture complexity
- Concluded: complexity is necessary and appropriate for domain
- Validated two-layer design

### Turn 10: Dr. Henry Blackwood (Session Historian)
- Synthesized findings into complete mental model
- Established glossary of terms

---

## Session Conclusion

**Victoria Sterling, Chair**: The Human Director has requested formal documentation and session closure.

**Decisions Made:**
1. Terminology: Accepted as adequate
2. Two-resource model: Accepted as sound architecture
3. `is_primary_transaction` naming: Accepted as-is

**Action Items:** None

**Session Outcome:** Educational objectives achieved. New Human Director oriented. Architecture validated.

---

## Closing Statement

**Victoria Sterling, Chair**: This session 2026-01-05_001_card-transaction-model is now CLOSED.

**Decisions Made**: 3  
**Action Items**: 0  
**Follow-up Sessions Needed**: None required

The record has been finalized by the Recording Clerk.
All artifacts have been filed by the Artifacts Clerk.
STATUS.md will be updated to reflect current state.

Thank you to all participating members.

---

*Transcript finalized by Emily Watson, Recording Clerk*  
*Approved by Victoria Sterling, Chair*
