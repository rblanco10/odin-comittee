# Committee Memory

> **Purpose**: Persistent context that carries across sessions  
> **Inspired by**: [MetaGPT](https://github.com/geekan/MetaGPT) shared memory patterns

---

## Overview

The memory folder maintains institutional knowledge that persists between committee sessions. Unlike session-specific documents (in `sessions/`), these files represent accumulated wisdom and ongoing concerns.

---

## Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `session_context.md` | Current focus and recent context | Every session |
| `decision_precedents.md` | Quick reference for past decisions | After significant decisions |
| `active_concerns.md` | Unresolved issues tracking | As concerns arise/resolve |

---

## Usage Guidelines

### For the Chair

Before opening a session:
1. Review `session_context.md` for recent context
2. Check `active_concerns.md` for pending issues
3. Reference `decision_precedents.md` when similar topics arise

### For Historians

After closing a session:
1. Update `session_context.md` with session summary
2. Add significant decisions to `decision_precedents.md`
3. Update `active_concerns.md` with new/resolved issues

### For Critics

During challenge rounds:
1. Reference `decision_precedents.md` for consistency
2. Check `active_concerns.md` for related issues
3. Ensure proposals don't contradict established patterns

---

## Memory vs. Knowledge Base

| Aspect | Memory | Knowledge Base |
|--------|--------|----------------|
| **Scope** | Operational context | Reference documentation |
| **Updates** | Frequent (per session) | Infrequent (stable) |
| **Content** | Current state, recent decisions | Patterns, architecture, glossary |
| **Purpose** | Session continuity | Long-term reference |

---

*"Memory is not just storage—it is the foundation of wise deliberation."*

