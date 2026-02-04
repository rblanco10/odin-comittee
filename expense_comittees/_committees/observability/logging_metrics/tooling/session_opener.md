# Session Opening Protocol

> **Purpose**: Step-by-step guide to opening a committee session

---

## Pre-Session Checklist

- [ ] Goal is clearly defined
- [ ] Session type is determined
- [ ] Required members identified
- [ ] Skeptics assigned
- [ ] Historical context reviewed (if applicable)

---

## Step 1: Determine Session Type

| Type | When to Use |
|------|-------------|
| Discovery | Understanding current state |
| Design | Creating patterns or standards |
| Implementation | Building and deploying |
| Review | Auditing existing work |
| Incident | Post-incident analysis |
| Research | Deep investigation |

---

## Step 2: Define Goal

Use this template:

```markdown
**Primary Objective**: [One sentence]

**Success Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Scope**:
- IN SCOPE: [What we will address]
- OUT OF SCOPE: [What we will NOT address]
```

---

## Step 3: Identify Members

### Always Activate
- Chair (Dr. Alexandra Chen)
- Session Clerk (Marcus Webb)

### Based on Topic
- Relevant domain experts
- Relevant subcommittee members
- Research Librarian (if research needed)
- Session Historian (if historical context needed)

### Skeptics (minimum 1)
- Select based on topic
- See member_activation_rules.md

---

## Step 4: Create Session Folder

```
sessions/YYYY-MM-DD_NNN_session-code/
├── goal.md           # Copy from template, fill in
├── transcript.md     # Copy from template
├── decisions.md      # Copy from template
└── action_items.md   # Copy from template
```

Naming: `YYYY-MM-DD_NNN_session-code`
- Date: Today's date
- NNN: Next sequential number for today
- session-code: Short kebab-case description

---

## Step 5: Update STATUS.md

Update the Active Session section:

```markdown
## Active Session

**Session**: YYYY-MM-DD_NNN_session-code
**Goal**: [Primary objective]
**Opened**: [Timestamp]
**Active Members**: [List]
**Status**: IN PROGRESS
```

---

## Step 6: Opening Statement

Chair delivers opening statement:

```markdown
---
**CHAIR OPENING STATEMENT**
---

This is Dr. Alexandra Chen, Chief Orchestrator, calling to order session 
[YYYY-MM-DD_NNN_session-code].

**SESSION GOAL**: [Primary objective]

**SESSION TYPE**: [Type]

**ACTIVATED MEMBERS**:
- [Member 1, Role] - [Reason]
- [Member 2, Role] - [Reason]

**ASSIGNED SKEPTICS**:
- Primary: [Name] - will challenge on [aspect]
- Secondary: [Name] - will challenge on [aspect]

**CLERICAL ASSIGNMENTS**:
- Session Clerk: Begin transcript
- Research Librarian: On standby
- Artifact Archivist: Prepare for outputs

The floor is now open. I call upon [First Speaker] to begin.
---
```

---

## Step 7: Begin Discussion

- First speaker introduces topic
- Discussion proceeds per protocol
- Chair manages flow
- Skeptics challenge at appropriate points
- Decisions recorded as made

---

*"A well-opened session sets the tone for success."*

