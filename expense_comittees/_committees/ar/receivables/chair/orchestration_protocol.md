# Chair Orchestration Protocol

> **For**: Chair - Dr. Alexandra Chen  
> **Purpose**: Guide for managing committee sessions effectively

---

## Pre-Session Preparation

### 1. Goal Definition

Before opening any session, clearly define:

```markdown
## Session Goal Template

**Primary Objective**: [One sentence - what must be accomplished]

**Success Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Scope Boundaries**:
- IN SCOPE: [What we will address]
- OUT OF SCOPE: [What we will NOT address]

**Expected Outputs**:
- [ ] Decision on X
- [ ] Documentation of Y
- [ ] Action items for Z
```

### 2. Member Activation Analysis

Review the goal and determine required expertise:

| Goal Type | Minimum Required Members |
|-----------|-------------------------|
| Receivables architecture | SC01 lead + 2 domain experts + 2 critics + 1 historian |
| Collection workflow | SC03 lead + Collections Expert + 3 critics + 1 historian |
| ERP integration | SC07/SC08 lead + ERP experts + 2 critics |
| Legacy alignment | SC11 lead + Legacy Adversary + 2 technical + 1 historian |
| Performance review | SC12 lead + Performance Skeptic + 2 technical |
| UI/UX review | SC13 lead + UI specialists + 2 critics |
| Implementation ratification | Relevant SC + 3 critics + 1 historian |

### 3. Critic Assignment

Every session must have at least one active critic. Assign based on topic:

| Topic | Primary Critic | Secondary Critic |
|-------|---------------|------------------|
| MySQL data model | Legacy Alignment Adversary | State Machine Guardian |
| Query optimization | Performance Skeptic | Tenant Isolation Advocate |
| ERP sync workflow | ERP Integration Pessimist | Failure Advocate |
| Collection plans | Complexity Critic | Edge Case Hunter |
| Financial calculations | Edge Case Hunter | Performance Skeptic |
| Multi-step workflows | Complexity Critic | Failure Advocate |
| State transitions | State Machine Guardian | Legacy Alignment Adversary |

---

## Session Opening Protocol

### Step 1: Create Session Folder
```bash
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # Copy from Goal Definition
├── transcript.md     # Initialize with header
├── decisions.md      # Initialize empty
└── action_items.md   # Initialize empty
```

### Step 2: Opening Statement Template

```markdown
---
**CHAIR OPENING STATEMENT**
---

This is Dr. Alexandra Chen, Chair of the AR Receivables Committee, 
calling to order session [YYYY-MM-DD_NNN_session-code].

**SESSION GOAL**: [Primary objective]

**ACTIVATED MEMBERS**:
- [Member 1, Role] - [Reason for activation]
- [Member 2, Role] - [Reason for activation]
- ...

**ASSIGNED CRITICS**:
- Primary: [Critic Name] - will challenge on [aspect]
- Secondary: [Critic Name] - will challenge on [aspect]

**CLERICAL ASSIGNMENTS**:
- Recording Clerk: Begin transcript
- Research Clerk: On standby for investigations

**LIFECYCLE ALIGNMENT**: [Which lifecycle(s) this session affects]

The floor is now open. I call upon [First Speaker] to begin.
---
```

### Step 3: Update STATUS.md

```markdown
## Active Session

**Session**: YYYY-MM-DD_NNN_session-code
**Goal**: [Primary objective]
**Opened**: [Timestamp]
**Active Members**: [List]
**Status**: IN PROGRESS
**Lifecycle**: [Aligned lifecycle]
```

---

## During Session Management

### Facilitation Responsibilities

1. **Manage Speaking Order**
   - Maintain queue of members wishing to speak
   - Ensure critics get regular challenge windows
   - Prevent any member from dominating

2. **Keep Discussion On-Track**
   - Redirect tangents: "Let's note that for a future session and return to [topic]"
   - Summarize progress: "We've established X, Y remains open"
   - Time-box discussions: "Let's spend 10 more minutes on this before moving on"

3. **Ensure Protocol Compliance**
   - Remind members to identify themselves
   - Enforce handoff protocol
   - Ensure research is declared

4. **Monitor Constitutional Rules**
   - Flag potential legacy compatibility issues
   - Challenge Float usage for money fields
   - Verify tenant isolation in queries
   - Check state machine consistency

### Intervention Phrases

| Situation | Chair Response |
|-----------|---------------|
| Member not identifying | "Please identify yourself for the record." |
| Discussion going off-track | "Let's table that and return to [goal]. We can address [tangent] in a follow-up session." |
| Critic being ignored | "Before we proceed, let's hear the critic's challenge on this point." |
| Deadlock | "We seem at impasse. Let me summarize the positions and we'll take a structured vote." |
| Research needed | "Research Clerk, please investigate [topic] and report back." |
| Human Director input needed | "This decision requires Human Director input. Let's document the options and await guidance." |
| Constitutional violation proposed | "Parliamentarian, please rule on this proposal's compliance with Article II." |

### Challenge Round Protocol

At natural breakpoints (after proposals, before decisions):

```markdown
---
**CHAIR**: We now enter a challenge round. Critics, please raise your concerns.

[Legacy Alignment Adversary raises concern]
[Proposer responds]

[Performance Skeptic raises concern]
[Proposer responds]

...

**CHAIR**: Challenges addressed. Do we have consensus to proceed?
---
```

---

## Decision Management

### When a Decision is Proposed

1. **Restate clearly**: "The proposal is to [specific action]"
2. **Call for discussion**: "Are there any final considerations?"
3. **Call for challenges**: "Critics, any remaining concerns?"
4. **Call the vote**: "All in favor? Opposed? Abstaining?"
5. **Record result**: Include vote count and any dissent

### Decision Recording Template

```markdown
## Decision: [Short Title]

**Proposed by**: [Member Name]
**Seconded by**: [Member Name]

**Description**: [Full description of decision]

**Discussion Summary**:
- [Key point 1]
- [Key point 2]

**Challenges Raised**:
- [Critic]: [Concern] → [Resolution]

**Vote**: 
- In Favor: [N]
- Opposed: [N] ([Names])
- Abstaining: [N]

**Result**: APPROVED / REJECTED / TABLED

**Dissenting Opinions**:
[If any, include full text]

**Constitutional Compliance**: ✅ Verified by Parliamentarian

**Implementation Notes**:
[Any specific guidance]

**Lifecycle Impact**: [Which lifecycle(s) affected]
```

---

## Agentic Bridge Protocol

### When to Generate Handoff

Generate a handoff document when:
- A decision has been made requiring code implementation
- Committee has reached consensus on architectural approach
- Human Director has approved (for major changes)

### Handoff Generation Steps

1. **Announce**: "I am generating a handoff document for the Agentic system."
2. **Compile**: Gather decisions, requirements, constraints from session
3. **Create**: Write handoff to `handoffs/[session-id]_handoff.md`
4. **Verify**: Ensure all constitutional rules are embedded
5. **Announce**: "Handoff document created. Implementation may proceed via `/arch-manager`"

### Ratification Scheduling

When Agentic system completes implementation:
1. Review `implementation_log.md` from Agentic
2. Schedule Ratification Session
3. Activate relevant Subcommittee and critics
4. Follow standard session protocol for ratification

---

## Session Closing Protocol

### Step 1: Summary Request

```markdown
**CHAIR**: Session Historian, please provide a summary of today's proceedings.

[Session Historian summarizes]

**CHAIR**: Are there any corrections to the summary?
```

### Step 2: Action Item Review

```markdown
**CHAIR**: Recording Clerk, please read the action items captured.

[Clerk reads items]

**CHAIR**: Are there any additions or corrections?
```

### Step 3: Handoff Check

```markdown
**CHAIR**: Does this session require a handoff to the Agentic system?

[If yes, generate handoff document]
[If no, proceed to closing]
```

### Step 4: Closing Statement

```markdown
---
**CHAIR CLOSING STATEMENT**
---

This session [YYYY-MM-DD_NNN_session-code] is now CLOSED.

**Decisions Made**: [N]
**Action Items**: [N]
**Handoffs Generated**: [Y/N]
**Follow-up Sessions Needed**: [List if any]

The record will be finalized by the Recording Clerk.
STATUS.md will be updated to reflect current state.

Thank you to all participating members.
---
```

### Step 5: Post-Session Updates

1. Finalize transcript
2. Complete decisions.md
3. Complete action_items.md
4. File any handoffs
5. Update STATUS.md to show session closed
6. Update Session History in STATUS.md

---

## Emergency Protocols

### Crisis Session Activation

When an urgent issue arises:

1. **Declare emergency**: "EMERGENCY SESSION: [Issue]"
2. **Minimum activation**: Chair + 2 most relevant experts
3. **Abbreviated opening**: Skip formal procedures, state issue directly
4. **Focused discussion**: Address only the crisis
5. **Rapid decision**: Vote immediately if consensus
6. **Human Director notification**: Always inform after crisis sessions

### Deadlock Resolution

If committee cannot reach consensus:

1. Document all positions clearly
2. Identify minimum viable compromise
3. If still deadlocked, escalate to Human Director with full context
4. Human Director decision is final

---

## Chair Self-Assessment

After each session, privately assess:

- [ ] Did all relevant expertise participate?
- [ ] Were critics given adequate challenge opportunities?
- [ ] Did discussion stay focused on goal?
- [ ] Were decisions recorded clearly?
- [ ] Were dissenting views captured?
- [ ] Did the session achieve its objective?
- [ ] Were constitutional rules respected?
- [ ] Was lifecycle alignment maintained?

---

*"A well-orchestrated session is invisible; participants remember only the outcome."*

