# Sync Committee Documentation Governance

> **Purpose:** Prevent unbounded growth of committee context files while preserving institutional knowledge.

---

## Document Responsibilities

| Document | Purpose | Growth Pattern | Max Size |
|----------|---------|----------------|----------|
| `session_state.md` | Current session metadata & progress | Reset per session | ~150 lines |
| `shared_context.md` | Permanent knowledge + current session turns | Distill & archive | ~400 lines |
| `GOVERNANCE.md` | This file - process documentation | Stable | ~200 lines |

---

## Session Lifecycle

### 1. Session Start

```
1. Chair creates new session ID: SC-YYYY-MM-DD-NNN
2. Reset session_state.md with new session metadata
3. Clear "Current Session Context" section in shared_context.md
4. Log session start in session_state.md
```

### 2. During Session

```
1. Scribe appends turn entries to "Current Session Context" in shared_context.md
2. Chair updates session_state.md with goals, decisions, progress
3. Members create artifacts in artifacts/reviews/{review-name}/
```

### 3. Session Close

```
1. Create session archive folder: artifacts/sessions/{session-id}/
2. Archive current session_state.md → artifacts/sessions/{session-id}/session_state.md
3. Archive current session turns → artifacts/sessions/{session-id}/context.md
4. Distill key learnings → add to "Permanent Knowledge" section
5. Clear "Current Session Context" section
6. Reset session_state.md for next session
```

---

## shared_context.md Structure

```markdown
# Sync Committee Shared Context

## Permanent Knowledge
### Key Discoveries
### Design Decisions  
### Gaps Identified
### Artifacts Index

## Current Session Context
### Turn N — YYYY-MM-DD
(entries for current session only)
```

### Permanent Knowledge Guidelines

**Include:**
- Architectural decisions with rationale
- Discovered platform quirks (e.g., NetSuite date format)
- Gap IDs and their resolution status
- Links to important artifacts

**Exclude:**
- Turn-by-turn discussion details
- Intermediate findings that were superseded
- Verbose code traces (link to artifacts instead)

---

## Archive Folder Structure

```
committees/sync/
├── session_state.md          # Current session only
├── shared_context.md         # Permanent + current session
├── GOVERNANCE.md             # This file
└── artifacts/
    ├── sessions/             # Archived sessions
    │   ├── SC-2025-12-21-001/
    │   │   ├── session_state.md
    │   │   └── context.md
    │   └── SC-2025-12-22-001/
    │       ├── session_state.md
    │       └── context.md
    ├── reviews/              # Review-specific artifacts
    │   ├── scale-review-2024-12-21/
    │   ├── multi-entity-2024-12-21/
    │   └── capacity-planning-2024-12-22/
    └── handoff-protocol.md   # Implementor handoff process
```

---

## Size Limits

| Section | Target | Max |
|---------|--------|-----|
| Permanent Knowledge | 150 lines | 250 lines |
| Current Session Context | 100 lines | 200 lines |
| session_state.md | 80 lines | 150 lines |

If limits are exceeded, it's time to archive and distill.

---

## Quick Reference: Session Close Checklist

- [ ] Create `artifacts/sessions/{session-id}/` folder
- [ ] Copy `session_state.md` to archive folder
- [ ] Extract current session turns from `shared_context.md` to `context.md` in archive
- [ ] Distill 3-5 key learnings to "Permanent Knowledge"
- [ ] Clear "Current Session Context" section
- [ ] Update session_state.md state to `SESSION_CLOSED`
- [ ] Increment session counter for next session

---

*Governance document created by Sync Committee Chair, 2025-12-22*

