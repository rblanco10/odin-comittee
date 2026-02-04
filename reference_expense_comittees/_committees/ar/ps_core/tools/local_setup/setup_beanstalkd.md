# Tool: Beanstalkd Setup

> **Forger**: Hephaestus  
> **Purpose**: Install and configure Beanstalkd job queue  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install Beanstalkd
brew install beanstalkd

# 2. Start Beanstalkd service
brew services restart beanstalkd
```

---

## Configuration

**Beanstalkd Settings for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `beanstalkd` (via hosts file) |
| Port | `11300` (default) |

---

## Verification

```bash
# Check if Beanstalkd is listening
nc -zv localhost 11300
# Expected: Connection to localhost port 11300 [tcp/*] succeeded!
```

---

## Troubleshooting

### Beanstalkd won't start

```bash
# Check status
brew services list

# Restart
brew services restart beanstalkd

# Check if port is in use
lsof -i :11300
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
