# Accounts Receivable Committee (AR 2.0)

> **Committee Code**: `AR-RECV`  
> **Established**: 2026-01-14  
> **Domain**: `flame_ps_ar` — Accounts Receivable 2.0

---

## Mission Statement

The AR Receivables Committee exists to achieve **world-class excellence** in Accounts Receivable functionality, governing:

- **Core AR Operations**: Receivables, Customers, Collections, Fees, Payments
- **ERP Integration**: Sage Intacct, NetSuite, QuickBooks sync
- **Legacy Alignment**: MySQL/Loopback2 compatibility
- **UI/UX Excellence**: Liquid Glass design system, LiveView surfaces

---

## Jurisdiction

### Primary Domain
```
campsite/flames/flame_ps_ar/
├── lib/flame_ps_ar/classic/       # Classic MySQL domain
│   ├── domain/                    # Core AR resources (~100)
│   ├── payments/                  # Payment resources (~62)
│   └── ...
├── lib/flame_ps_ar/ember_erp/     # ERP integration (~20)
└── lib/flame_ps_ar_web/           # LiveView surfaces
```

### Related Domains Under Advisement
- `FlamePsAr.Classic.Domain` - Receivables, Customers, Collections, Fees
- `FlamePsAr.Classic.Payments` - Autopay, Scheduled Payments, Banking
- `FlamePsAr.EmberErp` - ERP sync, Pull/Push workflows
- `FlamePsArWeb` - LiveView pages, Liquid Glass components

---

## Committee Structure

### Leadership (3 members)
| Role | Member | Responsibility |
|------|--------|----------------|
| **Chair** | Dr. Alexandra Chen | Session orchestration, decision routing |
| **Vice Chair** | Marcus Rodriguez | Cross-lifecycle coordination |
| **Parliamentarian** | Judge Helena Thornton | Governance enforcement |

### Standing Members (45 members)
- **Historians** (3): Session, pattern, and migration tracking
- **Critics & Skeptics** (8): Challenge all proposals
- **Domain Experts** (10): Receivables, Customers, Collections, Fees, Payments, ERP
- **Technical Specialists** (8): Elixir, Ash, Phoenix, Database, APIs
- **Integration Specialists** (5): ERP, Legacy, Sync, Migration
- **UI/UX Specialists** (3): LiveView, Design System, Accessibility
- **QA Specialists** (3): Testing strategy and quality
- **Clerical Staff** (2): Recording and research

### Subcommittees (15 total)
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

## Agentic System Integration

### The Bridge Pattern

This committee is designed to work **complementarily** with the Agentic system in `docs/agents/`:

```
┌─────────────────────┐                    ┌─────────────────────┐
│   AR COMMITTEE      │                    │   AGENTIC SYSTEM    │
│   (Deliberation)    │                    │   (Implementation)  │
│                     │                    │                     │
│  • Reviews          │   HANDOFF DOC      │  • Manager          │
│  • Decides          │ ─────────────────► │  • Coder            │
│  • Documents        │                    │  • Gapper           │
│  • Approves         │ ◄───────────────── │  • Architect        │
│                     │   IMPL REPORT      │                     │
└─────────────────────┘                    └─────────────────────┘
```

**Workflow:**
1. Committee deliberates on architecture/approach
2. Committee produces HANDOFF DOCUMENT
3. Manager creates prompt from handoff
4. Coder implements
5. Gapper/Architect review
6. Committee ratifies implementation

See `chair/agentic_bridge_protocol.md` for details.

---

## Key Principles

### 1. Legacy Compatibility First (CONSTITUTIONAL)
Records created by Ash MUST be readable by Loopback2. The legacy system (`roadrunner_samples/`) shares the same MySQL database.

### 2. Decimal for Money (CONSTITUTIONAL)
All financial fields MUST use Decimal, never Float. No exceptions.

### 3. Tenant Isolation (CONSTITUTIONAL)
All queries MUST include tenant (owner_id or workspace_id). Missing tenant = full table scan = BLOCKED.

### 4. State Machine Consistency (CONSTITUTIONAL)
Standard transitions: `created → active ↔ inactive`. "removed" is NOT a valid status.

### 5. Performance Budget (CONSTITUTIONAL)
- List pages: < 200ms, max 5 queries
- Detail pages: < 150ms, max 3 queries
- Violations require Subcommittee review.

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
| Bridge to Agentic | `handoff` command during session |

---

## File Structure

```
_committees/ar/receivables/
├── README.md                 # This file
├── GOVERNANCE.md             # Rules of operation
├── STATUS.md                 # Current state (auto-updated)
├── chair/                    # Chair protocols
├── members/                  # All member definitions
├── clerical/                 # Clerical staff
├── subcommittees/            # 15 specialized subcommittees
├── knowledge_base/           # Accumulated expertise
├── workflows/                # YAML workflow templates
├── handoffs/                 # Bridge documents to Agentic
└── sessions/                 # Session records
```

---

*"Excellence in Accounts Receivable is not accidental—it is the result of deliberate governance and disciplined implementation."*

