# Session Goal: WEX Fleet Flows Review

> **Session ID**: 2026-01-08_002_wex-flows-review  
> **Opened**: 2026-01-08  
> **Requested By**: Human Director

---

## Primary Objective

Comprehensively map and document ALL flows that touch the WEX Fleet provider within `ember_payments`, including every reactor, service, capability, and webhook that interacts with WEX even a single time. Identify what needs to be completed for each flow and provide a complete rundown of the provider's integration status.

---

## Success Criteria

- [ ] Complete inventory of all WEX-touching flows identified
- [ ] Each flow documented with current implementation status
- [ ] Gaps and missing pieces identified for each flow
- [ ] Production readiness assessment for each flow
- [ ] Clear action items for completion
- [ ] Understanding of dual-protocol architecture (REST + SOAP)

---

## Scope Boundaries

### IN SCOPE
- All WEX adapter capabilities and operations
- All reactors that invoke WEX (8 identified)
- All services that interact with WEX (12 identified)
- All webhook handlers for WEX events
- Virtual card flows (Purchase Log / Merchant Log API)
- Physical card flows (Card Management API)
- SOAP operations (AccountService, TransactionInquiry, etc.)
- Authentication flows (OAuth, Basic Auth, WS-Security)
- Trust Nothing webhook reconciliation pattern
- Business integration touchpoints

### OUT OF SCOPE
- Other providers (Checkbook, Dwolla, Marqeta) unless for comparison
- UI implementation details
- Non-payment-related code

---

## Expected Outputs

1. **Flow Inventory**: Complete list of all WEX flows (42 flows identified)
2. **Flow Status Matrix**: Implementation status for each flow
3. **Gap Analysis**: What's missing for production readiness
4. **Protocol Map**: REST vs SOAP operations breakdown
5. **Recommendations**: Prioritized action items

---

## Flow Architecture (Updated per Director Feedback)

WEX is treated as **TWO SEPARATE PROVIDERS** due to different APIs and authentication:

| Section | Flows | API | Auth |
|---------|-------|-----|------|
| **WEX-V** (Virtual) | 21 | Merchant Log | Basic Auth |
| **WEX-P** (Physical) | 21 | Card Management | OAuth 2.0 |
| **Total** | **42** | | |

### Key Corrections Applied:
- Each flow path is its own distinct flow (not nested branches)
- Transaction webhooks (event.type) separated from Authorization webhooks (MessageType)
- Physical card ordering paths each documented separately
- PLASTIC vs STATIC card ordering distinguished

---

## Activated Subcommittees

- **SC17**: WEX Fleet Deep Dive (Primary)
- **SC02**: Card Operations
- **SC12**: Reactor Workflows
- **SC05**: Webhook Processing
- **SC11**: Capability Architecture
- **SC01**: Provider Integration (cross-provider patterns)
- **SC13**: Credential Management (dual-auth complexity)

---

*"WEX is two APIs in a trench coat; we make them work as one."*

