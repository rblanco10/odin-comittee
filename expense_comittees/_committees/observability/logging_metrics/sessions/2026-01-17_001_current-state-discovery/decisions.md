# Session Decisions

> **Session ID**: 2026-01-17_001_current-state-discovery  
> **Type**: Discovery → Design → Implementation → Debug  
> **Status**: CLOSED (Final)

---

## Decisions Made

### Decision 1: Dashboard Taxonomy Approach

**Proposed by**: Dr. William Park (Dashboard Architect)  
**Seconded by**: Elena Vasquez (Complexity Auditor)  

**Description**: Adopt a Two-Tier + Variable-Driven approach for dashboard organization:
- Tier 1: System Overview (executive "is anything on fire?")
- Tier 2: Business Capability dashboards (Card Operations, Reimbursements, AP Payments, ERP Sync) with `$provider` variable
- Tier 2.5: Provider Health dashboard (single dashboard with `$provider` variable)
- Tier 3: Provider-specific dashboards only when truly unique needs exist

**Rationale**:
- Fewer dashboards to maintain
- Template variables provide same filtering capability
- Avoids duplication across provider dashboards

**Status**: APPROVED (Human Director confirmed direction)

---

### Decision 2: Tier 1 Redesign Approach

**Proposed by**: Dr. Alexandra Chen (Chair)  
**Seconded by**: Committee consensus

**Description**: Redesign Tier 1 from domain-centric (ERP, Payments) to business-centric (answering five critical questions):
1. Can employees spend money? (Card operations health)
2. Can employees get reimbursed? (Reimbursement health)
3. Can we pay vendors? (AP payment health)
4. Are customer ERPs in sync? (ERP sync health)
5. Which provider is broken? (Provider status)

**Rationale**:
- Current dashboard reflects technical domains, not business criticality
- Operators need to answer business questions at a glance
- Provider visibility is critical (which provider is the problem?)

**Status**: APPROVED (Human Director explicitly endorsed)

---

### Decision 3: Team Collaboration Strategy

**Proposed by**: Dr. Alexandra Chen (Chair)

**Description**: Adopt Contract-First Development approach:
1. Define observability contract (labels, metrics) TOGETHER
2. Work in parallel (logging team implements, dashboard team builds)
3. Pilot with WEX first
4. Expand to other providers

**Rationale**:
- Parallel work without wasted effort
- Contract ensures compatibility
- WEX pilot validates end-to-end

**Status**: APPROVED

---

### Decision 4: Provider/ERP Separation in Dashboard

**Proposed by**: Human Director  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Payment Providers and ERPs should be displayed in separate rows in Tier 1 dashboard:
- Row 2: Payment Providers (WEX, Marqeta, Dwolla, Checkbook)
- Row 3: ERP Integrations (NetSuite, QuickBooks, Xero, Sage)

**Rationale**:
- Payment providers and ERPs are different categories
- Different health semantics (money movement vs data sync)
- Different alert thresholds appropriate

**Status**: APPROVED (Human Director directive)

---

### Decision 5: Tier 1 Dashboard Implementation Approach

**Proposed by**: Dr. William Park (Dashboard Architect)

**Description**: Create full dashboard JSON with real Prometheus queries rather than placeholder skeleton.

**Rationale**:
- Gap analysis confirmed Prometheus metrics exist
- Full implementation allows immediate testing
- Queries can be adjusted post-deployment

**Status**: APPROVED (Human Director selected "Option A")

---

### Decision 6: Implement Reimbursement ACH Payout Logging

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. William Park (SC04 Lead)

**Description**: Implement structured Loki logging for the reimbursement ACH payout flow via Dwolla, following the approved LOGGING_STANDARDS.md patterns.

**Scope**:
- Add new event functions to `EmberReimbursements.LokiLoggingService`
- Instrument `PaymentService.create_payment/2` with structured logging
- Document new events in EVENT_TAXONOMY.md

**Discussion Summary**:
- Research found existing LokiLoggingService had payment functions that weren't being called
- Plan proposed to add batch-level events and instrument PaymentService
- Skeptic recommended keeping logging at domain level only (not duplicating in reactor)

**Challenges Raised**:
- Elena Vasquez (Complexity Auditor): Questioned duplication with reactor logging → Resolved by scoping to domain level only

**Vote**: 
- In Favor: 8 (all active members)
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

**Implementation Notes**:
- Implemented same session
- Verified against LOGGING_STANDARDS.md (11/11 checks passed)
- Grafana access documented

---

### Decision 7: Migrate Dashboard from Prometheus to Loki

**Proposed by**: Dr. Alexandra Chen (Chair)  
**Seconded by**: Dr. William Park (Dashboard Architect)

**Description**: Update Tier 1 Business Overview dashboard panels to use Loki (LogQL) queries instead of Prometheus (PromQL) queries for domains that send logs to Loki.

**Rationale**:
- Logging implementation sends to Loki via `LokiLoggingService`
- Dashboard was incorrectly configured to query Prometheus
- Prometheus metrics not being emitted for reimbursement domain

**Affected Panels**:
- Panel 2: Reimbursements gauge → Loki
- Panel 12: Dwolla (ACH) → Loki

**Status**: APPROVED AND IMPLEMENTED

---

### Decision 8: Temporary Provider Label Workaround

**Proposed by**: Dr. William Park (Dashboard Architect)

**Description**: Remove `provider="dwolla"` requirement from Dwolla panel query as temporary workaround while provider label bug is investigated.

**Rationale**:
- Logs are not receiving `provider` label despite code attempting to set it
- Workaround unblocks monitoring capability
- Proper fix requires code investigation

**Trade-off Acknowledged**:
- Cannot distinguish between Dwolla vs Checkbook payments until bug fixed
- Acceptable for now since ember_reimbursements domain primarily uses Dwolla

**Status**: APPROVED (Temporary Workaround)

---

## Pending Decisions

*None at checkpoint.*

All immediate decisions implemented. Provider label bug fix decision pending investigation.


