# Local Setup Tools

> **Forger**: Hephaestus  
> **Purpose**: Tools for summoning the PayStand Universe locally  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Overview

These tools translate the official PayStand Setup Guide v2 into executable instructions that Hephaestus can guide users through.

**Every command in these tools comes directly from the official documentation.**

---

## Tool Index

Execute these tools in order for a complete local setup:

| # | Tool | Purpose | Time |
|---|------|---------|------|
| 1 | `setup_ssh.md` | SSH key generation for GitLab | 5 min |
| 2 | `setup_system.md` | System directories and hosts file | 5 min |
| 3 | `setup_homebrew.md` | Homebrew package manager | 5 min |
| 4 | `setup_nvm.md` | NVM and Node.js 12.16 | 10 min |
| 5 | `setup_mysql.md` | MySQL database | 5 min |
| 6 | `setup_redis.md` | Redis cache | 2 min |
| 7 | `setup_rabbitmq.md` | RabbitMQ message queue | 10 min |
| 8 | `setup_beanstalkd.md` | Beanstalkd job queue | 2 min |
| 9 | `setup_postgresql.md` | PostgreSQL + Graphile DB | 5 min |
| 10 | `setup_elasticsearch.md` | Elasticsearch + Kibana | 10 min |
| 11 | `setup_kafka.md` | Kafka + topics | 15 min |
| 12 | `setup_sftp.md` | SFTP directories | 10 min |
| 13 | `setup_roadrunner.md` | Roadrunner API server | 30 min |
| 14 | `setup_fifilafume.md` | Dashboard (Node 10.24.1) | 15 min |
| 15 | `setup_microservices.md` | Transfer Reports + Synapsefi | 15 min |
| - | `troubleshooting.md` | **Error debugging & fixes** | - |

**Total estimated time: ~2.5 hours**

### Additional Services

For services beyond the core setup, consult the **Celestial Map**:
`knowledge_base/celestial_map.md`

---

## Quick Reference

### Critical Configurations

| Service | User | Password | Port |
|---------|------|----------|------|
| MySQL | `root` | `123` | 3306 |
| RabbitMQ | `test` | `test` | 5672 |
| RabbitMQ Admin | `guest` | `guest` | 15672 |
| PostgreSQL | `postgres` | - | 5432 |
| Redis | - | - | 6379 |
| Elasticsearch | - | - | 9200 |
| Kafka | - | - | **29092** |
| Kibana | - | - | 5601 |
| Roadrunner | - | - | 3000 |

### Required Node Versions

| Application | Node Version | npm Version | Port |
|-------------|--------------|-------------|------|
| **Roadrunner** | **12.16.1** | - | 3000/3001 |
| **Fifilafume (Dashboard)** | **14.20.1** | 6.14.17 | **8081** |
| **Checkout v4** | **10.24.1** | 6.14.12 | - |

### The Main Applications

```
Without Fifilafume, you can ONLY interact with Roadrunner via REST API!

Roadrunner = API Server (uses PM2 process manager)
Fifilafume = PayStand Dashboard (UI)
```

### Starting Roadrunner

| Command | What It Starts |
|---------|----------------|
| **`npm run serve`** | Web server only (most common) |
| **`npm run serve_all`** | Full stack: web + workers + Kafka |

### After Restart Checklist

```bash
# 1. Recreate runtime directory
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand

# 2. Start all services
brew services start mysql
brew services start redis
brew services start rabbitmq
brew services restart beanstalkd
brew services start postgresql
brew services start elastic/tap/elasticsearch-full
brew services start zookeeper
brew services start kafka

# 3. Start applications
cd ~/code/roadrunner && npm run serve_all
NODE_ENV=development pm2 restart all --update-env
```

---

## Official Documentation

**Always refer to the official documentation for the latest updates:**

| Document | Purpose |
|----------|---------|
| [Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM) | Native install (Homebrew) |
| [M1 Setup V2](https://paystand.atlassian.net/wiki/external/M2I1OGIyYWM1ZTJmNDMzMzgzYTJhNTczMjRjYzIzZTU) | Docker install + Troubleshooting |

---

## Troubleshooting Quick Access

If you encounter errors, see `troubleshooting.md` for fixes to common issues:

- Module not found errors
- Database doesn't exist errors
- Access denied errors
- Duplicate primary key errors
- Memory issues with Fifilafume
- Roadrunner won't start after reboot

---

*Sources:*
- *Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
- *M1 Setup V2 - David Lio, Feb 22, 2023*
