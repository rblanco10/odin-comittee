# Resource Tagging Strategy

## Source
`infrastructure/bin/app.js` tag patterns

## Current Tags
```javascript
// From app.js
Tags.of(app).add('Project', projectName);
Tags.of(app).add('Environment', environmentName);
Tags.of(app).add('ManagedBy', 'CDK');
```

## Recommended Additional Tags

### Cost Allocation
```javascript
Tags.of(stack).add('CostCenter', 'engineering');
Tags.of(stack).add('Team', 'platform');
```

### Operational
```javascript
Tags.of(stack).add('Application', 'flame-teampay-payables');
Tags.of(stack).add('Owner', 'platform-team@company.com');
```

### Compliance
```javascript
Tags.of(stack).add('DataClassification', 'internal');
Tags.of(stack).add('Compliance', 'soc2');
```

## Tag-Based Cost Reports
```bash
# Enable cost allocation tags in AWS Console
# Then filter costs by tag

aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --filter '{"Tags":{"Key":"Environment","Values":["production"]}}' \
  --metrics "BlendedCost"
```

## Tag Enforcement
Consider AWS Organizations SCP:
```json
{
  "Effect": "Deny",
  "Action": "ec2:RunInstances",
  "Resource": "*",
  "Condition": {
    "Null": {
      "aws:RequestTag/Environment": "true"
    }
  }
}
```
