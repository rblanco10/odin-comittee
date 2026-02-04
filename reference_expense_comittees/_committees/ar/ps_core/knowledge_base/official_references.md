# Official References

> **Keeper**: Khaos  
> **Purpose**: Canonical Links to Official PayStand Documentation  
> **Authority**: ABSOLUTE - These are the sources of truth

---

## Preamble

*"The void holds many truths, but some truths are written by mortals for mortals. When setting up the PayStand Universe, these documents are LAW. Do not guess. Do not improvise. Follow the sacred texts."*

---

## The Sacred Texts (Official Documentation)

### Local Development Setup

| Document | Link | Purpose |
|----------|------|---------|
| **Setup Guide v2** | [Confluence](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM) | **PRIMARY** - Native install with Homebrew (Elliot Weaver, Aug 08, 2022) |
| **M1 Setup V2** | [Confluence](https://paystand.atlassian.net/wiki/external/M2I1OGIyYWM1ZTJmNDMzMzgzYTJhNTczMjRjYzIzZTU) | Docker-based setup + Troubleshooting (David Lio, Feb 22, 2023) |

### Infrastructure

| Resource | Link | Branch | Purpose |
|----------|------|--------|---------|
| **PayStand Compose** | `git@gitlab.com:paystand/paystand-compose.git` | `sage-dev-onboarding` | Native setup infrastructure |
| **PayStand Compose** | `git@gitlab.com:paystand/paystand-compose.git` | `m1-config-update-2` | Docker-based M1 setup |

---

## Hephaestus Tools

The official Setup Guide v2 has been translated into Hephaestus tools that provide step-by-step guidance.

**Location**: `tools/local_setup/`

| Tool | Official Guide Section |
|------|----------------------|
| `setup_ssh.md` | SSH |
| `setup_system.md` | System |
| `setup_homebrew.md` | Homebrew |
| `setup_nvm.md` | NVM |
| `setup_mysql.md` | MySQL |
| `setup_redis.md` | Redis |
| `setup_rabbitmq.md` | RabbitMQ |
| `setup_beanstalkd.md` | Beanstalkd |
| `setup_postgresql.md` | Postgresql |
| `setup_elasticsearch.md` | Elasticsearch, Kibana |
| `setup_kafka.md` | Kafka |
| `setup_sftp.md` | SFTP |
| `setup_roadrunner.md` | Roadrunner |
| `setup_microservices.md` | Transfer Reports, Synapsefi |
| `setup_fifilafume.md` | Fifilafume (Dashboard) - from M1 Setup V2 |
| `troubleshooting.md` | Common errors & fixes - from M1 Setup V2 |

**Master Workflow**: `workflows/summon_universe.yaml`

---

## The Law of Documentation

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    THE DOCUMENTATION COMMANDMENT                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   When a mortal asks: "How do I set up PayStand locally?"             ║
║                                                                        ║
║   Khaos/Hephaestus SHALL:                                             ║
║   1. Reference the official documentation FIRST                       ║
║   2. Guide using the Hephaestus tools (tools/local_setup/)            ║
║   3. Never deviate from documented commands                           ║
║   4. Acknowledge when documentation may have changed                  ║
║                                                                        ║
║   Khaos/Hephaestus SHALL NOT:                                         ║
║   1. Invent setup steps not in the official guide                     ║
║   2. Guess at versions, ports, or credentials                         ║
║   3. Skip the critical SFTP configuration step                        ║
║                                                                        ║
║   VIOLATION = Sending engineers into the void without a map           ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Critical Values (From Official Guides)

These values come directly from the Setup Guides:

### The Main Applications

```
╔═══════════════════════════════════════════════════════════════════════╗
║   Without Fifilafume, you can ONLY interact with Roadrunner via API!  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Application Versions & Ports

| Application | Node Version | npm Version | Port |
|-------------|--------------|-------------|------|
| **Roadrunner** | **12.16.1** | - | 3000/3001 |
| **Fifilafume (Dashboard)** | **14.20.1** | 6.14.17 | **8081** |
| **Checkout v4** | **10.24.1** | 6.14.12 | - |

### Credentials

| Service | User | Password |
|---------|------|----------|
| MySQL | `root` | `123` |
| RabbitMQ | `test` | `test` |

### Infrastructure Ports

| Service | Port |
|---------|------|
| MySQL | 3306 |
| Redis | 6379 |
| RabbitMQ (AMQP) | 5672 |
| RabbitMQ (Management) | 15672 |
| PostgreSQL | 5432 |
| Elasticsearch | 9200 |
| Kibana | 5601 |
| **Kafka** | **29092** |
| Beanstalkd | 11300 |

### Kafka Topics

```
payment-events
transfer-report-events
lfs-events
reconciliation-events
transfer-events
```

---

## How Khaos/Hephaestus Should Respond

When asked about local setup:

```
**Khaos/Hephaestus**:

You seek to summon the PayStand Universe to your local realm.

📜 **Official Documentation**:
   https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM

I have forged tools that translate this sacred text into guided steps:
   📂 tools/local_setup/

Would you like me to guide you through the setup phase by phase?

1. Foundation (SSH, System, Homebrew, NVM)
2. Data Layer (MySQL, Redis, PostgreSQL)
3. Message Layer (RabbitMQ, Beanstalkd, Kafka)
4. Search Layer (Elasticsearch)
5. File Transfer (SFTP)
6. Core Application (Roadrunner)
7. Microservices (Transfer Reports, Synapsefi)

Which phase shall we begin?
```

---

## Document Maintenance

This file should be updated when:
- Official documentation is updated
- Documentation URLs change
- New Hephaestus tools are created
- Critical values change in the official guide

**Last Updated**: 2026-01-27  
**Source**: Setup Guide v2 - Elliot Weaver, Aug 08, 2022

---

*"I hold much knowledge, but wisdom is knowing that the official documentation is the living truth."*
