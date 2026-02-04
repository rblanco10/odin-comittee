# Turn Order Quick Reference

> **Purpose**: Quick reference for the sequential persona flow during reviews

---

## Standard Turn Order

```
┌────┬──────────────────────────────────────┬─────────────────────────┐
│ #  │ Member                               │ Focus                   │
├────┼──────────────────────────────────────┼─────────────────────────┤
│ 1  │ 🎯 Leadership: Moderator             │ Opens session           │
│ 2  │ 🔍 Clerical: Code Researcher         │ Analyzes code structure │
│ 3  │ 🏷️ Universal: Naming & Readability   │ Names, clarity          │
│ 4  │ 📐 Universal: Function & Complexity  │ Size, SRP, nesting      │
│ 5  │ 🚨 Universal: Error Handling         │ Error patterns          │
│ 6  │ 🧪 Universal: Test Quality           │ Test structure          │
│ 7  │ 🏗️ Universal: Architecture Boundaries│ Module design           │
│ 8  │ 🔄 Universal: Duplication            │ DRY violations          │
│ 9  │ 💜/💛 Language Specialist            │ Language idioms         │
│ 10 │ ⚖️ Critic: Pragmatism                │ Is it worth it?         │
│ 11 │ 🔗 Critic: Consistency               │ Matches codebase?       │
│ 12 │ 📝 Clerical: Review Recorder         │ Compiles report         │
│ 13 │ 📏 Leadership: Standards Keeper      │ Validates quality       │
│ 14 │ 🎯 Leadership: Moderator             │ Closes session          │
└────┴──────────────────────────────────────┴─────────────────────────┘
```

---

## Visual Flow

```
                    ┌─────────────────────┐
                    │  🎯 MODERATOR       │
                    │  Opens Session      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  🔍 CODE RESEARCHER │
                    │  Analyzes Code      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ 🏷️ NAMING     │    │ 📐 FUNCTIONS  │    │ 🚨 ERRORS     │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ 🧪 TESTS      │    │ 🏗️ ARCH       │    │ 🔄 DRY        │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ 💜/💛 SPECIALIST │
                    │ (Elixir or JS)  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐           ┌────────────────┐
     │ ⚖️ PRAGMATISM   │           │ 🔗 CONSISTENCY │
     └────────┬───────┘           └────────┬───────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼────────┐
                    │ 📝 RECORDER     │
                    │ Compiles Report │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ 📏 STANDARDS    │
                    │ Validates       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ 🎯 MODERATOR    │
                    │ Closes Session  │
                    └─────────────────┘
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

## Handoff Phrases

Each member uses their handoff phrase to pass control:

| From | To | Handoff |
|------|-----|---------|
| 🎯 Moderator | 🔍 Researcher | "I hand off to **🔍 Clerical: Code Researcher** to analyze the code." |
| 🔍 Researcher | 🏷️ Naming | "I hand off to **🏷️ Universal: Naming & Readability** to begin the review." |
| 🏷️ Naming | 📐 Functions | "I hand off to **📐 Universal: Function & Complexity** for structural analysis." |
| 📐 Functions | 🚨 Errors | "I hand off to **🚨 Universal: Error Handling** for error pattern review." |
| 🚨 Errors | 🧪 Tests | "I hand off to **🧪 Universal: Test Quality** for test coverage analysis." |
| 🧪 Tests | 🏗️ Architecture | "I hand off to **🏗️ Universal: Architecture Boundaries** for module structure review." |
| 🏗️ Architecture | 🔄 Duplication | "I hand off to **🔄 Universal: Duplication** for DRY analysis." |
| 🔄 Duplication | 💜/💛 Specialist | "I hand off to **💛 Specialist: JavaScript Idioms** for language-specific review." |
| 💜/💛 Specialist | ⚖️ Pragmatism | "I hand off to **⚖️ Critic: Pragmatism** for practicality review." |
| ⚖️ Pragmatism | 🔗 Consistency | "I hand off to **🔗 Critic: Consistency** for pattern review." |
| 🔗 Consistency | 📝 Recorder | "I hand off to **📝 Clerical: Review Recorder** to compile the final report." |
| 📝 Recorder | 📏 Standards | "I hand off to **📏 Leadership: Standards Keeper** for quality validation." |
| 📏 Standards | 🎯 Moderator | "I hand off to **🎯 Leadership: Moderator** for final approval." |

---

## Quick Commands to Modify Flow

| Command | Effect |
|---------|--------|
| `skip [member]` | Skip the specified member |
| `route [member]` | Add member to the active set |
| `focus [area]` | Only activate relevant members |
| `OVERRIDE: [instruction]` | Interrupt and apply instruction |

---

*"Each voice speaks in turn, each handoff is explicit, each contribution is complete."*
