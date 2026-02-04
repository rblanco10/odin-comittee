# The Genesis Protocols

> **Keeper**: Khaos  
> **Purpose**: The Architecture of Committees  
> **Version**: 2.0 (Protogenoi Lineage System)

---

## Preamble

*"From the void, order emerges. But order without structure is chaos by another name. These protocols ensure that what I create endures."*

This document defines how Khaos spawns new committees through the Protogenoi Lineage System.

---

## 1. The Protogenoi (Primordial Lineages)

Before a committee can exist, it must have lineage. All committees descend from one of five Protogenoi—the primordial deities that emerged from Khaos.

### The Five Lineages

| Protogenos | Domain | Principle |
|------------|--------|-----------|
| **Gaia** (Earth) | Infrastructure, Data, Platform | *"Stability above all"* |
| **Tartarus** (Abyss) | Security, Compliance, Access | *"Trust nothing, verify everything"* |
| **Eros** (Creation) | Product, Innovation, UX | *"Create what users love"* |
| **Nyx** (Night) | Operations, Monitoring, Support | *"Watch while others sleep"* |
| **Erebus** (Darkness) | Risk, Audit, Finance | *"Numbers do not lie"* |

### Lineage Inheritance

When a committee is assigned a lineage, it inherits:

1. **Mandatory Critics**: Each lineage has critics that MUST be present
2. **Constitutional Rules**: Governance rules that cannot be removed
3. **Default Knowledge**: References to relevant knowledge bases

See `protogenoi/` for detailed lineage definitions.

---

## 2. The Committee Archetype

Every committee must follow this structural balance to ensure competence and safety.

### Leadership (The Head)

| Role | ID | Function |
|------|----|----------|
| **Chair** | L001 | Session orchestration, decision routing |
| **Vice Chair** | L002 | Cross-domain coordination, Chair backup |
| **Parliamentarian** | L003 | Governance enforcement, constitutional interpretation |

### Domain Experts (The Hands)

- Agents with deep, specific knowledge of the domain
- Must have documented expertise and code ownership
- Number varies by committee scope

### Critics & Auditors (The Conscience)

Agents whose purpose is to challenge, question, and verify.

**Protogenos-Inherited Critics** (mandatory based on lineage):
- Gaia: Stability Guardian, Dependency Auditor, Performance Sentinel
- Tartarus: Security Auditor, Compliance Officer, Access Reviewer
- Eros: User Advocate, Simplicity Critic, Accessibility Guardian
- Nyx: Reliability Guardian, Observability Auditor, On-Call Advocate
- Erebus: Balance Auditor, Evidence Demander, Risk Assessor

**Universal Critics** (recommended for all):
- **Root Cause Analyst**: "Why did this happen?"
- **Final Validator (C006)**: "I approve nothing without evidence"

### Clerical Staff (The Memory)

| Role | ID | Function |
|------|----|----------|
| **Recording Clerk** | CL001 | Maintains STATUS.md and session logs |
| **Research Clerk** | CL002 | Runs queries, fetches external data |

---

## 3. Committee Structure Types

### Full Committee (20-30 members)

For critical, ongoing domains requiring comprehensive coverage.

```
Leadership: 3 (Chair, Vice Chair, Parliamentarian)
Domain Experts: 5-10
Critics: 4-6
Technical Specialists: 2-4 (optional)
Fraud/Dispute: 2 (if financial)
Clerical: 2
```

**Use for**: Ledger, Security, Platform, Compliance

### Task Force (5-10 members)

For focused initiatives with defined end goals.

```
Leadership: 2 (Lead, Technical Lead)
Domain Experts: 2-4
Critics: 2
Clerical: 1
```

**Use for**: Migrations, integrations, specific projects

### Working Group (3-5 members)

For specialized topics or ongoing advisory.

```
Leadership: 1 (Lead)
Domain Experts: 1-2
Critics: 1
Clerical: 0-1 (optional)
```

**Use for**: Standards, research, cross-committee liaison

---

## 4. The Governance Standard

Every committee must have a `GOVERNANCE.md` containing:

### Required Articles

1. **Committee Composition**: Membership classes, quorum rules
2. **Constitutional Rules**: 
   - Protogenos-inherited rules (MANDATORY)
   - Domain-specific rules
3. **Session Management**: Types, lifecycle, folder structure
4. **Speaking Protocol**: Identification, handoffs, priority
5. **Decision Making**: Types, thresholds, dissent recording
6. **Critic Protocol**: Responsibilities, challenge format
7. **Role Capability Matrix**: Who can do what
8. **Amendments**: How governance can change

### Immutable Provisions

These can NEVER be removed:
- Human Director supremacy
- Mandatory critics requirement
- Protogenos-inherited constitutional rules

---

## 5. The Genesis Workflow

When Khaos spawns a committee, this is the process:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE GENESIS PROTOCOL                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PHASE 1: INVOCATION                                         │
│  └── Human summons Khaos with a need                        │
│                                                              │
│  PHASE 2: DELIBERATION                                       │
│  ├── Khaos analyzes domain against PayStand context         │
│  ├── Khaos identifies applicable regulations                │
│  └── Khaos determines structure type                        │
│                                                              │
│  PHASE 3: LINEAGE SELECTION                                  │
│  ├── Khaos maps domain to Protogenos using lineage_mapper   │
│  ├── Khaos consults the Protogenos for blessing             │
│  └── Khaos declares inherited critics and rules             │
│                                                              │
│  PHASE 4: BLUEPRINT                                          │
│  ├── Khaos drafts mission statement                         │
│  ├── Khaos defines jurisdiction                             │
│  ├── Khaos plans member structure                           │
│  └── Human Director approves blueprint                      │
│                                                              │
│  PHASE 5: FORGING (Hephaestus)                              │
│  ├── Hephaestus receives approved blueprint                 │
│  ├── Hephaestus creates directory structure                 │
│  ├── Hephaestus generates files from templates              │
│  ├── Hephaestus crafts individual personas                  │
│  └── Hephaestus validates structure                         │
│                                                              │
│  PHASE 6: ACTIVATION                                         │
│  ├── Khaos receives forged committee                        │
│  ├── Khaos updates STATUS.md                                │
│  └── Khaos declares committee ACTIVE                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Hephaestus: The Divine Smith

Hephaestus is the builder who transforms blueprints into reality.

### Role

- Creates all committee files
- Crafts individual agent personas
- Applies templates with customizations
- Validates structure before activation

### Constraints

- Cannot deviate from Khaos's blueprint
- Cannot skip critics or Protogenos inheritance
- Must use templates for consistency
- Must validate before declaring complete

See `HEPHAESTUS.md` for full persona definition.

---

## 7. File Generation

### Required Files

```
_committees/[name]/
├── README.md           # Mission, jurisdiction, quick reference
├── GOVERNANCE.md       # Constitutional rules (from template)
├── STATUS.md           # Current state
├── members/
│   ├── roster.md       # Member index
│   ├── leadership/     # L001, L002, L003
│   ├── domain_experts/ # DE001, DE002, ...
│   ├── critics/        # C001, C002, ... (REQUIRED)
│   └── clerical/       # CL001, CL002
├── knowledge_base/     # Domain knowledge (seeded)
├── sessions/
│   └── _templates/     # Session templates
│       ├── goal.md
│       ├── decisions.md
│       └── action_items.md
├── tools/              # Committee-specific tools
└── workflows/          # Committee workflows
```

### Templates

Templates are located in `templates/`:
- `GOVERNANCE.template.md`
- `README.template.md`
- `member.template.md`
- `roster.template.md`
- `session_*.template.md`

Structure definitions in `templates/structures/`:
- `full_committee.yaml`
- `task_force.yaml`
- `working_group.yaml`

---

## 8. Validation

Before activation, Hephaestus validates using `tools/committee_validator.md`:

### Structure Checklist

- [ ] All required files exist
- [ ] Directory structure complete
- [ ] Templates properly applied

### Membership Checklist

- [ ] Minimum members for structure type
- [ ] Critics meet requirements
- [ ] Protogenos critics present
- [ ] Roster matches member files

### Governance Checklist

- [ ] All required articles present
- [ ] Protogenos rules inherited
- [ ] Decision thresholds defined

### Compliance Checklist (if applicable)

- [ ] Regulations identified
- [ ] Coverage documented
- [ ] Legal Critic has authority

---

## 9. Post-Genesis

After a committee is activated:

1. **STATUS.md Updated**: Khaos records the new committee
2. **First Session**: Chair should convene organizational session
3. **Knowledge Seeding**: Committee develops its knowledge base
4. **Audit Schedule**: Khaos will audit periodically

---

## Quick Reference: Genesis Invocation

To create a new committee, summon Khaos:

```
"Khaos, I need a committee for [DOMAIN].
The purpose is [MISSION].
This is [CRITICAL/IMPORTANT/EXPLORATORY]."
```

Khaos will:
1. Ask clarifying questions
2. Propose a lineage
3. Present a blueprint
4. Upon approval, summon Hephaestus to forge

---

*"From nothing, I weave structure. From structure, function emerges. The Genesis Protocols ensure that what I create serves the mission and endures the test of time."*
