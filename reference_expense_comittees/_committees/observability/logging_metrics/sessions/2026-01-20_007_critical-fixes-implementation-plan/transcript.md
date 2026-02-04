# Critical Dashboard Fixes - Implementation Plan Session

> **Session**: 2026-01-20_007_critical-fixes-implementation-plan  
> **Date**: 2026-01-20  
> **Status**: In Progress

---

## Session Opening

**Dr. Alexandra Chen** (Chief Orchestrator): Good afternoon. We're convening to create a comprehensive implementation plan for fixing the critical dashboard issues identified in our review. I've activated multiple Grafana and observability experts to ensure this plan is thorough and actionable.

**Handoff**: I yield to **Dr. William Park**, Dashboard Architect, to structure the implementation plan.

---

## Plan Structure

**Dr. William Park** (Dashboard Architect, SC04 Lead): This is Dr. William Park, Dashboard Architect. I'm structuring our implementation plan to address all critical issues systematically.

**Plan Organization:**

1. **Phase 1: Verification & Discovery** - Verify current state before making changes
2. **Phase 2: Critical Fixes** - Fix issues that prevent dashboards from working
3. **Phase 3: High-Priority Fixes** - Fix issues affecting data accuracy
4. **Phase 4: Testing & Validation** - Verify all fixes work correctly
5. **Phase 5: Documentation** - Update documentation with changes

**Handoff**: I yield to **Sarah Mitchell**, Dashboard Provisioning Engineer, to address datasource configuration issues.

---

## Datasource Configuration Plan

**Sarah Mitchell** (Dashboard Provisioning Engineer, SC04): This is Sarah Mitchell, Dashboard Provisioning Engineer. I'm addressing the Tempo datasource UID issue.

**CRIT-002: Tempo Datasource UID Fix**

**Verification Steps:**
1. Access Grafana UI: Configuration → Data Sources
2. Locate "Tempo" datasource
3. Note the actual UID (may be auto-generated)
4. Check if UID is explicitly set in `datasources.yml`

**Implementation Options:**

**Option A: Add Explicit UID to Datasource Config (Recommended)**
- Add `uid: "tempo"` to Tempo datasource in `datasources.yml`
- This ensures consistent UID across environments
- Update dashboard JSON to use `"uid": "tempo"`

**Option B: Use Grafana-Generated UID**
- Query Grafana API or UI to get actual UID
- Update dashboard JSON to match actual UID
- Less portable across environments

**Recommendation**: Option A - Add explicit UID for consistency.

**Testing:**
1. Restart Grafana to load new datasource config
2. Verify Tempo panel loads without errors
3. Verify trace queries execute correctly

**Handoff**: I yield to **Emily Watson**, Loki Query Master, for LogQL fixes.

---

## LogQL Query Fixes

**Emily Watson** (Loki Query Master, SC04): This is Emily Watson, Loki Query Master. I'm addressing the LogQL query issues.

**CRIT-001: Rate Function Fix**

**Current (INCORRECT):**
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [$__range]))
```

**Problem**: `rate()` requires range vector `[5m]`, not `[$__range]`

**Solution Options:**

**Option 1: Use Fixed Range (Recommended for Real-time)**
```logql
sum by (domain) (rate({domain=~"ember_.*", status="error"} | json [5m]))
```

**Option 2: Time-Range Aware Calculation**
```logql
sum by (domain) (
  sum(count_over_time({domain=~"ember_.*", status="error"} | json [$__range])) 
  / ($__range_s / 1)
)
```

**Option 3: Use `increase()` Instead**
```logql
sum by (domain) (
  increase({domain=~"ember_.*", status="error"} | json [$__range]) 
  / ($__range_s / 1)
)
```

**Recommendation**: Option 1 for real-time monitoring, Option 2 if time-range awareness is critical.

**CRIT-003: JSON Parsing Verification**

**Verification Steps:**
1. Query Loki directly: `{domain="ember_payments"} | limit 10`
2. Check log format:
   - If JSON: logs contain structured JSON fields
   - If labels: data is in label selectors only
   - If text: logs are plain text

**Implementation Based on Format:**

**If JSON Format:**
- Keep current queries with `| json`
- Add note to panel descriptions: "Requires JSON-formatted logs"

**If Label-Based:**
- Remove `| json` from queries
- Use label selectors: `{domain="ember_payments", error_type=~".+"}`
- Extract from labels: `sum by (error_type) (count_over_time({...}[$__range]))`

**If Text Format:**
- Use regex extraction: `| regexp "(?P<error_type>error_type=\\\"(?P<value>[^\\\"]+)\\\")"`
- Or add label extraction at log ingestion time

**Hybrid Approach (Recommended):**
- Create queries that work with both JSON and labels
- Use label-based queries as primary (more efficient)
- Add JSON parsing as fallback if labels missing

**HIGH-002: Unwrap Ordering Fix**

**Current (Unconventional):**
```logql
quantile_over_time(0.50, {...} | json | duration_ms > 0 | unwrap duration_ms [$__range])
```

**Fixed (Correct Order):**
```logql
quantile_over_time(0.50, {...} | json | unwrap duration_ms | duration_ms > 0 [$__range])
```

**Rationale**: Unwrap first to convert to numeric, then filter.

**Handoff**: I yield to **Carlos Mendez**, PromQL Wizard, for query validation.

---

## Query Validation Strategy

**Carlos Mendez** (PromQL Wizard, SC04): This is Carlos Mendez, PromQL Wizard. I'm providing validation strategies for all query fixes.

**Validation Checklist:**

1. **Syntax Validation**
   - Test each query in Grafana Explore before adding to dashboard
   - Verify no syntax errors in query editor
   - Check for LogQL/TraceQL syntax warnings

2. **Data Validation**
   - Verify queries return expected data types
   - Check for null/empty results (may indicate query issues)
   - Verify aggregations produce correct values

3. **Performance Validation**
   - Check query execution time in Explore
   - Verify queries complete within reasonable time (< 5s)
   - Monitor for query timeouts

4. **Edge Case Validation**
   - Test with no data (empty result set)
   - Test with single data point
   - Test with high volume data

**Handoff**: I yield to **Maria Santos**, Dashboard Performance Optimizer, for performance considerations.

---

## Performance Optimization

**Maria Santos** (Dashboard Performance Optimizer, SC04): This is Maria Santos, Dashboard Performance Optimizer. I'm ensuring our fixes don't introduce performance issues.

**Performance Considerations:**

1. **Range Vector Selection**
   - Fixed ranges like `[5m]` are more efficient than `[$__range]`
   - Use appropriate ranges: `[1m]` for high-frequency, `[5m]` for standard
   - Avoid very large ranges that scan too much data

2. **JSON Parsing Overhead**
   - `| json` adds parsing overhead
   - Prefer label-based queries when possible
   - If JSON needed, ensure logs are actually JSON (not double-parsing)

3. **Aggregation Efficiency**
   - `sum by (domain)` is efficient
   - `quantile_over_time` can be expensive on large ranges
   - Consider using `quantile_over_time` with smaller ranges

4. **Query Caching**
   - Grafana caches query results
   - Fixed ranges cache better than variable ranges
   - Consider refresh intervals for dashboards

**Recommendations:**
- Use fixed ranges where possible
- Prefer label-based queries over JSON parsing
- Monitor query performance after changes

**Handoff**: I yield to **Dr. Robert Fleming**, Dashboard Clutter Critic, for plan clarity review.

---

## Plan Clarity Review

**Dr. Robert Fleming** (Dashboard Clutter Critic, SC04): This is Dr. Robert Fleming, Dashboard Clutter Critic. I'm reviewing the plan for clarity and completeness.

**Clarity Assessment:**

✅ Plan is well-structured with clear phases  
✅ Each fix has verification, implementation, and testing steps  
✅ Multiple solution options provided where appropriate  
✅ Dependencies identified  

**Suggestions:**

1. Add rollback procedures for each fix
2. Include estimated time for each phase
3. Add checklist format for easy tracking
4. Include Grafana UI screenshots or references for verification steps

**Handoff**: I yield to **Elena Vasquez**, Complexity Auditor, for simplicity review.

---

## Simplicity Review

**Elena Vasquez** (Complexity Auditor): This is Elena Vasquez, Complexity Auditor. I'm ensuring the plan doesn't introduce unnecessary complexity.

**Simplicity Assessment:**

✅ Plan uses simplest solutions where possible  
✅ Multiple options provided but recommendations clear  
✅ No over-engineering detected  

**Concerns:**

1. Hybrid approach for JSON/label queries may add complexity
   - **Recommendation**: Choose one approach based on actual log format
   - Don't implement both unless absolutely necessary

2. Multiple solution options could cause confusion
   - **Recommendation**: Clearly mark "Recommended" option
   - Document why other options exist

**Handoff**: I yield back to **Dr. Alexandra Chen** for plan finalization.

---

## Plan Finalization

**Dr. Alexandra Chen** (Chief Orchestrator): Thank you all for the thorough review. The plan is comprehensive and has been validated by multiple experts. We'll now document this as our implementation plan.

**Key Decisions:**

1. Use explicit UID in datasource config (Option A)
2. Use fixed range `[5m]` for rate queries (Option 1)
3. Verify log format first, then choose appropriate query approach
4. Fix unwrap ordering in all latency queries
5. Add ERP webhooks to overall health calculation

**Next Steps:**
- Document complete implementation plan
- Create action items with specific steps
- Include testing procedures

---

*Session continues with implementation plan document creation...*
