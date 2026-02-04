# /cc-session-status

> Shows the current state of the active Clean Code Review session.

---

## Usage

```
/cc-session-status [optional: session-id]
```

If no session-id is provided, shows the current active session.

---

## What This Command Does

1. **Reads session state** from SESSION_STATE.md
2. **Shows progress** through all phases
3. **Lists findings** collected so far
4. **Shows open issues** and decisions
5. **Indicates next action** needed

---

## Example Invocation

```
/cc-session-status
```

**Output**:

```
**🎯 Leadership: Moderator**:

*checks notes*

Here's where we stand:

---

## Session Status: ky-ts_2026-02-04

| Field | Value |
|-------|-------|
| **Status** | 🟢 ACTIVE |
| **Target** | `src/core/Ky.ts` |
| **Language** | TypeScript |
| **Started** | 2026-02-04 10:15 UTC |
| **Duration** | 1 hour 23 minutes |

---

## Progress

| Phase | Status | Member |
|-------|--------|--------|
| 1. Session Opening | ✅ Complete | 🎯 Moderator |
| 2. Code Analysis | ✅ Complete | 🔍 Code Researcher |
| 3. Universal Review | ✅ Complete | All Universal Reviewers |
| 4. Language Review | ⏳ In Progress | 💛 JavaScript Idioms |
| 5. Critical Review | ⬜ Pending | Critics |
| 6. Report Compilation | ⬜ Pending | 📝 Review Recorder |
| 7. Quality Validation | ⬜ Pending | 📏 Standards Keeper |
| 8. Human Approval | ⬜ Pending | Human Director |
| 9. Session Closing | ⬜ Pending | 🎯 Moderator |

---

## Current Turn

**Active Member**: 💛 Specialist: JavaScript Idioms
**Phase**: Language Review
**Action**: Reviewing JS/TS-specific patterns

---

## Findings So Far (8)

| Severity | Count | From |
|----------|-------|------|
| 🔴 Must Fix | 2 | 🚨 Error Handling |
| 🟡 Should Fix | 4 | Various |
| 🟢 Nice to Have | 2 | 🏷️ Naming |

---

## Open Issues (1)

| ID | Issue | Raised By | Status |
|----|-------|-----------|--------|
| #1 | Split Ky class into smaller modules? | 🏗️ Architecture | ❓ Needs discussion |

---

## Decisions Made (2)

| Decision | Made By |
|----------|---------|
| Keep underscore prefix for private methods | 💛 JS Idioms (override) |
| Focus on error handling over naming | Human Director |

---

## Next Action

💛 JavaScript Idioms is completing their review. After that:
→ ⚖️ Pragmatism Critic will challenge findings
→ 🔗 Consistency Critic will check patterns

---

*To continue, just respond or wait for the current member to complete.*
```

---

## If No Active Session

```
**🎯 Leadership: Moderator**:

There is no active session at the moment.

**Recent Sessions**:
| Session | Status | Last Activity |
|---------|--------|---------------|
| ky-ts_2026-02-04 | ⏸️ Paused | 2 hours ago |
| auth-service_2026-02-03 | ✅ Completed | 1 day ago |

Use `/cc-session-open [target]` to start a new session.
Use `/cc-session-resume [session-id]` to continue a paused session.
```

---

## Related Commands

- `/cc-session-open` - Start a new session
- `/cc-session-resume` - Resume a paused session
- `/cc-session-pause` - Pause the current session
- `/cc-session-list` - List all sessions
