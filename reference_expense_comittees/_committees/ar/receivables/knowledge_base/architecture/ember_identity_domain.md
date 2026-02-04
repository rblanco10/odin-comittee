# Ember Identity Domain

> **Module**: `FlamePsAr.EmberIdentity`  
> **Location**: `lib/flame_ps_ar/ember_identity/`  
> **Database**: PostgreSQL  
> **Tenant**: Not multi-tenant (global user identities)  
> **Last Verified**: 2026-01-14

---

## Overview

The Identity domain provides comprehensive authentication and session management for the Ashwood platform.

---

## Capabilities

- **Passwordless Authentication** (Magic Links)
- **Social Login** (OAuth: Google, Slack, Microsoft, generic OIDC)
- **Enterprise SSO** (SAML, OIDC)
- **Multi-Factor Authentication** (TOTP, backup codes)
- **WebAuthn/FIDO2** passwordless authentication
- **Session Management** with JWT tokens
- **Account Lockout** and security event logging
- **User Context Preferences** across workspaces

---

## Resources

### Core Identity

| Resource | Location | Purpose |
|----------|----------|---------|
| `User` | `resources/user/user.ex` | Core user identity |
| `Session` | `resources/session/session.ex` | JWT session management |
| `UserContextPreference` | `resources/user_context_preference/` | User preferences per workspace |

### Authentication Methods

| Resource | Location | Purpose |
|----------|----------|---------|
| `MagicLinkToken` | `resources/magic_link_token/` | Passwordless email authentication |
| `OAuthIdentity` | `resources/oauth_identity/` | Social login provider linking |
| `DeviceRegistration` | `resources/device_registration/` | WebAuthn/FIDO2 hardware keys |

### Multi-Factor Authentication

| Resource | Location | Purpose |
|----------|----------|---------|
| `MfaConfig` | `resources/mfa_config/` | TOTP and backup codes configuration |
| `MfaChallenge` | `resources/mfa_challenge/` | Active MFA verification challenges |

### Security

| Resource | Location | Purpose |
|----------|----------|---------|
| `AuthEvent` | `resources/auth_event/` | Security event logging/audit trail |
| `AccountLockout` | `resources/account_lockout/` | Brute-force protection |

---

## Authentication Reactors

| Reactor | Location | Purpose |
|---------|----------|---------|
| `AuthenticateWithMagicLinkReactor` | `reactors/` | Magic link authentication flow |
| `AuthenticateWithSsoReactor` | `reactors/` | Enterprise SSO (SAML/OIDC) flow |

---

## Services

| Service | Location | Purpose |
|---------|----------|---------|
| `MagicLinkService` | `services/` | Magic link generation and validation |
| `MfaService` | `services/` | MFA operations |

---

## Providers

| Provider | Location | Purpose |
|----------|----------|---------|
| `SamlClient` | `providers/saml/` | SAML authentication client |

---

## User Resource Details

The `User` resource includes:

### Calculations

| Calculation | Purpose |
|-------------|---------|
| `has_mfa_enabled` | Check if user has MFA configured |
| `is_locked_out` | Check if user is currently locked out |

### Changes

| Change | Purpose |
|--------|---------|
| `confirm_email` | Email verification flow |
| `link_oauth_identity` | Link OAuth provider to user |

---

## Session Resource Details

The `Session` resource includes:

### Calculations

| Calculation | Purpose |
|-------------|---------|
| `is_expired` | Check if session has expired |

### Validations

| Validation | Purpose |
|------------|---------|
| `validate_concurrent_limit` | Enforce max concurrent sessions |

---

## Integration Points

| Integrates With | Purpose |
|-----------------|---------|
| `EmberWorkspaces` | SSO connections, workspace access |
| Communications | Magic link emails, notifications |

---

## Constitutional Considerations

- **Security**: All authentication tokens are securely hashed
- **Audit Trail**: All auth events are logged for compliance
- **Session Limits**: Configurable concurrent session limits
- **Lockout Policy**: Configurable brute-force protection

---

## Code References

```
lib/flame_ps_ar/ember_identity/
├── domain.ex                        # Ash domain definition
├── providers/
│   └── saml/
│       └── saml_client.ex           # SAML provider
├── reactors/
│   ├── authenticate_with_magic_link_reactor.ex
│   └── authenticate_with_sso_reactor.ex
├── resources/
│   ├── account_lockout/
│   ├── auth_event/
│   ├── device_registration/
│   ├── magic_link_token/
│   ├── mfa_challenge/
│   ├── mfa_config/
│   ├── oauth_identity/
│   ├── session/
│   ├── user/
│   └── user_context_preference/
└── services/
    ├── magic_link_service.ex
    └── mfa_service.ex
```

---

*"Identity is the gateway to trust."*
