# ElastiCache Redis

## Source
`infrastructure/lib/stacks/redis-stack.js`

## Configuration
```javascript
// From redis-stack.js
engine: 'redis'
engineVersion: '7.0'
cacheNodeType: envConfig.redis.nodeType  // cache.t3.micro → cache.r6g.large
numCacheClusters: 1  // Single node (no HA)
```

## Security
- **AUTH Token**: Stored in Secrets Manager
- **Encryption**: At rest (KMS) and in transit (TLS)
- **Network**: Isolated subnet, ECS-only access

## Connection Format
```
rediss://:auth_token@endpoint:6379  # Note: rediss:// for TLS
```

## Application Uses
1. **Phoenix sessions**: Distributed session storage
2. **Caching**: Application-level caching
3. **Oban**: Job queue backend
4. **PubSub**: Phoenix channels if configured

## High Availability Gap
- **Current**: Single node (numCacheClusters: 1)
- **Risk**: Node failure = complete Redis outage
- **Recommendation**: Multi-node replication for production

## Memory Considerations
- `cache.t3.micro`: 0.5 GB memory
- Monitor evictions and memory usage
- Consider `cache.r6g.large` for production (13.07 GB)
