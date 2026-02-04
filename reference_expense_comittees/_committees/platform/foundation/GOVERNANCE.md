# Governance Rules

> **Document Type**: Constitutional  
> **Authority**: Binding on all committee operations  
> **Established**: 2026-01-08

---

## Article I: Committee Composition

### Section 1.1: Membership Classes

1. **Leadership Members** (Chair, Vice Chair, Parliamentarian)
   - Permanent standing in all sessions
   - Authority to activate/deactivate other members
   - Responsible for session management

2. **Standing Members** (Specialists, experts, critics)
   - Activated by Chair based on session needs
   - May request activation for relevant topics
   - Full speaking and deliberation rights when active

3. **Clerical Staff** (Clerks)
   - Non-voting operational support
   - Always present during sessions
   - Responsible for records and research

4. **Human Director** (Special Member)
   - Override authority on all decisions
   - Sets strategic direction
   - May speak at any time without yielding

### Section 1.2: Quorum Requirements

| Session Type | Minimum Members |
|--------------|-----------------|
| Full Committee | 7 (including Chair + 2 Critics) |
| Subcommittee | 3 (including lead) |
| Architecture Decision | 9 (including 3 Tier Specialists) |
| Emergency | 3 (Chair + 2 relevant experts) |

---

## Article II: Architectural Decision Making

### Section 2.1: Decision Categories

| Category | Description | Approval Required |
|----------|-------------|-------------------|
| **Tier Classification** | Assigning an app to a tier | Subcommittee + Chair |
| **New App Creation** | Adding a new app to the umbrella | Full Committee |
| **Dependency Change** | Adding/removing cross-app dependency | Tier Specialists + Critics |
| **Convention Change** | Modifying naming or patterns | Full Committee + Human Director |
| **Migration Decision** | Legacy migration approach | Migration Subcommittee + Chair |

### Section 2.2: Tier Classification Rules

Any new application MUST be classified into exactly one tier:

| Tier | Prefix | Criteria |
|------|--------|----------|
| **Core** | `core_` | Pure Elixir, no database, no external APIs, no side effects |
| **Infrastructure** | `infra_` | Has database tables AND/OR external API integrations, shared across products |
| **Domain** | `domain_` | Business logic shared by multiple products, has database tables |
| **Product** | `product_` | Customer-facing product, specific business domain |
| **Web** | `web_` | Phoenix application, HTTP/LiveView layer |

### Section 2.3: Dependency Rules (Constitutional)

These rules are **inviolable** without Human Director override:

1. **Downward Only**: Tier N may depend on Tier N-1, N-2, etc. Never upward.
2. **No Horizontal Products**: `product_*` apps may NOT depend on other `product_*` apps.
3. **Core is Pure**: `core_*` apps may NOT have database or external API dependencies.
4. **Infra is Shared**: Multiple products MUST share `infra_*` services, not duplicate them.

```
ALLOWED:
  web_internal → product_receivables → domain_coding → infra_workspaces → core_types

FORBIDDEN:
  product_receivables → product_payables  (horizontal product dependency)
  infra_payments → domain_coding          (upward dependency)
  core_types → infra_workspaces           (core with external dependency)
```

### Section 2.4: Dependency Exception Process

If a situation requires violating a dependency rule:

1. Proposer documents the necessity
2. All Tier Specialists review
3. All Critics challenge
4. Chair presents to Human Director
5. Human Director may approve with documented rationale
6. Exception is recorded in knowledge base

---

## Article III: Session Protocol

### Section 3.1: Speaker Identification

All speakers MUST identify themselves:

```
CORRECT:
"This is Dr. Catherine Wells, Core Tier Expert. I have concerns about 
the proposed addition of database access to core_types..."

INCORRECT:
"I have concerns about the proposed addition..."
```

### Section 3.2: Research Declaration

When researching code or files:

```
CORRECT:
"This is Carlos Mendez, Research Clerk. I am researching the dependency 
graph in projects/elixir/ember_platform/apps/infra_payments/mix.exs"

INCORRECT:
*silently examines files*
```

### Section 3.3: Handoff Protocol

When transferring discussion:

```
CORRECT:
"I yield to Robert Chen, Infrastructure Tier Expert, who can speak to 
the implications for infra_payments."

INCORRECT:
"What do you think, Robert?"
```

---

## Article IV: Knowledge Base Management

### Section 4.1: Required Documentation

All architectural decisions MUST be documented with:

1. **Decision Statement**: What was decided
2. **Rationale**: Why this decision was made
3. **Alternatives Considered**: What was rejected and why
4. **Participants**: Who was involved in the decision
5. **Date**: When the decision was made

### Section 4.2: Architecture Decision Records (ADRs)

Major decisions are recorded as ADRs in `knowledge_base/decisions/`:

```
ADR-NNN_short-title.md

Example:
ADR-001_umbrella_architecture.md
ADR-002_tier_naming_convention.md
ADR-003_ar_product_structure.md
```

### Section 4.3: Knowledge Staleness

Knowledge base entries are reviewed:
- On first access in any session
- Quarterly by Historians
- After major structural changes

---

## Article V: Subcommittee Operations

### Section 5.1: Subcommittee Authority

Subcommittees may:
- Conduct focused investigations
- Produce recommendations for full committee
- Update knowledge base in their domain
- Classify new apps within their tier (Tier Governance only)

Subcommittees may NOT:
- Make binding cross-tier architectural decisions
- Modify dependency rules
- Change naming conventions

### Section 5.2: Subcommittee Reporting

All subcommittee findings MUST be reported to full committee before action.

---

## Article VI: Human Director Override

### Section 6.1: Override Authority

The Human Director may override any committee decision. Overrides are recorded:

```markdown
## Human Override Notice

**Original Decision**: [Description]
**Override Reason**: [Human's stated reason]
**Recording**: This override is documented per Governance Article VI
```

### Section 6.2: Override Scope

Human Director overrides may:
- Approve dependency rule exceptions
- Reclassify apps between tiers
- Approve convention changes
- Direct committee focus

---

## Article VII: Amendments

### Section 7.1: Amendment Process

1. Amendment proposed by any member
2. Full committee review
3. Human Director approval
4. Amendment recorded with date

### Section 7.2: Amendment Record

| Date | Article | Change | Proposer | Approved By |
|------|---------|--------|----------|-------------|
| 2026-01-08 | Initial | Full document | Human Director | Human Director |

---

*"Good governance enables architectural excellence; poor governance ensures structural decay."*
