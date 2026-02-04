# Committee Schemas

> **Purpose**: Define structured output formats for committee documents  
> **Inspired by**: [ChatDev](https://github.com/OpenBMB/ChatDev) schema_registry pattern

---

## Overview

Schemas define the required structure for committee outputs. They ensure consistency and enable validation of documents before they are finalized.

---

## Available Schemas

| Schema | Purpose | Used In |
|--------|---------|---------|
| `decision.schema.yaml` | Decision records | Architecture Review, any voting workflow |
| `handoff.schema.yaml` | Implementation handoff documents | Implementation Handoff workflow |
| `ratification.schema.yaml` | Ratification reports | Ratification workflow |

---

## Schema Format

Schemas use YAML with JSON Schema-like structure:

```yaml
type: object
required: [field1, field2]
properties:
  field1:
    type: string
    description: "What this field contains"
    pattern: "regex-if-applicable"
  field2:
    type: object
    properties:
      nested: { type: string }
```

---

## Validation Process

### During Workflow

1. Member creates document following schema structure
2. Before finalization, Chair requests validation
3. Clerk verifies all required fields present
4. Parliamentarian verifies constitutional sections
5. If valid, document is finalized
6. If invalid, return to authoring phase

### Quick Validation

```
Chair: "Recording Clerk, please validate this [document type] against schema."
Clerk: "Validating against [schema name]..."
Clerk: "Validation [PASSED/FAILED]. [Details if failed]"
```

---

## Schema Versioning

Schemas include version numbers. When updating:

1. Increment version number
2. Document changes in schema comments
3. Existing documents remain valid under their original version
4. New documents must use latest version

---

## Creating New Schemas

When a new document type is needed:

1. Identify all required fields
2. Define types and constraints
3. Add validation rules (patterns, enums)
4. Document each field's purpose
5. Add to this README

---

## Relationship to Templates

| Aspect | Schema | Template |
|--------|--------|----------|
| **Purpose** | Structure validation | Starting point |
| **Location** | `schemas/` | `sessions/_templates/` |
| **Format** | YAML (machine-readable) | Markdown (human-readable) |
| **Usage** | Validation check | Copy and fill |

Templates should conform to schemas. Schemas are the source of truth.

---

*"Structure enables creativity. Schemas ensure quality."*

