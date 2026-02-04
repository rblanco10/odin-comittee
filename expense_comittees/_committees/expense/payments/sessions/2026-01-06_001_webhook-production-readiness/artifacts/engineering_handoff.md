# Engineering Handoff: Webhook Rate Limiting

> **Session**: 2026-01-06_001_webhook-production-readiness  
> **Decision**: DEC-2026-01-06-002  
> **Priority**: High  
> **Assigned To**: Engineering Subcommittee

---

## Executive Summary

Implement rate limiting on the webhook endpoint using the Hammer library. This protects against webhook floods from providers or attackers.

**Scope**: Add rate limiting to `WebhookController`  
**Estimated Effort**: 2-4 hours (including tests)  
**Dependencies**: Add `hammer` library

---

## Requirements

### Functional Requirements

1. **Rate limit all incoming webhooks** at the controller level
2. **Limit**: 200 requests per minute per IP address (configurable)
3. **Response on limit exceeded**: HTTP 429 with appropriate message
4. **Logging**: Log all rate limit events with provider and IP

### Non-Functional Requirements

1. **Performance**: Rate limiting check must add < 1ms latency
2. **Reliability**: Rate limiter failure should NOT block webhooks (fail open)
3. **Observability**: Emit telemetry events for rate limit hits

---

## Technical Specification

### Step 1: Add Dependency

In `mix.exs`:

```elixir
defp deps do
  [
    # ... existing deps
    {:hammer, "~> 6.1"}
  ]
end
```

Run: `mix deps.get`

### Step 2: Configure Hammer Backend

In `config/config.exs`:

```elixir
config :hammer,
  backend: {Hammer.Backend.ETS, [
    expiry_ms: 60_000 * 60 * 2,  # 2 hours
    cleanup_interval_ms: 60_000 * 10  # 10 minutes
  ]}
```

### Step 3: Add Rate Limiting to WebhookController

**File**: `lib/flame_teampay_payables_web/controllers/webhook_controller.ex`

Add a plug at the top of the controller:

```elixir
defmodule FlameTeampayPayablesWeb.WebhookController do
  use FlameTeampayPayablesWeb, :controller

  require Logger

  # Rate limiting: 200 requests per minute per IP
  plug :rate_limit_webhooks

  # ... existing code ...

  # Add this private function
  defp rate_limit_webhooks(conn, _opts) do
    # Get client IP (handles proxies via x-forwarded-for)
    client_ip = get_client_ip(conn)
    bucket_key = "webhook:#{client_ip}"

    case Hammer.check_rate(bucket_key, 60_000, 200) do
      {:allow, count} ->
        # Log high usage (> 80% of limit)
        if count > 160 do
          Logger.warning("Webhook rate limit approaching",
            ip: client_ip,
            count: count,
            limit: 200
          )
        end
        conn

      {:deny, retry_after} ->
        Logger.warning("Webhook rate limited",
          ip: client_ip,
          retry_after_ms: retry_after
        )

        # Emit telemetry for monitoring
        :telemetry.execute(
          [:webhook, :rate_limited],
          %{count: 1},
          %{ip: client_ip}
        )

        conn
        |> put_status(429)
        |> put_resp_header("retry-after", Integer.to_string(div(retry_after, 1000)))
        |> json(%{error: "rate_limited", message: "Too many requests. Please retry later."})
        |> halt()
    end
  end

  defp get_client_ip(conn) do
    # Check for proxy headers first
    forwarded_for = 
      conn
      |> get_req_header("x-forwarded-for")
      |> List.first()

    case forwarded_for do
      nil -> 
        conn.remote_ip |> :inet.ntoa() |> to_string()
      
      header ->
        # x-forwarded-for can contain multiple IPs, take the first (client)
        header
        |> String.split(",")
        |> List.first()
        |> String.trim()
    end
  end
end
```

### Step 4: Add Application Startup (if using ETS backend)

In `lib/flame_teampay_payables/application.ex`, ensure Hammer starts:

```elixir
def start(_type, _args) do
  children = [
    # ... existing children
    # Hammer is automatically started by the library
  ]
  # ...
end
```

Note: Hammer with ETS backend starts automatically. No explicit child needed.

---

## Test Specification

### Required Tests

Create file: `test/flame_teampay_payables_web/controllers/webhook_controller_rate_limit_test.exs`

**Test Cases**:

1. **test "allows requests under rate limit"**
   - Send 5 webhook requests
   - All should return 200
   - Verify webhooks are processed

2. **test "returns 429 when rate limit exceeded"**
   - Send 201 requests rapidly
   - First 200 should return 200
   - 201st should return 429
   - Verify 429 response includes `retry-after` header

3. **test "rate limit is per-IP"**
   - Send 150 requests from IP A
   - Send 150 requests from IP B
   - All should succeed (different buckets)

4. **test "rate limit resets after window"**
   - Send 200 requests (hit limit)
   - Wait 60 seconds (or mock time)
   - Send another request
   - Should succeed

5. **test "rate limited requests are logged"**
   - Hit rate limit
   - Verify Logger.warning was called with expected metadata

6. **test "telemetry event emitted on rate limit"**
   - Attach telemetry handler
   - Hit rate limit
   - Verify [:webhook, :rate_limited] event received

### Test Implementation Notes

- Use `Hammer.delete_buckets/1` in setup to ensure clean state
- May need to mock Hammer for time-based tests
- Use `Plug.Test` for controller testing

---

## Verification Checklist

For Engineering Team:

- [ ] Dependency added to mix.exs
- [ ] Hammer configured in config.exs
- [ ] Rate limiting plug added to WebhookController
- [ ] get_client_ip handles x-forwarded-for
- [ ] 429 response includes retry-after header
- [ ] Telemetry event emitted
- [ ] Warning logged when limit approached (>80%)
- [ ] All 6 test cases implemented
- [ ] All tests pass

For Verification Subcommittees:

- [ ] Code matches specification in this document
- [ ] Tests cover all 6 specified scenarios
- [ ] Tests actually test the behavior (no shortcuts/mocks that bypass real logic)
- [ ] Rate limit values match specification (200/minute)
- [ ] Error response format matches specification

---

## What NOT To Do

Per Decision DEC-2026-01-06-001, do **NOT**:

- Add circuit breaker logic
- Add complex failure handling beyond rate limiting
- Add per-provider rate limiting (global IP-based is sufficient for now)
- Add distributed rate limiting (ETS is sufficient for single-node)

---

## Success Criteria

1. Webhook endpoint rejects requests exceeding 200/minute/IP
2. Legitimate webhook traffic is unaffected
3. All tests pass
4. Three subcommittees verify implementation matches spec

---

*Document prepared by Victoria Sterling, Chair*  
*Technical specification by Christina Nguyen, Resilience Expert*
