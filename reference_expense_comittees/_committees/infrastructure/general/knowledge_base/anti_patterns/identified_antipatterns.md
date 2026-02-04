# Anti-Patterns Identified

## Anti-Pattern: Hardcoded Secrets ⚠️
**Location**: `monitoring-stack.js` - Grafana admin password

**Problem**: 
```javascript
GF_SECURITY_ADMIN_PASSWORD: 'admin'
```

**Impact**: Security vulnerability, credential in version control.

**Fix**: Use Secrets Manager:
```javascript
GF_SECURITY_ADMIN_PASSWORD: ecs.Secret.fromSecretsManager(grafanaSecret)
```

---

## Anti-Pattern: Wildcard CORS ⚠️
**Location**: `s3-stack.js`

**Problem**:
```javascript
allowedOrigins: ['*']
```

**Impact**: Any domain can make requests to S3.

**Fix**: Specify allowed origins:
```javascript
allowedOrigins: ['https://app.yourdomain.com']
```

---

## Anti-Pattern: Single Redis Node ⚠️
**Location**: `redis-stack.js`

**Problem**:
```javascript
numCacheClusters: 1
```

**Impact**: No failover capability, single point of failure.

**Fix**: Add replication for production:
```javascript
numCacheClusters: 2,  // Primary + replica
automaticFailoverEnabled: true
```

---

## Anti-Pattern: Ephemeral Observability Storage ⚠️
**Location**: `monitoring-stack.js`

**Problem**: Prometheus/Loki data stored on task filesystem.

**Impact**: Data loss on task restart.

**Fix**: Add persistent storage (S3 backend) or EFS.

---

## Anti-Pattern: Long Health Check Grace Period ⚠️
**Location**: `ecs-stack.js`

**Problem**:
```javascript
healthCheckGracePeriod: Duration.minutes(30)
```

**Impact**: Slow detection of unhealthy deployments.

**Root Cause**: Investigate slow application startup.
