# Session Decisions

**Session**: 2026-01-23_002_tracing-adoption-implementation

---

## DEC-078: Tempo → Loki Bi-directional Linking

**Proposed by**: Dr. Amanda Foster (SC03 Lead)  
**Seconded by**: Dr. William Park (SC04 Lead)

**Description**: Add `tracesToLogsV2` configuration to Tempo datasource to enable navigation from traces to related logs. This completes the bi-directional linking (Loki → Tempo was already configured via derivedFields).

**Discussion Summary**:
- Loki already has derivedFields for trace_id → Tempo linking
- Tempo was missing tracesToLogs configuration
- This enables full observability workflow: Log → Trace → Related Logs

**Challenges Raised**:
- None - this is standard Grafana configuration

**Vote**: Unanimous  
**Result**: ✅ APPROVED and IMPLEMENTED

**Implementation**: `datasources.yml` updated with:
- `tracesToLogsV2` configuration
- `nodeGraph` enabled for visual trace graphs
- `lokiSearch` for Loki search from Tempo

---

## DEC-079: Tracing Infrastructure Already Complete

**Proposed by**: Dr. Janet Liu (SC05 Lead)  
**Seconded by**: Dr. Kenji Tanaka (Research Librarian)

**Description**: Acknowledge that reactor-level tracing is already fully implemented. The following services are in production-ready state:
- `TempoTracingService` - 15+ span types
- `ReactorInstrumentation` - Step-level child spans
- OpenTelemetry configuration - HTTP exporter to Tempo

**Discussion Summary**:
- FreezeCardReactor, UnfreezeCardReactor, CancelCardReactor all fully instrumented
- ActivateCardReactor, UpdateCardControlsReactor, UpdateSpendingLimitsReactor all instrumented
- Phoenix and Ecto auto-instrumentation active

**Challenges Raised**:
- Elena Vasquez (Complexity Auditor): "Verify traces are actually appearing in Tempo before declaring victory"
- Resolution: Added verification procedure to implementation plan

**Vote**: Unanimous  
**Result**: ✅ APPROVED

---

## DEC-080: No Sampling Required at Current Volume

**Proposed by**: Dr. Amanda Foster (SC03 Lead)  
**Seconded by**: Dr. Richard Thornton (SK001)

**Description**: Store 100% of traces without sampling. Current volume does not justify trace sampling, and full trace visibility is more valuable for debugging.

**Discussion Summary**:
- Current volume is low (development environment)
- Tempo retention already configured (60 days)
- Sampling would reduce debugging capability

**Challenges Raised**:
- Dr. Richard Thornton: "What's the threshold for enabling sampling?"
- Resolution: Document threshold as 10,000+ requests/minute or 100GB+ storage

**Vote**: Unanimous  
**Result**: ✅ APPROVED

---

## DEC-081: Verification Before Status Update

**Proposed by**: Elena Vasquez (SK002 - Complexity Auditor)  
**Seconded by**: Dr. Alexandra Chen (Chair)

**Description**: Do not mark tracing as "complete" in STATUS.md until verification procedure confirms traces are visible in Grafana.

**Discussion Summary**:
- Infrastructure exists but hasn't been verified end-to-end
- Implementation plan includes verification procedure
- Human Director should execute verification

**Vote**: Unanimous  
**Result**: ✅ APPROVED
