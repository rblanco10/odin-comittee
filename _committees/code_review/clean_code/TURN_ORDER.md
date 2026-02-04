# Turn Order Quick Reference

> **Purpose**: Quick reference for the sequential persona flow during reviews

---

## CRITICAL: Human-Controlled Flow

**⚠️ The Human Director controls the pace of the review.**

After EVERY member completes their turn:
1. **STOP** - Do not proceed automatically
2. **PRESENT CHECKPOINT** - Show findings table and options
3. **WAIT** - Only continue when human provides input

---

## Wave Organization

For full implementation audits, members are organized into waves:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAVE ORGANIZATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WAVE 1 — Analysis & Structure                                   │
│  ├── 🔍 Code Researcher      (Initial analysis)                  │
│  ├── 🏷️ Naming & Readability (Names, clarity)                   │
│  └── 📐 Function & Complexity (Size, SRP, nesting)              │
│                                                                  │
│  [CHECKPOINT — Wave 1 Complete]                                  │
│                                                                  │
│  WAVE 2 — Quality & Safety                                       │
│  ├── 🚨 Error Handling       (Error patterns)                    │
│  ├── 🧪 Test Quality         (Test structure)                    │
│  ├── 🏗️ Architecture         (Module design)                     │
│  └── 🔄 Duplication          (DRY violations)                    │
│                                                                  │
│  [CHECKPOINT — Wave 2 Complete]                                  │
│                                                                  │
│  WAVE 3 — Refinement                                             │
│  ├── 💛/💜 Language Specialist (Idioms, overrides)               │
│  ├── ⚖️ Pragmatism Critic    (Is it worth it?)                   │
│  └── 🔗 Consistency Critic   (Matches codebase?)                 │
│                                                                  │
│  [CHECKPOINT — Wave 3 Complete]                                  │
│                                                                  │
│  WAVE 4 — Finalization                                           │
│  ├── 📝 Review Recorder      (Compiles report)                   │
│  └── 📏 Standards Keeper     (Validates quality)                 │
│                                                                  │
│  [FINAL CHECKPOINT — Approval]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sequential Turn Order (Detailed)

```
┌────┬──────────────────────────────────────┬─────────────────────────┬──────────────┐
│ #  │ Member                               │ Focus                   │ Wave         │
├────┼──────────────────────────────────────┼─────────────────────────┼──────────────┤
│ 1  │ 🎯 Leadership: Moderator             │ Opens session           │ Intake       │
│ 2  │ 🔍 Clerical: Code Researcher         │ Analyzes code structure │ Wave 1       │
│ 3  │ 🏷️ Universal: Naming & Readability   │ Names, clarity          │ Wave 1       │
│ 4  │ 📐 Universal: Function & Complexity  │ Size, SRP, nesting      │ Wave 1       │
│    │ ─────────────────────────────────────│─────────────────────────│──────────────│
│ 5  │ 🚨 Universal: Error Handling         │ Error patterns          │ Wave 2       │
│ 6  │ 🧪 Universal: Test Quality           │ Test structure          │ Wave 2       │
│ 7  │ 🏗️ Universal: Architecture Boundaries│ Module design           │ Wave 2       │
│ 8  │ 🔄 Universal: Duplication            │ DRY violations          │ Wave 2       │
│    │ ─────────────────────────────────────│─────────────────────────│──────────────│
│ 9  │ 💜/💛 Language Specialist            │ Language idioms         │ Wave 3       │
│ 10 │ ⚖️ Critic: Pragmatism                │ Is it worth it?         │ Wave 3       │
│ 11 │ 🔗 Critic: Consistency               │ Matches codebase?       │ Wave 3       │
│    │ ─────────────────────────────────────│─────────────────────────│──────────────│
│ 12 │ 📝 Clerical: Review Recorder         │ Compiles report         │ Wave 4       │
│ 13 │ 📏 Leadership: Standards Keeper      │ Validates quality       │ Wave 4       │
│ 14 │ 🎯 Leadership: Moderator             │ Closes session          │ Closing      │
└────┴──────────────────────────────────────┴─────────────────────────┴──────────────┘
```

---

## Checkpoint Format

After each member (or wave), present a checkpoint:

```
[CHECKPOINT — After 🏷️ Naming & Readability]

**Findings so far**: 3
| ID | Severity | Location | Issue |
|----|----------|----------|-------|
| CC-001 | SHOULD FIX | api.ts:37 | Generic param name |
| CC-002 | SHOULD FIX | api.ts:97 | Vague function name |
| CC-003 | NICE TO HAVE | url.ts:38 | Misleading `trim` |

**Verdicts**:
| Member | Verdict |
|--------|---------|
| 🏷️ Naming | ⚠️ CONDITIONAL PASS |

**Options**:
1. `continue` — Proceed to 📐 Function & Complexity
2. `focus CC-001` — Deep dive on this finding
3. `drop CC-003` — Remove this finding
4. `skip complexity` — Skip to 🚨 Error Handling
5. `summary` — Show all findings
6. `pause` — Stop for discussion

Your input: ___
```

---

## Wave Checkpoint Format

After completing a wave:

```
[CHECKPOINT — Wave 1 Complete]

**Wave 1 Summary**:
| Member | Verdict | Findings |
|--------|---------|----------|
| 🔍 Researcher | — | Context provided |
| 🏷️ Naming | ⚠️ CONDITIONAL | 3 findings |
| 📐 Complexity | ❌ CONCERNS | 2 findings |

**Total Findings**: 5
| ID | Severity | Member | Issue |
|----|----------|--------|-------|
| CC-001 | SHOULD FIX | 🏷️ | Generic param name |
| CC-002 | SHOULD FIX | 🏷️ | Vague function name |
| CC-003 | NICE TO HAVE | 🏷️ | Misleading `trim` |
| CC-004 | MUST FIX | 📐 | 42-line function |
| CC-005 | SHOULD FIX | 📐 | 4-level nesting |

**Options**:
1. `continue` — Proceed to Wave 2 (Quality & Safety)
2. `focus wave 1` — Review Wave 1 findings in detail
3. `skip wave 2` — Jump to Wave 3 (Refinement)
4. `end` — Stop here with current findings

Your input: ___
```

---

## Member Output Format

Each member MUST follow this format:

### 1. Persona Switch
```
[Switching to 🏷️ Naming & Readability persona]
```

### 2. Greeting & Context
```
**🏷️ Universal: Naming & Readability**:

Thank you, 🔍 Code Researcher. That overview is helpful.

*leans in to examine the code*

I'm going to focus on what these names communicate...
```

### 3. Findings with IDs
```
**FINDING CC-001** [SHOULD FIX] — api.ts:37

| Field | Value |
|-------|-------|
| **Issue** | Generic parameter name `extraQuery: unknown[]` |
| **Impact** | Readers can't understand expected data shape |
| **Suggestion** | Rename to `additionalParams` |
| **Principle** | Clean Code: Meaningful Names |
```

### 4. Verdict
```
**Naming Verdict**: ⚠️ CONDITIONAL PASS

| Severity | Count |
|----------|-------|
| Must Fix | 0 |
| Should Fix | 2 |
| Nice to Have | 1 |

**Summary**: Overall naming is decent, but `unknown[]` usage hurts readability.

**Handoff**: → 📐 Function & Complexity (I flagged `trimURL` for your attention)
```

---

## When to Skip Members

| Member | Skip When |
|--------|-----------|
| 🧪 Test Quality | No test files in review |
| 💜 Elixir Specialist | No Elixir code present |
| 💛 JavaScript Specialist | No JS/TS code present |
| 🏗️ Architecture | Single function review |
| 🔄 Duplication | Single file review |

---

## Quick Commands

| Command | Effect |
|---------|--------|
| `continue` / `next` | Proceed to next member |
| `skip [member]` | Skip a specific member |
| `focus [ID]` | Deep dive on finding |
| `drop [ID]` | Remove a finding |
| `summary` | Show all findings |
| `pause` | Stop for discussion |
| `approve` | Accept final report |
| `end` | Close session |

---

*"Each voice speaks in turn, each verdict is clear, each checkpoint gives control."*
