# Session Goal

> **Session**: 2026-01-15_002_3ds-otp-user-not-found-testing  
> **Opened**: 2026-01-15  
> **Chair**: Victoria Sterling

---

## Primary Objective

Test and verify the "User Not Found" error scenarios in the 3DS OTP Notification flow.

## Context

The happy path for the 3DS OTP Notification flow has been tested and verified as working. This session focuses on the error/edge case scenarios where user lookup fails.

## Success Criteria

- [x] All error paths in `lookup_user/3` are tested (3 of 5 tested manually; 2 documented for automated testing)
- [x] Error logging is verified for each scenario
- [x] Webhook handler properly returns error responses
- [x] Edge cases documented

## Scope Boundaries

**IN SCOPE:**
- Testing `:card_not_found` scenario (no CardIssuance for card_token)
- Testing `:expense_card_not_found` scenario (CardIssuance exists but no ExpenseCard)
- Testing `:cardholder_not_found` scenario (CardIssuance exists but no user_id)
- Testing `:user_not_found` scenario (no CardHolder for user_token)
- Testing `:no_identifier` scenario (neither card_token nor user_token provided)
- Verifying error handling propagates correctly through the webhook handler

**OUT OF SCOPE:**
- Changes to happy path logic (already verified working)
- UI/frontend testing
- Email delivery verification

## Expected Outputs

- [x] Test commands documented for each error scenario
- [x] Verification of error handling behavior
- [x] Any issues identified and documented (none found; 2 scenarios noted for future automated tests)
