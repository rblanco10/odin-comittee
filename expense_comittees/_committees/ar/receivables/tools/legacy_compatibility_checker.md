# Tool: Legacy Compatibility Checker

> **Primary Users**: C001 (Legacy Alignment Adversary), IS004, TS004  
> **Constitutional Rule**: Legacy Compatibility First

---

## Purpose

Verify that Ash-created records can be read by Loopback2 and vice versa.

---

## When to Use

- Before approving any Classic domain resource change
- During Legacy Alignment Check workflow
- During ratification of Classic domain implementations

---

## Pre-Check Requirements

Before running this tool, ensure you have:
- [ ] The relevant Loopback2 model from `roadrunner_samples/`
- [ ] The Ash resource definition
- [ ] Column mapping (if exists)

---

## Checklist

### 1. Table Name Verification

- [ ] Ash resource writes to correct MySQL table
- [ ] Table name matches Loopback2 model `tableName`

```
Loopback2 Table: _____________
Ash Table: _____________
Match: [ ] Yes [ ] No
```

### 2. Column Name Mapping

For each column:

| Loopback2 Column | Ash Attribute | Has `source:` mapping? | Match? |
|------------------|---------------|------------------------|--------|
| | | [ ] | [ ] |
| | | [ ] | [ ] |
| | | [ ] | [ ] |

### 3. Data Type Compatibility

| Column | Loopback2 Type | Ash Type | Compatible? |
|--------|----------------|----------|-------------|
| | | | [ ] |
| | | | [ ] |
| | | | [ ] |

**Critical**: Financial fields MUST use Decimal
- [ ] All money fields use `Ash.Type.Decimal` or `:decimal`
- [ ] No `Float` types for financial data

### 4. Status/Enum Values

| Status | In Loopback2? | In Ash? | Case Match? |
|--------|---------------|---------|-------------|
| | [ ] | [ ] | [ ] |
| | [ ] | [ ] | [ ] |
| | [ ] | [ ] | [ ] |

**Critical**: Status values must be string-compatible
- [ ] No `removed` status (invalid in AR domain)
- [ ] Standard: created → active ↔ inactive

### 5. Nullable Consistency

| Column | Loopback2 Nullable | Ash allow_nil? | Match? |
|--------|-------------------|----------------|--------|
| | | | [ ] |
| | | | [ ] |

### 6. Default Values

| Column | Loopback2 Default | Ash Default | Match? |
|--------|-------------------|-------------|--------|
| | | | [ ] |
| | | | [ ] |

### 7. Foreign Keys

| FK Column | Loopback2 Relation | Ash belongs_to | Match? |
|-----------|-------------------|----------------|--------|
| | | | [ ] |
| | | | [ ] |

### 8. Tenant Isolation

- [ ] `owner_id` or `workspace_id` present
- [ ] Tenant attribute marked as required
- [ ] All queries include tenant filter

---

## Round-Trip Test Scenarios

### Scenario A: Ash → Loopback2

```markdown
1. Create record in Ash with all fields populated
2. Query record directly from MySQL
3. Verify all columns readable
4. Verify no data corruption
```

Result: [ ] PASS [ ] FAIL

### Scenario B: Loopback2 → Ash

```markdown
1. Insert record directly to MySQL (simulating Loopback2)
2. Load record in Ash
3. Verify all attributes populated
4. Verify associations load correctly
```

Result: [ ] PASS [ ] FAIL

---

## Output Template

```markdown
## Tool: Legacy Compatibility Checker
**Run By**: [Member ID and Name]
**Run Date**: [Date]
**Target**: [Resource name]

### Summary
- Table: [table_name]
- Columns Checked: [N]
- Status Values: [N]

### Results
- Column Mapping: [ ] PASS [ ] FAIL
- Data Types: [ ] PASS [ ] FAIL
- Status Values: [ ] PASS [ ] FAIL
- Nullable: [ ] PASS [ ] FAIL
- Defaults: [ ] PASS [ ] FAIL
- Foreign Keys: [ ] PASS [ ] FAIL
- Tenant Isolation: [ ] PASS [ ] FAIL
- Round-Trip Ash→LB2: [ ] PASS [ ] FAIL
- Round-Trip LB2→Ash: [ ] PASS [ ] FAIL

### Verdict
[ ] PASS - Legacy compatible
[ ] FAIL - Issues must be resolved (see below)

### Issues
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
```

---

## Failure Escalation

If this tool returns FAIL:
1. Document specific failures
2. Escalate to SC11 (Legacy Alignment) if not already there
3. BLOCK implementation until resolved
4. Constitutional violation requires Human Director override

---

*"If Loopback2 can't read it, we don't ship it."*

