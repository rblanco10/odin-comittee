# IAM Policies and Roles

## Source
`infrastructure/lib/stacks/ecs-stack.js`, CDK implicit role creation

## ECS Task Roles

### Task Execution Role
Permissions for ECS agent:
- ECR: Pull images
- CloudWatch Logs: Create log streams, put log events
- Secrets Manager: Get secret values

```javascript
// CDK creates automatically with:
taskDefinition.addToExecutionRolePolicy(...)
```

### Task Role
Permissions for application:
- S3: Read/write to uploads bucket
- Secrets Manager: Access specific secrets
- CloudWatch: Put metrics (if needed)

## Least Privilege Patterns

### Secret Access
```javascript
// Specific secret access, not wildcard
secret.grantRead(taskDefinition.taskRole);
```

### S3 Access
```javascript
// Bucket-specific, not s3:*
bucket.grantReadWrite(taskDefinition.taskRole);
```

## Security Groups as IAM Extension

### ECS to Database
```javascript
// Only ECS can reach database
rdsSecurityGroup.addIngressRule(
  ecsSecurityGroup, 
  Port.tcp(5432)
);
```

### ALB to ECS
```javascript
// Only ALB can reach containers
ecsSecurityGroup.addIngressRule(
  albSecurityGroup,
  Port.tcp(4000)
);
```

## Recommendations
1. Audit task role permissions periodically
2. Consider IAM Access Analyzer
3. Add resource-based policies where possible
