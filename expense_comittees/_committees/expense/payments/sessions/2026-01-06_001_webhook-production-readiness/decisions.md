# Session Decisions

> **Session ID**: 2026-01-06_001_webhook-production-readiness  
> **Goal**: Webhook Production Readiness Review  
> **Decision Authority**: Human Director with Committee Recommendation

---

## Decision 1: Circuit Breaker — DO NOT IMPLEMENT

**Decision ID**: DEC-2026-01-06-001  
**Proposed By**: Dr. Raymond Walsh (Complexity Critic)  
**Seconded By**: Dr. Amanda Foster (Elixir Expert)  
**Human Director**: Approved

### Decision Statement

The committee recommends **NOT implementing a circuit breaker** for webhook processing. This decision is binding and should be referenced if future engineers propose adding one.

### Rationale

The current webhook architecture already provides the properties that a circuit breaker would offer:

| Concern | How Current Architecture Handles It |
|---------|-------------------------------------|
| Processing failures | AshOban retries automatically (max 5 attempts) |
| Stuck webhooks | 15-minute timeout trigger resets status |
| Permanent failures | Alert trigger notifies after 5 failures |
| Cascading failures | **Cannot occur** — ingestion is decoupled from processing |

### Technical Analysis

The webhook flow is:

```
Provider → Controller → Store in DB → Return 200 → Process later via AshOban
                              ↑
                    Failure here does NOT cascade
```

Key insight: **Webhooks are stored before processing begins.** If `process_webhook_event` fails:
- The webhook record exists (audit trail preserved)
- AshOban retries automatically up to 5 times
- New webhooks continue to be ingested unaffected
- No provider is blocked waiting for a response

A circuit breaker protects against cascading failures when continuing to call a failing downstream service makes things worse. **This condition does not exist in our architecture** because:
1. We return 200 to the provider immediately (before processing)
2. Processing is local database operations (not external API calls)
3. Failed processing doesn't block new webhook ingestion

### When to Revisit This Decision

Add a circuit breaker IF the webhook processing layer evolves to:
- Make external API calls (notification services, analytics, etc.)
- Call third-party services that could be slow or failing
- Have processing that could overwhelm shared resources

**Future engineers:** If you're considering adding a circuit breaker, first verify that the above conditions exist. If they don't, refer to this decision document.

### Vote Record

- **In Favor**: Dr. Raymond Walsh, Dr. Amanda Foster, Christina Nguyen, Alex Rivera, Victoria Sterling
- **Opposed**: None
- **Abstaining**: None
- **Human Director**: Approved

---

## Decision 2: Rate Limiting — IMPLEMENT USING HAMMER

**Decision ID**: DEC-2026-01-06-002  
**Proposed By**: Christina Nguyen (Resilience Expert)  
**Seconded By**: Dr. Raymond Walsh (Complexity Critic)  
**Human Director**: Approved

### Decision Statement

The committee recommends **implementing rate limiting on the webhook endpoint** using the Hammer library with a Plug-based approach.

### Rationale

Rate limiting is warranted because:
1. Providers can send webhook floods (intentionally during bulk operations, or due to bugs)
2. An attacker could forge webhooks to exhaust database resources
3. It's cheap insurance (~30 minutes implementation)
4. Hammer is a battle-tested, well-maintained library

### Implementation Specification

**Library**: `hammer` (https://github.com/ExHammer/hammer)

**Location**: `FlameTeampayPayablesWeb.Endpoint` or `WebhookController`

**Configuration**:
```elixir
# Recommended limits
rate_limit: {"webhook_global", 60_000, 200}  # 200 requests per minute globally

# OR per-provider limits
rate_limit: {"webhook:#{provider}", 60_000, 100}  # 100 per minute per provider
```

**Behavior on Rate Limit Exceeded**:
- Return HTTP 429 (Too Many Requests)
- Most providers handle 429 gracefully and retry with backoff
- Log the rate limit event for monitoring

### Alternatives Considered and Rejected

| Alternative | Why Rejected |
|-------------|--------------|
| Infrastructure-level (nginx) | Requires infrastructure changes; in-app is sufficient |
| Custom ETS implementation | Adds maintenance burden; Hammer is well-tested |
| No rate limiting | Leaves system vulnerable to floods |
| Fuse library | Overkill for rate limiting; Hammer is purpose-built |

### Vote Record

- **In Favor**: Christina Nguyen, Dr. Raymond Walsh, Dr. Amanda Foster, Dr. Eleanor Vance, Victoria Sterling
- **Opposed**: None
- **Abstaining**: None
- **Human Director**: Approved

---

## Decision 3: Require Webhook Signatures — IMPLEMENT

**Decision ID**: DEC-2026-01-08-001  
**Proposed By**: Dr. Eleanor Vance (Security Adversary)  
**Seconded By**: Ryan Mitchell (API Integration Expert)  
**Human Director**: Approved

### Decision Statement

The committee recommends **requiring webhook signatures** for all incoming webhooks. The current code allows webhooks without any authentication headers, which creates a security vulnerability.

### Problem Statement

Current code in `WebhookController.extract_signature/1`:
```elixir
case signatures do
  [signature | _] -> {:ok, signature}
  # TEMPORARY: Allow webhooks without signature for testing
  [] -> {:ok, nil}
end
```

This allows an attacker who knows a valid `connection_id` to forge webhooks.

### Attack Vector

1. Attacker discovers a valid `connection_id` (from logs, URLs, or guessing)
2. Attacker sends forged webhook to `/webhooks/:provider/:connection_id`
3. System accepts webhook with no signature
4. Attacker can create fake transactions, card state changes, etc.

### Implementation Specification

**Change Required** (1 line):
```elixir
# Before:
[] -> {:ok, nil}

# After:
[] -> {:error, :missing_signature}
```

**Location**: `lib/flame_teampay_payables_web/controllers/webhook_controller.ex`, line ~686

**Behavior After Fix**:
- Webhooks without authentication headers return HTTP 401
- All known providers include auth headers (Basic Auth or HMAC signatures)
- Existing provider webhooks continue to work

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Provider sends without auth | Low — all known providers use auth | Monitor 401 rates after deploy |
| Existing tests break | Medium | Update test fixtures to include signatures |

### Verification Requirements

Three subcommittees must independently verify the implementation:
1. SC08 Testing & Quality — Verify tests are correct
2. SC09 Security & Compliance — Verify security gap is closed
3. SC07 Resilience & Observability — Verify error handling is proper

**CRITICAL**: Subcommittees must READ THE ACTUAL CODE FILES, not rely on context.

### Vote Record

- **In Favor**: Dr. Eleanor Vance, Ryan Mitchell, Christina Nguyen, David Kim, Victoria Sterling
- **Opposed**: None
- **Abstaining**: None
- **Human Director**: Approved

---

## Decision 4: Replay Protection — DEFERRED

**Decision ID**: DEC-2026-01-08-002  
**Status**: Deferred for future session

### Decision Statement

The committee recommends **deferring replay protection** implementation to a future session. While valuable, it requires ~2 hours of work with careful testing across all providers due to clock skew concerns.

### Rationale for Deferral

1. Moderate complexity (~50-80 lines of code)
2. Requires provider-specific timestamp extraction
3. Clock skew handling adds risk
4. Current idempotency check (event_id + provider) provides partial protection

### When to Revisit

Consider implementing replay protection when:
- A replay attack is detected
- Higher security posture is required
- During a dedicated security hardening session

---

## Decision Summary

| ID | Decision | Status |
|----|----------|--------|
| DEC-2026-01-06-001 | Do NOT implement circuit breaker | ✅ Approved |
| DEC-2026-01-06-002 | Implement rate limiting with Hammer | ✅ Approved |
| DEC-2026-01-08-001 | Require webhook signatures | ✅ Approved |
| DEC-2026-01-08-002 | Replay protection | ⏸️ Deferred |

---

*Decisions recorded by Emily Watson, Recording Clerk*  
*Approved by Victoria Sterling, Chair*  
*Ratified by Human Director*
