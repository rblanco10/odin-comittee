# SC17: WEX Fleet Deep Dive Subcommittee

> **Code**: SC17  
> **Focus**: WEX Fleet integration excellence

---

## Charter

### Purpose
Ensure world-class WEX Fleet integration for fleet cards.

### Scope
- Purchase Log API
- SOAP services
- Driver/vehicle management
- Authentication complexity

---

## Members

**Lead**: Michelle Park (WEX Expert)

**Core Members**:
- Robert Huang (Fleet Card Specialist)

---

## Code Focus Areas

```
adapters/providers/wex_fleet/
├── adapter.ex
├── capabilities/
├── clients/
│   ├── rest_client.ex
│   ├── soap_client.ex
│   └── client_router.ex
├── auth/
│   ├── oauth_handler.ex
│   └── wss_security.ex
└── soap/
    ├── envelope_builder.ex
    └── response_parser.ex
```

---

*"WEX is complex; our abstraction must hide that complexity."*
