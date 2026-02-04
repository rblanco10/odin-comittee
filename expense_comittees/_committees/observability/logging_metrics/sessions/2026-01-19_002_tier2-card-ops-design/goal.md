# Session Goal

> **Session ID**: 2026-01-19_002_tier2-card-ops-design  
> **Type**: Design → Implementation  
> **Status**: CLOSED

---

## Primary Objective

Design and implement a world-class Tier 2 Card Operations dashboard that is genuinely helpful to operators investigating card issuance, activation, and lifecycle management issues.

---

## Success Criteria

- [x] Design question-driven dashboard layout (answers urgent questions first)
- [x] Define all panels with LogQL queries
- [x] Include provider comparison capability
- [x] Include error spotlight for investigation
- [x] Include live log view for drill-down
- [x] Implement dashboard JSON file
- [x] Document dashboard in session artifacts

---

## Scope Boundaries

**IN SCOPE**:
- Card issuance operations
- Card activation operations
- Card freeze/unfreeze operations
- Card cancellation operations
- Card controls/limits updates
- Provider comparison (WEX, Marqeta)
- Error investigation capabilities

**OUT OF SCOPE**:
- Payment initiation (separate domain concern)
- KYB operations (could be separate dashboard)
- Alert rule creation (future session)

---

## Expected Outputs

- [x] `tier2-card-operations.json` dashboard file
- [x] Session decision record
- [x] Design documentation

---

## Context

Human Director requested a Tier 2 Card Operations dashboard that would:
1. Be genuinely helpful to operators
2. Impress leadership with professional quality
3. Answer questions in order of urgency
4. Support provider filtering and comparison

---

## Related Sessions

- 2026-01-17_001_current-state-discovery (Dashboard taxonomy approved)
- 2026-01-19_001_marqeta-loki-migration (Card operations logging completed)


