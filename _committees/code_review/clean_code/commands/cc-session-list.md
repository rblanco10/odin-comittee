# /cc-session-list

> Lists all Clean Code Review sessions with their status.

---

## Usage

```
/cc-session-list [optional: filter]
```

Filters: `active`, `paused`, `completed`, `all` (default)

---

## What This Command Does

1. **Reads SESSION_INDEX.md**
2. **Lists all sessions** by status
3. **Shows key metrics** for each session
4. **Provides quick actions** for each

---

## Example Invocation

```
/cc-session-list
```

**Output**:

```
**🎯 Leadership: Moderator**:

*opens the session ledger*

Here are all Clean Code Review sessions:

---

## Active Sessions (1)

| Session | Target | Started | Progress |
|---------|--------|---------|----------|
| `ky-ts_2026-02-04` | src/core/Ky.ts | 2 hours ago | Phase 4/9 |

**Quick Actions**: `/cc-session-status ky-ts_2026-02-04`

---

## Paused Sessions (1)

| Session | Target | Paused | Reason |
|---------|--------|--------|--------|
| `auth-service_2026-02-03` | src/auth/ | 1 day ago | Waiting for team input |

**Quick Actions**: `/cc-session-resume auth-service_2026-02-03`

---

## Completed Sessions (3)

| Session | Target | Completed | Findings |
|---------|--------|-----------|----------|
| `user-api_2026-02-02` | src/api/user.ts | 2 days ago | 6 |
| `utils_2026-02-01` | src/utils/ | 3 days ago | 4 |
| `config_2026-01-30` | src/config.ts | 5 days ago | 2 |

**Quick Actions**: View reports in `sessions/[session-id]/report.md`

---

## Summary

| Status | Count |
|--------|-------|
| 🟢 Active | 1 |
| ⏸️ Paused | 1 |
| ✅ Completed | 3 |
| **Total** | **5** |

---

*Use `/cc-session-open [target]` to start a new session.*
```

---

## Filtered Example

```
/cc-session-list paused
```

**Output**:

```
**🎯 Leadership: Moderator**:

Showing paused sessions only:

| Session | Target | Paused | Reason | Open Issues |
|---------|--------|--------|--------|-------------|
| `auth-service_2026-02-03` | src/auth/ | 1 day ago | Waiting for team input | 2 |

To resume: `/cc-session-resume auth-service_2026-02-03`
```

---

## If No Sessions

```
**🎯 Leadership: Moderator**:

No sessions found.

The committee hasn't conducted any reviews yet.

Use `/cc-session-open [target]` to start your first session.
```

---

## Related Commands

- `/cc-session-open` - Start a new session
- `/cc-session-status` - Check a specific session
- `/cc-session-resume` - Resume a paused session
