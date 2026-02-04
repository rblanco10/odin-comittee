# Tool: Performance Budget Calculator

> **Primary Users**: C002 (Performance Skeptic), QA003, TS004, TS005  
> **Constitutional Rule**: Performance Budget

---

## Purpose

Calculate whether an implementation meets AR domain performance budgets.

---

## When to Use

- During Performance Audit workflow
- Before approving list page implementations
- Before approving batch operations
- During ratification of query-intensive features

---

## Performance Budgets (Constitutional)

| Operation Type | Response Time | Max Queries | Notes |
|----------------|---------------|-------------|-------|
| **List Page** | < 200ms | 5 | Includes pagination |
| **Detail Page** | < 150ms | 3 | Single record + associations |
| **Search** | < 100ms | 2 | Must use indexes |
| **Batch Read** | < 500ms | 1 per 100 records | Chunked reads |
| **Write (Single)** | < 100ms | 3 | Including audit log |
| **Batch Write** | < 1000ms | 2 per 100 records | Must be transactional |

---

## Calculator Checklist

### 1. Identify Operation Type

- [ ] List Page
- [ ] Detail Page
- [ ] Search
- [ ] Batch Read
- [ ] Single Write
- [ ] Batch Write
- [ ] Other: _____________

**Applicable Budget**: _____________ ms, _____________ queries

### 2. Query Inventory

List all queries executed:

| # | Query Purpose | Estimated Time | Index Used? |
|---|---------------|----------------|-------------|
| 1 | | ms | [ ] |
| 2 | | ms | [ ] |
| 3 | | ms | [ ] |
| 4 | | ms | [ ] |
| 5 | | ms | [ ] |

**Total Queries**: _____________
**Budget Queries**: _____________
**Status**: [ ] WITHIN BUDGET [ ] OVER BUDGET

### 3. N+1 Detection

- [ ] No N+1 patterns detected
- [ ] N+1 detected (describe): _____________
- [ ] N+1 mitigated with preload/batch

### 4. Index Analysis

For each table accessed:

| Table | Columns Queried | Index Exists? | Used in Query? |
|-------|-----------------|---------------|----------------|
| | | [ ] | [ ] |
| | | [ ] | [ ] |

### 5. Full Table Scan Detection

- [ ] No full table scans
- [ ] Full table scan detected on: _____________
- [ ] Full table scan justified: _____________

### 6. Response Time Estimation

```
Query 1 time:      _____ ms
Query 2 time:      _____ ms
Query 3 time:      _____ ms
Processing time:   _____ ms
Serialization:     _____ ms
─────────────────────────────
TOTAL:             _____ ms
BUDGET:            _____ ms
STATUS:            [ ] WITHIN [ ] OVER
```

---

## Scale Projection Table

Estimate performance at different scales:

| Records | Query Time | Total Time | Status |
|---------|------------|------------|--------|
| 100 | ms | ms | [ ] OK |
| 1,000 | ms | ms | [ ] OK |
| 10,000 | ms | ms | [ ] OK |
| 100,000 | ms | ms | [ ] OK |
| 1,000,000 | ms | ms | [ ] OK |

**AR Domain Scale**: 30M+ records
**At Scale Status**: [ ] ACCEPTABLE [ ] UNACCEPTABLE

---

## EXPLAIN Analysis Template

For critical queries, run EXPLAIN:

```sql
EXPLAIN SELECT ... FROM ...
```

Key indicators to check:
- [ ] `type` is not `ALL` (full table scan)
- [ ] `key` shows index being used
- [ ] `rows` estimate is reasonable
- [ ] No `filesort` for large datasets
- [ ] No `temporary` for large datasets

---

## Output Template

```markdown
## Tool: Performance Budget Calculator
**Run By**: [Member ID and Name]
**Run Date**: [Date]
**Target**: [Feature/Operation name]

### Operation Classification
- Type: [List Page / Detail Page / etc.]
- Budget: [Xms, N queries]

### Query Analysis
- Total Queries: [N]
- N+1 Patterns: [None / Detected - mitigated / Detected - not mitigated]
- Full Table Scans: [None / Detected]

### Time Estimation
- Estimated Total: [X ms]
- Budget: [Y ms]
- Margin: [+/- Z ms]

### Scale Projection
- At 1K: [OK / Warning / Fail]
- At 100K: [OK / Warning / Fail]
- At 1M: [OK / Warning / Fail]

### Verdict
[ ] PASS - Within budget at scale
[ ] WARN - Close to budget, monitor
[ ] FAIL - Exceeds budget (see recommendations)

### Recommendations
1. [Optimization recommendation]
```

---

## Optimization Suggestions

If budget exceeded, consider:

1. **Add indexes** on frequently filtered columns
2. **Preload associations** to eliminate N+1
3. **Paginate** large result sets
4. **Cache** frequently accessed data
5. **Denormalize** for read-heavy operations
6. **Async** for non-critical calculations

---

## Failure Escalation

If this tool returns FAIL:
1. Document specific bottlenecks
2. Escalate to SC12 (Performance & Scale)
3. Implementation MAY proceed with Human Director approval
4. Must include optimization plan with timeline

---

*"Performance is a feature. Budget overruns are bugs."*

