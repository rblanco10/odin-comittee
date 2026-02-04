# SC01: ECS & Container Platform

## Charter

### Mission
Ensure the ECS Fargate platform is optimized, reliable, and follows best practices for container orchestration.

### Scope
- ECS service configuration and task definitions
- Fargate platform optimization
- Container lifecycle management
- Autoscaling policies
- Health checks and deployment strategies

### Members
| Role | Member | ID |
|------|--------|-----|
| **Lead** | Priya Sharma | DC01 |
| Johan Lindberg | Container Specialist | DC02 |
| Carlos Mendez | Autoscaling Expert | DC03 |
| Aisha Okonkwo | Task Definition Expert | DC04 |
| Viktor Petrov | Availability Adversary | C01 |
| Rebecca Thompson | Spot Expert | F04 |

### Current Focus
Based on infrastructure analysis:
1. ECS task resource sizing (256 CPU / 512 MB may be tight for BEAM)
2. Single task configuration in dev (no redundancy)
3. Health check grace period optimization (currently 30 min)
4. Circuit breaker configuration

### Key Questions
- Is the current CPU/memory appropriate for Elixir/BEAM workloads?
- Should we use ECS Spot for non-production?
- Is the autoscaling policy responsive enough?
