# Session Goal

> **Session ID**: 2026-01-20_001_wex-update-limits-logging  
> **Type**: Design → Implementation Planning  
> **Opened**: 2026-01-20  
> **Chair**: Dr. Alexandra Chen

---

## Primary Objective

Add Loki logging and Grafana observability for the WEX card operation for updating spending limits, following established patterns from freeze, unfreeze, and cancel operations.

## Success Criteria

- [ ] Gap analysis: Identify what logging exists vs. what's missing
- [ ] Design: Define the exact logging events to add
- [ ] Implementation plan: Create step-by-step engineering guide
- [ ] Dashboard integration: Ensure updates are visible in Grafana
- [ ] Human Director approval of plan

## Scope Boundaries

**IN SCOPE:**
- WEX virtual card `update_spending_limits` in `card_issuance.ex`
- WEX physical card `update_spending_limits` in `physical_card_issuance.ex`
- LokiLoggingService integration
- Dashboard query updates

**OUT OF SCOPE:**
- Marqeta provider (different API, different session)
- New dashboard creation (use existing Tier 2 Card Operations)
- Tempo tracing changes (already implemented in reactor)

## Expected Outputs

- [ ] Implementation plan document
- [ ] Code change specifications
- [ ] Dashboard query additions (if needed)
- [ ] Action items for engineering subcommittee

---

*Session goal approved by Chair.*
