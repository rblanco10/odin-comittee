# Plaid Setup Guide for CHK-S6 Testing

## Overview

CHK-S6 (Company Bank - Plaid IAV) requires Plaid sandbox credentials to test the "Connect instantly" bank connection flow.

## Required Environment Variables

Add these to your `.env` file in `campsite/flames/flame_teampay_payables/`:

```bash
# Plaid Sandbox Credentials
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SANDBOX_SECRET=your_plaid_sandbox_secret
PLAID_ENVIRONMENT=sandbox
```

## Getting Plaid Sandbox Credentials

1. **Sign up for Plaid Sandbox**:
   - Go to https://dashboard.plaid.com/signup
   - Create a free account (sandbox is free)

2. **Get Your Credentials**:
   - Log into Plaid Dashboard
   - Navigate to **Team Settings** → **Keys**
   - Copy your **Client ID** and **Sandbox Secret**

3. **Add to .env File**:
   ```bash
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SANDBOX_SECRET=your_sandbox_secret_here
   PLAID_ENVIRONMENT=sandbox
   ```

4. **Restart Phoenix Server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   mix phx.server
   # Or with IEx:
   iex -S mix phx.server
   ```

## Testing CHK-S6 After Setup

1. Navigate to `/expense/setup/funding`
2. Click "Add bank account"
3. Select "Check payments" as payment type
4. Select "Connect instantly" (Plaid)
5. Follow Plaid Link flow:
   - Use test credentials: `user_good` / `pass_good`
   - Select a test bank account
   - Complete the connection

## Expected Results

- ✅ Plaid Link modal opens successfully
- ✅ Bank account connects via Plaid IAV
- ✅ Bank account appears in list with "Plaid" tag
- ✅ Instant verification (no micro-deposits needed)
- ✅ Bank account registered with Checkbook automatically

## Troubleshooting

**Error: "Failed to initialize bank connection"**
- Check that `PLAID_CLIENT_ID` and `PLAID_SANDBOX_SECRET` are set correctly
- Verify `.env` file is in the correct location
- Restart Phoenix server after adding credentials

**Plaid Link doesn't open**
- Check browser console for errors
- Verify Plaid credentials are valid
- Check that `PLAID_ENVIRONMENT=sandbox` is set

## Alternative: Skip S6 for Now

Since CHK-S7 (Manual Entry) successfully demonstrates the bank setup flow, S6 can be tested later once Plaid credentials are configured. The manual entry flow covers the same core functionality (bank account creation and Checkbook registration).
