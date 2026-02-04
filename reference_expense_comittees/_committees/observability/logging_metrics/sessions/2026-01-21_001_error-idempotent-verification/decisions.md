# Decisions

> **Session ID**: 2026-01-21_001_error-idempotent-verification  
> **Type**: Verification  
> **Opened**: 2026-01-21  
> **Closed**: 2026-01-21

---

## Decisions Made

### DEC-031: IEx Testing Preferred for Verification

**Description**: IEx testing is the preferred method for verifying observability logging over UI testing due to direct control, faster iteration, and full error visibility.

**Vote**: Unanimous (committee recommendation)

---

## Verification Results

### AI-066: Error Case Logging — VERIFIED ✅

| Test | Scenario | Result | Evidence |
|------|----------|--------|----------|
| Test 4 | Freeze cancelled card | Error at validate_state | `step_status="error"`, `error_reason="{:invalid_state_for_freeze, :cancelled}"` |
| Test 5 | Unfreeze cancelled card | Error at validate_state | `step_status="error"`, `error_reason` captured |

**Finding**: Step-level logging correctly captures error cases with:
- `step_status = "error"`
- `error_reason` containing the specific error tuple
- `card_state` showing the invalid state
- No subsequent step events logged (operation stops at error)

---

### AI-067: Idempotent Case Logging — VERIFIED ✅

| Test | Scenario | Result | Evidence |
|------|----------|--------|----------|
| Test 1 | Unfreeze active card | Idempotent success | All steps succeed, 0ms on skipped steps, 35ms total |
| Test 3 | Freeze frozen card | Idempotent success | All steps succeed, 0ms on skipped steps, 12ms total |

**Finding**: Step-level logging correctly captures idempotent cases with:
- All steps show `step_status = "success"`
- Skipped steps (call_provider, update_db) have near-0ms duration
- Total operation duration is much faster than real operations (~12-35ms vs ~3000ms)

---

## Discovery: Graceful Idempotent Handling

Both FreezeCardReactor and UnfreezeCardReactor handle "already in target state" as idempotent success rather than error. This is good defensive design that prevents unnecessary error noise.

---
