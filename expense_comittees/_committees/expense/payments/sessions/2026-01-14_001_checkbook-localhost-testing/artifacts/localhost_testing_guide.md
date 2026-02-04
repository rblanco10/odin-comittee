# Checkbook Flows - Localhost Testing Guide

> **Session**: 2026-01-14_001_checkbook-localhost-testing  
> **Created**: 2026-01-14

---

## Prerequisites

### 1. Start the Server

```bash
cd /Users/proyer/ashwood/campsite/flames/flame_teampay_payables
mix phx.server
```

Server will be available at: **http://localhost:4002**

### 2. Login

- **Email**: `admin@demo.local`
- **Password**: Any password (dev mode)

### 3. Checkbook Connection Setup

Ensure you have a Checkbook connection configured. You can create one via:
- UI: Partner Setup → Payment Providers → Checkbook
- Script: `scripts/create_checkbook_connection.exs`

---

## Testing Flow Overview

We'll test all 18 flows one by one:

1. **Setup - KYB (S1-S5)**: 5 flows
2. **Setup - Bank (S6-S7)**: 2 flows  
3. **Payout - Check (P1-P7)**: 7 flows
4. **Payout - Void (P8-P10)**: 3 flows
5. **Operations (O1)**: 1 flow

---

## Flow Testing Instructions

Each flow will be tested with:
1. **Setup steps** - What to prepare
2. **Action steps** - What to do in the UI/API
3. **Verification steps** - What to check
4. **Expected results** - What should happen

---

*Detailed instructions for each flow will be provided as we proceed.*
