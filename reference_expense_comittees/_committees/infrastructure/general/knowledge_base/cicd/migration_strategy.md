# Database Migration Strategy

## Source
`infrastructure/documentation/DEPLOYMENT_REVIEW_AND_BEST_PRACTICES.md`, `infrastructure/documentation/MIGRATION_BEST_PRACTICES_IMPLEMENTED.md`

## Problem Statement
Originally: Migrations ran AFTER new code deployed
- Risk: New code referencing non-existent columns
- Result: Application errors, potential data corruption

## Implemented Solution
```yaml
# Pipeline order:
1. deploy-infra    # CDK updates
2. migrate         # Database migrations (NEW)
3. deploy-service  # ECS service update
```

## Migration Execution
```bash
# Run as standalone ECS task
aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition $APP-migrate \
  --launch-type FARGATE \
  --network-configuration "..."
```

## Fallback Strategy
```yaml
# If ECS task fails, fallback to init container
deploy-service:
  before_script:
    - # Check if migration ran successfully
    - # If not, init container will run migrations
```

## Migration Best Practices
1. **Backward Compatible**: Old code must work with new schema
2. **Forward Compatible**: New code must work with old schema
3. **Idempotent**: Running twice should be safe
4. **Small Changes**: Split large migrations

## Rollback Procedure
1. Revert CDK to previous version
2. Run down migrations if needed
3. Deploy previous app version
