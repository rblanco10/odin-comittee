# Tool: SFTP Setup

> **Forger**: Hephaestus  
> **Purpose**: Configure SFTP directories for payment processing  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- macOS system
- System Preferences access

---

## Step 1: Enable Remote Login

1. Open **Apple Menu** > **System Preferences** (or System Settings on newer macOS)
2. Go to **Sharing**
3. Enable **Remote Login**
4. Set to **All users** (or add your user)

---

## Step 2: Create SFTP Directories

Execute these commands in order:

```bash
# Navigate to home directory
cd ~/

# Create main SFTP directory
mkdir sftp

# Create payments directories
mkdir sftp/payments
mkdir sftp/payments/inbound
mkdir sftp/payments/outbound

# Create reports directories
mkdir sftp/reports
mkdir sftp/reports/inbound
mkdir sftp/reports/outbound

# Create CPI directory
mkdir sftp/cpi
```

---

## Step 3: Configure Roadrunner

You **MUST** update `src/config.development.json` with your Mac credentials.

### Find and Replace These Values:

| Setting | Change From | Change To |
|---------|-------------|-----------|
| `cpi.sftpReporting.username` | `'paystand'` | `'<YOUR_MAC_USERNAME>'` |
| `cpi.sftpReporting.password` | `'123'` | `'<YOUR_MAC_PASSWORD>'` |
| `vantiv.sftpLitle.username` | `'paystand'` | `'<YOUR_MAC_USERNAME>'` |
| `vantiv.sftpLitle.password` | `'123'` | `'<YOUR_MAC_PASSWORD>'` |
| `vantiv.sftpReporting.username` | `'paystand'` | `'<YOUR_MAC_USERNAME>'` |
| `vantiv.sftpReporting.password` | `'123'` | `'<YOUR_MAC_PASSWORD>'` |
| `vantiv.sftpLitle.inbound` | `'payments/inbound/'` | `'sftp/payments/inbound/'` |
| `vantiv.sftpLitle.outbound` | `'payments/outbound/'` | `'sftp/payments/outbound/'` |
| `vantiv.sftpReporting.inbound` | `'payments/inbound/'` | `'sftp/reports/inbound'` |
| `vantiv.sftpReporting.outbound` | `'payments/outbound/'` | `'sftp/reports/outbound'` |

---

## ⚠️ IMPORTANT

- `<YOUR_MAC_USERNAME>` is your macOS username (run `whoami` to find it)
- `<YOUR_MAC_PASSWORD>` is your macOS login password
- This is required for `npm run updateAll` to succeed

---

## Verification

```bash
# Check directory structure
ls -la ~/sftp
ls -la ~/sftp/payments
ls -la ~/sftp/reports

# Test SFTP connection to yourself
sftp $(whoami)@localhost
# Enter your Mac password when prompted
# Type 'exit' to quit
```

---

## Directory Structure

After setup, your `~/sftp` directory should look like:

```
~/sftp/
├── cpi/
├── payments/
│   ├── inbound/
│   └── outbound/
└── reports/
    ├── inbound/
    └── outbound/
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
