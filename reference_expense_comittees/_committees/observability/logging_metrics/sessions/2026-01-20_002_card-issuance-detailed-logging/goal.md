# Session Goal

> **Session**: 2026-01-20_002_card-issuance-detailed-logging  
> **Type**: Discovery → Design → Implementation  
> **Opened**: 2026-01-20  
> **Chair**: Dr. Alexandra Chen

---

## Primary Objective

Analyze the complete card issuance flow across both layers (Business Layer and Payment Layer), identify logging gaps at each step, and implement detailed step-by-step logging so that any failure can be immediately pinpointed to the exact step that failed.

---

## Success Criteria

- [ ] Map complete card issuance flow with all steps documented
- [ ] Identify all steps currently lacking Loki logging
- [ ] Design logging events for each missing step
- [ ] Implement step-timing to identify slow steps
- [ ] Ensure dashboard can display step-level progress
- [ ] Enable failure pinpointing at granular step level

---

## Scope Boundaries

### IN SCOPE
- CardIssuanceReactor (Business Layer) - all 11 steps
- IssueCardReactor (Payment Layer) - all 4 steps
- LokiLoggingService event additions for both layers
- Dashboard queries to visualize step-level data
- Step timing and duration tracking

### OUT OF SCOPE
- Approval workflow logging (CompleteApprovalReactor)
- Notification delivery logging (PrepareDeliveryReactor)
- Physical card tracking/activation flows
- ERP integration flows

---

## Expected Outputs

1. Complete flow diagram with all steps mapped
2. Gap analysis: steps without logging
3. New LokiLoggingService functions
4. Updated dashboard queries (LogQL)
5. Implementation in reactors

---

## Context

Previous sessions (2026-01-19) established:
- Loki logging for card operations (issuance start/end, provider request/response)
- Event naming convention: `ember_payments_card_{operation}_{phase}`
- Status as a Loki label for end events
- Tier 2 Card Operations dashboard

This session extends that work to provide **granular step-level visibility**.

---

## Related Decisions

- DEC-012: Consistent Error Logging (all reactors must log error end events)
- DEC-013: Error Helper Function (log + metric + trace in one call)
- DEC-014: Enriched Data Builders (error_reason, workspace_id, entity_id)
