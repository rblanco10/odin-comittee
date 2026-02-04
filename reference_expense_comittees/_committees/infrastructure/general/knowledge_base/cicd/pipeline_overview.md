# CI/CD Pipeline Overview

## Source
`.gitlab-ci.yml`

## Pipeline Stages
```yaml
stages:
  - validate       # Code linting, security scans
  - build          # Docker image build
  - push           # Push to ECR
  - deploy-infra   # CDK deployment
  - deploy-service # ECS service update
  - verify         # Post-deployment checks
```

## Trigger Conditions
- **Branch**: develop (automatic)
- **Manual**: staging, production

## Pipeline Flow
```
┌──────────┐    ┌───────┐    ┌──────┐
│ validate │ →  │ build │ →  │ push │
└──────────┘    └───────┘    └──────┘
                                 ↓
┌────────┐    ┌────────────────┐    ┌───────────────┐
│ verify │ ← │ deploy-service │ ← │ deploy-infra  │
└────────┘    └────────────────┘    └───────────────┘
```

## Key Variables
- `IMAGE_TAG`: Git SHA or tag
- `AWS_REGION`: Deployment region
- `ENVIRONMENT`: develop/staging/production

## Critical Improvement: Pre-Deployment Migrations
From `MIGRATION_BEST_PRACTICES_IMPLEMENTED.md`:
```yaml
migrate:
  stage: migrate  # NEW: Before deploy-service
  script:
    - aws ecs run-task --cluster $CLUSTER --task-definition $MIGRATE_TASK
```
