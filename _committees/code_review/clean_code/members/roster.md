# Committee Roster

> **Total Members**: 14  
> **Last Updated**: 2026-02-04

---

## Quick Reference

| Member | Category | Primary Focus |
|--------|----------|---------------|
| 🎯 Moderator | Leadership | Orchestration, consolidation |
| 📏 Standards Keeper | Leadership | Quality control, severity validation |
| 🏷️ Naming & Readability Reviewer | Universal | Names, clarity |
| 📐 Function & Complexity Reviewer | Universal | Function size, SRP |
| 🚨 Error Handling Reviewer | Universal | Error patterns |
| 🧪 Test Quality Reviewer | Universal | Test cleanliness |
| 🏗️ Architecture Boundaries Reviewer | Universal | Module structure |
| 🔄 Duplication Reviewer | Universal | DRY principle |
| 💜 Elixir Idioms Reviewer | Specialist | Elixir patterns |
| 💛 JavaScript Idioms Reviewer | Specialist | JS/TS patterns |
| ⚖️ Pragmatism Critic | Critic | Practicality |
| 🔗 Consistency Critic | Critic | Codebase consistency |
| 📝 Review Recorder | Clerical | Documentation |
| 🔍 Code Researcher | Clerical | Codebase research |

---

## By Category

### Leadership (2)

| Member | File |
|--------|------|
| 🎯 Moderator | `leadership/moderator.md` |
| 📏 Standards Keeper | `leadership/standards_keeper.md` |

### Universal Reviewers (6)

| Member | File |
|--------|------|
| 🏷️ Naming & Readability Reviewer | `universal_reviewers/naming_readability.md` |
| 📐 Function & Complexity Reviewer | `universal_reviewers/function_complexity.md` |
| 🚨 Error Handling Reviewer | `universal_reviewers/error_handling.md` |
| 🧪 Test Quality Reviewer | `universal_reviewers/test_quality.md` |
| 🏗️ Architecture Boundaries Reviewer | `universal_reviewers/architecture_boundaries.md` |
| 🔄 Duplication Reviewer | `universal_reviewers/duplication.md` |

### Language Specialists (2)

| Member | File |
|--------|------|
| 💜 Elixir Idioms Reviewer | `language_specialists/elixir_idioms.md` |
| 💛 JavaScript Idioms Reviewer | `language_specialists/javascript_idioms.md` |

### Critics (2)

| Member | File |
|--------|------|
| ⚖️ Pragmatism Critic | `critics/pragmatism_critic.md` |
| 🔗 Consistency Critic | `critics/consistency_critic.md` |

### Clerical (2)

| Member | File |
|--------|------|
| 📝 Review Recorder | `clerical/review_recorder.md` |
| 🔍 Code Researcher | `clerical/code_researcher.md` |

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
| 💜 Elixir Idioms | Universal Reviewers on Elixir code |
| 💛 JavaScript Idioms | Universal Reviewers on JS/TS code |
| ⚖️ Pragmatism Critic | Any finding (remove/downgrade) |
| 🔗 Consistency Critic | Any finding (remove/downgrade) |
| 🎯 Moderator | Final authority on conflicts |

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
