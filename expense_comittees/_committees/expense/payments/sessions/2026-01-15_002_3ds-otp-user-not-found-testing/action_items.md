# Action Items

> **Session**: 2026-01-15_002_3ds-otp-user-not-found-testing  
> **Recording Clerk**: Emily Watson

---

## AI-006: Add unit tests for edge case error scenarios

**Assigned to**: Engineering  
**Priority**: Low  
**Status**: Pending

**Description**: Create automated unit tests for the following `ThreeDsOtpNotificationService.lookup_user/3` error scenarios:

1. `:expense_card_not_found` — CardIssuance exists but has no linked ExpenseCard
2. `:cardholder_not_found` — CardIssuance exists but ExpenseCard has no user_id

These scenarios require mocking or test fixtures to create the specific database states.

**Context**: Manual testing covered `:card_not_found`, `:user_not_found`, and `:no_identifier` successfully.
