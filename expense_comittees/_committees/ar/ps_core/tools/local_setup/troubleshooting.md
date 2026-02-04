# Tool: Troubleshooting Guide

> **Forger**: Hephaestus  
> **Purpose**: Debug common installation and runtime errors  
> **Sources**: 
> - [M1 Setup V2](https://paystand.atlassian.net/wiki/external/M2I1OGIyYWM1ZTJmNDMzMzgzYTJhNTczMjRjYzIzZTU) by David Lio, Feb 22, 2023
> - Internal team knowledge

---

## The Main Applications

```
╔═══════════════════════════════════════════════════════════════════════╗
║              THE CORE OF LOCAL PAYSTAND DEVELOPMENT                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   1. ROADRUNNER (API Server)                                          ║
║      - Port: 3000 (HTTP), 3001 (HTTPS)                                ║
║      - Node: 12.16.1                                                  ║
║      - Uses PM2 process manager                                       ║
║      - Start: npm run serve (web) or npm run serve_all (full stack)  ║
║                                                                        ║
║   2. FIFILAFUME (PayStand Dashboard)                                  ║
║      - Port: 8081                                                     ║
║      - Node: 14.20.1                                                  ║
║      - Start: npm start -- --env sdk=local                            ║
║      - WITHOUT THIS, you can only use REST API!                       ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## PM2 Process Manager

Roadrunner requires **PM2** to manage its processes.

### Install PM2

```bash
npm install -g pm2
```

### Starting Roadrunner

| Command | What It Starts |
|---------|----------------|
| **`npm run serve`** | Web server only (most common for development) |
| **`npm run serve_all`** | Full stack: web server + workers + Kafka consumers |
| `npm run serve:web` | Web server without Kafka |
| `npm run workers` | Background workers only |
| `npm run start:kafka` | Kafka consumers only |

### PM2 Management

```bash
pm2 status              # Show all processes
pm2 logs                # View all logs
pm2 logs roadrunner     # View Roadrunner logs only
pm2 restart all         # Restart all processes
pm2 stop all            # Stop all processes
pm2 delete all          # Remove all processes
```

---

## Quick Diagnostics

### Check Service Status

```bash
# Homebrew services (native install)
brew services list

# Docker containers (docker-compose install)
docker-compose ps
```

### Check Roadrunner Logs

```bash
# Native PM2
pm2 logs roadrunner

# Docker container
docker exec -it <roadrunner-container> sh -c "pm2 logs 0"
```

---

## Common Errors & Fixes

### Error: "Module not found"

**Symptom**: Roadrunner fails to start with module not found errors.

**Fix**:

```bash
# Navigate to roadrunner
cd ~/code/roadrunner

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

---

### Error: "Database roadrunner_core doesn't exist"

**Symptom**: PostgreSQL database missing.

**Fix (Native Install)**:

```bash
psql postgres -c "CREATE DATABASE roadrunner_core WITH OWNER postgres;"
```

**Fix (Docker)**:

```bash
# Enter PostgreSQL container
docker exec -it <postgresql-container> bash

# Create database (password: 123)
psql -U postgres -W -c "CREATE DATABASE roadrunner_core;"

# Exit container
exit
```

Then rerun migrations:

```bash
# Native
npm run updateAll

# Docker
docker exec -it <roadrunner-container> sh -c "cd roadrunner && npm run updateAll"
```

---

### Error: "Access denied for user 'roadrunneradmin'"

**Symptom**: Dashboard shows invalid credentials, logs show access denied.

**Fix (Docker)**:

```bash
# Enter roadrunner container
docker exec -it <roadrunner-container> /bin/sh

# Create databases and users
mysql --host="mysql" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS roadrunner_vagrant2;"
mysql --host="mysql" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3;"
mysql --host="mysql" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS paystandv3_media;"
mysql --host="mysql" --user="root" --password="123" --execute="GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;"

# Run setup
cd /app/roadrunner
npm run updateAll
ln -s /app/fifilafume /app/roadrunner/client/fifilafume
npm run firstTimeSetup
pm2 restart all
```

**Note**: Some databases may already exist - continue with the next commands if you get "database exists" errors.

---

### Error: "Duplicate primary keys" during migration

**Symptom**: Migration fails with duplicate primary key errors.

**Fix**:

1. Delete all rows from these tables in `roadrunner_vagrant2`:
   - `ApplicationPs`
   - `UserPs`

```bash
mysql -uroot -p123 roadrunner_vagrant2 -e "DELETE FROM ApplicationPs; DELETE FROM UserPs;"
```

2. Rerun migrations:

```bash
npm run updateAll
```

---

### Error: "Invalid port" for vantiv-sftp container

**Symptom**: Docker container fails to start due to port configuration.

**Fix**: Edit `docker-compose.yml` in paystand-compose:

```yaml
# Change from:
vantiv_sftp:
  ...
  ports:
    - 2222:22

# Change to (add quotes):
vantiv_sftp:
  ...
  ports:
    - "2222:22"
```

Then rebuild:

```bash
docker-compose up -d --build
```

---

### Error: Fifilafume "out of memory"

**Symptom**: `npm start` fails with memory errors.

**Fix**:

```bash
# Option 1: Increase memory for single command
node --max-old-space-size=4096 $(which npm) start -- --env=sdk=local

# Option 2: Set environment variable (persistent)
export NODE_OPTIONS="--max-old-space-size=4096"
npm start -- --env=sdk={env}
```

If still failing, increase to 8192:

```bash
node --max-old-space-size=8192 $(which npm) start -- --env=sdk=local
```

---

### Error: Roadrunner won't start after reboot

**Symptom**: Roadrunner fails immediately after computer restart.

**Fix**:

```bash
# 1. Recreate runtime directory (REQUIRED after every restart)
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand

# 2. Restart all infrastructure services
brew services start mysql
brew services start redis
brew services start rabbitmq
brew services restart beanstalkd
brew services start postgresql
brew services start elastic/tap/elasticsearch-full
brew services start zookeeper
brew services start kafka

# 3. Start Roadrunner (choose one)
cd ~/code/roadrunner

# Option A: Web server only (most common)
npm run serve

# Option B: Full stack (web + workers + Kafka)
npm run serve_all
```

---

### Error: npm run updateAll fails

**Common Causes**:

1. **SFTP not configured**: Update `src/config.development.json` with your Mac credentials
2. **Wrong Node version**: Must be 12.16 (`nvm use 12.16`)
3. **Services not running**: Check `brew services list`
4. **Remote Login disabled**: Enable in System Preferences > Sharing

---

### Error: "Cannot merge array values of different length" (graphileConfig)

**Symptom**:

```
Error: Cannot apply .../src/config.development.json: Cannot merge array values 
of different length for the option `graphileConfig.clustersConfig.slow.taskNames`.
```

**Cause**: The `taskNames` arrays in `config.json` and `config.development.json` have different lengths. LoopBack cannot merge arrays of different lengths.

**Fix**: 

1. Open `src/config.json` and find `graphileConfig.clustersConfig.slow.taskNames`
2. Open `src/config.development.json` and find the same path
3. Make sure both arrays have the **same number of elements**

Example - if `config.json` has:
```json
"taskNames": ["task1", "task2", "task3"]
```

Then `config.development.json` must also have exactly 3 elements:
```json
"taskNames": ["task1", "task2", "task3"]
```

---

### Error: Dashboard requests silently fail (SSL Certificate)

**Symptom**: Dashboard loads but nothing works. No visible errors. API calls fail silently.

**Cause**: Roadrunner uses a self-signed SSL certificate in `src/keys/`. Browser hasn't accepted it.

**Fix**:

1. Open browser and navigate to: **https://localhost:3001**
2. You'll see a security warning
3. Click "Advanced" → "Proceed to localhost (unsafe)"
4. Refresh the dashboard at http://localhost:8081

**Alternative (macOS) - Add to Keychain**:

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/code/roadrunner/src/keys/development/server.crt
```

---

### Error: Checkout v4 "trackingId undefined"

**Symptom**:

```
[webpack-cli] TypeError: Cannot read property 'trackingId' of undefined
    at module.exports (.../webpack.config.js:135:64)
```

**Fix**: Comment out the `FBEventsPlugin` in `fifilafume/checkout/v4/webpack.config.js`:

```javascript
// Find and comment out this plugin:
// new FBEventsPlugin({
//   trackingId: ...
// })
```

---

## Fifilafume (Dashboard) Setup

### Required Node Version

**Dashboard requires Node 14.20.1** (npm 6.14.17):

```bash
nvm install 14.20.1
nvm use 14.20.1

# Verify
node -v  # v14.20.1
npm -v   # 6.14.17
```

### Install & Run

```bash
cd ~/code/fifilafume/dashboard/v2
npm install
npm start -- --env sdk=local
```

### Access Dashboard

**URL**: http://localhost:8081

### ⚠️ CRITICAL: Accept SSL Certificate First!

Before using the Dashboard, accept Roadrunner's self-signed certificate:

1. Visit https://localhost:3001 in your browser
2. Accept the security warning
3. Now Dashboard requests to Roadrunner will work

---

## Useful Aliases

Add these to `~/.zshrc` for convenience:

```bash
# Navigation
alias goFlf="cd ~/code/fifilafume/dashboard/v2"
alias goCheckout="cd ~/code/fifilafume/checkout/v4"
alias goRR="cd ~/code/roadrunner"

# NVM helpers
alias sourceNvm="source ~/.nvm/nvm.sh"
alias nodeRR="nvm use 12.16"
alias nodeFlf="nvm use 10.24.1"

# Setup commands
alias setupFlf="goFlf; npm install -g bower; bower install; npm install"
alias runFlf="goFlf; nodeFlf; npm start --env=sdk-local"

# Alias management
alias editAlias="code ~/.zshrc"
alias applyAlias="source ~/.zshrc"
```

Apply changes:

```bash
source ~/.zshrc
```

---

## Node Version Quick Reference

| Application | Node Version | npm Version | Port |
|-------------|--------------|-------------|------|
| **Roadrunner** | **12.16.1** | - | 3000/3001 |
| **Fifilafume (Dashboard)** | **14.20.1** | 6.14.17 | **8081** |
| **Checkout v4** | **10.24.1** | 6.14.12 | - |

---

## Docker vs Native Install

This troubleshooting guide covers both approaches:

| Approach | When to Use |
|----------|-------------|
| **Native (Homebrew)** | Recommended for most developers. Uses Setup Guide v2. |
| **Docker (paystand-compose)** | Alternative for M1 Macs or containerized environments. Uses M1 Setup V2. |

### Docker Branch

For Docker setup, use the `m1-config-update-2` branch:

```bash
git clone git@gitlab.com:paystand/paystand-compose.git
cd paystand-compose
git checkout m1-config-update-2
chmod 755 setup.sh
./setup.sh --repo develop
docker-compose up -d --build
```

---

*Source: M1 Setup V2 - David Lio, Feb 22, 2023*
