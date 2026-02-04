# Clean Code Review Committee

## Charter

The Clean Code Review Committee is a specialized review body that evaluates Elixir and JavaScript/TypeScript code against Clean Code principles. The committee operates as a deliberative body where expert reviewers collaborate to produce actionable, severity-graded feedback.

## Mission

To improve code quality through rigorous, practical, and educational reviews that:
- Apply Clean Code principles adapted to each language's idioms
- Provide actionable feedback grouped by severity
- Explain the "why" behind every suggestion
- Avoid nitpicks that don't meaningfully improve clarity

## Scope

### Languages
- **Elixir** - Including Phoenix, LiveView, Ecto, OTP patterns
- **JavaScript** - ES6+, Node.js, React
- **TypeScript** - With focus on type usage and safety

### Focus Areas
- Naming and readability
- Function size and complexity
- Single responsibility principle
- Code duplication (DRY)
- Error handling
- Test quality
- Module boundaries and architecture

### Non-Goals
- Deep security audits (unless affecting code clarity)
- Performance benchmarking
- Infrastructure reviews (unless affecting code clarity)
- Style preferences not backed by Clean Code principles

## Quality Bar

The committee operates like a senior engineering review board:
- **Rigorous**: Every finding backed by principle or practical impact
- **Practical**: Suggestions must be worth the effort
- **Consistent**: Same standards applied across all reviews
- **Educational**: Explain why changes improve maintainability

---

## Committee Structure

### Members (14 Total)

| Category | Members | Purpose |
|----------|---------|---------|
| Leadership | 🎯 Moderator, 📏 Standards Keeper | Orchestration and quality control |
| Universal Reviewers | 🏷️ 📐 🚨 🧪 🏗️ 🔄 | Apply shared Clean Code rubric |
| Language Specialists | 💜 Elixir, 💛 JavaScript | Apply language-specific idioms |
| Critics | ⚖️ Pragmatism, 🔗 Consistency | Challenge impractical or inconsistent suggestions |
| Clerical | 📝 Recorder, 🔍 Researcher | Documentation and research |

### Invocation

Primary command: `/clean-code-review`

See `clean-code-review.md` for full invocation protocol.

---

## Directory Structure

```
clean_code/
├── README.md                      # This file
├── GOVERNANCE.md                  # Operating rules
├── STATUS.md                      # Current state
├── clean-code-review.md           # Main invocation command
│
├── members/
│   ├── roster.md                  # Quick reference
│   ├── leadership/
│   ├── universal_reviewers/
│   ├── language_specialists/
│   ├── critics/
│   └── clerical/
│
├── knowledge_base/
│   ├── shared_rubric.md           # Universal checks
│   ├── elixir_layer.md            # Elixir-specific
│   ├── javascript_layer.md        # JS/TS-specific
│   ├── severity_guide.md          # Severity definitions
│   ├── override_examples.md       # Override patterns
│   ├── references.md              # Authoritative sources
│   └── common_issues.md           # Recurring patterns log
│
├── templates/
│   ├── review_report.md           # Final output
│   └── individual_review.md       # Per-reviewer
│
├── commands/                      # Targeted commands
│   ├── cc-naming.md
│   ├── cc-functions.md
│   └── ...
│
└── reviews/                       # Auto-saved archives
    └── [identifier]_[date]/
        └── report.md
```

---

## Quick Reference

### Severity Levels

| Level | Definition |
|-------|------------|
| **Must Fix** | Bugs, major confusion, maintenance nightmares |
| **Should Fix** | Hurts maintainability, code works but poorly |
| **Nice to Have** | Polish, minor improvements |

### Override Rules

| Situation | Resolution |
|-----------|------------|
| Universal vs 💜/💛 Specialist | Specialist wins when idiom applies |
| Anyone vs ⚖️ Pragmatism Critic | Pragmatism wins when change is impractical |
| Anyone vs 🔗 Consistency Critic | Consistency wins when suggestion breaks patterns |

### Nitpick Test

> "Would I actually change this in inherited code?"
> 
> If NO → Don't raise it

---

## References

- *Clean Code* by Robert C. Martin
- Elixir Style Guide
- JavaScript/TypeScript best practices

---

*"Clean code reads like well-written prose."* — Robert C. Martin
