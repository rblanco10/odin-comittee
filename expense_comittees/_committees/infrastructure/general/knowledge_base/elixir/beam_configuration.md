# BEAM VM Configuration

## Current State
Based on ECS task definition analysis - no explicit BEAM configuration visible.

## Default Behavior in Containers
```bash
# BEAM will detect and use:
# - CPU: Uses visible CPUs (may see host CPUs)
# - Schedulers: One per detected CPU
# - Memory: Uses cgroup limits if available
```

## Recommended Configuration
```bash
# rel/env.sh.eex or RELEASE_VM_ARGS
export ERL_FLAGS="+S 1:1 +SDcpu 1:1 +P 1048576 +Q 65536"

# Options:
# +S N:N       - Schedulers (match container CPU)
# +SDcpu N:N   - Dirty CPU schedulers
# +P N         - Max processes (default 262144)
# +Q N         - Max ports (default 65536)
```

## Memory Recommendations
```bash
# For 512MB container:
export ERL_AFLAGS="-kernel inet_default_connect_options [{nodelay,true}]"

# Consider:
# - +MBas aobf       # Allocator strategy
# - +MBsbct 512      # Super block carrier threshold
# - +MMscs 256       # Max cached segments
```

## Fargate-Specific Issues
1. **CPU Units ≠ vCPUs**: 256 units = 0.25 vCPU
2. **Scheduler Detection**: BEAM may see wrong CPU count
3. **Memory Limits**: Container OOM without graceful handling

## Production Recommendations
```elixir
# In config/prod.exs
config :flame_teampay_payables, FlameTeampayPayablesWeb.Endpoint,
  server: true,
  check_origin: ["https://yourdomain.com"],
  http: [
    transport_options: [socket_opts: [:inet6]]
  ]
```
