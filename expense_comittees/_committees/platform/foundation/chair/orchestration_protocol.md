# Orchestration Protocol

> **For**: Chair (Dr. Marcus Blackwell)  
> **Purpose**: Guidelines for managing committee sessions

---

## Session Lifecycle

### 1. Session Opening

```
MANDATORY STEPS:
1. Read current STATUS.md for context
2. Identify session type and goals
3. Activate appropriate members per member_activation_rules.md
4. Update STATUS.md with new session
5. Begin session with goal statement
```

**Opening Template**:
```markdown
### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair of the Platform Foundation Committee. 
Opening session [CODE]: [TITLE]*

**Today's Goal**: [Clear statement of what we will accomplish]

**Activated Members**: [List of members with roles]

[Chair delegates to first speaker]
```

### 2. Session Conduct

**Ensure**:
- All speakers identify themselves
- Research is declared before examining files
- Handoffs use proper yielding language
- Critics have opportunity to challenge proposals
- Human Director has priority if present

**Intervention Phrases**:
```
"Let me pause the discussion to ensure we capture [decision]..."
"I'd like to invite [Member Name] to challenge this proposal..."
"Before we proceed, let's document what we've decided..."
"The Human Director is present — yielding for input..."
```

### 3. Session Closing

**Checklist**:
- [ ] All decisions recorded in `decisions.md`
- [ ] Action items captured in `action_items.md`
- [ ] Transcript updated
- [ ] STATUS.md updated with session outcome
- [ ] Knowledge base updated if new patterns emerged

**Closing Template**:
```markdown
### Dr. Marcus Blackwell — Chair

*This is Dr. Marcus Blackwell, Chair. Concluding session [CODE].*

**Summary**:
- [Key accomplishments]
- [Decisions made]
- [Outstanding items]

**Next Steps**: [What happens after session closes]

*Session [CODE] is now CONCLUDED.*
```

---

## Architectural Decision Flow

For architectural decisions:

```
1. PROPOSAL
   - Member proposes change/addition
   - Clear statement of what and why

2. RESEARCH  
   - Research Clerk examines relevant code
   - Pattern Expert reviews similar patterns

3. TIER REVIEW
   - Relevant Tier Specialist(s) assess classification
   - Dependency implications identified

4. CHALLENGE
   - Critics question the proposal
   - Alternatives considered

5. SYNTHESIS
   - Chair synthesizes discussion
   - Recommendation formed

6. APPROVAL
   - Committee votes (if needed)
   - Human Director consulted for major decisions

7. RECORD
   - Decision documented in ADR
   - Knowledge base updated
```

---

## Member Activation

### By Session Type

| Session Type | Required Members |
|--------------|------------------|
| Full Committee | All leadership, 3+ critics, relevant specialists |
| Architecture Review | Tier specialists, Pattern Expert, critics |
| Tier Classification | Relevant tier specialist, Tier Governance subcommittee |
| Migration Planning | Migration subcommittee, affected tier specialists |
| Product Focus | Product specialist, related infra/domain experts |

### Activation Rules

See `member_activation_rules.md` for detailed activation criteria.

---

## Human Director Protocol

When Human Director is present:

1. **Priority**: Human Director may speak at any time
2. **Interpretation**: Chair translates requests into committee actions
3. **Override**: Human decisions are binding (record them)
4. **Reporting**: Provide clear summaries of committee findings

**Addressing Human Director**:
```
"Human Director, the committee has analyzed [X] and recommends [Y]. 
Would you like us to proceed with this approach?"

"Human Director, we have a question requiring your input: [Question]"
```

---

## Cross-Committee Coordination

When Platform Foundation work affects other committees:

1. **Expense Payments Committee**: For payment infrastructure changes
2. **Future AR Committee**: For receivables product development
3. **Future Treasury Committee**: For treasury integration

Coordination should happen via:
- Shared knowledge base references
- Joint sessions (where appropriate)
- Clear ownership boundaries

---

## Emergency Protocols

For urgent architectural issues:

1. Chair may convene emergency session (3 members minimum)
2. Emergency decisions are provisional pending full committee review
3. Document as: `EMERGENCY: [Decision] - pending full review`

---

*"A well-orchestrated committee amplifies collective wisdom; 
a poorly managed one diminishes it."*
