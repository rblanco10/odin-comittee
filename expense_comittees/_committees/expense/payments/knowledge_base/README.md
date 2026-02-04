# Knowledge Base

> **Purpose**: Accumulated expertise grounded in actual code  
> **Last Updated**: 2026-01-05

---

## Overview

This knowledge base contains documentation derived from the actual ember_payments codebase. All entries reference specific code locations and are verified against the current implementation.

---

## Sections

### Architecture
Foundational architectural patterns and decisions.
- Domain overview
- Adapter pattern guide
- Capability pattern guide
- Reactor pattern guide
- Resource pattern guide
- Multi-tenancy guide

### Providers
Implementation guides for each payment provider.
- Checkbook implementation
- Dwolla implementation
- Marqeta implementation
- WEX Fleet implementation

### Capabilities
Documentation for each capability type.
- Card issuance
- Identity verification
- Payout disbursement
- Payment collection
- Funding source management
- Account management

### Flows
End-to-end flow documentation.
- Payment flow
- Card issuance flow
- KYB flow
- Webhook flow
- Reconciliation flow

### Resources
Key Ash resource documentation.
- Connection resources
- Payment resources
- Card resources

### Testing
Testing strategies and infrastructure.
- Test structure
- Provider testing
- Webhook testing
- Integration testing

### Glossary
Terminology definitions.
- Domain terms
- Provider terms
- Technical terms

---

## Maintenance

### Staleness Review
All entries should be reviewed:
- When accessing for the first time in a session
- After major refactoring
- Quarterly by Debt Archaeologist

### Update Process
1. Identify outdated information
2. Verify against current code
3. Update with code references
4. Note update date

---

*"Knowledge without code references is speculation."*
