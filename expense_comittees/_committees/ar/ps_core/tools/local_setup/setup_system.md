# Tool: System Setup

> **Forger**: Hephaestus  
> **Purpose**: Create system directories and configure hosts file  
> **Source**: [Official Setup Guide v2](https://paystand.atlassian.net/wiki/external/NDU5ZjA0ZTcyY2VmNDQ1MDlhNTA1YzM2MjY0ZGQ3ZTM)

---

## Prerequisites

- macOS system
- Administrator (sudo) access

---

## Commands

Execute these commands in order:

```bash
# 1. Navigate to home directory
cd ~/

# 2. Create code directory (for all PayStand repositories)
mkdir code

# 3. Create PayStand runtime directory
sudo mkdir /var/run/paystand

# 4. Create PayStand log directory
sudo mkdir /var/log/paystand

# 5. Set permissions on runtime directory
sudo chmod 777 /var/run/paystand

# 6. Set permissions on log directory
sudo chmod 777 /var/log/paystand

# 7. Add hostnames to /etc/hosts
sudo echo "127.0.0.1	localhost mysql rabbitmq redis elasticsearch kibana zookeeper kafka postgres beanstalkd vantiv_sftp" >> /etc/hosts

# 8. Flush DNS cache
sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder
```

---

## Alternative: Manual hosts file edit

If the `sudo echo` command doesn't work:

```bash
# Open hosts file in editor
sudo nano /etc/hosts
```

Add this line at the end of the file:

```
127.0.0.1	localhost mysql rabbitmq redis elasticsearch kibana zookeeper kafka postgres beanstalkd vantiv_sftp
```

Save with `Ctrl+O`, then exit with `Ctrl+X`.

---

## ⚠️ IMPORTANT: After Restart

**Every time you restart or turn off your computer**, you MUST recreate the `/var/run/paystand` directory:

```bash
cd ~/
sudo mkdir /var/run/paystand
sudo chmod 777 /var/run/paystand
```

This is required before you can start Roadrunner again.

---

## Verification

```bash
# Check directories exist
ls -la /var/run/paystand
ls -la /var/log/paystand

# Check hosts file
cat /etc/hosts | grep mysql
```

Expected: You should see the directories and the hosts entry with `mysql`.

---

*Source: Setup Guide v2 - Elliot Weaver, Aug 08, 2022*
