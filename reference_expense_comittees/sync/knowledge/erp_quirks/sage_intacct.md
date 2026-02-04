# Sage Intacct Quirks & Gotchas

> **Known issues, unexpected behaviors, and workarounds for Sage Intacct integration.**

---

## Status: Stub Document

This document will be populated as the committee encounters and documents Intacct-specific quirks.

---

## Key Differences from Other ERPs

### Dimension-Centric Model
Intacct's core differentiator is its dimension model. Unlike NetSuite (record-based) or QBO (flat):
- Departments, Locations, Classes are dimensions
- Transactions are tagged with dimension values
- This affects how we sync "master data"

---

## Known Quirks

(To be populated)

---

## API Notes

- REST API is primary
- Pagination uses `resultId` and `pagesize`
- Generally more consistent than NetSuite

---

## Last Updated

2024-12-21 — Initial stub

---

## Contributing

When you discover a new quirk, add it here following the NetSuite document format.

