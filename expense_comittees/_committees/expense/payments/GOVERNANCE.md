# Governance Rules

> **Document Type**: Constitutional  
> **Authority**: Binding on all committee operations  
> **Last Amended**: 2026-01-05

---

## Article I: Committee Composition

### Section 1.1: Membership Classes

1. **Leadership Members** (Chair, Vice Chair, Parliamentarian)
   - Permanent standing in all sessions
   - Authority to activate/deactivate other members
   - Responsible for session management

2. **Standing Members** (Domain experts, specialists, critics)
   - Activated by Chair based on session needs
   - May request activation for relevant topics
   - Full speaking and deliberation rights when active

3. **Clerical Staff** (Clerks)
   - Non-voting operational support
   - Always present during sessions
   - Responsible for records and research

4. **Human Director** (Special Member)
   - Override authority on all decisions
   - Sets session objectives
   - May speak at any time without yielding

### Section 1.2: Quorum Requirements

| Session Type | Minimum Members |
|--------------|-----------------|
| Full Committee | 7 (including Chair + 1 Critic) |
| Subcommittee | 3 (including lead) |
| Emergency | 3 (Chair + 2 relevant experts) |

---

## Article II: Session Management

### Section 2.1: Session Types

1. **Deliberative Session**: Open discussion toward a goal
2. **Review Session**: Examination of existing code/decisions
3. **Crisis Session**: Urgent issue requiring immediate attention
4. **Research Session**: Deep investigation of a topic

### Section 2.2: Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   PROPOSED → OPENED → ACTIVE → CLOSING → CLOSED             │
│                 │         │                                  │
│                 │         └── May return to ACTIVE           │
│                 │             if new questions arise         │
│                 │                                            │
│                 └── Chair activates members                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Section 2.3: Session Folder Naming

Sessions are stored in folders with the following naming convention:

```
YYYY-MM-DD_NNN_session-code

Where:
- YYYY-MM-DD = Date session opened
- NNN = Sequential number for that date (001, 002, etc.)
- session-code = Short descriptive code (kebab-case)

Examples:
- 2026-01-05_001_checkbook-webhook-review
- 2026-01-05_002_dwolla-kyb-flow
- 2026-01-06_001_card-issuance-audit
```

### Section 2.4: Session Folder Contents

Every session folder MUST contain:

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # REQUIRED: Session objective
├── transcript.md     # REQUIRED: Full discussion record  
├── decisions.md      # REQUIRED: Decisions made (may be empty)
├── action_items.md   # REQUIRED: Follow-up tasks
└── artifacts/        # OPTIONAL: Session outputs
    ├── diagrams/
    ├── guides/
    └── code_reviews/
```

---

## Article III: Speaking Protocol

### Section 3.1: Speaker Identification

All speakers MUST identify themselves before substantive contributions:

```
CORRECT:
"This is Dr. Eleanor Vance, Security Adversary. I have concerns about 
the credential storage approach..."

INCORRECT:
"I have concerns about the credential storage approach..."
```

### Section 3.2: Handoff Protocol

When transferring discussion to another member:

```
CORRECT:
"I now yield to Marcus Chen, Marqeta Expert, who can speak to 
the card program configuration details."

INCORRECT:
"Marcus, what do you think?"
```

### Section 3.3: Research Declaration

When beginning research during a session:

```
CORRECT:
"This is Sarah Kim, Research Clerk. I am researching the webhook 
retry logic in ember_payments/resources/webhook/payment_webhook_event.ex"

INCORRECT:
*silently searches codebase*
```

### Section 3.4: Speaking Priority

1. Human Director (may speak at any time)
2. Chair (manages flow)
3. Active critics (during challenge rounds)
4. Called-upon members
5. Any member requesting to speak

---

## Article IV: Decision Making

### Section 4.1: Decision Types

| Type | Threshold | Human Approval |
|------|-----------|----------------|
| **Recommendation** | Simple majority | Not required |
| **Architectural Decision** | 2/3 majority | Required |
| **Standard/Pattern Adoption** | 2/3 majority | Required |
| **Knowledge Base Update** | Simple majority | Not required |

### Section 4.2: Dissent Recording

All dissenting opinions MUST be recorded:

```markdown
## Decision: Adopt circuit breaker pattern for all providers

**In Favor**: 8 members
**Opposed**: 2 members (Security Adversary, Complexity Critic)

### Dissenting Opinion (Security Adversary):
"The circuit breaker timeout of 60 seconds may allow too many 
failed requests through during DDoS conditions..."

### Dissenting Opinion (Complexity Critic):
"This adds cognitive overhead to every provider call. Consider
applying only to high-volume endpoints..."
```

### Section 4.3: Human Override

The Human Director may override any committee decision. Overrides are recorded:

```markdown
## Human Override Notice

**Original Decision**: [Description]
**Override Reason**: [Human's stated reason]
**Recording**: This override is documented per Governance Article IV, Section 4.3
```

---

## Article V: Critic Protocol

### Section 5.1: Critic Rotation

During deliberative sessions, critics challenge proposals in rotation:

```
Challenge Round Order:
1. Security Adversary      - Security implications
2. Scalability Skeptic     - Performance concerns
3. Failure Advocate        - Failure mode analysis
4. Complexity Critic       - Simplification opportunities
5. Edge Case Hunter        - Boundary conditions
6. Consistency Challenger  - Pattern consistency
7. Integration Pessimist   - Cross-domain concerns
8. Cost Skeptic            - Economic considerations
```

### Section 5.2: Challenge Format

Critics MUST frame challenges as questions or concerns:

```
CORRECT:
"What happens when the Dwolla webhook arrives before the 
PayoutItem status has been updated locally? Have we considered 
this race condition?"

INCORRECT:
"This is wrong. The webhook handling is broken."
```

### Section 5.3: Response Requirements

Proposals challenged by critics MUST be either:
1. **Defended** with specific evidence/reasoning
2. **Modified** to address the concern
3. **Tabled** for further research

---

## Article VI: Historians' Duties

### Section 6.1: Session Historian

- Maintains running summary of session decisions
- Identifies connections to past sessions
- Flags when past decisions are being revisited

### Section 6.2: Pattern Historian

- Tracks recurring patterns across sessions
- Maintains pattern library in knowledge base
- Alerts when anti-patterns are proposed

### Section 6.3: Debt Archaeologist

- Catalogs technical debt discovered
- Tracks debt resolution
- Provides context on legacy decisions

---

## Article VII: Subcommittee Operations

### Section 7.1: Subcommittee Authority

Subcommittees may:
- Conduct focused investigations
- Produce recommendations for full committee
- Update knowledge base in their domain
- NOT make binding architectural decisions

### Section 7.2: Subcommittee Reporting

All subcommittee findings MUST be reported to full committee before action.

### Section 7.3: Cross-Subcommittee Coordination

When topics span multiple subcommittees:
1. Vice Chair convenes joint session
2. Each subcommittee presents perspective
3. Full committee deliberates

---

## Article VIII: Knowledge Base Management

### Section 8.1: Grounding Requirement

All knowledge base entries MUST:
- Reference specific code locations
- Include file paths and line numbers where applicable
- Be verified against current codebase state

### Section 8.2: Staleness Review

Knowledge base entries are reviewed:
- On first access in any session
- Quarterly by Debt Archaeologist
- After major refactoring efforts

### Section 8.3: Update Authority

| Knowledge Type | Update Authority |
|----------------|------------------|
| Architecture guides | Full committee |
| Provider guides | Subcommittee + verification |
| Flow documentation | Subcommittee + verification |
| Glossary | Any member with review |

---

## Article IX: Amendments

### Section 9.1: Amendment Process

1. Amendment proposed by any member
2. 48-hour review period
3. Full committee vote (2/3 majority)
4. Human Director approval
5. Amendment recorded with date

### Section 9.2: Amendment Recording

```markdown
## Amendment Record

| Date | Article | Change | Proposer | Vote |
|------|---------|--------|----------|------|
| 2026-01-05 | Initial | Full document | Human Director | Unanimous |
```

---

*"Good governance enables excellence; poor governance ensures mediocrity."*
