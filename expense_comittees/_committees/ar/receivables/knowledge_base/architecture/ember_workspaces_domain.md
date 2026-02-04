# Ember Workspaces Domain

> **Domain**: `FlamePsAr.EmberWorkspaces`  
> **Location**: `lib/flame_ps_ar/ember_workspaces/`  
> **Database**: PostgreSQL  
> **Tenant Model**: `workspace_id` (UUID)  
> **Subcommittee Ownership**: SC11 (Legacy Alignment), SC15 (Migration)

---

## Overview

The Ember Workspaces domain manages **multi-tenant workspace configuration, user membership, and entity bridging** between PostgreSQL (Ember) and MySQL (Classic) systems. It is the **critical bridge** that enables PostgreSQL-based domains to interact with MySQL-based domains.

---

## Core Purpose

1. **Workspace Management**: Configure workspaces with custom domains, SSO, and API access
2. **Entity Bridging**: Link PostgreSQL UUIDs to MySQL KSUIDs via Entity and EntityMapping
3. **User Access Control**: Manage user memberships, invitations, and permissions
4. **Authentication Configuration**: Configure SSO, SCIM, and auth settings per workspace

---

## Resources

### Workspace Resources

| Resource | Purpose | Key Attributes |
|----------|---------|----------------|
| `Workspace` | Root workspace configuration | `id`, `name`, `slug`, `settings` |
| `WorkspaceAuthConfig` | Global auth settings | `workspace_id`, `enforce_mfa`, `session_timeout` |
| `WorkspaceSetupState` | Onboarding progress tracking | `workspace_id`, `completed_steps`, `current_step` |

### Entity Resources

| Resource | Purpose | Key Attributes |
|----------|---------|----------------|
| `Entity` | Links workspace to Classic owner | `workspace_id`, `classic_owner_id` (KSUID) |
| `EntityAuthConfig` | Entity-level auth overrides | `entity_id`, `allowed_auth_methods` |

### User Management Resources

| Resource | Purpose | Key Attributes |
|----------|---------|----------------|
| `UserMembership` | User access to workspace | `user_id`, `workspace_id`, `role`, `permissions` |
| `UserInvitation` | Pending invitations | `email`, `workspace_id`, `token`, `expires_at` |

### SSO & SCIM Resources

| Resource | Purpose | Key Attributes |
|----------|---------|----------------|
| `WorkspaceSsoConnection` | SSO provider configuration | `workspace_id`, `provider`, `metadata_url`, `entity_id` |
| `WorkspaceScimConfig` | SCIM provisioning config | `workspace_id`, `enabled`, `bearer_token` |

### API & Domain Resources

| Resource | Purpose | Key Attributes |
|----------|---------|----------------|
| `ApiKey` | API key management | `workspace_id`, `key_hash`, `scopes`, `last_used_at` |
| `CustomDomain` | Custom domain mapping | `workspace_id`, `domain`, `ssl_status`, `verified` |
| `WorkspaceDomain` | Domain verification | `workspace_id`, `domain`, `verification_token` |

---

## Resource File Structure

```
lib/flame_ps_ar/ember_workspaces/
├── domain.ex                          # Domain definition
├── resources/
│   ├── workspace/
│   │   └── workspace.ex               # Core workspace resource
│   ├── entity/
│   │   ├── entity.ex                  # Entity bridging
│   │   └── calculations/
│   │       └── classic_customer.ex    # Retrieve MySQL customer
│   ├── entity_auth_config/
│   │   ├── entity_auth_config.ex
│   │   └── calculations/
│   │       └── resolve_effective_config.ex
│   ├── user_membership/
│   │   ├── user_membership.ex
│   │   └── manual_read.ex
│   ├── user_invitation/
│   │   ├── user_invitation.ex
│   │   ├── changes/
│   │   │   ├── generate_invitation_token.ex
│   │   │   └── send_invitation_email.ex
│   │   ├── manual_actions/
│   │   │   └── accept_invitation.ex
│   │   └── validations/
│   ├── api_key/
│   │   ├── api_key.ex
│   │   ├── calculations/
│   │   │   ├── effective_scopes.ex
│   │   │   └── has_permission.ex
│   │   ├── changes/
│   │   │   ├── generate_key.ex
│   │   │   └── validate_permissions.ex
│   │   └── validations/
│   │       └── validate_scope_hierarchy.ex
│   ├── workspace_auth_config/
│   │   ├── workspace_auth_config.ex
│   │   ├── calculations/
│   │   └── changes/
│   ├── workspace_sso_connection/
│   │   ├── workspace_sso_connection.ex
│   │   ├── changes/
│   │   ├── manual_actions/
│   │   └── validations/
│   ├── workspace_scim_config/
│   │   ├── workspace_scim_config.ex
│   │   ├── changes/
│   │   └── manual_actions/
│   ├── workspace_domain/
│   │   ├── workspace_domain.ex
│   │   ├── changes/
│   │   ├── manual_actions/
│   │   └── validations/
│   ├── workspace_setup_state/
│   │   └── workspace_setup_state.ex
│   └── custom_domain/
│       ├── custom_domain.ex
│       └── changes/
│           └── validate_ssl_certificate.ex
├── services/
│   ├── domain_routing_service.ex      # Route requests by domain
│   ├── invitation_service.ex          # Send/manage invitations
│   ├── jit_provisioning_service.ex    # Just-in-time user provisioning
│   └── scim_service.ex                # SCIM protocol implementation
└── embers/
    └── communications/
        ├── templates.ex               # Email templates
        └── definitions.ex             # Communication definitions
```

---

## Key Architectural Patterns

### Entity Bridging Pattern

The most critical pattern - bridges PostgreSQL UUIDs to MySQL KSUIDs:

```elixir
# Entity provides the bridge
workspace = get_workspace(workspace_id)  # PostgreSQL UUID
entity = Entity.for_workspace(workspace_id)
classic_owner_id = entity.classic_owner_id  # MySQL KSUID

# Now you can query MySQL resources
receivables = Classic.Domain.Receivable.list!(owner_id: classic_owner_id)
```

### SSO Connection Flow

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  User Request   │────►│ WorkspaceSsoConn   │────►│  Identity        │
│                 │     │ (SAML/OIDC config) │     │  Provider        │
└─────────────────┘     └────────────────────┘     └──────────────────┘
                                │                          │
                                │ assertion                │
                                ▼                          │
                        ┌────────────────────┐             │
                        │ JitProvisioning    │◄────────────┘
                        │ Service            │
                        └────────────────────┘
                                │
                                │ create/update user
                                ▼
                        ┌────────────────────┐
                        │ UserMembership     │
                        │ (workspace access) │
                        └────────────────────┘
```

### SCIM Provisioning

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Identity       │────►│ ScimService        │────►│ UserMembership   │
│  Provider       │     │ (parse SCIM req)   │     │ (create/update)  │
│  (Okta, Azure)  │     └────────────────────┘     └──────────────────┘
└─────────────────┘              │
                                 │ provision
                                 ▼
                         ┌────────────────────┐
                         │ UserInvitation     │
                         │ (if not exists)    │
                         └────────────────────┘
```

---

## Constitutional Considerations

### Tenant Isolation (Article II, Section 2.3)

All queries MUST include `workspace_id`:

```elixir
# CORRECT
UserMembership |> Ash.Query.filter(workspace_id == ^workspace_id)

# INCORRECT - violates tenant isolation
UserMembership |> Ash.Query.filter(user_id == ^user_id)
```

### Entity Bridging Must Be Explicit

When crossing from PostgreSQL to MySQL, the Entity bridge MUST be used:

```elixir
# CORRECT - explicit bridging
entity = Entity.for_workspace!(workspace_id)
Classic.Domain.Receivable.list!(owner_id: entity.classic_owner_id)

# INCORRECT - assumed bridging
Classic.Domain.Receivable.list!(workspace_id: workspace_id)
```

---

## Services

### DomainRoutingService

Routes incoming requests based on custom domain configuration:

```elixir
# Resolve workspace from custom domain
case DomainRoutingService.resolve("billing.acme.com") do
  {:ok, workspace_id} -> # Route to workspace
  {:error, :not_found} -> # Default routing
end
```

### InvitationService

Manages user invitations with email delivery:

```elixir
# Send invitation
InvitationService.create_and_send(workspace_id, email, role, invited_by_id)
```

### JitProvisioningService

Creates users just-in-time during SSO flows:

```elixir
# Called after successful SSO assertion
JitProvisioningService.provision_user(workspace_id, saml_assertion)
```

### ScimService

Implements SCIM 2.0 protocol for enterprise provisioning:

```elixir
# Handle SCIM requests
ScimService.handle_users_request(workspace_id, conn)
ScimService.handle_groups_request(workspace_id, conn)
```

---

## Integration Points

### With Ember Identity

User identities are managed by `EmberIdentity.Domain.User`, but workspace access is controlled by `EmberWorkspaces.UserMembership`.

### With Classic Domain

Entity provides the bridge:
- `entity.classic_owner_id` → MySQL `owner_id`
- Enables queries against Classic resources with proper tenant context

### With Ember ERP

ERP connections are workspace-scoped. Entity bridging ensures ERP sync targets correct Classic records.

---

## Resource Count

| Category | Count |
|----------|-------|
| Core Resources | 12 |
| Calculations | 4 |
| Changes | 8 |
| Manual Actions | 5 |
| Validations | 4 |
| Services | 4 |
| **Total Modules** | ~39 |

---

## Related Documentation

- Domain boundaries: `architecture/domain_boundaries.md`
- Ember Identity: `architecture/ember_identity_domain.md`
- Multi-tenancy: `architecture/multitenancy.md`

---

*"Workspaces are the containers; Entities are the bridges."*
