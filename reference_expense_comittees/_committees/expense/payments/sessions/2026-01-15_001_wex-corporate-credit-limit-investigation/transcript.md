# Session Transcript

> **Session ID**: 2026-01-15_001_wex-corporate-credit-limit-investigation  
> **Date**: 2026-01-15

---

## Investigation Summary

### Initial Observation

The Card Funding page displayed a Credit Limit of **$220,003** with the label "Total credit line approved". However, the WEX portal for account "WB Paystand 81134671" showed a Total credit limit of only **$200.00 USD**.

### Data Flow Analysis

The credit limit display follows this path:

```
1. UI (card_funding_live.ex)
   └── mount() → load_funding_data() → fetch_wex_credit_limit()

2. Service Layer (wex_funding_service.ex)
   └── get_corporate_credit_limits() → make_soap_request()

3. SOAP Request to WEX
   └── POST to https://services.encompass-suite.com/services/AccountService.asmx
   └── SOAPAction: "GetCorporateAvailable"

4. Response Parsing
   └── parse_soap_response() → extract_corporate_accounts()
```

### Key Code Locations

| Component | File | Purpose |
|-----------|------|---------|
| UI Display | `card_funding_live.ex:282-286` | Renders the credit limit card |
| Data Loading | `card_funding_live.ex:866-869` | Fetches credit limit on page mount |
| Fallback Logic | `card_funding_live.ex:901-914` | Falls back to card limit sum if API fails |
| Service | `wex_funding_service.ex` | Makes SOAP call, parses response |
| SOAP Envelope | `wex_funding_service.ex:91-113` | Builds XML request |

### Root Cause Discovery

**The WEX SOAP API call is failing with `InvalidLogonCredentials`.**

When the API fails, the code falls back to displaying the **sum of all expense card limits** as the "credit limit":

```elixir
# card_funding_live.ex:862-869
total_limits = Enum.reduce(cards, 0.0, fn card, acc -> acc + (card.limit || 0) end)
credit_limit = fetch_wex_credit_limit(round(total_limits))

# If API fails, returns fallback_limit (sum of card limits)
defp fetch_wex_credit_limit(fallback_limit) do
  case WexFundingService.get_corporate_credit_limits() do
    {:ok, %{credit_limit: limit}} when limit > 0 ->
      round(limit)
    {:error, reason} ->
      Logger.warning("[CardFunding] Failed to fetch WEX credit limit: #{inspect(reason)}. Using fallback: $#{fallback_limit}")
      fallback_limit  # ← This is what's being displayed ($220,003)
  end
end
```

### Log Evidence

```
[info] [WexFundingService] Fetching corporate credit limits from WEX SOAP API
[error] [WexFundingService] WEX API returned error: InvalidLogonCredentials
[warn] [CardFunding] Failed to fetch WEX credit limit: {:wex_error, "InvalidLogonCredentials"}. Using fallback: $262034
```

### Credential Investigation

Environment variables checked via IEx:

| Variable | Value | Status |
|----------|-------|--------|
| `WEX_FLEET_ORG_ID` | `Paystand DEV ACCT` | Set |
| `WEX_FLEET_SOAP_USERNAME` | `Webservices` | Set |
| `WEX_FLEET_SOAP_PASSWORD` | `W31T#%v=X3x33` | Set |
| `WEX_FLEET_SOAP_BANK_NUMBER` | `nil` (defaults to `0010`) | Not set |
| `WEX_FLEET_SOAP_COMPANY_NUMBER` | `nil` (defaults to `0011267`) | Not set |

The credentials are being loaded correctly (no quote escaping issues), but WEX is rejecting them.

### WEX Portal Reference Data

From the WEX portal screenshot:
- Account: `WB Paystand 81134671`
- Group code: `WEXWB55911841915`
- Total credit limit: `$200.00 USD`
- Available to spend: `$136.09`

---

## Key Findings

1. **The $220,003 is NOT from WEX** — It's the sum of all expense card limits in the system, used as a fallback when the API fails.

2. **The SOAP API credentials are invalid** — WEX returns `InvalidLogonCredentials` error.

3. **No data transformation occurs** — If the API worked, the credit limit would be displayed exactly as returned by WEX (in dollars).

4. **The fallback is misleading** — Showing card limit sum as "Credit Limit" is confusing because they're completely different concepts:
   - Credit Limit = What WEX approves for the organization
   - Card Limits Issued = What's assigned to individual cards

5. **Possible ORG_ID mismatch** — The WEX portal shows Group code `WEXWB55911841915`, but we're using `Paystand DEV ACCT`. This may be the issue.

---

## Technical Details

### SOAP Envelope Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tem="http://aocsolutions.com/EncompassWebServices/">
  <soap:Body>
    <tem:GetCorporateAvailable>
      <tem:user>
        <tem:OrgGroupLoginId>{ORG_ID}</tem:OrgGroupLoginId>
        <tem:Username>{USERNAME}</tem:Username>
        <tem:Password>{PASSWORD}</tem:Password>
      </tem:user>
      <tem:request>
        <tem:BankNumber>{BANK_NUMBER}</tem:BankNumber>
        <tem:CompanyNumber>{COMPANY_NUMBER}</tem:CompanyNumber>
      </tem:request>
    </tem:GetCorporateAvailable>
  </soap:Body>
</soap:Envelope>
```

### Expected Response Fields

- `ResponseCode` (Success/Error)
- `CorporateAccount` elements with:
  - `AccountName`
  - `CreditLimit` (in dollars)
  - `AvailableBalance` (in dollars)
  - `BillingCurrency`

### Primary Account Lookup

The service looks for account named `WB Paystand 81134671` (hardcoded at line 127 of `wex_funding_service.ex`).
