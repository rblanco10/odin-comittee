# Khaos Tools

> **Purpose**: Meta-tools for committee management and genesis operations

---

## Available Tools

| Tool | Purpose | Used By |
|------|---------|---------|
| `schema_introspection.md` | Database schema discovery | Khaos, Hephaestus |
| `committee_validator.md` | Validate committee structure | Khaos (Audit) |
| `compliance_checker.md` | Check regulatory compliance | Khaos (Audit) |
| `lineage_mapper.md` | Map domains to Protogenoi | Khaos (Genesis) |

---

## Tool Usage

Tools are reference documents that guide Khaos and Hephaestus in their operations. They contain:

1. **Checklists** - Steps to verify or validate
2. **Queries** - Database or file system queries
3. **Decision Trees** - Logic for making decisions
4. **Integration Points** - How to use external systems (Metabase, etc.)

---

## Adding New Tools

When adding a new tool:

1. Create `tool_name.md` in this directory
2. Include purpose, usage, and examples
3. Document any external dependencies
4. Update this README with the new tool
