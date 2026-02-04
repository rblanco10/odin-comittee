# Session Goal

> **Session**: 2026-01-08_007_infra-documents-migration  
> **Status**: IN_PROGRESS

---

## Objective

Migrate `ember_document_intake` from `flame_teampay_payables` to the new `infra_documents` app in the Ember Platform umbrella.

---

## Success Criteria

1. **Complete Migration**: All 100+ files from `ember_document_intake` migrated
2. **Compiles**: `mix compile` succeeds with no errors
3. **Proper Dependencies**: 
   - Depends on `core_data` (Repo)
   - Depends on `infra_identity` (Workspace, Entity, User)
   - Does NOT depend on other infra apps (payments, erp, communications)
4. **Module Naming**: All modules renamed to `InfraDocuments.Documents.*`
5. **Migration Script**: Shell script using sed transformations (consistent with previous migrations)

---

## Source Analysis

### Location
`campsite/flames/flame_teampay_payables/lib/flame_teampay_payables/ember_document_intake/`

### File Count
- ~100 .ex files
- 16 .md documentation files

### Structure
```
ember_document_intake/
├── adapters/                    # Provider adapters
│   ├── adapter_registry.ex
│   ├── capability_router.ex
│   └── providers/
│       ├── anthropic/           # AI for OCR/extraction
│       ├── email/               # Email ingestion
│       ├── openai/              # AI for extraction
│       ├── pdf_extractor/       # PDF processing
│       ├── tesseract/           # OCR
│       ├── textract/            # AWS OCR
│       └── upload/              # Direct upload
├── behaviors/                   # Classifier/handler behaviors
├── cache/                       # Caching
├── capabilities/                # Capability interfaces
│   ├── data_extraction/
│   ├── document_ingestion/
│   └── ocr_extraction/
├── config/                      # Configuration
├── domain.ex                    # Ash domain
├── observability/               # Logging/metrics/tracing
├── reactors/                    # Ash reactors
├── resources/                   # 8 Ash resources
│   ├── document_batch/
│   ├── document_inbox/
│   ├── document_relationship/
│   ├── document_sender/
│   ├── document_version/
│   ├── intake_channel/
│   ├── processing_log/
│   └── webhook_event/
├── services/                    # Business logic services
├── types/                       # Custom types
└── workers/                     # Oban workers
```

### Ash Resources (8)
1. `WebhookEvent` - Incoming webhook events
2. `IntakeChannel` - Ingestion channel configuration
3. `DocumentInbox` - Main document processing pipeline
4. `DocumentVersion` - Document versioning
5. `DocumentBatch` - Batch processing
6. `DocumentSender` - Sender tracking
7. `DocumentRelationship` - Document relationships
8. `ProcessingLog` - Processing audit trail

---

## Dependencies

### Will Depend On (Tier 2 Allowed)
- `core_data` - Shared Repo and Vault
- `infra_identity` - Workspace, Entity, User references

### External Dependencies (Need Stubs)
- `EmberAudit` - Audit logging (not yet migrated)
- `EmberExpenseCard` - Product tier (policy references)
- `EmberReimbursements` - Product tier (policy references)
- `EmberAssistants` - Internal actor for system operations
- `Observability` - Telemetry/logging infrastructure

---

## Approach

Follow the established migration pattern from sessions 003-006:

1. Create `infra_documents` app with proper mix.exs
2. Create migration script with sed transformations
3. Run migration
4. Create adapter stubs for external dependencies
5. Fix any remaining compilation issues
6. Update umbrella config
7. Verify compilation

---

*Session initiated by Human Director request.*
