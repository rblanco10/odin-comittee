# Decision Template

> Use this template when the committee reaches a decision that should be recorded as precedent.

---

## Decision: [Short Title]

**ID:** DEC-[session-id]-[number]
**Date:** [ISO date]
**Session:** [Session ID]
**Decided By:** [Committee consensus | Human override | Majority vote]

### Decision
[Clear statement of what was decided]

### Context
[What prompted this decision? What was the question?]

### Options Considered

#### Option A: [Name]
**Description:** [What this option would mean]
**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

#### Option B: [Name]
**Description:** [What this option would mean]
**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

### Reasoning
[Why was the selected option chosen?]

### Dissents
[Any minority opinions that should be recorded]

**[Member Name]:** [Their dissenting view and reasoning]

### Scope
[When does this decision apply? What are the boundaries?]

### Implications
[What does this decision mean for current and future work?]

### Status
- [x] Active
- [ ] Superseded by: [reference]
- [ ] Revisit if: [condition that would trigger reconsideration]

### Related
- [Links to related decisions, gaps, or context]

---

## Example

### Decision: Use fallback for null vendor names

**ID:** DEC-SYNC-20241221-001
**Date:** 2024-12-21
**Session:** SYNC-20241221
**Decided By:** Committee consensus

### Decision
When a vendor's `companyName` is null in the ERP, we will use a fallback of "Unknown Vendor (ID: {external_id})" rather than failing the sync.

### Context
Data Quality Specialist identified that ~5% of NetSuite vendors have null names (draft vendors, incomplete imports). Edge Case Hunter asked how we should handle this.

### Options Considered

#### Option A: Fail on null name
**Description:** Reject vendors without names, log error, continue with others.
**Pros:**
- Forces data cleanup in ERP
- No fake data in Teampay

**Cons:**
- 5% of vendors won't sync
- Creates support tickets
- Customers may not fix ERP data

#### Option B: Use fallback name
**Description:** Generate a placeholder name using the external ID.
**Pros:**
- All vendors sync
- Users can still select vendor
- External ID allows identification

**Cons:**
- "Unknown Vendor" is ugly
- Users might not clean it up

#### Option C: Use external_id as name
**Description:** Use the raw external ID as the name.
**Pros:**
- Always unique
- Clear it came from ERP

**Cons:**
- Completely unusable for humans ("12345" as vendor name)

### Reasoning
Option B was chosen because:
1. Sync completeness is more important than perfect data
2. The fallback format clearly indicates missing data
3. Users can still identify the vendor via external_id
4. We can log a warning for visibility

### Dissents
**Data Quality Specialist:** "I worry we're normalizing bad data. We should at least surface a warning to admins when >10% of vendors use fallback names."

### Scope
Applies to:
- Vendor sync for all ERPs
- Any entity with a required name field

Does NOT apply to:
- External ID (must always be present)
- Numeric fields (should have their own handling)

### Implications
- Implement fallback in vendor mapper
- Add logging for fallback usage
- Consider admin warning for high fallback rates (per dissent)

### Status
- [x] Active
- [ ] Revisit if: Fallback usage exceeds 10% for any customer

### Related
- FIND-SYNC-20241221-001: Vendor sync null handling
- GAP-SYNC-20241221-003: Need admin visibility for data quality issues

