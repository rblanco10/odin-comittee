# Tool: PostgreSQL Setup

> **Forger**: Hephaestus  
> **Purpose**: Install PostgreSQL and create Graphile database  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install PostgreSQL
brew install postgresql

# 2. Start PostgreSQL service
brew services start postgresql

# 3. Create postgres superuser
psql postgres -c "CREATE USER postgres SUPERUSER;"

# 4. Create graphile database (for background jobs)
psql postgres -c "CREATE DATABASE graphile WITH OWNER postgres;"
```

---

## Configuration

**PostgreSQL Settings for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `postgres` (via hosts file) |
| Port | `5432` (default) |
| User | `postgres` |
| Database | `graphile` |

---

## Verification

```bash
# Connect to graphile database
psql -U postgres -d graphile

# In psql, check connection
\conninfo
# Expected: You are connected to database "graphile" as user "postgres"

# Exit
\q
```

---

## Troubleshooting

### "role 'postgres' does not exist"

```bash
# Create the postgres user
createuser -s postgres
```

### PostgreSQL won't start

```bash
# Check status
brew services list

# Check if data directory exists
ls -la /usr/local/var/postgres

# Initialize if needed
initdb /usr/local/var/postgres

# Restart
brew services restart postgresql
```

### "database 'graphile' already exists"

This is fine - the database is already created.

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
