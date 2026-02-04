# Elixir Release Configuration

## Standard Release Setup
```elixir
# mix.exs
def project do
  [
    releases: [
      flame_teampay_payables: [
        include_executables_for: [:unix],
        applications: [runtime_tools: :permanent]
      ]
    ]
  ]
end
```

## Dockerfile Structure
```dockerfile
# Build stage
FROM elixir:1.15-otp-26 AS builder
ENV MIX_ENV=prod
WORKDIR /app
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile
COPY . .
RUN mix release

# Runtime stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 locales
COPY --from=builder /app/_build/prod/rel/flame_teampay_payables ./
CMD ["bin/flame_teampay_payables", "start"]
```

## Runtime Configuration
```elixir
# config/runtime.exs
import Config

config :flame_teampay_payables, FlameTeampayPayables.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10")

config :flame_teampay_payables, FlameTeampayPayablesWeb.Endpoint,
  url: [host: System.get_env("PHX_HOST")],
  secret_key_base: System.get_env("SECRET_KEY_BASE"),
  server: true
```

## Startup Command Options
```bash
# Standard start
bin/flame_teampay_payables start

# With migrations
bin/flame_teampay_payables eval "MyApp.Release.migrate()"
bin/flame_teampay_payables start

# Remote console (debugging)
bin/flame_teampay_payables remote
```

## Container Entry Point
```bash
#!/bin/sh
# entrypoint.sh
set -e
exec bin/flame_teampay_payables start
```
