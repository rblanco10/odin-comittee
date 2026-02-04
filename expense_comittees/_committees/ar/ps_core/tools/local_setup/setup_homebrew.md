# Tool: Homebrew Installation

> **Forger**: Hephaestus  
> **Purpose**: Install Homebrew package manager  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- macOS system
- Terminal access
- Internet connection

---

## Commands

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Post-Install (Apple Silicon Macs)

If you have an M1/M2/M3 Mac, add Homebrew to your PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

---

## Verification

```bash
# Check Homebrew is installed
brew --version
```

Expected output: `Homebrew X.X.X`

---

## Troubleshooting

### "brew: command not found"

Add Homebrew to PATH:

```bash
# For Intel Macs
export PATH="/usr/local/bin:$PATH"

# For Apple Silicon Macs
export PATH="/opt/homebrew/bin:$PATH"
```

### Permission issues

```bash
sudo chown -R $(whoami) /usr/local/Cellar
```

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
