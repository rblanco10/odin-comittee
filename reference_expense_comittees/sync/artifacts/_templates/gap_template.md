# Gap Template

> Use this template when a committee member identifies something missing, underspecified, or risky that needs to be addressed.

---

## Gap: [Short Title]

**ID:** GAP-[session-id]-[number]
**Identified By:** [Member Name]
**Turn:** [N]
**Severity:** [Low | Medium | High | Critical]
**Category:** [Design | Implementation | Documentation | Testing | Observability | Security]

### Description
[What is missing, underspecified, or risky?]

### Impact
[What could go wrong if this gap is not addressed?]

### Current State
[What exists now, if anything?]

### Desired State
[What should exist?]

### Suggested Resolution
[If provided by the member identifying the gap]

### Effort Estimate
- [ ] Small (< 1 day)
- [ ] Medium (1-3 days)
- [ ] Large (1-2 weeks)
- [ ] XL (> 2 weeks)
- [ ] Unknown

### Dependencies
[What else needs to happen first?]

### Related
- [Links to related gaps, findings, or context]

### Status
- [ ] Open
- [ ] In Progress: [Who is working on it]
- [ ] Blocked: [What's blocking it]
- [ ] Resolved: [PR/commit/doc reference]
- [ ] Accepted Risk: [Why we're proceeding without addressing]
- [ ] Won't Fix: [Why we're not addressing]

### History
| Date | Actor | Action |
|------|-------|--------|
| [date] | [who] | [what happened] |

---

## Example

### Gap: No observability for mapper operations

**ID:** GAP-SYNC-20241221-002
**Identified By:** Observability Auditor
**Turn:** 7
**Severity:** High
**Category:** Observability

### Description
The mapper layer (MapperRegistry.map_data) has no telemetry instrumentation. When mapping is slow or fails, we have no visibility into why.

### Impact
- Can't debug slow syncs (is it API or mapping?)
- Can't detect mapping failures before they cause downstream issues
- No metrics for mapper performance

### Current State
MapperRegistry.map_data is called but not wrapped in any telemetry span.

### Desired State
- Tempo span for each mapper invocation
- Span attributes: provider, entity_type, field_count, duration
- Prometheus histogram for mapper duration
- Loki log on mapper failure

### Suggested Resolution
Add `RI.with_step("map_#{entity_type}", [...])` around the mapper call in each sync handler, or centralize in MapperRegistry itself.

### Effort Estimate
- [x] Small (< 1 day)

### Dependencies
None — can be done independently.

### Related
- FIND-SYNC-20241221-003: Slow syncs for large vendors

### Status
- [x] Open
- [ ] In Progress

### History
| Date | Actor | Action |
|------|-------|--------|
| 2024-12-21 | Observability Auditor | Identified during vendor sync review |

