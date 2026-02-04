# Shared Clean Code Rubric

> **Applies To**: All code regardless of language  
> **Reference**: *Clean Code* by Robert C. Martin

---

## The 8 Universal Checks

This rubric forms the foundation that language-specific layers build upon.

---

## 1. Naming

> *"The name of a variable, function, or class should answer why it exists, what it does, and how it is used."*

### Principles

| Principle | Description |
|-----------|-------------|
| **Reveal Intent** | Names tell why it exists, what it does |
| **No Disinformation** | Names don't lie or mislead |
| **Meaningful Distinctions** | Different names mean different things |
| **Pronounceable** | Names can be spoken in discussion |
| **Searchable** | Names can be found in codebase |
| **No Encodings** | No Hungarian notation, type prefixes |

### Check Questions

- [ ] Does the name describe what it represents?
- [ ] Could someone understand this without reading the implementation?
- [ ] Is the name accurate (not misleading)?
- [ ] Is it appropriately specific (not too vague, not too verbose)?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Misleading name (says X, does Y) | Must Fix |
| Cryptic abbreviation | Must Fix |
| Vague name (`data`, `info`, `item`) | Should Fix |
| Could be slightly clearer | Nice to Have |

---

## 2. Function Size

> *"The first rule of functions is that they should be small. The second rule is that they should be smaller than that."*

### Principles

| Principle | Description |
|-----------|-------------|
| **Small** | Functions should fit on one screen |
| **Single Level** | All statements at same abstraction level |
| **Stepdown** | Code reads top-to-bottom like narrative |

### Thresholds

| Metric | Good | Flag | Must Fix |
|--------|------|------|----------|
| Lines | ≤20 | 21-40 | >40 |
| Nesting | ≤2 | 3 | >3 |

### Check Questions

- [ ] Can you understand this function at a glance?
- [ ] Does it require scrolling to read?
- [ ] Are there natural break points for extraction?

### Severity Guide

| Issue | Severity |
|-------|----------|
| >40 lines with no justification | Must Fix |
| 21-40 lines that could be split | Should Fix |
| 15-20 lines that could be shorter | Nice to Have |

---

## 3. Single Responsibility

> *"A function should do one thing. It should do it well. It should do it only."*

### Principles

| Principle | Description |
|-----------|-------------|
| **One Thing** | Function has single purpose |
| **One Reason to Change** | Module changes for one reason only |
| **High Cohesion** | Related things stay together |

### Check Questions

- [ ] Can you describe what this does without using "and"?
- [ ] If you extracted a piece, would it make sense on its own?
- [ ] Does this function have one job?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Function doing 5+ distinct things | Must Fix |
| Function doing 2-3 things that should be separate | Should Fix |
| Minor secondary responsibility | Nice to Have |

---

## 4. Duplication (DRY)

> *"Every piece of knowledge must have a single, unambiguous, authoritative representation."*

### Principles

| Principle | Description |
|-----------|-------------|
| **DRY** | Don't Repeat Yourself |
| **Once and Only Once** | Single source of truth |
| **Earned Abstraction** | Don't abstract prematurely |

### Important Caveat

Not all duplication is bad. Ask:
- Is the abstraction simpler than the duplication?
- Will these things evolve together?
- Does extracting hurt readability?

### Check Questions

- [ ] Is this code duplicated elsewhere?
- [ ] Would extracting this actually simplify things?
- [ ] Is this duplication intentional (different concepts)?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Exact copy-paste of 10+ lines | Must Fix |
| Same business rule in 3+ places | Must Fix |
| Similar functions that could be parameterized | Should Fix |
| Minor 2-3 line duplication | Nice to Have |

---

## 5. Clarity

> *"Clean code reads like well-written prose."*

### Principles

| Principle | Description |
|-----------|-------------|
| **Readable** | Code tells a story |
| **Minimal Cognitive Load** | Easy to understand |
| **Self-Documenting** | Code explains itself |

### Check Questions

- [ ] Can a new team member understand this?
- [ ] Does the code flow logically?
- [ ] Are there any "WTF" moments reading this?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Code that actively misleads | Must Fix |
| Code that requires significant effort to understand | Should Fix |
| Code that could be slightly clearer | Nice to Have |

---

## 6. Error Handling

> *"Error handling is important, but if it obscures logic, it's wrong."*

### Principles

| Principle | Description |
|-----------|-------------|
| **Explicit** | Errors handled, not ignored |
| **Informative** | Error messages explain what happened |
| **Appropriate Level** | Errors caught at right boundary |
| **No Null Returns** | Don't return null to signal errors |

### Check Questions

- [ ] Are errors handled or do they fail silently?
- [ ] Do error messages provide useful context?
- [ ] Is error handling at the appropriate level?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Silent failure (error ignored) | Must Fix |
| Unhandled async error | Must Fix |
| Generic error message with no context | Should Fix |
| Error handling could be more informative | Nice to Have |

---

## 7. Tests

> *"Test code is just as important as production code."*

### Principles (F.I.R.S.T.)

| Principle | Description |
|-----------|-------------|
| **Fast** | Tests run quickly |
| **Independent** | Tests don't depend on each other |
| **Repeatable** | Tests work in any environment |
| **Self-validating** | Tests have boolean pass/fail |
| **Timely** | Tests written at the right time |

### Additional Principles

| Principle | Description |
|-----------|-------------|
| **One Concept** | Each test tests one thing |
| **Clean** | Tests are as clean as production code |
| **Readable** | Tests serve as documentation |

### Check Questions

- [ ] Does each test test one concept?
- [ ] Are tests independent of each other?
- [ ] Can you understand what's tested from the name?
- [ ] Is Arrange-Act-Assert clear?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Test depends on other tests | Must Fix |
| Test has no assertions | Must Fix |
| Test tests multiple concepts | Should Fix |
| Test name could be clearer | Nice to Have |

---

## 8. Boundaries

> *"Good software designs are centered on the use cases."*

### Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | Modules have one reason to change |
| **High Cohesion** | Related things stay together |
| **Low Coupling** | Modules minimize dependencies |
| **Dependency Direction** | Dependencies point toward stability |

### Check Questions

- [ ] Does this module have a clear, single purpose?
- [ ] Is the public API minimal and intentional?
- [ ] Do dependencies flow in a sensible direction?
- [ ] Are there circular dependencies?

### Severity Guide

| Issue | Severity |
|-------|----------|
| Circular dependency | Must Fix |
| God module (does everything) | Must Fix |
| Low cohesion (unrelated things grouped) | Should Fix |
| Public API could be smaller | Nice to Have |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED CLEAN CODE RUBRIC                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NAMING         - Names reveal intent                         │
│  2. FUNCTION SIZE  - Small, ≤20 lines ideal                      │
│  3. SRP            - Do one thing                                │
│  4. DUPLICATION    - DRY, but don't over-abstract                │
│  5. CLARITY        - Reads like prose                            │
│  6. ERROR HANDLING - Explicit, informative                       │
│  7. TESTS          - F.I.R.S.T., one concept each                │
│  8. BOUNDARIES     - Clear modules, dependency direction         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*"Clean code is simple and direct. Clean code reads like well-written prose."* — Grady Booch
