# Decisions

**Session**: 2026-01-30_003_anthropic-integration-testing  
**Date**: 2026-01-30  
**Status**: IN PROGRESS

## Decisions Made During Session

### DEC-BRIDGE-004: Confidence Score Calculation

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Use weighted average for overall confidence score:
- 40% amount confidence
- 30% vendor confidence  
- 30% date confidence

**Rationale**: Amount is most critical for matching, followed by vendor and date. This weighting reflects business priorities.

**Implementation**:
```elixir
overall_confidence = (amount_confidence * 0.4 + vendor_confidence * 0.3 + date_confidence * 0.3)
```

---

### DEC-BRIDGE-005: Low Confidence Handling

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Return error (422) for extractions with confidence < 0.3 rather than returning partial data.

**Rationale**: 
- Low confidence data could lead to incorrect matches
- Better to fail explicitly than provide unreliable data
- Teampay can handle gracefully (allow manual matching)

**Alternative Considered**: Return partial data with warning flag (rejected - too risky)

---

### DEC-BRIDGE-006: Focused Extraction Mode

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Use focused extraction mode with `enforce_document_type: :expense_receipt`.

**Rationale**:
- Better accuracy for known document types
- Reduces token usage (fewer API costs)
- Faster response times
- We know receipts are always expense receipts in this context

**Implementation**: Pass `enforce_document_type: :expense_receipt` to VisionClient

---

### DEC-BRIDGE-007: Error Handling Strategy

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Implement comprehensive error handling with 6 distinct error types:
1. Low confidence
2. Extraction failed
3. Schema violation
4. API key not configured
5. File read error
6. Generic errors

**Rationale**: 
- Clear error messages help debugging
- Different errors require different responses
- Enables proper monitoring and alerting

---

### DEC-BRIDGE-008: Testing Approach

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Create comprehensive testing documentation instead of skipping tests due to environment limitations.

**Rationale**:
- Cannot run servers in current environment
- Documentation provides clear testing procedures for humans
- 26 test cases across 6 suites ensures thorough coverage
- Test plan can be executed later with running servers

**Alternative Considered**: Skip testing entirely (rejected - not acceptable for QA role)

---

### DEC-BRIDGE-009: API Documentation Format

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Use OpenAPI 3.0.3 specification format for API documentation.

**Rationale**:
- Industry standard
- Machine-readable (can generate client SDKs)
- Human-readable (good documentation)
- Supports code generation and validation
- Compatible with Swagger UI and other tools

**Alternative Considered**: OpenAPI 3.1 (rejected - less tool support currently)

---

### DEC-BRIDGE-010: Deployment Guide Scope

**Date**: 2026-01-30  
**Decided By**: QA Engineer (Agent 2)  
**Status**: Approved

**Decision**: Create comprehensive deployment guide covering:
- Both Ashwood and Teampay configuration
- Multiple deployment options (manual, Docker, platform)
- Troubleshooting section with 6 common issues
- Security considerations
- Rollback procedures

**Rationale**: Production deployment requires complete documentation for operations team.

---

## Decision Summary

**Total Decisions**: 7  
**All Approved**: Yes  
**Pending Review**: None  
**Blocked**: None

**Key Themes**:
- Prioritize reliability over flexibility
- Comprehensive error handling
- Clear documentation for operations
- Balance between accuracy and usability
