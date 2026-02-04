# SC02 Focus Areas

## Current Pipeline State

### Stages (from .gitlab-ci.yml)
1. validate (lint, tests)
2. detect (change detection)
3. build (Docker image)
4. prepare_ecr
5. push (to ECR)
6. deploy_infra (CDK)
7. deploy_services (ECS)
8. verify

### Key Observations
- Pre-deployment migrations implemented ✓
- Docker buildx for AMD64 builds
- OBAN_LICENSE_KEY as build arg
- Image artifacts passed between jobs
- ECR lifecycle policies not visible

### Optimization Opportunities
1. Build caching improvements
2. Parallel job execution
3. Conditional deployments
4. Smaller Docker images
