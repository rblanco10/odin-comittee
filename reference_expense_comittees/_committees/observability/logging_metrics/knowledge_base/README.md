# Knowledge Base

> **Purpose**: Centralized repository of observability knowledge  
> **Maintained By**: Research Librarian, Pattern Chronicler

---

## Structure

```
knowledge_base/
├── README.md                    # This file
├── current_state/               # What exists today
│   ├── README.md
│   ├── loki_implementation.md
│   ├── prometheus_implementation.md
│   ├── tempo_implementation.md
│   ├── grafana_dashboards.md
│   ├── elixir_logging_patterns.md
│   ├── identified_gaps.md
│   └── technical_debt.md
├── ideal_state/                 # What we're working toward
│   ├── README.md
│   ├── logging_vision.md
│   ├── metrics_vision.md
│   ├── tracing_vision.md
│   ├── dashboard_vision.md
│   └── alerting_vision.md
├── patterns/                    # Approved patterns
│   ├── README.md
│   ├── logging_patterns.md
│   ├── metric_patterns.md
│   ├── tracing_patterns.md
│   ├── error_handling_patterns.md
│   └── anti_patterns.md
├── decisions/                   # Architecture Decision Records
│   ├── README.md
│   └── ADR-template.md
├── glossary.md                  # Terms and definitions
└── external_references.md       # Links to external docs
```

---

## Usage

### Reading Knowledge

Before any session, the Research Librarian should:
1. Check relevant current state documents
2. Review applicable patterns
3. Note any related decisions
4. Identify gaps in knowledge

### Updating Knowledge

Knowledge base updates require:
1. Session discussion and approval
2. Verification against codebase
3. Date stamp on update
4. Attribution to session

### Verification

All knowledge base entries should include:
- **Last Verified**: Date of last verification
- **Verified By**: Who verified
- **Source**: Code paths or documentation

---

## Categories

### Current State
Documents what observability exists today. Should be:
- Factual and verifiable
- Linked to specific code
- Updated when implementation changes

### Ideal State
Documents what we're working toward. Should be:
- Aspirational but achievable
- Informed by best practices
- Updated as vision evolves

### Patterns
Documents approved patterns. Should be:
- Concrete and copy-paste-able
- Include rationale
- Include anti-patterns to avoid

### Decisions
Architecture Decision Records. Should be:
- Numbered sequentially
- Include context and rationale
- Include consequences

---

## Maintenance

### Regular Review
- Monthly: Pattern Chronicler reviews patterns
- Quarterly: Full knowledge base review
- After major changes: Immediate update

### Staleness Detection
Knowledge is considered stale if:
- Not verified in 3 months
- Referenced code has changed
- Contradicted by new decisions

---

*"Knowledge shared is knowledge multiplied."*

