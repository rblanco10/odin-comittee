# Committee Roster

> **Total Members**: 14  
> **Last Updated**: 2026-02-04

---

## Quick Reference

| Member | Primary Focus |
|--------|---------------|
| 🎯 **Leadership**: Moderator | Orchestration, consolidation |
| 📏 **Leadership**: Standards Keeper | Quality control, severity validation |
| 🏷️ **Universal**: Naming & Readability | Names, clarity |
| 📐 **Universal**: Function & Complexity | Function size, SRP |
| 🚨 **Universal**: Error Handling | Error patterns |
| 🧪 **Universal**: Test Quality | Test cleanliness |
| 🏗️ **Universal**: Architecture Boundaries | Module structure |
| 🔄 **Universal**: Duplication | DRY principle |
| 💜 **Specialist**: Elixir Idioms | Elixir patterns |
| 💛 **Specialist**: JavaScript Idioms | JS/TS patterns |
| ⚖️ **Critic**: Pragmatism | Practicality |
| 🔗 **Critic**: Consistency | Codebase consistency |
| 📝 **Clerical**: Review Recorder | Documentation |
| 🔍 **Clerical**: Code Researcher | Codebase research |

---

## By Category

### Leadership (2)

| Member | File |
|--------|------|
| 🎯 **Leadership**: Moderator | `leadership/moderator.md` |
| 📏 **Leadership**: Standards Keeper | `leadership/standards_keeper.md` |

### Universal Reviewers (6)

| Member | File |
|--------|------|
| 🏷️ **Universal**: Naming & Readability | `universal_reviewers/naming_readability.md` |
| 📐 **Universal**: Function & Complexity | `universal_reviewers/function_complexity.md` |
| 🚨 **Universal**: Error Handling | `universal_reviewers/error_handling.md` |
| 🧪 **Universal**: Test Quality | `universal_reviewers/test_quality.md` |
| 🏗️ **Universal**: Architecture Boundaries | `universal_reviewers/architecture_boundaries.md` |
| 🔄 **Universal**: Duplication | `universal_reviewers/duplication.md` |

### Language Specialists (2)

| Member | File |
|--------|------|
| 💜 **Specialist**: Elixir Idioms | `language_specialists/elixir_idioms.md` |
| 💛 **Specialist**: JavaScript Idioms | `language_specialists/javascript_idioms.md` |

### Critics (2)

| Member | File |
|--------|------|
| ⚖️ **Critic**: Pragmatism | `critics/pragmatism_critic.md` |
| 🔗 **Critic**: Consistency | `critics/consistency_critic.md` |

### Clerical (2)

| Member | File |
|--------|------|
| 📝 **Clerical**: Review Recorder | `clerical/review_recorder.md` |
| 🔍 **Clerical**: Code Researcher | `clerical/code_researcher.md` |

---

## Activation by Review Type

### Full Review (`/clean-code-review`)

All members participate:
- **Phase 1**: All 6 Universal Reviewers (parallel)
- **Phase 2**: 💜 Elixir and/or 💛 JavaScript (based on languages)
- **Phase 3**: ⚖️ Pragmatism, 🔗 Consistency
- **Phase 4**: 📏 Standards Keeper (validation)
- **Phase 5**: 🎯 Moderator, 📝 Review Recorder (consolidation)

### Elixir-Focused (`/cc-elixir`)

- All Universal Reviewers
- 💜 Elixir Idioms Reviewer (leads)
- ⚖️ Pragmatism, 🔗 Consistency Critics
- 🎯 Moderator, 📏 Standards Keeper, 📝 Recorder, 🔍 Researcher

### JavaScript-Focused (`/cc-js`)

- All Universal Reviewers
- 💛 JavaScript Idioms Reviewer (leads)
- ⚖️ Pragmatism, 🔗 Consistency Critics
- 🎯 Moderator, 📏 Standards Keeper, 📝 Recorder, 🔍 Researcher

### Targeted Commands

| Command | Activated |
|---------|-----------|
| `/cc-naming` | 🏷️ Naming, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-functions` | 📐 Function, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-errors` | 🚨 Error, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-tests` | 🧪 Test, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-architecture` | 🏗️ Architecture, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-duplication` | 🔄 Duplication, ⚖️ Pragmatism, 🔗 Consistency, 🎯 Moderator |
| `/cc-quick` | 🏷️ Naming, 📐 Function, 🎯 Moderator |

---

## Override Authority

| Member | Can Override |
|--------|--------------|
| 💜 **Specialist**: Elixir Idioms | Universal Reviewers on Elixir code |
| 💛 **Specialist**: JavaScript Idioms | Universal Reviewers on JS/TS code |
| ⚖️ **Critic**: Pragmatism | Any finding (remove/downgrade) |
| 🔗 **Critic**: Consistency | Any finding (remove/downgrade) |
| 🎯 **Leadership**: Moderator | Final authority on conflicts |

---

## Member Communication

All members must:
1. **Announce themselves** before contributing
2. **Declare research** before investigating
3. **Specify handoffs** when passing to another member

Format:
```
---
### [Role Name] — Phase [N]

*[Activating [Role Name]]*

[Contribution]

**Handoff**: [Next member] for [reason]

---
```

---

*"The right voices in the room make the right decision possible."*
