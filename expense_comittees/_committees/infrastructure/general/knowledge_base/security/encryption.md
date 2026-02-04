# Encryption Configuration

## Source
`infrastructure/lib/stacks/security-stack.js`, `aurora-stack.js`, `s3-stack.js`, `redis-stack.js`

## KMS Key Configuration
```javascript
// From security-stack.js
const kmsKey = new Key(this, 'InfraKey', {
  enableKeyRotation: true,
  alias: `${projectName}/${env}/infra-key`
});
```

## Encryption at Rest

### Aurora PostgreSQL
```javascript
// Uses KMS encryption
storageEncrypted: true
// Default AWS-managed key or custom KMS
```

### ElastiCache Redis
```javascript
// From redis-stack.js
atRestEncryptionEnabled: true
```

### S3 Buckets
```javascript
// Current: S3-managed encryption
encryption: BucketEncryption.S3_MANAGED

// Recommended: KMS encryption
encryption: BucketEncryption.KMS,
encryptionKey: kmsKey
```

## Encryption in Transit

### ALB → Client
- TLS 1.2+ enforced
- ACM certificate

### ECS → Aurora
- SSL mode required in connection string
- `?sslmode=require`

### ECS → Redis
```javascript
// From redis-stack.js
transitEncryptionEnabled: true
```

### Within VPC
- All internal traffic can use TLS
- VPC endpoints use AWS internal network

## Improvement Opportunities
1. Upgrade S3 to KMS encryption
2. Add client-side encryption for sensitive data
3. Consider field-level encryption for PII
