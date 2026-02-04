# Tool: Roadrunner Setup

> **Forger**: Hephaestus  
> **Purpose**: Clone, configure, and initialize Roadrunner  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- All infrastructure installed:
  - SSH keys configured (see `setup_ssh.md`)
  - System directories created (see `setup_system.md`)
  - NVM/Node.js 12.16 installed (see `setup_nvm.md`)
  - MySQL running (see `setup_mysql.md`)
  - Redis running (see `setup_redis.md`)
  - RabbitMQ running with test/test user (see `setup_rabbitmq.md`)
  - Beanstalkd running (see `setup_beanstalkd.md`)
  - PostgreSQL running with graphile DB (see `setup_postgresql.md`)
  - Elasticsearch running (see `setup_elasticsearch.md`)
  - Kafka running with topics (see `setup_kafka.md`)
  - SFTP configured (see `setup_sftp.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Navigate to code directory
cd ~/code

# 2. Clone Roadrunner
git clone git@gitlab.com:paystand/roadrunner.git

# 3. Enter Roadrunner directory
cd roadrunner

# 4. Install dependencies
npm install

# 5. Create symlink for paystand modules
# IMPORTANT: Replace {username} with your actual Mac username
ln -s /Users/{username}/code/roadrunner/src/modules/paystand /Users/{username}/code/roadrunner/node_modules/paystand

# 6. Create MySQL databases
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS roadrunner_vagrant2;"
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3;"
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3_media;"
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3_test;"
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3_test_media;"
mysql --host="localhost" --user="root" --password="123" --execute="GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;"
mysql --host="localhost" --user="root" --password="123" --execute="FLUSH PRIVILEGES;"

# 7. Run database migrations and setup
npm run updateAll

# 8. Run first-time setup (seeds data)
npm run firstTimeSetup
```

---

## ⚠️ IMPORTANT: Before npm run updateAll

**You MUST configure SFTP settings first!** See `setup_sftp.md` Step 3.

If you get errors during `npm run updateAll`, it's likely because the SFTP configuration in `src/config.development.json` hasn't been updated with your Mac credentials.

---

## Create Ledger Indexes

After Roadrunner is set up, run these SQL statements to create performance indexes:

```bash
mysql -uroot -p123 roadrunner_vagrant2 << 'EOF'
CREATE INDEX ix_lt_accids_created_amt ON LedgerTransaction(debitAccountId,creditAccountId,created,amount);
CREATE INDEX ix_lt_accids_custid ON LedgerTransaction(debitAccountId,creditAccountId,customerId);
CREATE INDEX idx_lt_accids_custid_created ON LedgerTransaction(debitAccountId,creditAccountId,customerId,created);
CREATE INDEX ix_lt_ltid_ltiid ON LedgerTransaction(ledgerInstructionId);

CREATE INDEX idx_ltid_srctype ON LedgerTransactionSource(sourceType,sourceId);
CREATE INDEX ix_plts_ltiid_src_srctype ON LedgerTransactionSource(sourceType,sourceId,ledgerTransactionId);
CREATE INDEX ix_lts_scrid_srctype ON LedgerTransactionSource(sourceId,sourceType);

CREATE INDEX idx_liid_custid_accids_created ON LedgerTransaction(ledgerInstructionId,customerId,debitAccountId,creditAccountId,created);
CREATE INDEX idx_txa_txp_txb_txstatus_txtype ON LedgerInstruction(txAmountLocked,txAmountPending,txAmountBalance,txStatus,txType);
CREATE INDEX idx_lfid_txtype ON LedgerInstruction(ledgerFlowId,txType);
EOF
```

---

## Starting Roadrunner

Roadrunner uses **PM2** to manage its processes. PM2 must be installed globally (`npm install -g pm2`).

### Start Commands (IMPORTANT)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    RECOMMENDED START COMMANDS                         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   npm run serve      → Start web server ONLY (most common)            ║
║                                                                        ║
║   npm run serve_all  → Start FULL STACK:                              ║
║                        • Web server                                   ║
║                        • Workers (background jobs)                    ║
║                        • Kafka producer/consumers                     ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Available npm Scripts

| Command | What It Does |
|---------|--------------|
| **`npm run serve`** | Start web server via PM2 (recommended for most development) |
| **`npm run serve_all`** | Start full stack: web + workers + Kafka (when you need everything) |
| `npm run serve:web` | Start web server without Kafka consumers |
| `npm run workers` | Start background workers only |
| `npm run start:kafka` | Start Kafka consumers only |
| `npm run debug` | Stop PM2 and start with Node debugger (port 9229) |
| `npm run debugWorkers` | Debug workers with inspector (port 9230) |

### Database & Migration Scripts

| Command | What It Does |
|---------|--------------|
| `npm run updateAll` | Run all database migrations and updates |
| `npm run update` | Run incremental update |
| `npm run migrate` | Run MySQL migrations only |
| `npm run firstTimeSetup` | Initial setup with seed data |

### Example: Start Web Server Only

```bash
cd ~/code/roadrunner
npm run serve

# Check it's running
pm2 status

# View logs
pm2 logs roadrunner
```

### Example: Start Full Stack

```bash
cd ~/code/roadrunner
npm run serve_all

# This starts:
# - roadrunner (web server)
# - workers (background job processors)
# - kafka-consumers (event processors)

# Check all processes
pm2 status

# View all logs
pm2 logs
```

### PM2 Management Commands

```bash
pm2 status              # Show all processes
pm2 logs [name]         # View logs (all or specific process)
pm2 restart all         # Restart all processes
pm2 stop all            # Stop all processes
pm2 delete all          # Remove all processes from PM2
```

---

## ⚠️ After Computer Restart

If you restart your computer, you need to:

### 1. Recreate the runtime directory (REQUIRED)

```bash
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand
```

### 2. Restart all infrastructure services

```bash
brew services start mysql
brew services start redis
brew services start rabbitmq
brew services restart beanstalkd
brew services start postgresql
brew services start elastic/tap/elasticsearch-full
brew services start zookeeper
brew services start kafka
```

### 3. Start Roadrunner

```bash
cd ~/code/roadrunner

# Option A: Web server only (most common for development)
npm run serve

# Option B: Full stack (web + workers + Kafka)
npm run serve_all
```

---

## Verification

```bash
# Check if Roadrunner is running
pm2 status

# Test API
curl http://localhost:3000/api/v3/ping
```

---

## Troubleshooting

### npm install fails

```bash
# Ensure correct Node version
nvm use 12.16
node -v  # Should be v12.16.x
```

### npm run updateAll fails

1. Check SFTP configuration in `src/config.development.json`
2. Ensure all databases are created
3. Ensure MySQL is running with correct credentials

### Connection errors

Ensure all services are running:
```bash
brew services list
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
