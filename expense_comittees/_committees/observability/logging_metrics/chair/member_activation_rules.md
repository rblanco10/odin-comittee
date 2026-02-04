# Member Activation Rules

> **For**: Chief Orchestrator (Chair)  
> **Purpose**: Guidelines for activating appropriate committee members

---

## Core Principle

**Activate the minimum members needed for quality deliberation, but never fewer than required for the topic's complexity.**

---

## Activation by Session Type

### Discovery Sessions

| Always Activate | Conditionally Activate |
|-----------------|----------------------|
| Chair | Domain experts (based on area) |
| Session Historian | Technical specialists (based on stack) |
| Research Librarian | Subcommittee skeptic |
| 1 Cross-cutting Skeptic | |

### Design Sessions

| Always Activate | Conditionally Activate |
|-----------------|----------------------|
| Chair | Pattern Chronicler (if pattern exists) |
| Relevant domain experts (2-4) | Decision Genealogist (if revisiting) |
| 2 Cross-cutting Skeptics | Additional specialists |
| Subcommittee skeptic | |

### Implementation Sessions

| Always Activate | Conditionally Activate |
|-----------------|----------------------|
| Chair | Infrastructure specialists |
| Technical specialists (2-3) | Security Pessimist (if sensitive) |
| QA specialist | Cost Hawk (if resource-intensive) |
| 1 Cross-cutting Skeptic | |

### Review Sessions

| Always Activate | Conditionally Activate |
|-----------------|----------------------|
| Chair | Incident Archaeologist (if past issues) |
| Session Historian | Technical Debt Historian |
| Domain experts (1-2) | Pattern Chronicler |
| 2 Cross-cutting Skeptics | |

### Incident Sessions

| Always Activate | Conditionally Activate |
|-----------------|----------------------|
| Chair | All relevant domain experts |
| Incident Archaeologist | Security Pessimist |
| Root Cause Investigator | Performance Paranoid |
| 2 Cross-cutting Skeptics | |

---

## Activation by Topic

### Logging Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Log structure | Log Structure Architect, Structured Logging Purist | Complexity Auditor |
| Log levels | Log Level Taxonomist | Simplicity Zealot |
| Buffering | Buffer Strategist, Backpressure Engineer | Performance Paranoid |
| Loki integration | Loki Query Master, Log Routing Engineer | Integration Cynic |
| Context propagation | Context Propagation Expert, Log Correlation Expert | Scale Skeptic |

### Metrics Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Prometheus setup | Prometheus Sage, Scrape Interval Optimizer | Performance Paranoid |
| Metric design | Custom Metrics Designer, Metric Naming Conventionist | Cardinality Guardian |
| Cardinality | Cardinality Guardian, Metrics Minimalist | Cost Hawk |
| Business metrics | Business Metrics Translator, Business KPI Translator | Vanity Metric Skeptic |
| Histograms | Histogram Specialist, Latency Percentile Expert | Complexity Auditor |

### Tracing Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Tempo setup | Tempo Expert, Trace Storage Optimizer | Cost Hawk |
| Span design | Span Designer, Trace Context Architect | Tracing Overhead Skeptic |
| Sampling | Trace Sampling Strategist | Performance Paranoid |
| Correlation | Cross Service Tracer, Trace Visualization Expert | Integration Cynic |
| OpenTelemetry | OpenTelemetry Evangelist | Vendor Lock-in Warner |

### Grafana Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Dashboard design | Dashboard Architect, Panel Layout Designer | Dashboard Clutter Critic |
| Provisioning | Dashboard Provisioning Engineer | Maintenance Pessimist |
| Queries | PromQL Wizard, Loki Query Master | Performance Paranoid |
| Alerts | Alert Rule Designer, Alert Threshold Calibrator | Alert Fatigue Preventer |
| Variables | Variable Template Expert | Complexity Auditor |

### Elixir/Ash Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Telemetry | Elixir Telemetry Expert, Ash Action Instrumenter | Performance Paranoid |
| Phoenix | Phoenix Instrumentation Specialist | Complexity Auditor |
| OTP | OTP Supervision Observer, GenServer Observer | Scale Skeptic |
| BEAM VM | BEAM VM Metrics Specialist, Process Mailbox Monitor | Performance Paranoid |
| Ecto | Ecto Query Tracer | DB Metrics Skeptic |

### Infrastructure Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Docker setup | Docker Compose Architect, Local Dev Environment Engineer | Complexity Auditor |
| Deployment | Service Discovery Expert, Config Management Expert | Deployment Skeptic |
| Storage | Time Series DB Expert, Data Lifecycle Manager | Storage Cost Hawk |
| Networking | Network Topology Designer | Security Pessimist |

### Domain Topics

| Topic | Required Members | Skeptics |
|-------|------------------|----------|
| Expense workflows | Expense Workflow Expert, Approval Chain Tracer | Domain Complexity Skeptic |
| Payment flows | Payment Flow Observer | Integration Cynic |
| User journeys | User Journey Analyst, Conversion Funnel Tracker | Vanity Metric Skeptic |

---

## Skeptic Selection Matrix

### When to Activate Each Cross-Cutting Skeptic

| Skeptic | Activate When |
|---------|---------------|
| **Devil's Advocate General** | Major decisions, new standards, anything controversial |
| **Complexity Auditor** | New abstractions, additional layers, configuration |
| **Cost Hawk** | Storage decisions, retention policies, infrastructure |
| **Security Pessimist** | PII handling, credential logging, audit trails |
| **Performance Paranoid** | Hot paths, high-volume logging, synchronous operations |
| **Scale Skeptic** | Cardinality, storage growth, query performance |
| **Maintenance Pessimist** | New patterns, custom tooling, non-standard approaches |
| **Integration Cynic** | Cross-service concerns, external dependencies |
| **Vendor Lock-in Warner** | Tool selection, proprietary formats, cloud services |
| **Simplicity Zealot** | Any complexity, always available for "do we need this?" |

### Minimum Skeptic Requirements

| Decision Type | Minimum Skeptics |
|---------------|------------------|
| Recommendation | 1 |
| Pattern Adoption | 2 |
| Standard Definition | 2 |
| Infrastructure Change | 2 |
| Knowledge Base Update | 0 (optional) |

---

## Subcommittee Activation

### When to Activate Full Subcommittee

- Topic is core to subcommittee's domain
- Cross-cutting decision affects subcommittee
- Subcommittee expertise needed for quality decision

### When to Activate Subcommittee Lead Only

- Quick consultation needed
- Subcommittee perspective needed but not full deliberation
- Representing subcommittee in cross-cutting discussion

### Subcommittee Leads

| Subcommittee | Lead Member |
|--------------|-------------|
| SC01 Logging Architecture | Log Structure Architect |
| SC02 Metrics & Instrumentation | Prometheus Sage |
| SC03 Distributed Tracing | Tempo Expert |
| SC04 Grafana & Visualization | Dashboard Architect |
| SC05 Elixir/Ash Integration | Elixir Telemetry Expert |
| SC06 Site Reliability | SLO Architect |
| SC07 Alerting & On-Call | Alert Fatigue Preventer |
| SC08 Security & Compliance | PII Redaction Guardian |
| SC09 Performance Engineering | Bottleneck Detective |
| SC10 Data Pipeline & Storage | Time Series DB Expert |
| SC11 Infrastructure & DevOps | Docker Compose Architect |
| SC12 Product Analytics | User Journey Analyst |
| SC13 Expense Domain | Expense Workflow Expert |
| SC14 Developer Experience | Logging API Designer |
| SC15 Cost Optimization | Log Volume Auditor |
| SC16 Quality Assurance | Observability Tester |
| SC17 Capacity Planning | Growth Forecaster |
| SC18 Standards & Governance | Naming Convention Arbiter |
| SC19 Incident Analysis | Root Cause Investigator |
| SC20 Frontend Observability | Browser Performance Monitor |
| SC21 Database Observability | Query Performance Analyst |
| SC22 Automation & Tooling | Dashboard Generator |
| SC23 BEAM VM Observability | BEAM VM Metrics Specialist |

---

## Historian Activation

### Session Historian
- **Always activate** for any session longer than 30 minutes
- **Always activate** when decisions will be made

### Incident Archaeologist
- Activate when discussing past failures
- Activate when reviewing incident-related code
- Activate for any incident session

### Pattern Chronicler
- Activate when proposing new patterns
- Activate when reviewing pattern compliance
- Activate when anti-patterns suspected

### Decision Genealogist
- Activate when revisiting past decisions
- Activate when "why is it this way?" questions arise
- Activate when considering breaking changes

### Technical Debt Historian
- Activate when reviewing legacy code
- Activate when debt is discovered
- Activate when planning debt reduction

---

## Clerical Activation

### Always Active
- **Session Clerk**: Every session (manages transcript)

### Activate as Needed
- **Research Librarian**: When codebase investigation needed
- **Artifact Archivist**: When outputs will be produced
- **Minute Keeper**: For complex sessions with many decisions
- **Continuity Officer**: When resuming paused sessions

---

*"The right voices at the right time produce the right outcomes."*

