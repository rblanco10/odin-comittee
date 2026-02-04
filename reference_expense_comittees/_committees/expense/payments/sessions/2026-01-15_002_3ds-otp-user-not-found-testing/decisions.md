# Session Decisions

> **Session**: 2026-01-15_002_3ds-otp-user-not-found-testing  
> **Recording Clerk**: Emily Watson

---

## Decision 1: Three error scenarios sufficient for manual verification

**Proposed by**: Victoria Sterling (Chair)  
**Seconded by**: David Kim (Marqeta Expert)

**Description**: The three testable error scenarios (`:card_not_found`, `:user_not_found`, `:no_identifier`) are sufficient for manual verification of the error handling logic.

**Vote**: Unanimous (6-0)  
**Result**: APPROVED

---

## Decision 2: Document remaining scenarios for future automated testing

**Proposed by**: Yuki Tanaka (Edge Case Hunter)  
**Seconded by**: Elena Rodriguez (Failure Advocate)

**Description**: The remaining error scenarios (`:expense_card_not_found`, `:cardholder_not_found`) require specific database states that are difficult to create safely in a live environment. These should be covered by automated unit tests.

**Vote**: Unanimous (6-0)  
**Result**: APPROVED
