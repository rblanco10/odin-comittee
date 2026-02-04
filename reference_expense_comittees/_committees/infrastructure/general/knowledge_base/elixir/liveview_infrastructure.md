# LiveView Infrastructure Requirements

## Source
`infrastructure/lib/stacks/alb-stack.js`, `infrastructure/lib/stacks/security-stack.js`

## ALB Configuration for LiveView
```javascript
// From alb-stack.js - Sticky sessions required
stickinessCookieDuration: Duration.days(1)
```

## Why Sticky Sessions?
- LiveView uses WebSocket connections
- Each connection is stateful
- User must return to same container
- Without stickiness: reconnect loops

## WAF Exceptions
```javascript
// From security-stack.js
// LiveView endpoint needs special handling
'/live/websocket' - Excluded from some WAF rules
```

## Health Check Path
- `/health` - Standard health check
- `/live/websocket` - Should NOT be health check path

## Connection Limits
```elixir
# Consider in Phoenix config
config :flame_teampay_payables, FlameTeampayPayablesWeb.Endpoint,
  live_view: [
    signing_salt: "your_salt"
  ],
  pubsub_server: FlameTeampayPayables.PubSub
```

## Scaling Implications
- Sticky sessions may cause uneven load
- Consider connection limits per task
- PubSub across tasks needs Redis or PG adapter

## Connection Draining
- ALB drains connections on deployment
- LiveView users may see disconnect during deploy
- Consider: notify users of pending deployment
