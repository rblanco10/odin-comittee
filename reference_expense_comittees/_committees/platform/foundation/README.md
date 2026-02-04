# Platform Foundation Committee

> **Committee Code**: `PLATFORM-FOUND`  
> **Established**: 2026-01-08  
> **Domain**: Ember Platform Architecture, Governance, and Standards

---

## Mission Statement

The Platform Foundation Committee exists to **build, govern, and maintain** the Ember Platform — a world-class Elixir umbrella application that powers Accounts Receivable, Accounts Payable, Expense Management, and Treasury operations.

We are the authoritative body for:
- **Architectural decisions** affecting the platform structure
- **Conventions and standards** for code organization
- **Tier classification** of applications (core, infra, domain, product, web)
- **Dependency governance** ensuring proper boundaries
- **Knowledge stewardship** documenting patterns and decisions
- **Onboarding guidance** for developers joining the platform

---

## Jurisdiction

### Primary Domain
```
projects/elixir/ember_platform/
├── apps/
│   ├── core_*/           # Tier 1: Pure libraries
│   ├── infra_*/          # Tier 2: Infrastructure services
│   ├── domain_*/         # Tier 3: Shared business logic
│   ├── product_*/        # Tier 4: Customer-facing products
│   └── web_*/            # Tier 5: Phoenix web applications
├── config/
└── mix.exs
```

### Scope of Authority
- Architecture and structure of all umbrella apps
- Naming conventions and tier classification
- Dependency rules and enforcement
- Migration from legacy `flame_teampay_payables`
- Cross-product integration patterns
- Release and deployment strategies

### Out of Scope
- Day-to-day development within individual apps (delegated to product committees)
- Business logic decisions within products
- Provider-specific implementations (delegated to specialized committees)

---

## Committee Structure

### Leadership (3 members)
| Role | Member | Responsibility |
|------|--------|----------------|
| **Chair** | Chief Platform Architect | Session orchestration, architectural decisions |
| **Vice Chair** | Integration Lead | Cross-app coordination, migration oversight |
| **Parliamentarian** | Standards Guardian | Convention enforcement, governance interpretation |

### Standing Members (42 members)
- **Historians** (3): Session, pattern, and migration tracking
- **Critics & Skeptics** (8): Challenge architectural proposals
- **Tier Specialists** (5): One expert per tier (core, infra, domain, product, web)
- **Domain Experts** (4): AR, AP, Expense, Treasury
- **Technical Specialists** (7): Elixir, Ash, Umbrella, Dependencies, Deployment
- **Infrastructure Specialists** (6): Payments, ERP, Identity, Communications
- **Compliance & Quality** (4): Standards, API, Testing
- **Clerical Staff** (3): Recording, Research, Artifacts

### Subcommittees (8 total)
| Code | Subcommittee | Focus |
|------|--------------|-------|
| SC01 | Tier Governance | Tier classification, dependency rules |
| SC02 | Product: Receivables | AR architecture and patterns |
| SC03 | Product: Payables | AP architecture and patterns |
| SC04 | Product: Expense | Expense architecture and patterns |
| SC05 | Infrastructure | Shared services architecture |
| SC06 | Migration | Legacy migration strategy |
| SC07 | Testing | Test strategy across umbrella |
| SC08 | Deployment | Release and deployment patterns |

---

## Core Principles

### 1. Tier Discipline
Every app belongs to exactly one tier. Tier determines naming, dependencies, and responsibilities.

### 2. Downward Dependencies Only
Higher tiers depend on lower tiers, never the reverse. Products never depend on other products.

### 3. Explicit Over Implicit
Naming conventions make architecture visible. `infra_payments` immediately communicates its role.

### 4. Shared Infrastructure
Products share infrastructure services. No duplicating payment processing or ERP integrations.

### 5. Knowledge Preservation
All architectural decisions are documented. Future developers understand not just what, but why.

---

## The 5-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 5: WEB (web_*)                                            │
│  Phoenix applications, HTTP/LiveView                            │
├─────────────────────────────────────────────────────────────────┤
│  TIER 4: PRODUCTS (product_*)                                   │
│  Customer-facing applications: AR, AP, Expense, Treasury        │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3: DOMAIN (domain_*)                                      │
│  Shared business logic: Coding, Approvals, Audit, Bulk          │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2: INFRASTRUCTURE (infra_*)                               │
│  Shared services: Workspaces, Payments, ERP, Identity           │
├─────────────────────────────────────────────────────────────────┤
│  TIER 1: CORE (core_*)                                          │
│  Pure libraries: Types, Auth, Behaviors, Telemetry              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Human Director Integration

The Human Director serves as a special committee member with elevated privileges:

- **Sets strategic direction** — Defines product priorities and platform goals
- **Approves major decisions** — Architectural changes require Human approval
- **Provides business context** — Shares requirements not visible in code
- **Override authority** — Can override committee recommendations

The Chair interfaces with the Human Director, translating requests into committee actions and reporting findings.

---

## Session Types

| Type | Purpose | Typical Activation |
|------|---------|-------------------|
| **Architecture Review** | Evaluate proposed structural changes | Full committee |
| **Tier Classification** | Decide app tier placement | Tier specialists + critics |
| **Convention Refinement** | Update naming/pattern standards | Technical specialists |
| **Migration Planning** | Plan legacy migration steps | Migration subcommittee |
| **Onboarding** | Guide new developers | Relevant specialists |

---

## Quick Reference

| Action | Command/Location |
|--------|------------------|
| View current state | `STATUS.md` |
| Find a member | `members/roster.md` |
| Convene subcommittee | `subcommittees/SC##_name/` |
| Research architecture | `knowledge_base/architecture/` |
| Review past decisions | `sessions/YYYY-MM-DD_###_code/decisions.md` |
| Check naming conventions | `knowledge_base/architecture/naming_conventions.md` |
| Check tier rules | `knowledge_base/tiers/` |

---

## File Structure

```
_committees/platform/foundation/
├── README.md                 # This file
├── GOVERNANCE.md             # Rules of operation
├── STATUS.md                 # Current state (auto-updated)
├── chair/                    # Chair protocols
├── members/                  # All member definitions
├── subcommittees/            # 8 specialized subcommittees
├── knowledge_base/           # Accumulated expertise
└── sessions/                 # Session records
```

---

*"A strong foundation enables infinite possibilities; a weak one guarantees eventual collapse."*
