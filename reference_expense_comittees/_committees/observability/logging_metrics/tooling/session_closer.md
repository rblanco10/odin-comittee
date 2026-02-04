# Session Closing Protocol

> **Purpose**: Step-by-step guide to closing a committee session

---

## Pre-Closing Checklist

- [ ] All agenda items addressed (or explicitly deferred)
- [ ] All decisions recorded
- [ ] All action items captured
- [ ] Skeptic challenges resolved
- [ ] Human Director input obtained (if needed)

---

## Step 1: Request Summary

Chair requests summary from Session Historian:

```markdown
**CHAIR**: Session Historian, please provide a summary of today's proceedings.

[Session Historian summarizes]

**CHAIR**: Are there any corrections to the summary?
```

---

## Step 2: Review Action Items

Chair requests action item review:

```markdown
**CHAIR**: Minute Keeper, please read the action items captured.

[Minute Keeper reads items]

**CHAIR**: Are there any additions or corrections?
```

---

## Step 3: Identify Follow-ups

Chair identifies any follow-up sessions needed:

```markdown
**CHAIR**: Based on today's discussion, the following follow-up sessions are needed:

1. [Topic 1] - [Reason]
2. [Topic 2] - [Reason]
```

---

## Step 4: Closing Statement

Chair delivers closing statement:

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

---

## Step 5: Finalize Documents

### Transcript
- Add closing statement
- Add session statistics
- Mark as finalized

### Decisions
- Ensure all decisions are recorded
- Include vote counts
- Include dissenting opinions

### Action Items
- Ensure all items have owners
- Set due dates where applicable
- Note any blocked items

### Artifacts
- File all outputs in artifacts/ folder
- Index in session folder

---

## Step 6: Update STATUS.md

Update STATUS.md to reflect session closure:

```markdown
## Last Completed Session

**Session**: YYYY-MM-DD_NNN_session-code
**Goal**: [Goal]
**Opened**: [Date]
**Closed**: [Date]
**Status**: ✅ COMPLETED

**Key Decisions**:
1. [Decision 1]
2. [Decision 2]

**Action Items**: [N] items assigned
```

Update Session History:

```markdown
| Date | Code | Session | Outcome |
|------|------|---------|---------|
| YYYY-MM-DD | NNN | session-code | ✅ Completed |
```

---

## Step 7: Notify Stakeholders

If applicable:
- Notify Human Director of key decisions
- Notify affected subcommittees
- Schedule follow-up sessions

---

## Session Pause (Alternative to Close)

If session needs to pause rather than close:

```markdown
**CHAIR**: This session is PAUSED, not closed.

**Current State**: [Where we are]
**Pending Items**: [What remains]
**Next Speaker on Resume**: [Who will speak next]

STATUS.md will reflect paused state.
```

Update STATUS.md:
```markdown
**Status**: ⏸️ PAUSED - [Reason]
```

---

*"A well-closed session preserves its value for the future."*

