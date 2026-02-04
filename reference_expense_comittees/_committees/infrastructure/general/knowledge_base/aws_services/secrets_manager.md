# Secrets Manager

## Source
`infrastructure/lib/stacks/aurora-stack.js`, `infrastructure/lib/stacks/redis-stack.js`, `infrastructure/lib/stacks/ecs-stack.js`

## Secrets Managed
1. **Aurora credentials**: Auto-generated, auto-rotated
2. **Redis AUTH token**: Auto-generated
3. **SECRET_KEY_BASE**: Phoenix secret

## Aurora Secret Configuration
```javascript
// From aurora-stack.js
credentials: Credentials.fromGeneratedSecret('dbadmin', {
  secretName: `${projectName}/${env}/aurora-credentials`
})

// Rotation schedule
rotationSchedule: Duration.days(30)
```

## Secret Injection to ECS
```javascript
// From ecs-stack.js
secrets: {
  DATABASE_URL: ecs.Secret.fromSecretsManager(rdsSecret, 'connectionString'),
  SECRET_KEY_BASE: ecs.Secret.fromSecretsManager(appSecret, 'secretKeyBase'),
  REDIS_AUTH_TOKEN: ecs.Secret.fromSecretsManager(redisSecret, 'authToken')
}
```

## Access Pattern
- Secrets retrieved at container start
- Cached in container memory
- No secrets in environment at rest

## Security Notes
- KMS encryption for all secrets
- IAM policies restrict access to ECS task role only
- Rotation minimizes exposure window
