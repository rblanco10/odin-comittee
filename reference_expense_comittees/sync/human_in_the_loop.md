# Sync Committee Human-in-the-Loop

> **Defines when and how humans intervene in the committee's work.**

---

## Philosophy

The committee is designed to do the heavy lifting of analysis and deliberation. Humans:
1. **Push the workflow forward** — Triggering new cycles, resuming paused sessions
2. **Make final decisions** — Approving recommendations, resolving conflicts
3. **Provide direction** — Redirecting focus, expanding or limiting scope
4. **Inject external context** — Information the committee doesn't have access to

The committee is NOT fully autonomous. It's a **human-augmented** system.

---

## Checkpoint Types

### 1. Direction Check
**Trigger:** 5+ turns since last human input, or major finding that changes direction

**Purpose:** Ensure the committee is still on track

**Human Actions:**
- Review recent context in `shared_context.md`
- Confirm direction: "Continue as-is"
- Redirect: "Focus on X instead" or "Skip Y for now"
- End session: "Good stopping point, let's pause here"

**Format:**
```
[DIRECTION CHECK]

Committee has been deliberating for [N] turns.

Recent focus:
- [Summary of recent contributions]

Current pending handoffs:
- [List of pending handoffs]

Human, please:
1. Confirm we should continue as-is, OR
2. Redirect focus to a specific area, OR
3. End this session

Your input: ___
```

---

### 2. Conflict Resolution
**Trigger:** Unresolved disagreement after Path Defender attempt

**Purpose:** Human makes a judgment call when the committee can't resolve internally

**Human Actions:**
- Review the conflict in `shared_context.md`
- Side with one position: "Go with Option A"
- Request more debate: "Need more from [Member] on this"
- Table it: "Document as open question, move on"
- Escalate: "This needs external input (product, eng lead, etc.)"

**Format:**
```
[CONFLICT RESOLUTION NEEDED]

The following disagreement could not be resolved:

Position A ([Member]):
[Summary of position]

Position B ([Member]):
[Summary of position]

Path Defender's attempt to mediate:
[What was tried]

Human, please:
1. Side with a position
2. Request more debate from specific members
3. Table as open question
4. Escalate outside the committee

Your input: ___
```

---

### 3. Scope Decision
**Trigger:** Potential scope creep identified by Chair or member

**Purpose:** Human decides whether to expand scope

**Human Actions:**
- Approve expansion: "Yes, include X in this review"
- Reject expansion: "No, keep focus narrow. Note X for future review."
- Split: "Address X separately in a follow-up session"

**Format:**
```
[SCOPE DECISION NEEDED]

Current scope: [Description of original scope]

Proposed expansion: [What's being suggested to add]

Raised by: [Member]
Reason: [Why they think it's in scope]

Potential impact:
- Time: [Estimate]
- Complexity: [Assessment]

Human, please:
1. Approve scope expansion
2. Reject and keep focus narrow
3. Split into separate session

Your input: ___
```

---

### 4. Decision Gate
**Trigger:** Committee has formed a recommendation

**Purpose:** Human makes the final approval/rejection

**Human Actions:**
- Approve: "Approved. Proceed with implementation."
- Reject: "Rejected. [Reason]"
- Conditional: "Approved with conditions: [List conditions]"
- Request revision: "Need changes: [What needs to change]"

**Format:**
```
[DECISION GATE]

The committee has formed a recommendation:

**Recommendation:** [Summary]

**Supporting findings:**
- [Finding 1]
- [Finding 2]

**Gaps identified:**
- [Gap 1]
- [Gap 2]

**Dissents/concerns:**
- [Member]: [Their concern]

**Confidence level:** [High/Medium/Low]

Human, please:
1. Approve
2. Approve with conditions
3. Reject
4. Request revision

Your input: ___
```

---

### 5. Session Control
**Trigger:** Natural stopping points, or human-initiated

**Purpose:** Control session lifecycle

**Human Actions:**
- Continue: "Keep going"
- Pause: "Pause here, we'll resume later"
- End: "Session complete, capture final state"
- New intake: "Let's switch to reviewing [new item]"

**Format:**
```
[SESSION CONTROL]

Current session: [Session ID]
State: [Current state]
Turn count: [N]

Options:
1. Continue deliberation
2. Pause session (can resume later)
3. End session (finalize state)
4. Start new intake

Your input: ___
```

---

## Human Input Formats

### Quick Commands
For efficiency, humans can use short commands:

| Command | Effect |
|---------|--------|
| `continue` | Proceed with current trajectory |
| `pause` | Pause session, preserve state |
| `end` | End session, capture final state |
| `focus [topic]` | Redirect committee to focus on [topic] |
| `skip [member]` | Skip pending handoff to [member] |
| `route [member]` | Add [member] to pending handoffs |
| `approve` | Approve current recommendation |
| `reject` | Reject current recommendation |
| `table` | Table current item as open question |

### Extended Input
For more nuanced direction, humans can provide free-form input that the Chair will interpret and translate into committee actions.

---

## Human Visibility

At each checkpoint, humans should have access to:

1. **Session state** (`session_state.md`) — Current state, pending handoffs
2. **Recent context** (`shared_context.md`, last 3-5 turns) — What was just discussed
3. **Open questions** — Unresolved items
4. **Pending artifacts** — Gaps/findings not yet finalized

---

## Intervention Frequency

Recommended human interaction frequency:

| Session Intensity | Recommended Check-in |
|-------------------|---------------------|
| **Light review** | Every 5-7 turns |
| **Standard review** | Every 3-5 turns |
| **Complex/contentious** | Every 1-3 turns |
| **Deep dive** | Every 2-3 turns |

The committee will auto-pause and request input if the human hasn't interacted within the recommended window.

---

## Emergency Override

At any time, a human can:

```
OVERRIDE: [instruction]
```

This immediately:
1. Pauses all pending handoffs
2. Captures current state
3. Applies the human's instruction
4. Resumes from the new state

Use sparingly — overrides disrupt the natural flow of deliberation.

