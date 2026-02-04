# SC07 Focus: Elixir/OTP Configuration

## Current State
- Phoenix app: flame_teampay_payables
- Ash Framework
- Oban Pro jobs
- LiveView enabled
- WAF exceptions for /live/websocket ✓

## Concerns
- 256 CPU units = ~0.25 vCPU (limited schedulers)
- 512 MB memory (tight for BEAM)
- No visible vm.args customization
- 300s startup suggests heavy initialization

## Recommendations
1. Increase CPU/memory for BEAM
2. Configure BEAM schedulers explicitly
3. Review graceful shutdown (SIGTERM handling)
4. Verify connection draining
