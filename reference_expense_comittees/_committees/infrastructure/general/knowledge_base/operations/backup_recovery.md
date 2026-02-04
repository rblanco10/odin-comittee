# Backup and Recovery

## Source
`infrastructure/lib/stacks/aurora-stack.js`

## Aurora PostgreSQL Backups

### Automatic Backups
```javascript
// From aurora-stack.js
backup: {
  retention: Duration.days(7),
  preferredWindow: '03:00-04:00'
}
```

### Point-in-Time Recovery
```bash
# Restore to specific point
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier flame-teampay-$ENV \
  --db-cluster-identifier flame-teampay-$ENV-restore \
  --restore-to-time "2024-01-05T12:00:00Z"
```

### Manual Snapshot
```bash
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier flame-teampay-$ENV \
  --db-cluster-snapshot-identifier manual-$(date +%Y%m%d)
```

## S3 Versioning
```javascript
// From s3-stack.js
versioned: true
```

### Restore Previous Version
```bash
# List versions
aws s3api list-object-versions \
  --bucket flame-teampay-uploads-$ENV \
  --prefix path/to/file

# Restore specific version
aws s3api get-object \
  --bucket flame-teampay-uploads-$ENV \
  --key path/to/file \
  --version-id $VERSION_ID \
  restored-file
```

## Redis (No Automatic Backup)
- **Current**: No backups configured
- **Risk**: Data loss on failure
- **Recommendation**: Enable snapshots for production

## Recovery Time Objectives (TBD)
- Aurora: ~15-30 minutes PITR
- S3: Immediate (versioned)
- Redis: Not applicable (ephemeral)
