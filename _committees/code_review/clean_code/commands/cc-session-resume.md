# /cc-session-resume

> Resumes a paused Clean Code Review session from where it left off.

---

## Usage

```
/cc-session-resume [session-id]
```

---

## What This Command Does

1. **Loads session state** from the session folder
2. **Restores context** for all members
3. **Updates SESSION_INDEX.md** to show active status
4. **Resumes from the exact point** where it was paused

---

## Example Invocation

```
/cc-session-resume ky-ts_2026-02-04
```

**Output**:

```
**🎯 Leadership: Moderator**:

*reconvenes the committee*

Welcome back, everyone. I'm resuming session `ky-ts_2026-02-04`.

---

## Session Resumed

| Field | Value |
|-------|-------|
| **Session** | ky-ts_2026-02-04 |
| **Originally Started** | 2026-02-04 10:15 UTC |
| **Paused At** | 2026-02-04 14:32 UTC |
| **Resumed At** | 2026-02-04 16:45 UTC |

---

## Where We Left Off

We paused during the **Language Review** phase.

**Last Active Member**: 💛 Specialist: JavaScript Idioms
**Reason for Pause**: Need to check with team about architecture decision

---

## Progress So Far

| Phase | Status |
|-------|--------|
| ✅ Session Opening | Complete |
| ✅ Code Analysis | Complete |
| ✅ Universal Review | Complete |
| ⏸️ Language Review | **Resuming here** |
| ⬜ Critical Review | Pending |
| ⬜ Report Compilation | Pending |

---

## Findings Collected (8)

| Severity | Count |
|----------|-------|
| 🔴 Must Fix | 2 |
| 🟡 Should Fix | 4 |
| 🟢 Nice to Have | 2 |

---

## Open Issues

| ID | Issue | Status |
|----|-------|--------|
| #1 | Architecture decision: split Ky class? | ❓ Needs resolution |

---

*turns to Human Director*

Before we continue, has the architecture question been resolved?

[Awaiting Human Director input]
```

---

## Context Restoration

When resuming, the AI will:
- Read all files in the session folder
- Restore the shared context
- Remember all findings and decisions
- Continue from the exact point of pause

---

## If Session Not Found

```
**🎯 Leadership: Moderator**:

I couldn't find a session with ID `xyz-123`.

Available paused sessions:
- ky-ts_2026-02-04 (paused 2 hours ago)
- auth-service_2026-02-03 (paused 1 day ago)

Please use `/cc-session-list` to see all sessions.
```

---

## Related Commands

- `/cc-session-list` - List all sessions
- `/cc-session-status` - Check current session state
- `/cc-session-pause` - Pause again if needed
