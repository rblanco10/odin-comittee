# Decisions

> **Session**: 2026-01-20_002_card-issuance-detailed-logging

---

## DEC-018: Add Step-Level Logging to Card Issuance Flow

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. Janet Liu (SC05 Lead)

**Description**: Implement 5 new logging events to cover the following gaps in the CardIssuanceReactor:
1. `log_card_request_loaded` - Step 2: load_card_request
2. `log_card_request_approved` - Step 3: approve_card_request
3. `log_card_dimensions_copied` - Step 6.5: copy_dimensions
4. `log_card_documents_copied` - Step 6.6: copy_supporting_documents
5. `log_card_budget_linked` - Step 8: link_to_budgets

**Challenges Raised**:
- Elena Vasquez (Complexity Auditor): Questioned necessity of separate events for copy_dimensions and copy_supporting_documents
- Resolution: Events kept separate for independent failure diagnosis

**Vote**: 
- In Favor: 6
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

---

## DEC-019: Add Step Timing to All Card Issuance Events

**Proposed by**: Dr. Michael Torres (SC01 Lead)  
**Seconded by**: Dr. William Park (SC04 Lead)

**Description**: Add `step_duration_ms` field to all card issuance logging events to enable:
- Performance bottleneck identification
- Step-level SLO monitoring
- Regression detection after code changes

**Implementation Pattern**:
```elixir
step_start_time = System.monotonic_time(:millisecond)
# ... step logic ...
step_duration_ms = System.monotonic_time(:millisecond) - step_start_time
```

**Challenges Raised**:
- Elena Vasquez: Minor overhead concern
- Resolution: Overhead is negligible (<1μs per call), value justifies cost

**Vote**: 
- In Favor: 6
- Opposed: 0
- Abstaining: 0

**Result**: APPROVED

