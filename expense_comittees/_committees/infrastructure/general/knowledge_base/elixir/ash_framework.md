# Ash Framework Infrastructure Considerations

## Context
Application uses Ash Framework for data modeling layer.

## Database Implications
- Ash generates Ecto migrations
- Schema complexity may increase DB load
- Policies evaluated at query time

## Resource Usage
- **Memory**: Ash maintains caches
- **CPU**: Policy evaluation overhead
- **DB Connections**: May need higher pool

## Migration Considerations
```elixir
# Ash migrations via:
mix ash.codegen migration_name
mix ash_postgres.generate_migrations
mix ash_postgres.migrate
```

## Deployment Order
1. Database migrations MUST run before new code
2. Ash resources compile at boot
3. Initial queries may be slow (cache cold)

## Performance Tuning
```elixir
# Consider for Ash resources
config :ash, :pub_sub, [
  # Configure PubSub for notifications
]

# Pagination for large datasets
read :list do
  pagination offset?: true, default_limit: 25
end
```

## Infrastructure Recommendations
- Increase ECS memory for Ash overhead
- Monitor database connection pool usage
- Consider read replicas for heavy read workloads
