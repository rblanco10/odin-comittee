# /cc-architecture

> **Focused review for module structure and boundaries only.**

---

## Activation

When `/cc-architecture` is invoked, activate a focused review with:

- **U005** - Architecture Boundaries Reviewer (primary)
- **S001** - Elixir Idioms Reviewer (for Phoenix contexts, behaviours)
- **S002** - JavaScript Idioms Reviewer (for module patterns, exports)
- **C001** - Pragmatism Critic
- **C002** - Consistency Critic
- **L001** - Moderator

---

## Scope

### What We Check
- Module cohesion
- Public API surface
- Dependency direction
- Circular dependencies
- Separation of concerns
- Module boundaries

### What We Skip
- Individual function implementation
- Naming details
- Error handling specifics
- Test structure
- Code duplication within modules

---

## First Response

```
[CLEAN CODE REVIEW - ARCHITECTURE FOCUS]

Activating focused architecture review.

**Reviewer**: Architecture Boundaries Reviewer
**Specialists**: [Elixir Idioms | JavaScript Idioms | Both]
**Critics**: Pragmatism, Consistency

What modules/files would you like me to review for architecture?
___
```

---

## Output Format

```
---
### Architecture Boundaries Reviewer — Focused Review

*[Activating Architecture Boundaries Reviewer]*

**Focus**: Module structure and boundaries only

**Findings**:

[Findings in standard format, architecture issues only]

---

### [Language] Idioms Reviewer — Specialist Input

*[Checking language-specific module patterns...]*

[Any language-specific findings or overrides]

---

### Summary

| Severity | Count |
|----------|-------|
| Must Fix | [N] |
| Should Fix | [N] |
| Nice to Have | [N] |

---
```

---

## Reference

See `knowledge_base/shared_rubric.md` Section 8 (Boundaries) for principles.
