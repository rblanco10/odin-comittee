# Glossary of Terms

> **Last Updated**: 2026-01-14

---

## A

**Action** (Ash)
: An operation that can be performed on a resource (create, read, update, destroy, or custom).

**Actor**
: The entity (user, system, API key) performing an action. Carries permissions and tenant context.

**Aging**
: The process of categorizing receivables by how long they've been outstanding (30, 60, 90+ days).

**Ash**
: The Elixir framework used for building domain models and business logic.

---

## B

**Balance**
: The outstanding amount on a receivable after payments are applied.

---

## C

**Changeset**
: An Ash structure that tracks changes to be made to a resource.

**Collection Plan**
: A structured payment arrangement for overdue receivables.

**Constitutional Rule**
: A governance rule that cannot be violated without Human Director override.

---

## D

**Decimal**
: The data type required for all monetary values. Never use Float.

**Domain**
: A grouping of related resources in Ash (e.g., FlamePsAr.Classic.Domain).

---

## E

**ERP**
: Enterprise Resource Planning system (Sage, NetSuite, QuickBooks).

---

## F

**Fee**
: Additional charges applied to receivables (late fees, service fees).

---

## G

**GL**
: General Ledger - the core accounting record.

---

## H

**Handoff**
: A formal document passing implementation from Committee to Agentic system.

---

## K

**KSUID**
: K-Sortable Unique IDentifier - the ID format used in Classic domain.

---

## L

**Lifecycle**
: A documented business process flow (e.g., receivable_lifecycle).

**Loopback2**
: The legacy Node.js framework sharing the MySQL database.

---

## O

**Owner ID**
: The tenant identifier in Classic domain (KSUID format).

---

## P

**Payment Application**
: The process of applying a payment to one or more receivables.

**Policy**
: Authorization rules in Ash that control access to actions.

---

## R

**Ratification**
: Committee approval of an Agentic implementation.

**Reactor**
: An Ash construct for orchestrating multi-step workflows.

**Receivable**
: An invoice or amount owed by a customer.

**Resource**
: An Ash construct representing a data entity with attributes and actions.

---

## S

**Service**
: A module containing business logic that doesn't fit in resource actions.

**State Machine**
: The defined states and transitions for a resource's status field.

**Subcommittee**
: A specialized group within the committee focused on a specific domain.

---

## T

**Tenant**
: An organization whose data is isolated from others (multi-tenancy).

---

## W

**Workspace ID**
: The tenant identifier in Ember domain (UUID format).

**Workflow**
: A defined sequence of steps to accomplish a business process.

---

*"Shared vocabulary enables shared understanding."*

