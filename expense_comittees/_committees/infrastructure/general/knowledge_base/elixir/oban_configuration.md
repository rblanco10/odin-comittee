# Oban Pro Configuration

## Context
Application uses Oban Pro for background job processing.

## Infrastructure Requirements
1. **PostgreSQL**: Primary job storage
2. **Redis**: Optional, for rate limiting/uniqueness (Pro features)

## Recommended Configuration
```elixir
# config/prod.exs
config :flame_teampay_payables, Oban,
  repo: FlameTeampayPayables.Repo,
  plugins: [
    Oban.Plugins.Pruner,
    Oban.Plugins.Stager,
    {Oban.Plugins.Cron, crontab: [
      # {"0 * * * *", YourWorker}
    ]}
  ],
  queues: [
    default: 10,
    mailers: 5,
    events: 20
  ]
```

## ECS Considerations
- **SIGTERM Handling**: Oban needs graceful shutdown time
- **Multiple Tasks**: Consider Oban.Plugins.Gossip for coordination
- **Scaling**: Queue limits should account for task count

## Graceful Shutdown
```elixir
# In application.ex
def stop(_state) do
  Oban.stop()  # Drain jobs
end

# Or with shutdown timeout
children = [
  {Oban, shutdown: 30_000}
]
```

## Infrastructure Implications
- Jobs stored in Aurora (durable)
- Failed jobs retry automatically
- Pro features may need Redis for some functionality
