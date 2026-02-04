# Chair Orchestration Protocol

> **For**: Chief Orchestrator (Chair)  
> **Purpose**: Guide for managing Observability Committee sessions effectively

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
| Discovery | 3 domain experts + 1 historian + 1 skeptic |
| Design | 4 specialists + 2 skeptics + 1 historian |
| Implementation | 3 technical + 2 skeptics + 1 QA |
| Review | 2 domain experts + 2 skeptics + 1 historian |
| Incident | 3 relevant experts + 2 skeptics + incident archaeologist |
| Research | 2 domain experts + research librarian |

### 3. Skeptic Assignment

Every session must have at least one active skeptic. Assign based on topic:

| Topic | Primary Skeptic | Secondary Skeptic |
|-------|-----------------|-------------------|
| Logging patterns | Performance Paranoid | Complexity Auditor |
| Metrics design | Scale Skeptic | Cost Hawk |
| Tracing implementation | Integration Cynic | Performance Paranoid |
| Dashboard creation | Maintenance Pessimist | Simplicity Zealot |
| Infrastructure changes | Vendor Lock-in Warner | Security Pessimist |
| New abstractions | Complexity Auditor | Simplicity Zealot |
| Cost decisions | Cost Hawk | Scale Skeptic |
| Standards adoption | Devil's Advocate General | Maintenance Pessimist |

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

This is Dr. Alexandra Chen, Chief Orchestrator, calling to order session 
[YYYY-MM-DD_NNN_session-code].

**SESSION GOAL**: [Primary objective]

**SESSION TYPE**: [Discovery/Design/Implementation/Review/Incident/Research]

**ACTIVATED MEMBERS**:
- [Member 1, Role] - [Reason for activation]
- [Member 2, Role] - [Reason for activation]
- ...

**ASSIGNED SKEPTICS**:
- Primary: [Skeptic Name] - will challenge on [aspect]
- Secondary: [Skeptic Name] - will challenge on [aspect]

**CLERICAL ASSIGNMENTS**:
- Session Clerk: Begin transcript
- Research Librarian: On standby for investigations
- Artifact Archivist: Prepare for outputs

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
```

---

## During Session Management

### Facilitation Responsibilities

1. **Manage Speaking Order**
   - Maintain queue of members wishing to speak
   - Ensure skeptics get regular challenge windows
   - Prevent any member from dominating

2. **Keep Discussion On-Track**
   - Redirect tangents: "Let's note that for a future session and return to [topic]"
   - Summarize progress: "We've established X, Y remains open"
   - Time-box discussions: "Let's spend 10 more minutes on this before moving on"

3. **Ensure Protocol Compliance**
   - Remind members to identify themselves
   - Enforce handoff protocol
   - Ensure research is declared

### Intervention Phrases

| Situation | Chair Response |
|-----------|---------------|
| Member not identifying | "Please identify yourself for the record." |
| Discussion going off-track | "Let's table that and return to [goal]. We can address [tangent] in a follow-up session." |
| Skeptic being ignored | "Before we proceed, let's hear the skeptic's challenge on this point." |
| Deadlock | "We seem at impasse. Let me summarize the positions and we'll take a structured vote." |
| Research needed | "Research Librarian, please investigate [topic] and report back." |
| Human Director input needed | "This decision requires Human Director input. Let's document the options and await guidance." |
| Complexity creeping | "Complexity Auditor, is this addition justified?" |
| Performance concern | "Performance Paranoid, what's your assessment of the overhead?" |
| Cost concern | "Cost Hawk, what's the resource impact of this approach?" |

### Challenge Round Protocol

At natural breakpoints (after proposals, before decisions):

```markdown
---
**CHAIR**: We now enter a challenge round. Skeptics, please raise your concerns.

[Primary Skeptic raises concern]
[Proposer responds]
[Secondary Skeptic raises concern]
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
3. **Call for challenges**: "Skeptics, any remaining concerns?"
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
- [Skeptic]: [Concern] → [Resolution]

**Vote**: 
- In Favor: [N]
- Opposed: [N] ([Names])
- Abstaining: [N]

**Result**: APPROVED / REJECTED / TABLED

**Dissenting Opinions**:
[If any, include full text]

**Implementation Notes**:
[Any specific guidance]
```

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
**CHAIR**: Artifact Archivist, please read the action items captured.

[Archivist reads items]

**CHAIR**: Are there any additions or corrections?
```

### Step 3: Closing Statement

```markdown
---
**CHAIR CLOSING STATEMENT**
---

This session [YYYY-MM-DD_NNN_session-code] is now CLOSED.

**Decisions Made**: [N]
**Action Items**: [N]
**Follow-up Sessions Needed**: [List if any]

The record will be finalized by the Session Clerk.
All artifacts will be filed by the Artifact Archivist.
STATUS.md will be updated to reflect current state.

Thank you to all participating members.
---
```

### Step 4: Post-Session Updates

1. Finalize transcript
2. Complete decisions.md
3. Complete action_items.md
4. File any artifacts
5. Update STATUS.md to show session closed
6. Update Session History in STATUS.md

---

## Observability-Specific Protocols

### Discovery Session Protocol

When discovering current state:

1. **Research Librarian** searches codebase for existing patterns
2. **Domain experts** analyze what they find
3. **Skeptics** identify gaps and risks
4. **Session Historian** documents findings
5. **Chair** synthesizes into current state assessment

### Design Session Protocol

When designing new patterns:

1. **Domain experts** propose patterns
2. **Skeptics** challenge (especially Complexity Auditor, Performance Paranoid)
3. **Committee** iterates on design
4. **Chair** calls for consensus
5. **Artifact Archivist** documents pattern

### Implementation Session Protocol

When implementing:

1. **Technical experts** propose implementation
2. **QA specialists** identify test requirements
3. **Skeptics** challenge (especially Integration Cynic)
4. **Committee** approves approach
5. **Code artifacts** created in session folder

### Review Session Protocol

When reviewing existing work:

1. **Historians** provide context
2. **Domain experts** assess quality
3. **Skeptics** identify issues
4. **Committee** decides on changes needed
5. **Action items** assigned

---

## Emergency Protocols

### Crisis Session Activation

When an urgent observability issue arises:

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
- [ ] Were skeptics given adequate challenge opportunities?
- [ ] Did discussion stay focused on goal?
- [ ] Were decisions recorded clearly?
- [ ] Were dissenting views captured?
- [ ] Did the session achieve its objective?
- [ ] Were observability best practices followed?
- [ ] Were implementation details concrete enough to act on?

---

*"A well-orchestrated session is invisible; participants remember only the outcome."*

