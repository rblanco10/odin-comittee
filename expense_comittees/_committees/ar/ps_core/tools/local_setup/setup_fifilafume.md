# Tool: Fifilafume (PayStand Dashboard) Setup

> **Forger**: Hephaestus  
> **Purpose**: Set up the PayStand Dashboard locally  
> **Importance**: **CRITICAL** - Without Fifilafume, you can only interact with Roadrunner via REST API

---

## Why Fifilafume is Essential

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         ⚠️  IMPORTANT  ⚠️                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║   Fifilafume IS the PayStand Dashboard.                               ║
║                                                                        ║
║   Without it, your only way to interact with Roadrunner is via        ║
║   direct REST API calls (curl, Postman, etc.).                        ║
║                                                                        ║
║   For a complete local development experience, you NEED:              ║
║   1. Roadrunner (API server)                                          ║
║   2. Fifilafume (Dashboard UI)                                        ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Prerequisites

- Roadrunner running locally (see `setup_roadrunner.md`)
- NVM installed (see `setup_nvm.md`)
- **SSL Certificate accepted in browser** (see below)

---

## Node Version

**Dashboard requires Node v14.20.1** (npm v6.14.17)

```bash
nvm install 14.20.1
nvm use 14.20.1

# Verify
node -v  # Should show v14.20.1
npm -v   # Should show 6.14.17
```

---

## Setup Commands

```bash
# 1. Clone Fifilafume (if not already cloned)
cd ~/code
git clone git@gitlab.com:paystand/fifilafume.git

# 2. Navigate to Dashboard v2
cd fifilafume/dashboard/v2

# 3. Switch to correct Node version
nvm use 14.20.1

# 4. Install dependencies
npm install

# 5. Start the dashboard
npm start -- --env sdk=local
```

---

## Access the Dashboard

**URL**: http://localhost:8081

The PayStand Dashboard will be accessible at port **8081**.

---

## ⚠️ CRITICAL: Accept SSL Certificate First!

Before using the Dashboard, you **MUST** accept Roadrunner's self-signed SSL certificate in your browser.

### Why?

Roadrunner uses a self-signed certificate located in `src/keys/`. If you don't accept it:
- Dashboard requests to Roadrunner will **silently fail**
- You won't see any error messages
- The dashboard will appear broken

### How to Accept:

1. Open your browser
2. Navigate to: https://localhost:3001
3. You'll see a security warning
4. Click "Advanced" → "Proceed to localhost (unsafe)"
5. Now the certificate is trusted for this session

### Alternative: Add to Keychain (macOS)

```bash
# Add Roadrunner's certificate to your system keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/code/roadrunner/src/keys/development/server.crt
```

---

## Verification

1. Ensure Roadrunner is running: `pm2 status`
2. Accept SSL certificate at https://localhost:3001
3. Open http://localhost:8081
4. You should see the PayStand Dashboard login page

---

## Checkout v4

Checkout v4 lives inside Fifilafume and requires a **different Node version**.

### Node Version for Checkout v4

**Node v10.24.1** (npm v6.14.12)

```bash
nvm install 10.24.1
nvm use 10.24.1
```

### Setup Commands

```bash
# Navigate to Checkout v4
cd ~/code/fifilafume/checkout/v4

# Switch to correct Node version
nvm use 10.24.1

# Install dependencies
npm install

# Start checkout
npm start
```

### Common Error: trackingId undefined

If you see this error:

```
[webpack-cli] TypeError: Cannot read property 'trackingId' of undefined
    at module.exports (.../webpack.config.js:135:64)
```

**Fix**: Comment out the `FBEventsPlugin` in `webpack.config.js`:

```javascript
// Comment out or remove this plugin
// new FBEventsPlugin({ ... })
```

---

## Node Version Summary

| Application | Node Version | npm Version |
|-------------|--------------|-------------|
| **Roadrunner** | 12.16.1 | - |
| **Dashboard (Fifilafume)** | **14.20.1** | 6.14.17 |
| **Checkout v4** | **10.24.1** | 6.14.12 |

---

## Troubleshooting

### Dashboard loads but nothing works

**Cause**: SSL certificate not accepted.

**Fix**: Visit https://localhost:3001 and accept the certificate.

### "Connection refused" errors

**Cause**: Roadrunner not running.

**Fix**: Start Roadrunner:
```bash
cd ~/code/roadrunner
npm run serve_all
```

### Wrong Node version errors

**Fix**: Use NVM to switch to correct version:
```bash
# For Dashboard
nvm use 14.20.1

# For Checkout v4
nvm use 10.24.1
```

---

*The main applications for local PayStand development are Roadrunner (API) and Fifilafume (Dashboard).*
