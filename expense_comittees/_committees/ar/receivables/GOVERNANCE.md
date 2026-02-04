# Governance Rules

> **Document Type**: Constitutional  
> **Authority**: Binding on all committee operations  
> **Last Amended**: 2026-01-14

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

## Article II: Constitutional Rules (AR-Specific)

These rules are **CONSTITUTIONAL** and CANNOT be violated without Human Director override.

### Section 2.1: Legacy Compatibility First

```
Records created by Ash MUST be readable by Loopback2.
The legacy system (roadrunner_samples/) shares the same MySQL database.
Violations require Human Director override with documented justification.
```

**Enforcement**: Parliamentarian blocks any proposal violating this rule.

### Section 2.2: Decimal for Money

```
All financial fields MUST use Decimal, never Float.
No exceptions. This includes:
- amount, total, balance, price, fee, payment amounts
- Any field representing monetary value
```

**Enforcement**: Immediate rejection of any implementation using Float for money.

### Section 2.3: Tenant Isolation

```
All queries MUST include tenant (owner_id or workspace_id).
- Classic MySQL: owner_id (KSUID)
- Ember PostgreSQL: workspace_id (UUID)
Missing tenant = full table scan = BLOCKED.
```

**Enforcement**: Performance Skeptic and Tenant Isolation Advocate challenge all queries.

### Section 2.4: State Machine Consistency

```
Standard transitions: created → active ↔ inactive
- created: Initial state after record creation
- active: Normal operating state
- inactive: Soft-deleted or paused state

"removed" is NOT a valid status. Use "inactive" for soft deletes.
```

**Enforcement**: State Machine Guardian reviews all state transitions.

### Section 2.5: Performance Budget

```
List pages: < 200ms response time, maximum 5 database queries
Detail pages: < 150ms response time, maximum 3 database queries
Search/autocomplete: < 100ms response time, maximum 2 queries
```

**Enforcement**: Performance Skeptic blocks implementations exceeding budget.

---

## Article III: Session Management

### Section 3.1: Session Types

1. **Deliberative Session**: Open discussion toward a goal
2. **Review Session**: Examination of existing code/decisions
3. **Crisis Session**: Urgent issue requiring immediate attention
4. **Research Session**: Deep investigation of a topic
5. **Ratification Session**: Approving completed implementation

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

Examples:
- 2026-01-14_001_collections-architecture
- 2026-01-15_001_erp-push-review
```

### Section 3.4: Session Folder Contents

Every session folder MUST contain:

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # REQUIRED: Session objective
├── transcript.md     # REQUIRED: Full discussion record  
├── decisions.md      # REQUIRED: Decisions made (may be empty)
├── action_items.md   # REQUIRED: Follow-up tasks
└── artifacts/        # OPTIONAL: Session outputs
    ├── handoff.md    # If bridging to Agentic
    └── diagrams/
```

---

## Article IV: Speaking Protocol

### Section 4.1: Speaker Identification

All speakers MUST identify themselves before substantive contributions:

```
CORRECT:
"This is Dr. Victor Kozlov, Legacy Alignment Adversary. I have concerns about 
the column mapping approach..."

INCORRECT:
"I have concerns about the column mapping approach..."
```

### Section 4.2: Handoff Protocol

When transferring discussion to another member:

```
CORRECT:
"I now yield to Jonathan Blake, Receivables Expert, who can speak to 
the sync workflow details."

INCORRECT:
"Jonathan, what do you think?"
```

### Section 4.3: Research Declaration

When beginning research during a session:

```
CORRECT:
"This is Research Clerk. I am researching the receivable sync 
logic in lib/flame_ps_ar/classic/domain/resources/receivable.ex"

INCORRECT:
*silently searches codebase*
```

### Section 4.4: Speaking Priority

1. Human Director (may speak at any time)
2. Chair (manages flow)
3. Active critics (during challenge rounds)
4. Called-upon members
5. Any member requesting to speak

---

## Article V: Decision Making

### Section 5.1: Decision Types

| Type | Threshold | Human Approval |
|------|-----------|----------------|
| **Recommendation** | Simple majority | Not required |
| **Architectural Decision** | 2/3 majority | Required |
| **Constitutional Change** | Unanimous | Required |
| **Knowledge Base Update** | Simple majority | Not required |
| **Implementation Handoff** | Chair unilateral | Not required |

### Section 5.2: Dissent Recording

All dissenting opinions MUST be recorded:

```markdown
## Decision: Adopt reactor pattern for collection plan creation

**In Favor**: 8 members
**Opposed**: 2 members (Complexity Critic, Legacy Alignment Adversary)

### Dissenting Opinion (Complexity Critic):
"The reactor adds cognitive overhead for what could be a simple 
manual action. Consider the maintenance burden..."

### Dissenting Opinion (Legacy Alignment Adversary):
"The reactor output format may not match legacy expectations.
Need explicit mapping verification..."
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

### Section 6.1: Critic Rotation

During deliberative sessions, critics challenge proposals in rotation:

```
Challenge Round Order:
1. Legacy Alignment Adversary    - Will Loopback2 read this correctly?
2. Performance Skeptic           - Will this work with 30M+ records?
3. Failure Advocate              - What happens when this fails?
4. Complexity Critic             - Is this over-engineered?
5. Edge Case Hunter              - Boundary conditions, nulls, zeros?
6. State Machine Guardian        - Valid state transitions only?
7. Tenant Isolation Advocate     - Can tenants leak data?
8. ERP Integration Pessimist     - Will Sage/NetSuite accept this?
```

### Section 6.2: Challenge Format

Critics MUST frame challenges as questions or concerns:

```
CORRECT:
"What happens when the receivable status changes to 'paid' but 
the ERP sync hasn't completed? Have we considered this race condition?"

INCORRECT:
"This is wrong. The sync handling is broken."
```

### Section 6.3: Response Requirements

Proposals challenged by critics MUST be either:
1. **Defended** with specific evidence/reasoning
2. **Modified** to address the concern
3. **Tabled** for further research

---

## Article VII: Agentic System Integration

### Section 7.1: Handoff Authority

The Chair has **unilateral authority** to generate handoff documents to the Agentic system when:
- A decision has been made requiring implementation
- The committee has reached consensus on approach
- Human Director approves (for major changes)

### Section 7.2: Handoff Document Requirements

All handoff documents MUST include:
- Session reference (ID, decisions.md link)
- Implementation specification with success criteria
- Architectural decisions (BINDING on Agentic)
- Legacy alignment requirements
- Performance budget
- Out of scope items
- Ratification requirements

### Section 7.3: Ratification Protocol

Upon implementation completion:
1. Agentic system produces implementation report
2. Chair schedules Ratification Session
3. Relevant Subcommittee reviews implementation
4. Critics challenge implementation
5. Committee votes on ratification
6. If approved, implementation is accepted
7. If rejected, returns to Agentic with feedback

---

## Article VIII: Subcommittee Operations

### Section 8.1: Subcommittee Authority

Subcommittees may:
- Conduct focused investigations
- Produce recommendations for full committee
- Update knowledge base in their domain
- Review implementations for ratification
- NOT make binding architectural decisions alone

### Section 8.2: Subcommittee Reporting

All subcommittee findings MUST be reported to full committee before action.

### Section 8.3: Lifecycle Alignment

Each subcommittee (SC01-SC10) is aligned with a specific lifecycle in `docs/agents/architecture/lifecycles/`. This creates clear ownership and expertise mapping.

---

## Article IX: Knowledge Base Management

### Section 9.1: Grounding Requirement

All knowledge base entries MUST:
- Reference specific code locations
- Include file paths and line numbers where applicable
- Be verified against current codebase state

### Section 9.2: Staleness Review

Knowledge base entries are reviewed:
- On first access in any session
- Quarterly by historians
- After major refactoring efforts

### Section 9.3: Update Authority

| Knowledge Type | Update Authority |
|----------------|------------------|
| Architecture guides | Full committee |
| Lifecycle documentation | Subcommittee + verification |
| Legacy alignment | SC11 + verification |
| Patterns | Any member with review |
| Glossary | Any member with review |

---

## Article X: Role Capability Matrix

> **Inspired by**: [MetaGPT](https://github.com/geekan/MetaGPT) SOP role definitions

### Section 10.1: Capability Definitions

This matrix defines what each role CAN and CANNOT do within committee operations.

| Role | Research | Challenge | Decide | Handoff | Override |
|------|:--------:|:---------:|:------:|:-------:|:--------:|
| **Human Director** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Chair** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Vice Chair** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Parliamentarian** | ✅ | ✅* | ✅ | ✅ | ❌ |
| **Historian** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Critic** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Domain Expert** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **Technical Specialist** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **Integration Specialist** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **UI/UX Specialist** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **QA Specialist** | ✅ | ✅** | ✅ | ❌ | ❌ |
| **Recording Clerk** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Research Clerk** | ✅ | ❌ | ❌ | ❌ | ❌ |

*\* Parliamentarian challenges only constitutional violations*  
*\*\* Specialists may challenge within their domain of expertise*

### Section 10.2: Capability Explanations

| Capability | Description |
|------------|-------------|
| **Research** | Access codebase, read files, search documentation |
| **Challenge** | Formally challenge proposals, block with concerns |
| **Decide** | Participate in voting on decisions |
| **Handoff** | Generate handoff documents to Agentic system |
| **Override** | Override committee decisions unilaterally |

### Section 10.3: Escalation Path

```
Member concern → Challenge to relevant Critic
Critic concern → Escalate to Chair
Chair concern → Escalate to Human Director
Constitutional concern → Parliamentarian blocks automatically
Human Director decision → Final, recorded as override
```

---

## Article XI: Self-Reflection Protocol

> **Inspired by**: [ChatDev](https://github.com/OpenBMB/ChatDev) self-reflection mechanism

### Section 11.1: Purpose

Self-reflection ensures quality by having members review their own contributions before submission. This catches errors, improves clarity, and increases confidence in outputs.

### Section 11.2: When Required

Self-reflection is **REQUIRED** for:
- Implementation Handoff documents
- Architecture Decision Records (ADRs)
- Knowledge base updates
- Ratification reports

Self-reflection is **OPTIONAL** for:
- Discussion contributions
- Research findings
- Challenge responses

### Section 11.3: Self-Reflection Process

After producing a deliverable, the authoring member MUST:

```
1. PAUSE - Do not immediately submit
2. REVIEW - Read the entire output as if seeing it for the first time
3. CHECK - Verify against the Self-Reflection Checklist
4. REVISE - Fix any issues identified
5. CERTIFY - State: "I have completed self-reflection on this [deliverable type]"
```

### Section 11.4: Self-Reflection Checklist

For all deliverables:

```
[ ] Accuracy: Are all statements factually correct?
[ ] Completeness: Does it address all requirements?
[ ] Clarity: Is it understandable to the intended audience?
[ ] Consistency: Does it align with previous decisions?
[ ] Constitutional: Does it comply with all 5 constitutional rules?
```

For code-related deliverables:

```
[ ] Code References: Are file paths and line numbers accurate?
[ ] Syntax: Are code examples syntactically correct?
[ ] Patterns: Do examples follow established patterns?
[ ] Testing: Are test requirements addressed?
```

For handoff documents:

```
[ ] Scope: Is the scope clearly defined?
[ ] Success Criteria: Are criteria measurable?
[ ] Constraints: Are all constraints documented?
[ ] Out of Scope: Is exclusion list complete?
```

### Section 11.5: Recording Self-Reflection

When certifying self-reflection, include:

```markdown
---
**Self-Reflection Certification**
**Author**: [Member ID and Name]
**Deliverable**: [Type]
**Completed**: [Timestamp]
**Checklist**: All items verified
**Revisions Made**: [Brief description or "None"]
---
```

### Section 11.6: Peer Review After Self-Reflection

Self-reflection does NOT replace peer review. After self-reflection:
1. Critic review still required for major deliverables
2. Parliamentarian review required for constitutional compliance
3. Human Director approval required per decision type thresholds

---

## Article XII: Amendments

### Section 12.1: Amendment Process

1. Amendment proposed by any member
2. 48-hour review period
3. Full committee vote (2/3 majority for regular, unanimous for constitutional)
4. Human Director approval
5. Amendment recorded with date

### Section 12.2: Amendment Recording

```markdown
## Amendment Record

| Date | Article | Change | Proposer | Vote |
|------|---------|--------|----------|------|
| 2026-01-14 | Initial | Full document | Human Director | Unanimous |
```

---

*"Good governance enables excellence; poor governance ensures mediocrity."*

