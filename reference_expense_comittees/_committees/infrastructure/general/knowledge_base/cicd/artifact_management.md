# Artifact Management

## Source
`.gitlab-ci.yml`, `infrastructure/lib/stacks/ecs-stack.js`

## Docker Images

### ECR Repository
```javascript
// From ecs-stack.js
const repository = Repository.fromRepositoryName(
  this, 'AppRepo', 
  'flame-teampay-payables'
);
```

### Image Tagging Strategy
```yaml
# Current
IMAGE_TAG: $CI_COMMIT_SHORT_SHA

# Recommended additions
IMAGE_TAG_SEMANTIC: v1.2.3
IMAGE_TAG_ENV: develop-latest
```

## Image Lifecycle

### Current State
- Images pushed on every build
- No visible lifecycle policy

### Recommended Policy
```javascript
new ecr.CfnLifecyclePolicy(this, 'LifecyclePolicy', {
  repositoryName: repo.repositoryName,
  lifecyclePolicyText: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Keep last 30 images',
      selection: {
        tagStatus: 'any',
        countType: 'imageCountMoreThan',
        countNumber: 30
      },
      action: { type: 'expire' }
    }]
  })
});
```

## Build Artifacts
- Release tarball
- Static assets (if separate)
- Migration scripts

## CDK Outputs
```javascript
// Stack outputs become artifacts
new CfnOutput(this, 'ServiceArn', { value: service.serviceArn });
new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
```
