# Action Items

> **Session ID**: 2026-01-06_001_webhook-production-readiness  
> **Goal**: Webhook Production Readiness Review

---

## Open Action Items

*All action items completed.*

---

## Completed This Session (2026-01-08)

### AI-006: Implement Required Webhook Signatures — ✅ COMPLETE

**Description**: Remove the fallback that allows webhooks without signatures.

**Deliverables**:
- [x] Change `{:ok, nil}` to `{:error, :missing_signature}` in `extract_signature/1`
- [x] Verify error handling returns 401 for missing signatures

**Reference**: Decision DEC-2026-01-08-001
**Completed**: 2026-01-08 by Engineering Subcommittee

---

### AI-007: Write Signature Requirement Tests — ✅ COMPLETE

**Description**: Add tests to verify webhooks are rejected when no signature is present.

**Test Cases Implemented** (6 total):
1. ✅ Webhook with no signature returns 401
2. ✅ Webhook with Authorization header (Basic Auth) accepted
3. ✅ Webhook with x-marqeta-signature header accepted
4. ✅ Webhook with x-request-signature-sha-256 (Dwolla) accepted
5. ✅ Webhook with signature header (Checkbook) accepted
6. ✅ Error response does not leak sensitive information

**Test File**: `test/flame_teampay_payables_web/controllers/webhook_controller_signature_test.exs`
**Result**: 6 tests, 0 failures
**Completed**: 2026-01-08 by Engineering Subcommittee

---

### AI-008: SC08 Verification — Testing & Quality — ✅ VERIFIED

**Description**: Verify test implementation matches requirements.

**Verification by**: Mark Sullivan (Webhook Testing Expert)

**Tasks**:
- [x] Read the test file — DONE (lines 1-132)
- [x] Verify test cases match specification — 6 tests cover all requirements
- [x] Verify tests don't mock away signature checking — Tests use real HTTP requests
- [x] Confirm tests pass — 6 tests, 0 failures

**Verdict**: ✅ Tests correctly verify the security requirement

---

### AI-009: SC09 Verification — Security & Compliance — ✅ VERIFIED

**Description**: Verify security gap is properly closed.

**Verification by**: Dr. Robert Fleming (PCI Compliance Expert)

**Tasks**:
- [x] Read `webhook_controller.ex` and find `extract_signature/1` — Line 664-688
- [x] Verify `{:ok, nil}` is replaced with `{:error, :missing_signature}` — Line 686 confirmed
- [x] Verify 401 response is returned for missing signatures — Lines 199-202 confirmed
- [x] Verify no sensitive data is leaked in error responses — Only `%{error: "Missing signature"}`

**Verdict**: ✅ Security gap is properly closed

---

### AI-010: SC07 Verification — Resilience & Observability — ✅ VERIFIED

**Description**: Verify error handling and logging.

**Verification by**: Christina Nguyen (Resilience Expert)

**Tasks**:
- [x] Read the error handling code for `:missing_signature` — Lines 188-203
- [x] Verify appropriate logging occurs — `Logger.error` on line 199
- [x] Verify the fix doesn't break legitimate provider webhooks — All auth header types supported

**Verdict**: ✅ Verified with minor observation (consider adding telemetry)

---

## Action Item Details

### AI-001: Implement Webhook Rate Limiting

**Description**: Add rate limiting to the webhook endpoint using Hammer library per the engineering handoff document.

**Deliverables**:
- [ ] Add `hammer` dependency to mix.exs
- [ ] Configure Hammer backend in config.exs
- [ ] Add rate limiting plug to WebhookController
- [ ] Implement get_client_ip with x-forwarded-for support
- [ ] Return proper 429 response with retry-after header
- [ ] Emit telemetry on rate limit

**Reference**: `artifacts/engineering_handoff.md`

---

### AI-002: Write Rate Limiting Tests

**Description**: Implement all 6 test cases specified in the engineering handoff.

**Test Cases Required**:
1. Allows requests under rate limit
2. Returns 429 when rate limit exceeded
3. Rate limit is per-IP
4. Rate limit resets after window
5. Rate limited requests are logged
6. Telemetry event emitted on rate limit

**Reference**: `artifacts/engineering_handoff.md` § Test Specification

---

### AI-003: SC08 Verification (Testing & Quality)

**Description**: SC08 Testing & Quality subcommittee must verify:

**CRITICAL INSTRUCTION**: Subcommittee members MUST read the actual code and test files. Do NOT rely on context memory or summaries.

**Verification Tasks**:
- [ ] Read `test/flame_teampay_payables_web/controllers/webhook_controller_rate_limit_test.exs`
- [ ] Verify all 6 test cases are implemented
- [ ] Verify tests actually test the behavior (no shortcuts)
- [ ] Verify tests don't mock away the rate limiting logic
- [ ] Confirm tests pass when run

---

### AI-004: SC09 Verification (Security & Compliance)

**Description**: SC09 Security & Compliance subcommittee must verify:

**CRITICAL INSTRUCTION**: Subcommittee members MUST read the actual code. Do NOT rely on context memory.

**Verification Tasks**:
- [ ] Read the rate limiting implementation in WebhookController
- [ ] Verify IP extraction handles x-forwarded-for correctly
- [ ] Verify 429 response doesn't leak sensitive information
- [ ] Verify telemetry doesn't log sensitive data
- [ ] Confirm rate limit is applied BEFORE any webhook processing

---

### AI-005: SC07 Verification (Resilience & Observability)

**Description**: SC07 Resilience & Observability subcommittee must verify:

**CRITICAL INSTRUCTION**: Subcommittee members MUST read the actual code. Do NOT rely on context memory.

**Verification Tasks**:
- [ ] Read the Hammer configuration
- [ ] Verify rate limit values match spec (200/minute)
- [ ] Verify warning is logged at 80% threshold
- [ ] Verify telemetry event name matches spec
- [ ] Confirm rate limiter failure would fail open (not block webhooks)

---

## Completed Action Items

| ID | Item | Completed By | Date | Status |
|----|------|--------------|------|--------|
| AI-001 | Implement webhook rate limiting | Engineering Subcommittee | 2026-01-06 | ✅ Complete |
| AI-002 | Write and pass all test cases | Engineering Subcommittee | 2026-01-06 | ✅ Complete (9 tests, all pass) |
| AI-003 | Verify implementation matches spec | SC08 Testing & Quality | 2026-01-06 | ✅ Verified |
| AI-004 | Verify security requirements | SC09 Security & Compliance | 2026-01-06 | ✅ Verified |
| AI-005 | Verify rate limiting behavior | SC07 Resilience & Observability | 2026-01-06 | ✅ Verified |
| AI-006 | Require webhook signatures | Engineering Subcommittee | 2026-01-08 | ✅ Complete |
| AI-007 | Write signature tests (6 tests) | Engineering Subcommittee | 2026-01-08 | ✅ Complete |
| AI-008 | Verify tests match spec | SC08 Testing & Quality | 2026-01-08 | ✅ Verified |
| AI-009 | Verify security gap closed | SC09 Security & Compliance | 2026-01-08 | ✅ Verified |
| AI-010 | Verify error handling | SC07 Resilience & Observability | 2026-01-08 | ✅ Verified |

---

## Verification Protocol

**Per Human Director instruction**, all three verification subcommittees MUST:

1. **Actually read the code files** — not rely on summaries or context
2. **Read the test files** — verify tests match specification
3. **Check for shortcuts** — ensure tests don't bypass real logic
4. **Cross-reference** — compare code to engineering_handoff.md specification

**This is the most critical requirement of this session.**

---

*Action items tracked by Sophie Laurent, Artifacts Clerk*
