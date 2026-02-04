# Handoff Templates

## Overview

This document provides standard templates for handing off conversation between members. Consistent handoffs maintain session flow, ensure proper documentation, and make transcripts readable.

---

## Basic Handoff Patterns

### Direct Handoff

When one member finishes and another should speak on a specific topic:

```
"[CURRENT SPEAKER] handing to [NEXT SPEAKER] for [TOPIC]."
```

**Examples:**
```
"Priya Sharma handing to Viktor Petrov for availability risk assessment."

"Dr. Ahmed Hassan handing to Oscar Lindqvist for logging configuration details."

"Wei Zhang handing to Aleksandr Kuznetsov for migration risk analysis."
```

---

### Chair-Directed Handoff

When the Chair assigns the next speaker:

```
"Chair directing [MEMBER NAME] to address [TOPIC]."
```

**Examples:**
```
"Chair directing Dr. Erik Stenman to address the BEAM VM configuration."

"Chair directing Chen Li to perform security review of this proposal."

"Chair directing Dr. Eleanor Whitfield to provide historical context."
```

---

### Expertise Request Handoff

When a speaker needs expertise they don't have:

```
"[CURRENT SPEAKER] requesting [MEMBER NAME] for expertise on [TOPIC]."
```

**Examples:**
```
"Carlos Mendez requesting Julia Martinez for Redis cluster configuration expertise."

"Uma Patel requesting Dr. Jane Smith for Docker multi-stage build guidance."

"Olga Volkov requesting Diana Popescu for WAF rule implications."
```

---

### Critic Handoff

When handing to a critic for challenge:

```
"[CURRENT SPEAKER] handing to [CRITIC NAME] for [CHALLENGE TYPE] review."
```

**Examples:**
```
"Benjamin Torres handing to Viktor Petrov for availability review."

"Dr. Sarah Kim handing to Martin Schmidt for cost impact review."

"Nathan Williams handing to Chen Li for security review."
```

---

### Historian Handoff

When requesting historical context:

```
"[CURRENT SPEAKER] handing to [HISTORIAN NAME] for historical context on [TOPIC]."
```

**Examples:**
```
"Beatriz Campos handing to Dr. Eleanor Whitfield for prior deployment decisions."

"Dr. Jennifer Walsh handing to Dr. Nadia Volkov for relevant past incidents."

"Alex Rivera handing to James Okonkwo-Peters for infrastructure evolution context."
```

---

## Complex Handoff Patterns

### Sequential Handoff

When multiple members need to speak in sequence:

```
"Chair directing sequential review:
1. [MEMBER A] on [TOPIC A]
2. [MEMBER B] on [TOPIC B]
3. [MEMBER C] on [TOPIC C]

[MEMBER A], please begin."
```

**Example:**
```
"Chair directing sequential review:
1. Dr. Ivan Petrov on database schema changes
2. Lena Fischer on migration strategy
3. Aleksandr Kuznetsov on rollback procedures

Dr. Ivan Petrov, please begin."
```

---

### Parallel Review Handoff

When multiple critics should review simultaneously:

```
"Chair calling for parallel critic review.
[CRITIC A], assess [RISK A].
[CRITIC B], assess [RISK B].
[CRITIC C], assess [RISK C].

Please provide your assessments."
```

**Example:**
```
"Chair calling for parallel critic review.
Viktor Petrov, assess availability risk.
Martin Schmidt, assess cost implications.
Chen Li, assess security exposure.

Please provide your assessments."
```

---

### Research-Then-Discuss Handoff

When research is needed before discussion continues:

```
"[CURRENT SPEAKER] requesting research pause.
[RESEARCHER NAME], please investigate [QUESTION] in [LOCATION].
We'll resume discussion with findings."
```

**Example:**
```
"Dr. Erik Stenman requesting research pause.
Clara Josephsson, please investigate the current vm.args configuration in infrastructure/lib/stacks/ecs-stack.js.
We'll resume discussion with findings."
```

---

### Subcommittee Handoff

When handing to a subcommittee for focused discussion:

```
"Chair handing to [SUBCOMMITTEE] for detailed analysis.
[SUBCOMMITTEE LEAD], please coordinate review of [TOPIC]."
```

**Example:**
```
"Chair handing to SC04 (Observability Stack) for detailed analysis.
Dr. Ahmed Hassan, please coordinate review of the Prometheus configuration."
```

---

### Escalation Handoff

When escalating to leadership:

```
"[CURRENT SPEAKER] escalating to [LEADERSHIP MEMBER] for [REASON]."
```

**Examples:**
```
"Samuel Osei escalating to Vice Chair Chen-Ramirez for implementation guidance."

"Dr. Patricia Walsh escalating to Chair Vance for decision on contested point."
```

---

### Human Stakeholder Handoff

When the Human should be consulted:

```
"Chair requesting Human stakeholder input on [TOPIC].
Human, we need your guidance on [SPECIFIC QUESTION]."
```

**Example:**
```
"Chair requesting Human stakeholder input on deployment timing.
Human, we need your guidance on whether we should proceed with blue/green deployment given the cost implications."
```

---

## Handoff Acknowledgment

The receiving member MUST acknowledge the handoff:

### Standard Acknowledgment
```
"[RECEIVING MEMBER], [ROLE] - Acknowledged. [BEGINNING STATEMENT]"
```

**Examples:**
```
"Viktor Petrov, Availability Adversary - Acknowledged. Looking at this ECS configuration, my primary concern is..."

"Dr. Eleanor Whitfield, Session Historian - Acknowledged. In session 003, we faced a similar situation..."

"Chen Li, Security Adversary - Acknowledged. I've identified three potential vulnerabilities..."
```

---

### Research Acknowledgment
```
"[RECEIVING MEMBER], [ROLE] - Acknowledged. Beginning research on [TOPIC].
Looking in [LOCATION] for [SPECIFIC ITEM]."
```

**Example:**
```
"Clara Josephsson, OTP Configuration Expert - Acknowledged. Beginning research on BEAM settings.
Looking in infrastructure/lib/stacks/ecs-stack.js for container environment variables."
```

---

## Transition Phrases

### Topic Transitions
```
"Moving from [TOPIC A] to [TOPIC B]..."
"Shifting focus to [NEW TOPIC]..."
"Building on that, let's examine [RELATED TOPIC]..."
"With that established, we should consider [NEXT TOPIC]..."
```

### Challenge Transitions
```
"Before we proceed, let's hear from the critics..."
"I'd like the skeptics to weigh in on this..."
"What risks are we missing?"
"Let's stress-test this proposal..."
```

### Summary Transitions
```
"To summarize what we've heard..."
"Pulling together the key points..."
"The consensus emerging is..."
"We have differing views on..."
```

### Decision Transitions
```
"We're ready to decide on..."
"I'm calling for a decision..."
"Let's formalize our conclusion..."
"The question before us is..."
```

---

## Handoff Anti-Patterns

### ❌ Avoid: Unclear Handoffs
```
Bad: "Someone should look at this."
Good: "Chair directing Dr. Ivan Petrov to examine the database configuration."
```

### ❌ Avoid: Implicit Handoffs
```
Bad: *silence, hoping someone speaks*
Good: "Priya Sharma handing to Carlos Mendez for scaling analysis."
```

### ❌ Avoid: Topic-less Handoffs
```
Bad: "Viktor, what do you think?"
Good: "Viktor Petrov, as Availability Adversary, please assess the failure modes of this approach."
```

### ❌ Avoid: Skipping Acknowledgment
```
Bad: *immediately begins speaking*
Good: "Viktor Petrov, Availability Adversary - Acknowledged. My assessment is..."
```

---

## Quick Reference Card

| Situation | Template |
|-----------|----------|
| Direct handoff | `"[A] handing to [B] for [topic]."` |
| Chair directs | `"Chair directing [B] to address [topic]."` |
| Need expertise | `"[A] requesting [B] for expertise on [topic]."` |
| Critic review | `"[A] handing to [critic] for [type] review."` |
| Historical context | `"[A] handing to [historian] for context on [topic]."` |
| Research needed | `"[A] requesting research pause. [B], please investigate..."` |
| Subcommittee focus | `"Chair handing to [SC] for detailed analysis."` |
| Human input | `"Chair requesting Human stakeholder input on [topic]."` |
| Acknowledgment | `"[B], [role] - Acknowledged. [statement]"` |

---

*Clear handoffs make sessions productive. Use these templates.*
