# Aurora PostgreSQL Serverless v2

## Source
`infrastructure/lib/stacks/aurora-stack.js`

## Cluster Configuration
```javascript
// From aurora-stack.js
engine: DatabaseClusterEngine.auroraPostgres({
  version: AuroraPostgresEngineVersion.VER_15_4
})
serverlessV2MinCapacity: envConfig.aurora.minCapacity,  // 0.5-2
serverlessV2MaxCapacity: envConfig.aurora.maxCapacity,  // 4-16
```

## Security Setup
- **Credentials**: Secrets Manager with automatic rotation
- **Encryption**: KMS at rest
- **Network**: Isolated subnets, security group limited to ECS

## Backup Configuration
```javascript
backup: {
  retention: Duration.days(7),
  preferredWindow: '03:00-04:00'
}
deletionProtection: isProd  // Only in production
```

## Connection String Format
```
postgres://username:password@cluster-endpoint:5432/database_name?sslmode=require
```

## Performance Considerations
- Serverless v2 scales in 0.5 ACU increments
- Cold start possible at 0.5 ACU minimum
- Consider higher minimum for production latency

## Secret Rotation
```javascript
// Automatic rotation configured
rotationSchedule: Duration.days(30)
```
