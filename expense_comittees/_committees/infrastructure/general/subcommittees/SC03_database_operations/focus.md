# SC03 Focus Areas

## Current Database State

### Aurora PostgreSQL Serverless v2
```javascript
version: PostgreSQL 15.12
minCapacity: 0.5 ACU
maxCapacity: 4 ACU
deletionProtection: true
iamAuthentication: true
```

### ElastiCache Redis
```javascript
version: 7.0
nodeType: cache.t3.micro
numCacheClusters: 1  // No replication
transitEncryption: true
atRestEncryption: true
```

### S3
```javascript
versioned: prod only
encryption: S3_MANAGED
lifecycleRules: multipart cleanup, glacier transition
```

## Priority Items
1. Redis HA for production
2. Aurora backup verification
3. S3 encryption upgrade to KMS
4. Connection pooling validation
