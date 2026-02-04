# Tool: Redis Setup

> **Forger**: Hephaestus  
> **Purpose**: Install and configure Redis  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install Redis
brew install redis

# 2. Start Redis service
brew services start redis
```

---

## Configuration

**Redis Settings for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `redis` (via hosts file) |
| Port | `6379` (default) |
| Password | None (local development) |

---

## Verification

```bash
# Test Redis connection
redis-cli
```

You should enter the Redis CLI. Type `PING` and expect `PONG`. Type `exit` to quit.

```bash
# In redis-cli
PING
# Expected: PONG
```

---

## Troubleshooting

### Redis won't start

```bash
# Check Redis status
brew services list

# Restart Redis
brew services restart redis

# Check if port is in use
lsof -i :6379
```

### Connection refused

```bash
# Verify Redis is running
redis-cli ping
# If no response, restart:
brew services restart redis
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
