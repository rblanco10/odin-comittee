# Glossary

> **Purpose**: Define terms used in observability discussions  
> **Maintained By**: Research Librarian

---

## A

### ADR (Architecture Decision Record)
A document that captures an important architectural decision along with its context and consequences.

### Alert
A notification triggered when a metric crosses a threshold or an SLO is at risk.

### Alert Fatigue
The desensitization that occurs when too many alerts fire, leading to ignored alerts.

### Async Logging
Logging that doesn't block the main execution thread, typically using a buffer.

---

## B

### Backpressure
A mechanism to slow down producers when consumers can't keep up.

### BEAM
The Erlang virtual machine that runs Elixir code. Stands for Bogdan's Erlang Abstract Machine.

### Buffering
Temporarily storing data before sending it to its destination.

---

## C

### Cardinality
The number of unique values a label can have. High cardinality causes performance issues.

### Correlation ID
A unique identifier that links related logs, metrics, and traces across a request.

### Counter
A metric that only increases (or resets to zero). Used for counting events.

---

## D

### Dashboard
A visual display of metrics and logs, typically in Grafana.

### Distributed Tracing
Tracking a request as it flows through multiple services.

---

## E

### Error Budget
The amount of unreliability allowed before SLO is violated.

### Exemplar
A link from a metric to a specific trace that contributed to that metric.

### ETS (Erlang Term Storage)
In-memory storage in the BEAM VM.

---

## F

### Flame Graph
A visualization of stack traces showing where time is spent.

---

## G

### Gauge
A metric that can go up or down. Used for current values.

### GenServer
An Elixir/OTP behavior for implementing server processes.

### Golden Signals
The four key metrics: latency, traffic, errors, saturation.

### Grafana
Open-source visualization and dashboarding platform.

---

## H

### Histogram
A metric that samples observations and counts them in buckets.

### Hot Path
Code that executes frequently and is performance-critical.

---

## I

### Instrumentation
Adding code to collect observability data.

---

## L

### Label
A key-value pair attached to a metric for filtering and grouping.

### Latency
The time taken to complete an operation.

### LiveView
Phoenix framework for real-time server-rendered UIs.

### LogQL
Grafana Loki's query language.

### Loki
Grafana's log aggregation system.

---

## M

### Metric
A numeric measurement collected over time.

---

## O

### Observability
The ability to understand a system's internal state from its external outputs.

### OpenTelemetry (OTel)
A vendor-neutral standard for observability instrumentation.

### OTP (Open Telecom Platform)
The set of libraries and design principles for Erlang/Elixir applications.

---

## P

### P50, P95, P99
Percentiles. P99 means 99% of values are below this threshold.

### PII (Personally Identifiable Information)
Data that can identify an individual.

### Prometheus
Open-source monitoring and alerting system.

### PromQL
Prometheus Query Language.

---

## R

### Recording Rule
A Prometheus rule that pre-computes frequently used queries.

### RED Method
Rate, Errors, Duration - three key metrics for services.

### Reduction
A unit of work in the BEAM VM scheduler.

### Runbook
A document describing how to respond to an alert.

---

## S

### Sampling
Collecting only a subset of data to reduce volume.

### Scheduler
BEAM component that distributes work across CPU cores.

### Scrape
Prometheus pulling metrics from a target.

### SLI (Service Level Indicator)
A metric that measures service quality.

### SLO (Service Level Objective)
A target value for an SLI.

### Span
A unit of work in a distributed trace.

### Structured Logging
Logging in a machine-parseable format (typically JSON).

---

## T

### Telemetry
Elixir library for instrumenting applications.

### Tempo
Grafana's distributed tracing backend.

### Three Pillars
Logs, metrics, and traces - the three types of observability data.

### Time Series
Data points indexed by time.

### Toil
Repetitive, manual work that could be automated.

### Trace
A collection of spans representing a request's journey.

### Trace Context
Headers that propagate trace information across services.

---

## U

### USE Method
Utilization, Saturation, Errors - three key metrics for resources.

---

## W

### Webhook
An HTTP callback triggered by an event.

---

*"Shared vocabulary enables shared understanding."*

