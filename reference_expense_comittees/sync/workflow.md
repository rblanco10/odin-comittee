# Sync Committee Workflow

> **A dynamic, state-driven conversation graph where work flows between members based on context, accumulating toward the committee's goal.**

---

## Core Principles

### 1. Not a Pipeline
The workflow is NOT:
```
Plan → Audit → Sign-Off → Done
```

The workflow IS:
```
[State] → [Route to 1-5 members] → [They contribute] → [Context grows] → [New state] → [Route again] → ...
```

### 2. Context Accumulates
Every member contribution adds to `shared_context.md`. Nothing is lost. The collective intelligence grows with each turn.

### 3. Routing is Dynamic
Who speaks next depends on:
- What was just said
- What gaps/questions were raised
- What expertise is needed to respond
- The current goal

### 4. Human-in-the-Loop Drives Progress
The committee doesn't run autonomously forever. Humans push it forward at checkpoints, provide direction, and can redirect at any time.

---

## Session States

The committee operates in one of these states:

| State | Description | Typical Next Actions |
|-------|-------------|---------------------|
| `AWAITING_INTAKE` | No active work; waiting for new item to review | Intake Coordinator prepares materials |
| `INTAKE_PREPARED` | Materials ready; meeting can convene | Chair convenes, sets agenda |
| `MEETING_ACTIVE` | Committee is actively deliberating | Members contribute, handoffs occur |
| `AWAITING_HUMAN` | Paused at checkpoint for human input | Human reviews, provides direction |
| `CONVERGING` | Committee is close to resolution | Final challenges, dissent capture |
| `DECISION_PENDING` | Recommendation formed, awaiting sign-off | Human makes final call |

---

## The Turn Cycle

Each "turn" follows this pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  1. ASSESS STATE                                            │
│     - Read session_state.md                                 │
│     - Read shared_context.md (recent entries)               │
│     - Identify pending handoffs                             │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ROUTE TO MEMBERS                                        │
│     - Apply routing_rules.md                                │
│     - Select 1-5 members based on context                   │
│     - Each member takes on their persona                    │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  3. MEMBER CONTRIBUTION                                     │
│     - Member performs their defined work                    │
│     - Produces artifacts (findings, questions, concerns)    │
│     - Explicitly states handoff recommendations             │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CONTEXT ACCUMULATION                                    │
│     - Scribe captures contribution to shared_context.md     │
│     - Session state updated with new handoffs               │
│     - Decision points noted                                 │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  5. CHECKPOINT EVALUATION                                   │
│     - Should we pause for human input?                      │
│     - Is a decision point reached?                          │
│     - Are there conflicting recommendations?                │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
          [Continue to next turn OR pause for human]
```

---

## Routing Logic

### Trigger-Based Routing

When a member produces output, their handoff recommendations trigger routing:

| Trigger | Routes To |
|---------|-----------|
| "This raises architectural concerns" | Sync Architect |
| "Need NetSuite-specific context" | NetSuite Domain Expert |
| "This affects how AP teams work" | Accounts Payable Expert |
| "Is this how it was designed?" | Architecture Presenter |
| "Was this decided before?" | Precedent Keeper |
| "What are the edge cases?" | Edge Case Hunter |
| "Does the code match the plan?" | Code Fidelity Auditor |
| "Is this observable?" | Observability Auditor |
| "How will users experience this?" | End User Advocate |
| "What about other ERPs?" | Multi-ERP Generalist |
| "This needs to be challenged" | Path Defender (to advocate) OR appropriate critic |
| "I disagree with this approach" | Path Defender (to mediate) |
| "We need to document this" | Scribe |
| "This feels like scope creep" | Chair (to refocus) |

### State-Based Routing

Some routing is based on session state, not triggers:

| State | Default Routing |
|-------|-----------------|
| `AWAITING_INTAKE` | Intake Coordinator |
| `INTAKE_PREPARED` | Chair |
| `MEETING_ACTIVE` | Based on pending handoffs |
| `AWAITING_HUMAN` | Wait for human |
| `CONVERGING` | Chair + dissenters |
| `DECISION_PENDING` | Human |

### Parallel Routing

Multiple members can be routed simultaneously when their perspectives are independent:

```
Example: A new sync handler is proposed

Routed in parallel:
├── Sync Architect (structural soundness)
├── Data Mapping Specialist (transformation logic)
├── NetSuite Domain Expert (provider-specific concerns)
└── Standards Enforcer (pattern compliance)

They contribute independently, then their outputs may trigger further routing.
```

---

## Handoff Patterns

### The "And Also" Pattern
Member A's contribution triggers multiple follow-ups:
```
Edge Case Hunter: "What if the vendor is deleted mid-sync?"
  → Routes to: Sync Architect AND Error Handling AND Data Quality Specialist
```

### The "Debate" Pattern
Conflicting views require mediation:
```
Sync Architect: "We should roll back on failure"
NetSuite Expert: "NetSuite doesn't support transactional rollback"
  → Routes to: Path Defender (to mediate) + Chair (if unresolved)
```

### The "Deep Dive" Pattern
A topic needs focused exploration:
```
Chair: "Let's focus on dimension sync specifically"
  → Routes to: GL Expert + Data Mapping Specialist + NetSuite Expert
  → Other members pause until deep dive completes
```

### The "Checkpoint" Pattern
Natural pause for human input:
```
After 5+ contributions, Chair evaluates:
  - "We've covered a lot. Pausing for human review."
  → State changes to AWAITING_HUMAN
```

---

## Context Accumulation Format

Every contribution is captured in `shared_context.md` with this structure:

```markdown
## Turn [N] - [Timestamp]

### Active Members
- [Member Name] (role)

### Contributions

#### [Member Name]
**Perspective:** [What lens they're applying]

**Observation/Finding:**
[Their contribution]

**Artifacts Produced:**
- [List any gaps, findings, decisions]

**Handoff Recommendations:**
- Routes to: [Member 1], [Member 2]
- Reason: [Why these members need to respond]

---
```

---

## Human Checkpoints

The committee pauses for human input at these points:

| Checkpoint | Trigger | Human Action |
|------------|---------|--------------|
| **Direction Check** | 5+ turns without human input | Review progress, provide direction |
| **Conflict Resolution** | Unresolved disagreement | Make a call or request more debate |
| **Scope Decision** | Potential scope creep identified | Confirm or reject scope expansion |
| **Decision Gate** | Committee has a recommendation | Approve, reject, or request changes |
| **Session End** | Natural stopping point | End session or continue |

---

## Convergence

The committee converges toward resolution when:

1. **All relevant perspectives heard** — No pending handoffs to domain experts
2. **No unresolved conflicts** — Disagreements are documented but not blocking
3. **Gaps documented** — Known unknowns are captured in gaps.md
4. **Recommendation formed** — The committee has a position
5. **Dissents captured** — Any minority opinions are recorded

Convergence is not "agreement" — it's "we've heard everyone and have a recommendation (with noted dissents)."

---

## Session Persistence

Between human interactions, state is preserved in:

- `session_state.md` — Current state, pending handoffs, active goal
- `shared_context.md` — All accumulated contributions
- `artifacts/reviews/[session-id]/` — Any produced artifacts

The committee can be paused and resumed at any point without losing context.

