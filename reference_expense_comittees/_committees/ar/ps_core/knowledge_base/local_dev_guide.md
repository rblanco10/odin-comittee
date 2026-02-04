# Local Development Guide

> **Keeper**: Khaos  
> **Purpose**: Context for Local PayStand Development  
> **Audience**: Engineers joining the PayStand realm  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM) by Elliot Weaver, Aug 08, 2022

---

## CRITICAL: Official Documentation

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         ⚠️  THE SACRED TEXT  ⚠️                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   📜 OFFICIAL SETUP GUIDE v2:                                         ║
║      https://paystand.atlassian.net/wiki/external/                    ║
║      NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM                       ║
║                                                                        ║
║   This document and the Hephaestus tools are translations of the      ║
║   official guide. When in doubt, consult the source.                  ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Hephaestus Tools

Hephaestus has forged tools to guide you through local setup. Each tool contains the exact commands from the official documentation.

**Location**: `tools/local_setup/`

| # | Tool | Purpose |
|---|------|---------|
| 1 | `setup_ssh.md` | SSH key generation for GitLab |
| 2 | `setup_system.md` | System directories and hosts file |
| 3 | `setup_homebrew.md` | Homebrew package manager |
| 4 | `setup_nvm.md` | NVM and Node.js 12.16 |
| 5 | `setup_mysql.md` | MySQL database |
| 6 | `setup_redis.md` | Redis cache |
| 7 | `setup_rabbitmq.md` | RabbitMQ message queue |
| 8 | `setup_beanstalkd.md` | Beanstalkd job queue |
| 9 | `setup_postgresql.md` | PostgreSQL + Graphile DB |
| 10 | `setup_elasticsearch.md` | Elasticsearch + Kibana |
| 11 | `setup_kafka.md` | Kafka + topics |
| 12 | `setup_sftp.md` | SFTP directories |
| 13 | `setup_roadrunner.md` | Roadrunner API server |
| 14 | `setup_microservices.md` | Transfer Reports + Synapsefi |

**Workflow**: `workflows/summon_universe.yaml`

---

## The Main Applications

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    CORE LOCAL DEVELOPMENT APPS                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   1. ROADRUNNER - The API Server                                      ║
║      Node: 12.16.1 | Ports: 3000 (HTTP), 3001 (HTTPS)                ║
║      Start: npm run serve (web only) or npm run serve_all (full)     ║
║                                                                        ║
║   2. FIFILAFUME - The PayStand Dashboard                              ║
║      Node: 14.20.1 | Port: 8081                                       ║
║      Start: npm start -- --env sdk=local                              ║
║                                                                        ║
║   ⚠️  WITHOUT FIFILAFUME, you can ONLY interact via REST API!         ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Starting Roadrunner (PM2 Required)

Roadrunner uses **PM2** process manager. Install globally: `npm install -g pm2`

### Recommended Commands

| Command | What It Starts |
|---------|----------------|
| **`npm run serve`** | Web server only (most common for development) |
| **`npm run serve_all`** | Full stack: web + workers + Kafka |

### All Available Start Commands

| Command | Description |
|---------|-------------|
| `npm run serve` | Start web server via PM2 |
| `npm run serve_all` | Start web + workers + Kafka consumers |
| `npm run serve:web` | Start web without Kafka |
| `npm run workers` | Start background workers only |
| `npm run start:kafka` | Start Kafka consumers only |
| `npm run debug` | Debug mode (port 9229) |

### PM2 Commands

```bash
pm2 status              # Show process status
pm2 logs [name]         # View logs
pm2 restart all         # Restart all
pm2 stop all            # Stop all
```

---

## Quick Reference (From Official Guide)

### Required Software Versions

| Application | Node Version | npm Version | Port |
|-------------|--------------|-------------|------|
| **Roadrunner** | **12.16.1** | - | 3000/3001 |
| **Fifilafume (Dashboard)** | **14.20.1** | 6.14.17 | **8081** |
| **Checkout v4** | **10.24.1** | 6.14.12 | - |

### Service Credentials

| Service | User | Password | Port |
|---------|------|----------|------|
| MySQL | `root` | `123` | 3306 |
| RabbitMQ (App) | `test` | `test` | 5672 |
| RabbitMQ (Admin) | `guest` | `guest` | 15672 |
| PostgreSQL | `postgres` | - | 5432 |
| Redis | - | - | 6379 |
| Elasticsearch | - | - | 9200 |
| **Kafka** | - | - | **29092** |
| Kibana | - | - | 5601 |

### Kafka Topics (Required)

```
payment-events
transfer-report-events
lfs-events
reconciliation-events
transfer-events
```

### MySQL Databases (Required)

```
roadrunner_vagrant2
paystandv3
paystandv3_media
paystandv3_test
paystandv3_test_media
```

### Directory Structure

```
~/
├── code/
│   ├── roadrunner/
│   ├── transfer-reports/
│   └── synapsefi/
└── sftp/
    ├── cpi/
    ├── payments/
    │   ├── inbound/
    │   └── outbound/
    └── reports/
        ├── inbound/
        └── outbound/

/var/run/paystand/    # Runtime directory (recreate after restart)
/var/log/paystand/    # Log directory
```

### Hosts File Entry

```
127.0.0.1	localhost mysql rabbitmq redis elasticsearch kibana zookeeper kafka postgres beanstalkd vantiv_sftp
```

---

## ⚠️ CRITICAL: After Computer Restart

**Every time you restart your computer**, you MUST:

```bash
# 1. Recreate runtime directory (REQUIRED or Roadrunner won't start)
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand

# 2. Start all infrastructure services
brew services start mysql
brew services start redis
brew services start rabbitmq
brew services restart beanstalkd
brew services start postgresql
brew services start elastic/tap/elasticsearch-full
brew services start zookeeper
brew services start kafka

# 3. Start applications
cd ~/code/roadrunner
npm run serve_all
NODE_ENV=development pm2 restart all --update-env
```

---

## ⚠️ CRITICAL: SSL Certificate

Roadrunner uses a **self-signed SSL certificate** located in `src/keys/development/`.

**Before using the Dashboard**, you MUST accept this certificate in your browser:

1. Open browser and navigate to: **https://localhost:3001**
2. You'll see a security warning
3. Click "Advanced" → "Proceed to localhost (unsafe)"
4. Now the Dashboard at http://localhost:8081 will work

**Without accepting this certificate, Dashboard requests to Roadrunner will SILENTLY FAIL!**

---

## ⚠️ CRITICAL: SFTP Configuration

Before running `npm run updateAll`, you **MUST** update `src/config.development.json`:

| Setting | Change To |
|---------|-----------|
| `cpi.sftpReporting.username` | Your Mac username |
| `cpi.sftpReporting.password` | Your Mac password |
| `vantiv.sftpLitle.username` | Your Mac username |
| `vantiv.sftpLitle.password` | Your Mac password |
| `vantiv.sftpReporting.username` | Your Mac username |
| `vantiv.sftpReporting.password` | Your Mac password |
| `vantiv.sftpLitle.inbound` | `sftp/payments/inbound/` |
| `vantiv.sftpLitle.outbound` | `sftp/payments/outbound/` |
| `vantiv.sftpReporting.inbound` | `sftp/reports/inbound` |
| `vantiv.sftpReporting.outbound` | `sftp/reports/outbound` |

**Failure to do this will cause `npm run updateAll` to fail.**

---

## Common Questions

### "What Node version do I need?"

Different apps require different versions:
- **Roadrunner**: 12.16.1
- **Fifilafume (Dashboard)**: 14.20.1
- **Checkout v4**: 10.24.1

### "Why port 29092 for Kafka instead of 9092?"

The setup guide configures Kafka to use port 29092 to avoid conflicts.

### "npm run updateAll is failing"

1. Check SFTP configuration in `src/config.development.json`
2. Ensure Remote Login is enabled (System Preferences > Sharing)
3. Verify all databases are created

### "Roadrunner won't start after reboot"

You need to recreate `/var/run/paystand`:
```bash
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand
```

### "Cannot merge array values of different length" (graphileConfig)

The `taskNames` arrays in `config.json` and `config.development.json` must have the same number of elements. Check both files and ensure the arrays match in length.

### "Dashboard loads but nothing works"

You need to accept Roadrunner's SSL certificate:
1. Visit https://localhost:3001
2. Accept the security warning
3. Refresh the Dashboard

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `official_references.md` | Canonical links to official documentation |
| `celestial_map.md` | Technical topology and service mapping |
| `tools/local_setup/README.md` | Index of Hephaestus setup tools |
| `workflows/summon_universe.yaml` | Complete setup workflow |

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
