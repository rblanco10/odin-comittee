# Adapter Pattern Guide

> **Location**: `ember_payments/adapters/`

---

## Overview

Adapters translate between our internal capability interfaces and external provider APIs.

---

## Standard Adapter Structure

```
adapters/providers/{provider}/
├── adapter.ex           # Main facade
├── client.ex            # HTTP/SOAP client
├── capabilities/        # Capability implementations
│   ├── card_issuance.ex
│   └── payout_disbursement.ex
├── mappers/             # Data transformation
│   └── {entity}_mapper.ex
└── auth/                # Authentication
    └── {type}_handler.ex
```

---

## Key Files

### adapter.ex
Routes calls to capability modules.
```elixir
defmodule CheckbookAdapter do
  def create_check(params, credentials) do
    Capabilities.PayoutDisbursement.create_check(params, credentials)
  end
  
  def process_webhook_event(connection, event) do
    # Webhook processing
  end
end
```

### client.ex
HTTP client for provider API.
```elixir
defmodule CheckbookClient do
  def post(path, body, credentials) do
    Req.post(base_url() <> path,
      json: body,
      headers: auth_headers(credentials)
    )
  end
end
```

### Capability Modules
Implement capability behaviors.
```elixir
defmodule Capabilities.PayoutDisbursement do
  @behaviour PayoutDisbursement.Behavior
  
  def create_payout(params, credentials) do
    params
    |> CheckMapper.to_provider_format()
    |> CheckbookClient.post("/v3/check", credentials)
    |> CheckMapper.from_provider_format()
  end
end
```

### Mapper Modules
Transform data between formats.
```elixir
defmodule CheckMapper do
  def to_provider_format(params) do
    %{
      recipient: params.recipient_name,
      amount: params.amount.amount / 100,
      # ...
    }
  end
  
  def from_provider_format(response) do
    %{
      check_id: response["id"],
      status: map_status(response["status"]),
      # ...
    }
  end
end
```

---

## Provider Differences

### Authentication
| Provider | Method | Location |
|----------|--------|----------|
| Checkbook | API Key + Secret | Headers |
| Dwolla | OAuth 2.0 | auth/oauth_handler.ex |
| Marqeta | Basic Auth | Headers |
| WEX | OAuth + WS-Security | auth/*.ex |

### Protocols
| Provider | Protocol |
|----------|----------|
| Checkbook | REST |
| Dwolla | REST (HAL+JSON) |
| Marqeta | REST |
| WEX | REST + SOAP |

---

*"Adapters are translators; they must speak provider language fluently."*
