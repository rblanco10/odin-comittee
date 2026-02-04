# Three-Layer Architecture Model

> **Reference**: `docs/agents/README.md`  
> **Last Verified**: 2026-01-14

---

## Overview

The `flame_ps_ar` application follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THREE-LAYER MODEL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        SURFACES LAYER                                 │  │
│  │         LiveView pages, components, user interactions                 │  │
│  │                    lib/flame_ps_ar_web/                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ARCHITECTURE LAYER                               │  │
│  │            Business lifecycles, workflows, orchestration              │  │
│  │              docs/agents/architecture/lifecycles/                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      FOUNDATIONS LAYER                                │  │
│  │           Ash resources, domains, data access, validation             │  │
│  │                       lib/flame_ps_ar/                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### Surfaces Layer (`lib/flame_ps_ar_web/`)

**Purpose**: User-facing UI and interactions

**Contains**:
- Phoenix LiveView pages
- LiveView components
- Liquid Glass design system implementation
- JS hooks for interactivity
- Real-time updates

**Responsibilities**:
- User input handling
- Data presentation
- Navigation
- Real-time feedback

### Architecture Layer (`docs/agents/architecture/`)

**Purpose**: Business process orchestration

**Documents**:
- Business lifecycles (receivable, customer, collections, etc.)
- Workflow definitions
- State transitions
- Process orchestration

**Responsibilities**:
- Define business processes
- Orchestrate multi-step operations
- Manage lifecycle states
- Coordinate between domains

### Foundations Layer (`lib/flame_ps_ar/`)

**Purpose**: Data access and business rules

**Contains**:
- Ash Resources
- Domain definitions
- Services
- Reactors
- Data validation

**Responsibilities**:
- Data persistence
- Validation rules
- Business logic
- External integrations

---

## Domain Structure (Foundations)

```
lib/flame_ps_ar/
├── classic/                    # Classic MySQL domain
│   ├── domain/                 # Core AR resources (~100)
│   │   ├── resources/
│   │   ├── services/
│   │   └── reactors/
│   └── payments/               # Payment resources (~62)
│       ├── resources/
│       ├── services/
│       └── reactors/
└── ember_erp/                  # ERP integration (~20)
    ├── resources/
    └── services/
```

---

## Data Layer Mapping

| Domain | Database | Tenant Field |
|--------|----------|--------------|
| `FlamePsAr.Classic.Domain` | MySQL | `owner_id` (KSUID) |
| `FlamePsAr.Classic.Payments` | MySQL | `owner_id` (KSUID) |
| `FlamePsAr.EmberErp` | PostgreSQL | `workspace_id` (UUID) |

---

## Committee Alignment

- **Full Committee**: Overall architecture decisions
- **SC01-SC06**: Classic Domain subcommittees
- **SC07-SC10**: ERP Integration subcommittees
- **SC13**: Surfaces Layer (UI/UX)

---

## Related Documentation

- Domain boundaries: `knowledge_base/architecture/domain_boundaries.md`
- Agentic system docs: `docs/agents/`

---

*"Architecture is the skeleton; code is the flesh."*

