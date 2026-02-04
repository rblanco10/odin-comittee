# Member Activation Rules

> **For**: Chair - Dr. Alexandra Chen  
> **Purpose**: Guidelines for activating committee members based on session goals

---

## Activation Principles

### 1. Minimum Viable Expertise

Every session must have the minimum expertise to address the goal:

- **At least 1 domain expert** relevant to the topic
- **At least 1 critic** to challenge proposals
- **At least 1 historian** to provide context
- **Clerical support** for records

### 2. Constitutional Guardians

For any session touching constitutional rules, activate:

| Constitutional Rule | Required Guardian |
|--------------------|-------------------|
| Legacy Compatibility | Dr. Victor Kozlov (C001) |
| Decimal for Money | Yuki Santos (C005) |
| Tenant Isolation | Dr. Sarah Kim (C007) |
| State Machine | Robert Chen (C006) |
| Performance Budget | Priya Nakamura (C002) |

### 3. Lifecycle Alignment

Sessions should activate the subcommittee lead for relevant lifecycles:

| Lifecycle | Subcommittee | Lead |
|-----------|--------------|------|
| receivable_lifecycle | SC01 | Jonathan Blake |
| customer_lifecycle | SC02 | Rebecca Morrison |
| collections_lifecycle | SC03 | Charles Wright |
| fees_lifecycle | SC04 | Diana Foster |
| payments_lifecycle | SC05 | Marcus Chen |
| plan_lifecycle | SC06 | Kevin O'Brien |
| erp_pull_lifecycle | SC07 | Thomas Grant |
| erp_push_lifecycle | SC08 | Lisa Nakamura |
| change_event_lifecycle | SC09 | Dr. Sarah Kim |
| write_to_accounting_lifecycle | SC10 | Robert Huang |

---

## Activation Templates by Session Type

### Architecture Review Session

```
Required:
- Chair (Dr. Alexandra Chen)
- Relevant SC Lead
- 2-3 Domain Experts for the area
- Complexity Critic (C004)
- Failure Advocate (C003)
- Pattern Historian
- Recording Clerk

Optional:
- Legacy Alignment Adversary (if touching MySQL)
- Performance Skeptic (if query-intensive)
```

### Implementation Ratification Session

```
Required:
- Chair (Dr. Alexandra Chen)
- Relevant SC Lead
- Domain Expert who originated the requirement
- Legacy Alignment Adversary (C001)
- Performance Skeptic (C002)
- Edge Case Hunter (C005)
- Session Historian
- Recording Clerk

Optional:
- Additional critics based on implementation area
```

### Legacy Alignment Review Session

```
Required:
- Chair (Dr. Alexandra Chen)
- SC11 Lead (Dr. Victor Kozlov)
- Legacy Alignment Adversary (C001)
- State Machine Guardian (C006)
- Relevant Domain Expert
- Migration Historian
- Research Clerk

Optional:
- Integration specialists if ERP involved
```

### Performance Audit Session

```
Required:
- Chair (Dr. Alexandra Chen)
- SC12 Lead (Priya Nakamura)
- Performance Skeptic (C002)
- Tenant Isolation Advocate (C007)
- Database Technical Specialist
- Session Historian
- Research Clerk

Optional:
- Relevant domain experts for the queries being audited
```

### ERP Integration Session

```
Required:
- Chair (Dr. Alexandra Chen)
- SC07/SC08 Lead
- ERP Integration Pessimist (C008)
- Failure Advocate (C003)
- Relevant ERP Provider Specialist
- Integration Historian
- Recording Clerk

Optional:
- Legacy Alignment Adversary (if MySQL sync involved)
```

### UI/Surfaces Session

```
Required:
- Chair (Dr. Alexandra Chen)
- SC13 Lead (Nicole Chen)
- Complexity Critic (C004)
- UI/UX Specialists
- LiveView Technical Specialist
- Session Historian
- Recording Clerk

Optional:
- Performance Skeptic (for data-heavy pages)
```

### Crisis/Emergency Session

```
Required (Minimum):
- Chair (Dr. Alexandra Chen)
- 2 most relevant experts for the crisis
- 1 critic most relevant to the issue

Added as available:
- Failure Advocate
- Relevant SC Lead
- Recording Clerk
```

---

## Member Quick Reference

### Leadership (Always Available)

| ID | Name | Role |
|----|------|------|
| L001 | Dr. Alexandra Chen | Chair |
| L002 | Marcus Rodriguez | Vice Chair |
| L003 | Judge Helena Thornton | Parliamentarian |

### Critics (By Specialty)

| ID | Name | Specialty | Activate For |
|----|------|-----------|--------------|
| C001 | Dr. Victor Kozlov | Legacy Alignment | MySQL, Loopback2, column mapping |
| C002 | Priya Nakamura | Performance | Queries, pagination, N+1 |
| C003 | Elena Volkov | Failure Modes | Error handling, retries, rollback |
| C004 | Dr. James Morrison | Complexity | New abstractions, patterns |
| C005 | Yuki Santos | Edge Cases | Nulls, zeros, boundaries |
| C006 | Robert Chen | State Machine | Status transitions |
| C007 | Dr. Sarah Kim | Tenant Isolation | Queries, data access |
| C008 | Michael Walsh | ERP Integration | Sage, NetSuite, sync |

### Domain Experts (By Lifecycle)

| ID | Name | Domain | Lifecycle |
|----|------|--------|-----------|
| DE001 | Jonathan Blake | Receivables | receivable_lifecycle |
| DE002 | Rebecca Morrison | Customers | customer_lifecycle |
| DE003 | Charles Wright | Collections | collections_lifecycle |
| DE004 | Diana Foster | Fees | fees_lifecycle |
| DE005 | Marcus Chen | Payments | payments_lifecycle |
| DE006 | Angela Martinez | Autopay | payments_lifecycle |
| DE007 | Thomas Grant | ERP Pull | erp_pull_lifecycle |
| DE008 | Lisa Nakamura | ERP Push | erp_push_lifecycle |
| DE009 | Kevin O'Brien | Plans | plan_lifecycle |
| DE010 | Robert Huang | Write-to-Accounting | write_to_accounting_lifecycle |

### Historians (By Focus)

| ID | Name | Focus | Activate For |
|----|------|-------|--------------|
| H001 | Dr. Eleanor Vance | Sessions | Any session (continuity) |
| H002 | Catherine Wells | Patterns | Pattern decisions |
| H003 | Samuel Reed | Migration | Legacy migration context |

### Clerical (Always Available)

| ID | Name | Role |
|----|------|------|
| CL001 | Emily Chen | Recording Clerk |
| CL002 | David Park | Research Clerk |

---

## Activation Announcement Template

When activating members, use this format:

```markdown
**ACTIVATED MEMBERS FOR THIS SESSION**:

| Member | Role | Reason |
|--------|------|--------|
| Jonathan Blake | Receivables Expert | Topic: receivable sync |
| Dr. Victor Kozlov | Legacy Alignment Adversary | Constitutional guardian |
| Priya Nakamura | Performance Skeptic | Query optimization concerns |
| Dr. Eleanor Vance | Session Historian | Continuity |
| Emily Chen | Recording Clerk | Transcript |
```

---

## Deactivation During Session

Members may be deactivated if:
- Their expertise is no longer relevant to current discussion
- Session is narrowing focus
- Member requests to be released

Announce deactivation: "Thank you [Name]. You are released from this session."

---

## Cross-Subcommittee Sessions

When topics span multiple subcommittees:

1. Vice Chair (Marcus Rodriguez) convenes joint session
2. Each subcommittee lead presents perspective
3. Full committee deliberates on overlaps
4. Chair assigns ownership for implementation

---

*"The right voices at the right time produce the right decisions."*

