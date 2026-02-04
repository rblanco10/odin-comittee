# Tool: Kafka Setup

> **Forger**: Hephaestus  
> **Purpose**: Install Kafka and create required topics  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install Kafka (includes Zookeeper)
brew install kafka

# 2. Start Zookeeper first
brew services start zookeeper

# 3. Configure Kafka listeners (port 29092)
perl -i -pe "s/\#listeners=PLAINTEXT:\/\/:9092/listeners=PLAINTEXT:\/\/kafka:29092/g" /usr/local/etc/kafka/server.properties

# 4. Configure advertised listeners
perl -i -pe "s/\#advertised.listeners=PLAINTEXT:\/\/your.host.name:9092/advertised.listeners=PLAINTEXT:\/\/kafka:29092/g" /usr/local/etc/kafka/server.properties

# 5. Start Kafka
brew services start kafka
```

---

## Create Required Topics

After Kafka is running, create the PayStand topics:

```bash
# Create payment-events topic
kafka-topics --create --bootstrap-server localhost:29092 --replication-factor 1 --partitions 1 --topic payment-events

# Create transfer-report-events topic
kafka-topics --create --bootstrap-server localhost:29092 --replication-factor 1 --partitions 1 --topic transfer-report-events

# Create lfs-events topic
kafka-topics --create --bootstrap-server localhost:29092 --replication-factor 1 --partitions 1 --topic lfs-events

# Create reconciliation-events topic
kafka-topics --create --bootstrap-server localhost:29092 --replication-factor 1 --partitions 1 --topic reconciliation-events

# Create transfer-events topic
kafka-topics --create --bootstrap-server localhost:29092 --replication-factor 1 --partitions 1 --topic transfer-events
```

---

## Configuration

**Kafka Settings for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `kafka` (via hosts file) |
| Port | `29092` (NOT default 9092) |
| Zookeeper Port | `2181` |

---

## ⚠️ IMPORTANT: Port 29092

PayStand uses port **29092** for Kafka, not the default 9092. This is configured in the Kafka server.properties via the commands above.

---

## Verification

```bash
# List all topics
kafka-topics --list --bootstrap-server localhost:29092

# Expected output:
# payment-events
# transfer-report-events
# lfs-events
# reconciliation-events
# transfer-events
```

---

## Troubleshooting

### Kafka won't start

```bash
# Ensure Zookeeper is running first
brew services start zookeeper
sleep 5
brew services start kafka
```

### Topics won't create

```bash
# Check if Kafka is accepting connections
nc -zv localhost 29092

# If not, check logs
cat /usr/local/var/log/kafka/*.log
```

### "Topic already exists"

This is fine - the topic is already created. You can verify with:

```bash
kafka-topics --list --bootstrap-server localhost:29092
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
