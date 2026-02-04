# Action Items

> **Session**: 2026-01-20_002_card-issuance-detailed-logging

---

## AI-044: Implement Card Issuance Detailed Logging

| Field | Value |
|-------|-------|
| **ID** | AI-044 |
| **Owner** | Engineering Subcommittee |
| **Priority** | 🟠 Medium |
| **Status** | Pending |
| **Created** | 2026-01-20 |

**Description**: 
Implement the card issuance detailed logging as specified in `IMPLEMENTATION_PLAN.md`.

**Scope**:
1. Add 5 new logging functions to `EmberExpenseCard.LokiLoggingService`
2. Instrument 5 gap steps in `CardIssuanceReactor`
3. Add step timing (`step_duration_ms`) to all events
4. Verify events appear in Grafana Live Events

**Files to Modify**:
- `lib/flame_teampay_payables/ember_expense_card/observability/services/loki_logging_service.ex`
- `lib/flame_teampay_payables/ember_expense_card/reactors/card_issuance_reactor.ex`

**Acceptance Criteria**:
- [ ] All 5 new logging functions implemented
- [ ] All 5 gap steps instrumented
- [ ] Step timing added to all events
- [ ] No compilation errors
- [ ] Events visible in Grafana Loki

**Reference**: 
- DEC-018: Add Step-Level Logging
- DEC-019: Add Step Timing
- `artifacts/IMPLEMENTATION_PLAN.md`

