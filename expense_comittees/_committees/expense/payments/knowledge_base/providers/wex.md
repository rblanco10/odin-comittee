# WEX Fleet Implementation Guide

> **Location**: `adapters/providers/wex_fleet/`  
> **API**: REST + SOAP  
> **Status**: Development

---

## Overview

WEX Fleet provides fleet card programs with fuel-specific controls.

---

## Code Structure

```
adapters/providers/wex_fleet/
├── adapter.ex
├── capabilities/
│   └── card_issuance.ex         # Purchase Log API
├── clients/
│   ├── rest_client.ex           # REST calls
│   ├── soap_client.ex           # SOAP calls
│   └── client_router.ex         # Protocol router
├── auth/
│   ├── oauth_handler.ex         # REST auth
│   └── wss_security.ex          # SOAP auth
└── soap/
    ├── envelope_builder.ex      # SOAP envelope
    └── response_parser.ex       # SOAP parsing
```

---

## Dual Protocol

| Operation | Protocol |
|-----------|----------|
| Purchase Log (virtual cards) | REST |
| Driver management | SOAP |
| Vehicle management | SOAP |
| Transaction inquiry | SOAP |

---

## Authentication

### REST (OAuth)
```elixir
POST /oauth/token
grant_type=client_credentials
```

### SOAP (WS-Security)
```xml
<wsse:Security>
  <wsse:UsernameToken>
    <wsse:Username>...</wsse:Username>
    <wsse:Password>...</wsse:Password>
    <wsse:Nonce>...</wsse:Nonce>
    <wsu:Created>...</wsu:Created>
  </wsse:UsernameToken>
</wsse:Security>
```

---

## Purchase Log API

Creates virtual single-use cards with embedded controls.

```elixir
POST /purchaselog
{
  "driver_id": "...",
  "vehicle_id": "...",
  "dollar_limit": 100.00,
  "product_codes": ["01", "02"]  # Fuel types
}
# Returns: card_number
```

---

*"WEX: fleet cards with fuel-specific intelligence."*
