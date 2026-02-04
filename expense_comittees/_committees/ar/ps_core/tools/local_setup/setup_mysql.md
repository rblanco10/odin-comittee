# Tool: MySQL Setup

> **Forger**: Hephaestus  
> **Purpose**: Install and configure MySQL  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install MySQL
brew install mysql

# 2. Start MySQL service
brew services start mysql

# 3. Set root password to '123'
mysql --user=root --execute="ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123';"
```

---

## Configuration

**MySQL Credentials for PayStand:**

| Setting | Value |
|---------|-------|
| Host | `localhost` or `mysql` (via hosts file) |
| User | `root` |
| Password | `123` |
| Port | `3306` (default) |

---

## Verification

```bash
# Test MySQL connection
mysql -uroot -p123
```

You should enter the MySQL shell. Type `exit` to quit.

---

## Troubleshooting

### "Access denied for user 'root'@'localhost'"

```bash
# Stop MySQL
brew services stop mysql

# Start MySQL in safe mode
mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# In MySQL shell:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123';
exit;

# Restart MySQL normally
brew services restart mysql
```

### MySQL won't start

```bash
# Check MySQL status
brew services list

# Check logs
cat /usr/local/var/mysql/*.err
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
