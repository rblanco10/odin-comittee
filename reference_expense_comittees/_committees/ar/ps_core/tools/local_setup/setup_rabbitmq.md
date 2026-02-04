# Tool: RabbitMQ Setup

> **Forger**: Hephaestus  
> **Purpose**: Install and configure RabbitMQ with user  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install RabbitMQ
brew install rabbitmq

# 2. Add RabbitMQ to PATH
export PATH=$PATH:/usr/local/opt/rabbitmq/sbin

# 3. Add to shell config for persistence
echo "export HOMEBREW_RABBITMQ=/usr/local/Cellar/rabbitmq/3.7.11/sbin" >> ~/.zshrc
echo "export PATH=$PATH:$HOMEBREW_RABBITMQ" >> ~/.zshrc

# 4. Start RabbitMQ service
brew services start rabbitmq
```

---

## Create Application User

After RabbitMQ is running, create the `test` user:

### Via Management UI (Recommended)

1. Open browser: http://localhost:15672
2. Login with:
   - Username: `guest`
   - Password: `guest`
3. Go to **Admin** tab
4. Click **Add a user**
5. Enter:
   - Username: `test`
   - Password: `test`
6. Click **Add user**
7. Click on the new `test` user
8. Under **Permissions**, set virtual host to `/`
9. Click **Set permission**

### Via Command Line

```bash
# Create user
rabbitmqctl add_user test test

# Set permissions
rabbitmqctl set_permissions -p / test ".*" ".*" ".*"

# Optional: Make admin
rabbitmqctl set_user_tags test administrator
```

---

## Configuration

**RabbitMQ Credentials for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `rabbitmq` (via hosts file) |
| Port | `5672` (AMQP) |
| Management Port | `15672` (Web UI) |
| User | `test` |
| Password | `test` |
| Virtual Host | `/` |

---

## Verification

```bash
# Test via browser
# Go to http://localhost:15672
# Login: guest / guest (admin) or test / test (app user)
```

---

## Troubleshooting

### Management UI not accessible

```bash
# Enable management plugin
rabbitmq-plugins enable rabbitmq_management

# Restart RabbitMQ
brew services restart rabbitmq
```

### RabbitMQ won't start

```bash
# Check status
brew services list

# Check logs
cat /usr/local/var/log/rabbitmq/*.log
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
