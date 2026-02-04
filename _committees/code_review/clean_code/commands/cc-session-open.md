# /cc-session-open

> Opens a new Clean Code Review Committee session with full persona embodiment.

---

## Usage

```
/cc-session-open [target-file-or-folder]
```

---

## What This Command Does

1. **Creates a new session** with a unique ID
2. **Sets up the session folder** with all required files
3. **Updates SESSION_INDEX.md** with the new session
4. **Begins the review workflow** with the Moderator opening the session

---

## Workflow

When invoked, the AI will:

### 1. Session Setup (Behind the scenes)
- Generate session ID: `[target-name]_[YYYY-MM-DD]`
- Create session folder in `sessions/`
- Initialize SESSION_STATE.md
- Update SESSION_INDEX.md

### 2. Moderator Opens Session

The AI embodies **🎯 Leadership: Moderator** and:
- Greets the committee
- Introduces the target being reviewed
- Sets context and stakes
- Introduces who will participate
- Hands off to Code Researcher

### 3. Code Researcher Analyzes

The AI embodies **🔍 Clerical: Code Researcher** and:
- Analyzes the target code
- Provides statistics and structure
- Flags potential concerns for reviewers
- Saves analysis to `context.md`
- Hands off to first reviewer

### 4. Continue Through Turn Order

The session continues through the full turn order defined in `TURN_ORDER.md`, with each member embodying their persona.

---

## Example Invocation

```
/cc-session-open src/core/Ky.ts
```

**Output**:

```
📁 Session Created: ky-ts_2026-02-04
📍 Location: sessions/ky-ts_2026-02-04/

---

**🎯 Leadership: Moderator**:

Good morning, committee. I'm calling this Clean Code Review session to order.

*shuffles notes*

Today we're examining `src/core/Ky.ts`, the core of the Ky HTTP client library...

[continues with full persona embodiment]
```

---

## Session State

After opening, the session state will show:

| Field | Value |
|-------|-------|
| **Status** | 🟢 ACTIVE |
| **Current Turn** | 🎯 Moderator → 🔍 Code Researcher |
| **Phase** | 1. Session Opening |

---

## Human Director Role

As the Human Director, you can:
- **Interrupt** at any time to ask questions or provide direction
- **Skip** members if their review isn't needed
- **Request focus** on specific areas
- **Pause** the session with `/cc-session-pause`

---

## Related Commands

- `/cc-session-status` - Check current session state
- `/cc-session-pause` - Pause the session
- `/cc-session-close` - Close the session
