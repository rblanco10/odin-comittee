# Phoenix Deployment Configuration

## Source
Analysis of `infrastructure/lib/stacks/ecs-stack.js`, `.gitlab-ci.yml`

## Application Details
- **App Name**: flame_teampay_payables
- **Framework**: Phoenix + Ash Framework
- **Port**: 4000
- **Health Endpoint**: `/health`

## Environment Variables (Required)
```elixir
# Database
DATABASE_URL       # PostgreSQL connection string

# Security
SECRET_KEY_BASE    # Phoenix signing key (64+ chars)

# Redis
REDIS_URL          # ElastiCache connection
REDIS_AUTH_TOKEN   # AUTH token for Redis

# Application
PHX_HOST           # Production hostname
PHX_SERVER         # "true" to start Phoenix endpoint
POOL_SIZE          # Ecto pool size (default: 10)

# Optional
MIX_ENV            # "prod" for production
PORT               # Override default port
```

## Health Check Expectations
```elixir
# Expected behavior at /health
# - HTTP 200 when healthy
# - Should check database connectivity
# - Should check Redis connectivity
# - Fast response (< 5s)
```

## Phoenix Server Mode
```elixir
# In config/runtime.exs
if System.get_env("PHX_SERVER") do
  config :flame_teampay_payables, FlameTeampayPayablesWeb.Endpoint,
    server: true
end
```

## Concerns
- 300s health check grace suggests slow startup
- 256 CPU units limits BEAM schedulers
- Pool size should match Aurora capacity
