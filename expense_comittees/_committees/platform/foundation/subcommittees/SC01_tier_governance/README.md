# SC01: Tier Governance Subcommittee

> **Code**: SC01  
> **Lead**: Dr. Catherine Wells  
> **Co-Lead**: Robert Chen  
> **Focus**: Tier classification, dependency enforcement, architectural boundaries

---

## Mission

The Tier Governance Subcommittee ensures the integrity of the 5-tier architecture. We are the guardians of architectural boundaries, responsible for:

1. **Classifying** new applications into appropriate tiers
2. **Enforcing** dependency rules
3. **Reviewing** tier boundary violations
4. **Advising** on tier-related architectural questions

---

## Jurisdiction

### Primary Responsibilities

- Approve tier classification for new apps
- Review and approve dependency changes
- Maintain tier documentation
- Propose tier rule amendments (to full committee)
- Advise on edge cases

### Decision Authority

| Decision Type | Authority Level |
|---------------|-----------------|
| New app tier classification | Subcommittee approval |
| Dependency addition (same tier or downward) | Subcommittee approval |
| Dependency exception request | Recommend to full committee |
| Tier rule change | Recommend to full committee + Human Director |

---

## Members

| Name | Role | Tier Expertise |
|------|------|----------------|
| Dr. Catherine Wells | Lead | Core Tier |
| Robert Chen | Co-Lead | Infrastructure Tier |
| Dr. Sarah Lin | Member | Domain Tier |
| James Morrison | Member | Product Tier |
| Lisa Park | Member | Web Tier |
| Dr. Yuki Tanaka | Member | Core Tier (backup) |
| Natasha Volkov | Member | Infrastructure (multi-tenancy) |
| Dr. Benjamin Okafor | Member | Domain (rules) |

---

## Tier Classification Process

### New App Proposal

```
1. SUBMISSION
   - Proposer submits app proposal with:
     - App name
     - Purpose
     - Proposed tier
     - Proposed dependencies
     - Justification

2. REVIEW
   - Relevant tier specialist examines proposal
   - Dependencies validated against rules
   - Naming convention verified

3. CHALLENGE
   - Other members may challenge classification
   - Must provide alternative tier with rationale

4. DECISION
   - Subcommittee votes
   - Majority required for approval
   - Record decision in subcommittee log

5. ESCALATION (if needed)
   - Contentious decisions go to full committee
   - Rule exceptions go to full committee + Human Director
```

---

## Dependency Review Process

### Adding a Dependency

```elixir
# Example: product_receivables wants to add domain_coding dependency

# 1. Check tier relationship
product_receivables (Tier 4) → domain_coding (Tier 3)
# ✅ Downward dependency: ALLOWED by rule

# 2. Check horizontal rule
product_receivables → product_payables
# ❌ Horizontal product: FORBIDDEN

# 3. Subcommittee approves if valid
```

### Exception Requests

When someone requests a dependency exception:

1. Document the necessity in detail
2. Subcommittee reviews and challenges
3. If subcommittee agrees necessity exists, escalate to full committee
4. Full committee presents to Human Director
5. Human Director may approve with documented rationale

---

## Tier Quick Reference

| Tier | Prefix | Has DB? | External APIs? | Can Depend On |
|------|--------|---------|----------------|---------------|
| 1. Core | `core_*` | ❌ | ❌ | Nothing (except Elixir stdlib) |
| 2. Infra | `infra_*` | ✅ | ✅ | Core |
| 3. Domain | `domain_*` | ✅ | ❌ | Core, Infra |
| 4. Product | `product_*` | ✅ | Via Infra | Core, Infra, Domain |
| 5. Web | `web_*` | Via others | ❌ | All lower tiers |

---

## Common Questions

### Q: Can a domain app call an external API?

**A**: No. Domain apps contain business logic only. If external API access is needed, it must be in an infra app, and the domain app can depend on that infra app.

### Q: Can two products share code directly?

**A**: No. Shared code between products must be in a domain app. Both products then depend on that domain app.

### Q: Where does a "utility" go?

**A**: Pure utilities (no DB, no APIs) go in core. If it needs DB or external access, it's probably infra or domain depending on whether it's business logic or service infrastructure.

---

## Meeting Cadence

- **Regular**: Weekly (or as needed during active development)
- **Ad-hoc**: Convened for new app proposals
- **Quarterly**: Tier health review

---

## Related Documentation

- [Dependency Rules](../../knowledge_base/architecture/dependency_rules.md)
- [Naming Convention](../../knowledge_base/architecture/naming_convention.md)
- [Umbrella Structure](../../knowledge_base/architecture/umbrella_structure.md)

---

*"Clear tiers enable clear thinking. Blurred tiers create blurred responsibilities."*
