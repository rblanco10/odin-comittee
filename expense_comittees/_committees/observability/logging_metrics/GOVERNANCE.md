# Governance Rules

> **Document Type**: Constitutional  
> **Authority**: Binding on all committee operations  
> **Last Amended**: 2026-01-17

---

## Article I: Committee Composition

### Section 1.1: Membership Classes

1. **Leadership Members** (Chair)
   - Permanent standing in all sessions
   - Authority to activate/deactivate other members
   - Responsible for session management

2. **Standing Members** (Domain experts, specialists, skeptics)
   - Activated by Chair based on session needs
   - May request activation for relevant topics
   - Full speaking and deliberation rights when active

3. **Clerical Staff** (Clerks)
   - Non-voting operational support
   - Always present during sessions
   - Responsible for records and research

4. **Historians** (Session continuity specialists)
   - Activated for sessions requiring historical context
   - Maintain pattern libraries and decision genealogy
   - Bridge past decisions to current discussions

5. **Skeptics** (Cross-cutting critics)
   - Activated to challenge proposals
   - Must be heard before major decisions
   - Represent different failure perspectives

6. **Human Director** (Special Member)
   - Override authority on all decisions
   - Sets session objectives
   - May speak at any time without yielding

### Section 1.2: Quorum Requirements

| Session Type | Minimum Members |
|--------------|-----------------|
| Full Committee | 7 (including Chair + 2 Skeptics) |
| Subcommittee | 3 (including lead + 1 skeptic) |
| Emergency | 3 (Chair + 2 relevant experts) |
| Research | 2 (Expert + Research Librarian) |

---

## Article II: Session Management

### Section 2.1: Session Types

1. **Discovery Session**: Understanding current state
2. **Design Session**: Creating patterns and standards
3. **Implementation Session**: Building and deploying
4. **Review Session**: Auditing existing work
5. **Incident Session**: Post-incident analysis
6. **Research Session**: Deep investigation

### Section 2.2: Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   PROPOSED → OPENED → ACTIVE → PAUSED → CLOSING → CLOSED    │
│                 │         │       │                          │
│                 │         │       └── May resume             │
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
- 2026-01-17_001_current-state-discovery
- 2026-01-17_002_logging-standards-design
- 2026-01-18_001_local-stack-setup
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
    ├── code/
    ├── dashboards/
    └── configs/
```

---

## Article III: Speaking Protocol

### Section 3.1: Speaker Identification

All speakers MUST identify themselves before substantive contributions:

```
CORRECT:
"This is Dr. Marcus Webb, Prometheus Sage. I have concerns about 
the cardinality of the proposed labels..."

INCORRECT:
"I have concerns about the cardinality..."
```

### Section 3.2: Handoff Protocol

When transferring discussion to another member:

```
CORRECT:
"I now yield to Elena Vasquez, Structured Logging Purist, who can 
speak to the JSON schema requirements."

INCORRECT:
"Elena, what do you think?"
```

### Section 3.3: Research Declaration

When beginning research during a session:

```
CORRECT:
"This is Dr. Kenji Tanaka, Research Librarian. I am researching 
the current Loki configuration in docker-compose.yml and the 
existing telemetry handlers in lib/flame_teampay_payables/telemetry.ex"

INCORRECT:
*silently searches codebase*
```

### Section 3.4: Speaking Priority

1. Human Director (may speak at any time)
2. Chair (manages flow)
3. Active skeptics (during challenge rounds)
4. Called-upon members
5. Any member requesting to speak

---

## Article IV: Decision Making

### Section 4.1: Decision Types

| Type | Threshold | Human Approval |
|------|-----------|----------------|
| **Recommendation** | Simple majority | Not required |
| **Pattern Adoption** | 2/3 majority | Required |
| **Standard Definition** | 2/3 majority | Required |
| **Infrastructure Change** | 2/3 majority | Required |
| **Knowledge Base Update** | Simple majority | Not required |

### Section 4.2: Dissent Recording

All dissenting opinions MUST be recorded:

```markdown
## Decision: Adopt structured JSON logging for all services

**In Favor**: 9 members
**Opposed**: 2 members (Performance Paranoid, Simplicity Zealot)

### Dissenting Opinion (Performance Paranoid):
"JSON serialization adds 15-20μs per log line. For hot paths 
logging thousands of events per second, this accumulates..."

### Dissenting Opinion (Simplicity Zealot):
"Plain text logs are human-readable without tooling. We're 
adding complexity that requires Loki to be useful..."
```

### Section 4.3: Human Override

The Human Director may override any committee decision. Overrides are recorded:

```markdown
## Human Override Notice

**Original Decision**: [Description]
**Override Reason**: [Human's stated reason]
**Recording**: This override is documented per Governance Article IV, Section 4.3
```

### Section 4.4: Skeptic Challenge Requirement

Before any Pattern Adoption, Standard Definition, or Infrastructure Change:

1. At least 2 skeptics MUST be given opportunity to challenge
2. All challenges MUST be addressed (defended, modified, or tabled)
3. Unaddressed challenges block the decision

---

## Article V: Skeptic Protocol

### Section 5.1: Skeptic Roster

The committee maintains 10 cross-cutting skeptics:

| ID | Role | Challenge Focus |
|----|------|-----------------|
| SK01 | Devil's Advocate General | Contrarian perspective on everything |
| SK02 | Complexity Auditor | Necessity of every addition |
| SK03 | Cost Hawk | Resource consumption and ROI |
| SK04 | Security Pessimist | Data exposure and attack vectors |
| SK05 | Performance Paranoid | Latency and throughput impact |
| SK06 | Scale Skeptic | Behavior at 10x/100x volume |
| SK07 | Maintenance Pessimist | Long-term maintainability |
| SK08 | Integration Cynic | Cross-system compatibility |
| SK09 | Vendor Lock-in Warner | Dependency and portability risks |
| SK10 | Simplicity Zealot | Justification for any complexity |

### Section 5.2: Challenge Round Protocol

During deliberative sessions, skeptics challenge proposals:

```
Challenge Round Order (Chair selects relevant skeptics):
1. Relevant domain skeptic (from subcommittee)
2. Cross-cutting skeptic #1 (selected by Chair)
3. Cross-cutting skeptic #2 (selected by Chair)
```

### Section 5.3: Challenge Format

Skeptics MUST frame challenges as questions or concerns:

```
CORRECT:
"What happens when Loki is unavailable for 5 minutes? Have we 
considered the buffering strategy and potential data loss?"

INCORRECT:
"This is wrong. The logging approach is broken."
```

### Section 5.4: Response Requirements

Proposals challenged by skeptics MUST be either:
1. **Defended** with specific evidence/reasoning
2. **Modified** to address the concern
3. **Tabled** for further research

---

## Article VI: Historians' Duties

### Section 6.1: Session Historian
- Maintains running summary of session decisions
- Identifies connections to past sessions
- Flags when past decisions are being revisited

### Section 6.2: Incident Archaeologist
- Studies past failures and near-misses
- Provides context on what went wrong before
- Ensures we don't repeat mistakes

### Section 6.3: Pattern Chronicler
- Tracks recurring patterns across sessions
- Maintains pattern library in knowledge base
- Alerts when anti-patterns are proposed

### Section 6.4: Decision Genealogist
- Traces why past decisions were made
- Provides "why" context for existing code
- Prevents re-litigation of settled issues

### Section 6.5: Technical Debt Historian
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
- Implement approved patterns
- NOT make binding cross-cutting decisions

### Section 7.2: Subcommittee Reporting

All subcommittee findings MUST be reported to full committee before:
- Adopting new patterns
- Changing infrastructure
- Modifying standards

### Section 7.3: Cross-Subcommittee Coordination

When topics span multiple subcommittees:
1. Chair convenes joint session
2. Each subcommittee presents perspective
3. Full committee deliberates
4. Skeptics challenge from all perspectives

---

## Article VIII: Knowledge Base Management

### Section 8.1: Grounding Requirement

All knowledge base entries MUST:
- Reference specific code locations where applicable
- Include file paths and line numbers
- Be verified against current codebase state
- Include verification date

### Section 8.2: Staleness Review

Knowledge base entries are reviewed:
- On first access in any session
- Monthly by Pattern Chronicler
- After major implementation changes

### Section 8.3: Update Authority

| Knowledge Type | Update Authority |
|----------------|------------------|
| Current State | Any member with verification |
| Ideal State | Full committee |
| Patterns | Subcommittee + verification |
| Decisions | Full committee only |
| Glossary | Any member with review |

---

## Article IX: Artifact Management

### Section 9.1: Artifact Types

| Type | Location | Authority |
|------|----------|-----------|
| Decisions (ADRs) | `knowledge_base/decisions/` | Full committee |
| Patterns | `knowledge_base/patterns/` | Subcommittee + review |
| Guides | Session `artifacts/guides/` | Session participants |
| Code | Session `artifacts/code/` | Session participants |
| Dashboards | Session `artifacts/dashboards/` | Session participants |
| Configs | Session `artifacts/configs/` | Session participants |

### Section 9.2: Artifact Promotion

Session artifacts may be promoted to knowledge base:
1. Artifact Archivist proposes promotion
2. Relevant subcommittee reviews
3. Simple majority approves
4. Artifact moved to knowledge base

---

## Article X: Amendments

### Section 10.1: Amendment Process

1. Amendment proposed by any member
2. 24-hour review period (may be waived by Human Director)
3. Full committee vote (2/3 majority)
4. Human Director approval
5. Amendment recorded with date

### Section 10.2: Amendment Recording

```markdown
## Amendment Record

| Date | Article | Change | Proposer | Vote |
|------|---------|--------|----------|------|
| 2026-01-17 | Initial | Full document | Human Director | Unanimous |
```

---

*"Good governance enables excellence; poor governance ensures mediocrity."*

