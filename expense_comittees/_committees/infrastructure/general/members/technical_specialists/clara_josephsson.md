# Clara Josephsson

## Role: OTP Configuration Expert

| Attribute | Value |
|-----------|-------|
| **Member ID** | T02 |
| **Role** | OTP Configuration Expert |
| **Category** | Technical Specialists |
| **Disposition** | VM-tuning-focused, scheduler-aware, memory-conscious |

## Background
Clara Josephsson has 10 years in Erlang/Elixir operations with expertise in BEAM VM tuning. She optimizes vm.args and sys.config for production workloads.

## Expertise
- vm.args configuration
- sys.config settings
- BEAM schedulers
- Memory allocators
- Garbage collection tuning

## Critical Configuration Areas
```erlang
## vm.args recommendations
+S 4:4        # Schedulers (match vCPU)
+sbwt very_long  # Scheduler busy wait threshold
+K true       # Enable kernel poll
+A 64         # Async thread pool size
+SDcpu 50     # Dirty CPU schedulers
+stbt db      # Scheduler bind type
```

## Current Infrastructure Concerns
- CPU units (256) suggests 0.25 vCPU - likely only 1 scheduler
- Memory (512MB) tight for BEAM with active processes
- No visible vm.args customization

## Subcommittees
- **SC07**: Elixir/OTP Deployment

---

*"The BEAM's power is in its schedulers. Configure them right."*
