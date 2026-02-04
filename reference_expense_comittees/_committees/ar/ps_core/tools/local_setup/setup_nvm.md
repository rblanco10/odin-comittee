# Tool: NVM & Node.js Setup

> **Forger**: Hephaestus  
> **Purpose**: Install NVM and Node.js 12.16  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- Homebrew installed (see `setup_homebrew.md`)

---

## Commands

Execute these commands in order:

```bash
# 1. Install NVM via Homebrew
brew install nvm

# 2. Create NVM directory
mkdir ~/.nvm

# 3. Add NVM to shell configuration
echo "export NVM_DIR=~/.nvm" >> ~/.zshrc
echo "source $(brew --prefix nvm)/nvm.sh" >> ~/.zshrc

# 4. Reload shell configuration
source ~/.zshrc

# 5. Install Node.js 12.16 (REQUIRED VERSION)
nvm install 12.16

# 6. Use Node.js 12.16
nvm use 12.16

# 7. Install global npm packages
npm install -g typescript nodemon sequelize-cli pm2

# 8. Set NODE_ENV (add to shell config for persistence)
echo "export NODE_ENV=development" >> ~/.zshrc
source ~/.zshrc
```

---

## ⚠️ CRITICAL: Node.js Version

Roadrunner **requires Node.js 12.16**. Using a different version may cause compatibility issues.

```bash
# Always verify you're using the correct version
node -v
# Expected: v12.16.x
```

---

## Verification

```bash
# Test Node.js version
node -v
# Expected: v12.16.x

# Test npm
npm -v

# Test global packages
typescript --version
nodemon --version
pm2 --version
sequelize --version
```

---

## Troubleshooting

### "nvm: command not found"

```bash
source ~/.zshrc
# or restart your terminal
```

### Wrong Node version

```bash
nvm use 12.16
# or set as default
nvm alias default 12.16
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
