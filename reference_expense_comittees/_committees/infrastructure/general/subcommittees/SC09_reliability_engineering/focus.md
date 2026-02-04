# SC09 Focus: Reliability

## Current State
- Aurora: Multi-AZ capable (verify config)
- Redis: Single node (no HA)
- ECS: Single task in dev
- ALB: Multi-AZ by default ✓
- Backups: Enabled ✓

## Gaps
1. No documented SLOs
2. Redis has no failover
3. DR procedures not documented
4. Recovery not tested

## Priorities
1. Define SLOs for availability/latency
2. Plan Redis HA for production
3. Document and test DR procedures
4. Schedule chaos/game day
