# Tool: SSH Key Setup

> **Forger**: Hephaestus  
> **Purpose**: Generate SSH keys for GitLab access  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- macOS system
- Terminal access
- PayStand email address

---

## Commands

Execute these commands in order:

```bash
# 1. Generate SSH key (replace {your_email} with your PayStand email)
ssh-keygen -t rsa -b 4096 -C "{your_email}@paystand.com"

# 2. Start the SSH agent
eval "$(ssh-agent -s)"

# 3. Add SSH key to agent (with Keychain integration)
ssh-add -K ~/.ssh/id_rsa

# 4. Copy public key to clipboard
pbcopy < ~/.ssh/id_rsa.pub
```

---

## Post-Setup

1. Go to GitLab: https://gitlab.com/-/profile/keys
2. Paste the public key (already in clipboard from step 4)
3. Add a title (e.g., "MacBook Pro - PayStand")
4. Click "Add key"

---

## Verification

```bash
# Test GitLab connection
ssh -T git@gitlab.com
```

Expected output: `Welcome to GitLab, @username!`

---

## Troubleshooting

### "Permission denied (publickey)"

Ensure the SSH agent is running and key is added:

```bash
eval "$(ssh-agent -s)"
ssh-add -K ~/.ssh/id_rsa
```

### Key not in clipboard

```bash
cat ~/.ssh/id_rsa.pub
# Manually copy the output
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
