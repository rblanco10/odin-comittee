# Research Protocols

> **Purpose**: Guidelines for conducting research during sessions

---

## Research Declaration

Before conducting any research, the researcher MUST declare:

```markdown
---
**[MEMBER NAME]** ([Role]): I am researching [TOPIC].

**Looking for**: [Specific information needed]

**Sources**:
- [Source 1]
- [Source 2]

*Conducting research...*
---
```

---

## Research Types

### Codebase Search

Search the application codebase for:
- Existing implementations
- Patterns in use
- Configuration files
- Test examples

**Tools**: grep, file search, semantic search

### Knowledge Base Lookup

Search the committee knowledge base for:
- Past decisions
- Documented patterns
- Current state information
- Glossary terms

**Location**: `knowledge_base/`

### External Documentation

Search external resources for:
- Best practices
- Tool documentation
- Community guidance

**Location**: `knowledge_base/external_references.md`

### Session History

Search past sessions for:
- Related discussions
- Previous decisions
- Historical context

**Location**: `sessions/`

---

## Research Findings Format

After research, report findings:

```markdown
---
**[MEMBER NAME]** ([Role]): Research complete.

**Topic**: [What was researched]

**Findings**:
1. [Finding 1]
   - Location: [File path or source]
   - Relevance: [How it relates]

2. [Finding 2]
   - Location: [File path or source]
   - Relevance: [How it relates]

**Code Example** (if applicable):
```elixir
# [file path]:[line numbers]
[relevant code]
```

**Interpretation**: [What this means for our discussion]

**Handoff**: I yield to [MEMBER] to [action].
---
```

---

## Research Best Practices

### Be Specific
- State exactly what you're looking for
- Narrow scope to relevant areas
- Don't boil the ocean

### Be Transparent
- Show your sources
- Quote relevant code
- Acknowledge gaps

### Be Efficient
- Don't research what's already known
- Check knowledge base first
- Ask if someone already knows

### Be Honest
- Report what you find, not what you want to find
- Acknowledge when you don't find anything
- Note uncertainty

---

## Common Research Scenarios

### "Does this exist?"

```markdown
**Research Librarian**: I am researching whether [FEATURE] exists.

**Looking for**: Implementation of [FEATURE]

**Sources**:
- lib/ directory
- config/ directory
- knowledge_base/current_state/

*Conducting research...*

**Findings**: [Found/Not found] at [location]
```

### "How is this done?"

```markdown
**Research Librarian**: I am researching how [OPERATION] is performed.

**Looking for**: Implementation pattern for [OPERATION]

**Sources**:
- Relevant modules
- Test files for examples
- knowledge_base/patterns/

*Conducting research...*

**Findings**: [Pattern description with code]
```

### "What did we decide?"

```markdown
**Session Historian**: I am researching past decisions on [TOPIC].

**Looking for**: Previous committee decisions

**Sources**:
- sessions/ folder
- knowledge_base/decisions/
- STATUS.md history

*Conducting research...*

**Findings**: In session [ID], we decided [DECISION] because [RATIONALE].
```

---

## Research Handoffs

After research, hand off to:

| Finding Type | Hand Off To |
|--------------|-------------|
| Technical implementation | Domain expert |
| Pattern question | Pattern Chronicler |
| Decision question | Decision Genealogist |
| Security concern | Security Pessimist |
| Performance concern | Performance Paranoid |
| General interpretation | Requesting member |

---

*"Research illuminates; interpretation guides."*

