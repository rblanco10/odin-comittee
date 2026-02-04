# Finding Template

> Use this template when a committee member identifies something noteworthy — an observation, concern, or insight that should be captured.

---

## Finding: [Short Title]

**ID:** FIND-[session-id]-[number]
**Type:** [Observation | Concern | Insight | Inconsistency]
**Raised By:** [Member Name]
**Turn:** [N]
**Severity:** [Info | Low | Medium | High | Critical]

### Summary
[One-sentence summary of the finding]

### Details
[Full explanation of what was found]

### Evidence
[Code references, documentation links, or data that supports this finding]

```elixir
# Example code reference if applicable
```

### Impact
[What are the implications of this finding?]

### Related
- [Links to related findings, gaps, or context]

### Status
- [ ] Acknowledged
- [ ] Being addressed
- [ ] Resolved: [How/when resolved]
- [ ] Accepted as-is: [Why we're not addressing it]

### Follow-Up
[Any actions or handoffs triggered by this finding]

---

## Example

### Finding: Vendor sync doesn't handle soft deletes

**ID:** FIND-SYNC-20241221-001
**Type:** Concern
**Raised By:** Edge Case Hunter
**Turn:** 8
**Severity:** High

### Summary
The vendor sync handler doesn't distinguish between inactive and deleted vendors in NetSuite.

### Details
When a vendor is set to `isInactive = true` in NetSuite, the current sync handler continues to sync the vendor but doesn't update its status in Teampay. When a vendor is deleted entirely, the API returns 404 and the sync fails with an unhandled exception.

### Evidence
```elixir
# From vendor_sync_handler.ex:45
# No status field mapping present
defp map_vendor(erp_data) do
  %{
    external_id: erp_data["id"],
    name: erp_data["companyName"],
    # status is not mapped!
  }
end
```

### Impact
- Inactive vendors remain selectable in Teampay
- Deleted vendors cause sync failures
- AP team may create bills against inactive vendors

### Related
- GAP-SYNC-20241221-001: Vendor deletion handling

### Status
- [x] Acknowledged
- [ ] Being addressed

### Follow-Up
Route to Data Mapping Specialist to design status mapping.

