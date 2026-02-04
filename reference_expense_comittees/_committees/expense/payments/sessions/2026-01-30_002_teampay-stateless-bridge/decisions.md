# Decisions

**Session**: 2026-01-30_002_teampay-stateless-bridge  
**Date**: 2026-01-30

## Decision 1: Stateless API Approach

**Proposed by**: Backend Engineer  
**Seconded by**: Chair

**Description**: Implement Option C1 (Stateless Bridge) from ASHWOOD_BRIDGE_OPTIONS.md rather than Option C2 (Stateful Bridge).

**Discussion Summary**:
- Faster delivery (~4 days vs 6-7 days)
- No org/workspace mapping required
- Simpler architecture
- Teampay handles all data storage

**Vote**:
- In Favor: 3
- Opposed: 0

**Result**: APPROVED

**Implementation Notes**:
- Endpoints return computation results only
- No DocumentInbox storage
- Teampay manages receipt lifecycle

---

## Decision 2: API Key Authentication

**Proposed by**: Security Adversary  
**Seconded by**: Chair

**Description**: Use Bearer token API key authentication rather than OAuth or JWT.

**Discussion Summary**:
- Simpler for service-to-service integration
- Sufficient security for internal systems
- Easy to rotate via environment variables

**Vote**:
- In Favor: 3
- Opposed: 0

**Result**: APPROVED

**Implementation Notes**:
- Configure via `teampay_api_key` in runtime config
- Format: `Authorization: Bearer <key>`
- Returns 401 for invalid tokens

---

## Decision 3: Scoring Algorithm Replication

**Proposed by**: Backend Engineer  
**Seconded by**: Pattern Historian

**Description**: Replicate MatchComputationService scoring logic in controller rather than calling service directly.

**Discussion Summary**:
- Keeps controller stateless (no database access)
- Matches Teampay's expectations
- Same algorithm guarantees consistency

**Vote**:
- In Favor: 3
- Opposed: 0

**Result**: APPROVED

**Implementation Notes**:
- Weights: Amount 50pts, Date 30pts, Merchant 20pts
- Auto-match threshold: 80 points
- Clear winner: 10+ point gap

---

*Decisions recorded by Recording Clerk*
