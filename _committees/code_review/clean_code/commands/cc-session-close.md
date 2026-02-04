# /cc-session-close

> Formally closes a Clean Code Review session after completion.

---

## Usage

```
/cc-session-close [optional: session-id]
```

If no session-id is provided, closes the current active session.

---

## What This Command Does

1. **Verifies completion** - ensures all phases are done
2. **Finalizes the report** - saves to session folder
3. **Updates common issues log** - tracks patterns
4. **Archives the session** - moves to completed status
5. **Updates SESSION_INDEX.md** - records completion

---

## Prerequisites

Before closing, the session must have:
- ✅ All review phases completed
- ✅ Report compiled by Review Recorder
- ✅ Report validated by Standards Keeper
- ✅ Human Director approval

---

## Example Invocation

```
/cc-session-close
```

**Output**:

```
**🎯 Leadership: Moderator**:

*stands*

I'm now closing session `ky-ts_2026-02-04`.

---

## Session Closing

### Verification Checklist

| Requirement | Status |
|-------------|--------|
| All phases completed | ✅ |
| Report compiled | ✅ |
| Report validated | ✅ |
| Human approval | ✅ |

---

### Final Statistics

| Metric | Value |
|--------|-------|
| **Duration** | 2 hours 15 minutes |
| **Findings** | 9 total |
| **Must Fix** | 2 |
| **Should Fix** | 5 |
| **Nice to Have** | 2 |
| **Overrides** | 1 |
| **Challenges Accepted** | 2 |

---

### Artifacts Saved

| File | Location |
|------|----------|
| Final Report | `sessions/ky-ts_2026-02-04/report.md` |
| Context Analysis | `sessions/ky-ts_2026-02-04/context.md` |
| Individual Findings | `sessions/ky-ts_2026-02-04/findings/` |
| Challenges | `sessions/ky-ts_2026-02-04/challenges/` |

---

### Common Issues Updated

| Issue | New Count | Status |
|-------|-----------|--------|
| Silent error swallowing | 3 | ⚠️ Consider knowledge base entry |
| Floating promises | 5 | ⚠️ Consider knowledge base entry |

---

*addresses the committee*

Thank you all for your contributions today. This was a thorough review.

**🏷️ Naming & Readability** - Your naming analysis was particularly insightful.
**🚨 Error Handling** - Good catch on the silent failures.
**💛 JavaScript Idioms** - The override on underscore naming was well-reasoned.
**⚖️ Pragmatism** - Thank you for keeping us grounded.

The session is now closed. The report is available at:
`sessions/ky-ts_2026-02-04/report.md`

*gavels*

Session adjourned.
```

---

## If Prerequisites Not Met

```
**🎯 Leadership: Moderator**:

I cannot close this session yet. The following are incomplete:

| Requirement | Status |
|-------------|--------|
| All phases completed | ✅ |
| Report compiled | ✅ |
| Report validated | ❌ Missing |
| Human approval | ❌ Missing |

Please complete the remaining steps before closing.

Current phase: Quality Validation
Next action: 📏 Standards Keeper needs to validate the report
```

---

## Related Commands

- `/cc-session-status` - Check what's needed before closing
- `/cc-session-list` - List all sessions
