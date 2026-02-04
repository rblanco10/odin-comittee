# S3 Storage Configuration

## Source
`infrastructure/lib/stacks/s3-stack.js`

## Bucket Configuration
```javascript
// From s3-stack.js
const uploadsBucket = new Bucket(this, 'UploadsBucket', {
  bucketName: `${projectName}-uploads-${env}`,
  encryption: BucketEncryption.S3_MANAGED,  // Consider KMS
  versioned: true,
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true
});
```

## Lifecycle Rules
```javascript
lifecycleRules: [{
  id: 'cleanup-old-versions',
  noncurrentVersionExpiration: Duration.days(30),
  abortIncompleteMultipartUploadAfter: Duration.days(7)
}]
```

## CORS Configuration
```javascript
cors: [{
  allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.POST],
  allowedOrigins: ['*'],  // Tighten in production
  allowedHeaders: ['*'],
  maxAge: 3000
}]
```

## Access Pattern
- **Application**: IAM role-based access via ECS task role
- **Users**: Pre-signed URLs for direct upload/download
- **Public**: Blocked entirely

## Improvement Opportunity
- Change from `S3_MANAGED` to `KMS` encryption
- Tighten CORS origins for production
- Add intelligent tiering for cost optimization
