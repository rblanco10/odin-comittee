# {{COMMITTEE_NAME}} Committee

> **Committee Code**: `{{COMMITTEE_CODE}}`  
> **Established**: {{DATE}}  
> **Domain**: {{DOMAIN}}  
> **Lineage**: {{PROTOGENOS}} ({{LINEAGE_DOMAIN}})

---

## Mission Statement

{{MISSION_STATEMENT}}

---

## Jurisdiction

### Primary Domain

```
{{PRIMARY_DOMAIN_STRUCTURE}}
```

### Key Concepts Under Governance

{{KEY_CONCEPTS_LIST}}

---

## Committee Structure

### Leadership ({{LEADERSHIP_COUNT}} members)

| Role | Member | Responsibility |
|------|--------|----------------|
{{LEADERSHIP_TABLE}}

### Standing Members ({{STANDING_COUNT}} members)

{{STANDING_MEMBERS_SUMMARY}}

**Total: {{TOTAL_MEMBERS}} members**

---

## Constitutional Rules

These rules are **NON-NEGOTIABLE** (inherited from {{PROTOGENOS}}):

{{CONSTITUTIONAL_RULES_SUMMARY}}

---

## Session Protocol

### Opening a Session

```
1. Chair declares session OPEN with goal statement
2. Chair activates relevant members based on goal
3. Parliamentarian confirms quorum (minimum 5 members)
4. Recording Clerk begins transcript
```

### During Session

```
- All speakers MUST announce themselves: "This is [Name], [Role]..."
- Handoffs MUST be explicit: "I yield to [Name] for [reason]"
- Research MUST be declared: "I am researching [topic] in [location]"
- Critics challenge at regular intervals
```

### Closing a Session

```
1. Session Historian summarizes decisions
2. Action items catalogued
3. Artifacts filed in session folder
4. Chair declares session CLOSED
5. STATUS.md updated with current state
```

---

## Quick Reference

| Action | Location |
|--------|----------|
| View current state | `STATUS.md` |
| Open new session | Chair creates folder in `sessions/` |
| Find a member | `members/roster.md` |
| Research a topic | `knowledge_base/` |
| Review past decisions | `sessions/YYYY-MM-DD_###_code/` |

---

## File Structure

```
_committees/{{COMMITTEE_CODE_LOWER}}/
├── README.md                 # This file
├── GOVERNANCE.md             # Rules of operation
├── STATUS.md                 # Current state
├── members/                  # All member definitions
│   ├── roster.md
│   ├── leadership/
│   ├── domain_experts/
│   ├── critics/
│   └── clerical/
├── knowledge_base/           # Accumulated expertise
├── sessions/                 # Session records
│   └── _templates/
├── tools/                    # Analysis tools
└── workflows/                # Workflow definitions
```

---

## Protogenos Lineage: {{PROTOGENOS}}

This committee descends from **{{PROTOGENOS}}** and inherits:

### Inherited Critics
{{INHERITED_CRITICS}}

### Inherited Constitutional Rules
{{INHERITED_RULES_SUMMARY}}

### Inherited Knowledge
{{INHERITED_KNOWLEDGE}}

---

## Key Collaboration Patterns

{{COLLABORATION_PATTERNS}}

---

*"{{COMMITTEE_MOTTO}}"*
