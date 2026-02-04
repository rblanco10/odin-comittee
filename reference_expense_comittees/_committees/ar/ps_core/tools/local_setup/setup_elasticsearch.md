# Tool: Elasticsearch & Kibana Setup

> **Forger**: Hephaestus  
> **Purpose**: Install Elasticsearch and Kibana  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

### Elasticsearch

```bash
# 1. Add Elastic tap
brew tap elastic/tap

# 2. Install Elasticsearch
brew install elastic/tap/elasticsearch-full

# 3. Start Elasticsearch service
brew services start elastic/tap/elasticsearch-full
```

### Kibana (Optional - for debugging)

```bash
# 1. Add Elastic tap (if not already done)
brew tap elastic/tap

# 2. Install Kibana
brew install elastic/tap/kibana-full

# 3. Start Kibana service
brew services start elastic/tap/kibana-full
```

---

## Configuration

**Elasticsearch Settings for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `elasticsearch` (via hosts file) |
| Port | `9200` (HTTP) |
| Port | `9300` (Transport) |

**Kibana Settings:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `kibana` (via hosts file) |
| Port | `5601` |

---

## Verification

### Elasticsearch

```bash
# Test Elasticsearch
curl http://localhost:9200
```

Expected response:
```json
{
  "name" : "...",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "...",
  "version" : { ... },
  "tagline" : "You Know, for Search"
}
```

### Kibana

```bash
# Open in browser
open http://localhost:5601
```

---

## Troubleshooting

### Elasticsearch won't start

```bash
# Check status
brew services list

# Check logs
cat /usr/local/var/log/elasticsearch/*.log

# Restart
brew services restart elastic/tap/elasticsearch-full
```

### Java issues

Elasticsearch requires Java. If you have issues:

```bash
# Install Java via Homebrew
brew install openjdk

# Add to PATH
echo 'export PATH="/usr/local/opt/openjdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
