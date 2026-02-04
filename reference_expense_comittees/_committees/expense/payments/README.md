# Ember Payments Committee

> **Committee Code**: `EXPENSE-PAY`  
> **Established**: 2026-01-05  
> **Domain**: `ember_payments` and related touchpoints in `flame_teampay_payables`

---

## Mission Statement

The Ember Payments Committee exists to achieve **world-class excellence** in every aspect of the payment infrastructure within the flame_teampay_payables project. We serve as the authoritative body for understanding, advising, and improving all payment-related systems including:

- **Provider integrations** (Checkbook, Dwolla, Marqeta, WEX Fleet)
- **Capability abstractions** (Card issuance, ACH, checks, identity verification)
- **Business domain integrations** (Expense cards, reimbursements, AP payments)
- **Operational excellence** (Webhooks, reconciliation, observability)

---

## Jurisdiction

### Primary Domain
```
campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_payments/
├── adapters/         # Provider implementations
├── capabilities/     # Capability behaviors & types
├── resources/        # Ash resources (27+)
├── services/         # Business logic orchestration (34+)
├── reactors/         # Multi-step workflows (20+)
├── webhooks/         # Webhook processing
├── observability/    # Metrics, tracing, logging
├── test_runner/      # Test infrastructure
└── workers/          # Background jobs
```

### Related Domains Under Advisement
- `ember_expense_card/` - Card expense management
- `ember_reimbursements/` - Employee reimbursements  
- `ember_ap_payments/` - Accounts payable batching
- `ember_funding/` - Funding source management
- `ember_payment_instruments/` - Payment method management

---

## Committee Structure

### Leadership (3 members)
| Role | Member | Responsibility |
|------|--------|----------------|
| **Chair** | Payment Systems Architect | Session orchestration, member activation |
| **Vice Chair** | Integration Lead | Cross-domain coordination |
| **Parliamentarian** | Process Guardian | Protocol enforcement |

### Standing Members (55+ members)
- **Historians** (3): Session, pattern, and technical debt tracking
- **Critics & Skeptics** (8): Challenge all assumptions
- **Domain Experts** (15): Payments, cards, identity, reconciliation
- **Provider Specialists** (4): Checkbook, Dwolla, Marqeta, WEX
- **Technical Specialists** (7): Elixir, Ash, Phoenix, APIs, databases
- **Architecture Specialists** (5): Patterns, resilience, multi-tenancy
- **Business Domain Experts** (5): Expense, reimbursements, AP
- **Compliance Specialists** (3): PCI, regulations, privacy
- **QA Specialists** (4): API, integration, webhook, load testing

### Clerical Staff (3)
- **Recording Clerk**: Session transcription
- **Research Clerk**: Information gathering
- **Artifacts Clerk**: Document management

### Subcommittees (18 total)
See `subcommittees/` for detailed charters.

---

## Session Protocol

### Opening a Session
```
1. Chair declares session OPEN with goal statement
2. Chair activates relevant members based on goal
3. Parliamentarian confirms quorum (minimum 5 members)
4. Recording Clerk begins transcript
```

### During Session
```
- All speakers MUST announce themselves: "This is [Name], [Role]..."
- Handoffs MUST be explicit: "I yield to [Name] for [reason]"
- Research MUST be declared: "I am researching [topic] in [location]"
- Critics rotate through challenges at regular intervals
```

### Closing a Session
```
1. Session Historian summarizes decisions
2. Action items catalogued
3. Artifacts filed in session folder
4. Chair declares session CLOSED
5. STATUS.md updated with current state
```

---

## Human Director Integration

The Human Director serves as a special committee member with elevated privileges:

- **Sets session objectives** - Defines what the committee should accomplish
- **Provides business context** - Shares requirements not visible in code
- **Redirects discussions** - Can refocus the committee at any time
- **Approves decisions** - Major architectural changes require Human approval
- **Override authority** - Can override committee recommendations

The Chair primarily interfaces with the Human Director, translating their requests into committee actions and reporting back consolidated findings.

---

## Key Principles

### 1. Rigor Over Speed
Every proposal is stress-tested by skeptics. We don't rush to conclusions.

### 2. Code-Grounded Knowledge
All documentation references actual code locations and patterns found in the codebase.

### 3. Historical Awareness
Historians ensure past decisions inform future direction. We don't repeat mistakes.

### 4. Cross-Functional Perspective
No decision is made without considering security, scalability, testing, and business impact.

### 5. Transparent Deliberation
All discussions are recorded. Disagreements are documented alongside decisions.

---

## Quick Reference

| Action | Command/Location |
|--------|------------------|
| View current state | `STATUS.md` |
| Open new session | Chair creates folder in `sessions/` |
| Find a member | `members/roster.md` |
| Convene subcommittee | `subcommittees/SC##_name/` |
| Research a topic | `knowledge_base/` |
| Review past decisions | `sessions/YYYY-MM-DD_###_code/decisions.md` |

---

## File Structure

```
_committees/expense/payments/
├── README.md                 # This file
├── GOVERNANCE.md             # Rules of operation
├── STATUS.md                 # Current state (auto-updated)
├── chair/                    # Chair protocols
├── members/                  # All member definitions
├── clerical/                 # Clerical staff
├── subcommittees/            # 18 specialized subcommittees
├── knowledge_base/           # Accumulated expertise
└── sessions/                 # Session records
```

---

*"Excellence in payments is not an accident—it is the result of sustained, rigorous deliberation."*
