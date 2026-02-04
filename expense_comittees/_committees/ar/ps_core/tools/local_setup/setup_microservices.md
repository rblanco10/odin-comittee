# Tool: Microservices Setup

> **Forger**: Hephaestus  
> **Purpose**: Set up Transfer Reports and Synapsefi microservices  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Roadrunner fully set up (see `setup_roadrunner.md`)
- All infrastructure running
- NVM/Node.js 12.16 installed

---

## Transfer Reports

Execute these commands in order:

```bash
# 1. Navigate to code directory
cd ~/code

# 2. Clone Transfer Reports
git clone git@gitlab.com:paystand/transfer-reports.git

# 3. Enter directory
cd transfer-reports

# 4. Copy environment file
cp .env.development.example .env

# 5. Install dependencies
npm install

# 6. Compile TypeScript
npm run tsc

# 7. Start with PM2
NODE_ENV=development pm2 start . --name=transfer-report
```

---

## Synapsefi

Execute these commands in order:

```bash
# 1. Navigate to code directory
cd ~/code

# 2. Clone Synapsefi
git clone git@gitlab.com:paystand/synapsefi.git

# 3. Enter directory
cd synapsefi

# 4. Copy environment file
cp .env.development.example .env

# 5. Install dependencies
npm install

# 6. Create Synapsefi database
mysql --host="localhost" --user="root" --password="123" --execute="CREATE DATABASE IF NOT EXISTS synapsefi;"

# 7. Run database migrations
npm run sequelize:migrate

# 8. Seed database
npm run sequelize:seed-all

# 9. Start with PM2
NODE_ENV=development pm2 start . --name=synapsefi
```

---

## After Computer Restart

If you restart your computer, you need to restart the microservices:

```bash
# Start Transfer Reports
cd ~/code/transfer-reports
NODE_ENV=development pm2 start . --name=transfer-report

# Start Synapsefi
cd ~/code/synapsefi
NODE_ENV=development pm2 start . --name=synapsefi

# Or restart all PM2 processes
NODE_ENV=development pm2 restart all --update-env
```

---

## Verification

```bash
# Check PM2 status
pm2 status

# Expected: Both 'transfer-report' and 'synapsefi' should be 'online'
```

---

## Troubleshooting

### TypeScript compilation fails (Transfer Reports)

```bash
# Ensure TypeScript is installed globally
npm install -g typescript

# Try compiling again
npm run tsc
```

### Database migration fails (Synapsefi)

```bash
# Ensure MySQL is running
brew services start mysql

# Ensure database exists
mysql -uroot -p123 -e "CREATE DATABASE IF NOT EXISTS synapsefi;"

# Run migrations again
npm run sequelize:migrate
```

### PM2 process crashes

```bash
# Check logs
pm2 logs transfer-report
pm2 logs synapsefi

# Common issues:
# - Wrong Node version (use 12.16)
# - Missing environment variables (check .env file)
# - Database not running
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
