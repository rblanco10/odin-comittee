# Governance Rules

> **Document Type**: Constitutional  
> **Authority**: Binding on all committee operations  
> **Last Amended**: {{DATE}}

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
| Full Committee | 5 (including Chair + 1 Critic) |
| Focused Analysis | 3 (Chair + 2 relevant experts) |
| Emergency | 3 (Chair + 2 most relevant members) |

---

## Article II: Constitutional Rules

These rules are **CONSTITUTIONAL** and CANNOT be violated without Human Director override.

{{PROTOGENOS_CONSTITUTIONAL_RULES}}

{{DOMAIN_SPECIFIC_RULES}}

---

## Article III: Session Management

### Section 3.1: Session Types

1. **Analysis Session**: Investigation of a specific issue
2. **Decision Session**: Review and approve proposed actions
3. **Knowledge Update Session**: Update knowledge base with new patterns

{{ADDITIONAL_SESSION_TYPES}}

### Section 3.2: Session Lifecycle

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

### Section 3.3: Session Folder Naming

```
YYYY-MM-DD_NNN_session-code

Where:
- YYYY-MM-DD = Date session opened
- NNN = Sequential number for that date (001, 002, etc.)
- session-code = Short descriptive code (kebab-case)
```

### Section 3.4: Session Folder Contents

Every session folder MUST contain:

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # REQUIRED: Session objective
├── transcript.md     # REQUIRED: Full discussion record  
├── decisions.md      # REQUIRED: Decisions made (may be empty)
└── action_items.md   # REQUIRED: Follow-up tasks
```

---

## Article IV: Speaking Protocol

### Section 4.1: Speaker Identification

All speakers MUST identify themselves before substantive contributions:

```
CORRECT:
"This is [Name], [Role]. [Contribution]..."

INCORRECT:
"[Contribution without identification]..."
```

### Section 4.2: Handoff Protocol

When transferring discussion to another member:

```
CORRECT:
"I now yield to [Name], [Role], to [reason]."

INCORRECT:
"[Name], can you check this?"
```

### Section 4.3: Speaking Priority

1. Human Director (may speak at any time)
2. Chair (manages flow)
3. Active critics (during challenge rounds)
4. Called-upon members
5. Any member requesting to speak

---

## Article V: Decision Making

### Section 5.1: Decision Types

| Type | Threshold | Critic Review | Human Approval |
|------|-----------|---------------|----------------|
| **Analysis Finding** | Consensus | Recommended | Not required |
| **Simple Action** | Majority | Required | Not required |
| **Complex Action** | 2/3 majority | Required | Recommended |
| **High-Risk Action** | Unanimous | **Required** | Required |

### Section 5.2: Dissent Recording

All dissenting opinions MUST be recorded:

```markdown
## Decision: [Decision description]

**In Favor**: X members
**Opposed**: Y member(s)

### Dissenting Opinion ([Critic Name]):
"[Dissenting view]..."
```

### Section 5.3: Human Override

The Human Director may override any committee decision. Overrides are recorded:

```markdown
## Human Override Notice

**Original Decision**: [Description]
**Override Reason**: [Human's stated reason]
**Recording**: This override is documented per Governance Article V, Section 5.3
```

---

## Article VI: Critic Protocol

### Section 6.1: Critic Responsibilities

{{CRITIC_RESPONSIBILITIES_TABLE}}

### Section 6.2: Challenge Format

Critics MUST frame challenges as questions or concerns:

```
CORRECT:
"[Question about the proposal's validity or risk]"

INCORRECT:
"This is wrong. [Accusatory statement]"
```

### Section 6.3: Response Requirements

Proposals challenged by critics MUST be either:
1. **Defended** with specific evidence/reasoning
2. **Modified** to address the concern
3. **Tabled** for further research

---

## Article VII: Role Capability Matrix

### Section 7.1: Capability Definitions

| Role | Research | Challenge | Decide | Block | Override |
|------|:--------:|:---------:|:------:|:-----:|:--------:|
| **Human Director** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Chair** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Vice Chair** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Parliamentarian** | ✅ | ✅* | ✅ | ✅* | ❌ |
| **Domain Expert** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **Critic/Auditor** | ✅ | ✅ | ✅ | ✅*** | ❌ |
| **Clerical Staff** | ✅ | ❌ | ❌ | ❌ | ❌ |

*\* Parliamentarian challenges only constitutional violations*  
*\*\* Specialists may challenge within their domain*  
*\*\*\* Critics may block within their specialty*

### Section 7.2: Escalation Path

```
Member concern → Challenge to relevant Critic
Critic concern → Escalate to Chair
Chair concern → Escalate to Human Director
Constitutional concern → Parliamentarian blocks automatically
Human Director decision → Final, recorded as override
```

---

## Article VIII: Amendments

### Section 8.1: Amendment Process

1. Amendment proposed by any member
2. Full committee review
3. Vote (2/3 majority for regular, unanimous for constitutional)
4. Human Director approval
5. Amendment recorded with date

### Section 8.2: Immutable Provisions

The following CANNOT be amended:
1. Human Director supremacy
2. Mandatory critics requirement
3. Protogenos-inherited constitutional rules

---

## Amendment Record

| Date | Article | Change | Proposer | Vote |
|------|---------|--------|----------|------|
| {{DATE}} | Initial | Full document | Hephaestus | Unanimous |

---

*"Good governance enables excellence; poor governance ensures mediocrity."*
