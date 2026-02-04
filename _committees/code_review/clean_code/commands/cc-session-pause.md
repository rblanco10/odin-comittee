# /cc-session-pause

> Pauses the current Clean Code Review session, saving state for later resumption.

---

## Usage

```
/cc-session-pause [optional: reason]
```

---

## What This Command Does

1. **Saves current state** to SESSION_STATE.md
2. **Records the pause point** (which member, which phase)
3. **Updates SESSION_INDEX.md** to show paused status
4. **Provides a summary** of progress and open issues

---

## When to Use

- Need to step away but want to continue later
- Waiting for additional information
- Want to review findings before continuing
- Need to discuss with team before proceeding

---

## Example Invocation

```
/cc-session-pause Need to check with team about architecture decision
```

**Output**:

```
**🎯 Leadership: Moderator**:

*raises hand*

I'm pausing this session at the request of the Human Director.

---

## Session Paused

| Field | Value |
|-------|-------|
| **Session** | ky-ts_2026-02-04 |
| **Paused At** | 2026-02-04 14:32 UTC |
| **Reason** | Need to check with team about architecture decision |

---

## Progress Summary

| Phase | Status |
|-------|--------|
| ✅ Session Opening | Complete |
| ✅ Code Analysis | Complete |
| ✅ Universal Review | Complete |
| ⏸️ Language Review | **Paused here** |
| ⬜ Critical Review | Pending |
| ⬜ Report Compilation | Pending |

---

## Current State

**Last Active Member**: 💛 Specialist: JavaScript Idioms
**Findings So Far**: 8
**Open Issues**: 1

---

## Open Issues

| ID | Issue | Raised By |
|----|-------|-----------|
| #1 | Architecture decision needed: split Ky class? | 🏗️ Architecture |

---

## To Resume

Use `/cc-session-resume ky-ts_2026-02-04` to continue from this point.

Session state saved. See you when you return.
```

---

## What Gets Saved

- Current phase and turn
- All findings collected so far
- Open issues and decisions
- Member notes and context
- Timestamp of pause

---

## Related Commands

- `/cc-session-resume [session-id]` - Resume this session
- `/cc-session-status` - Check session state
- `/cc-session-list` - List all sessions
