# Receipt Matching Feature - Teampay Implementation Guide

> **Prepared by**: Ember Payments Committee  
> **Session**: 2026-01-26_001_receipt-matching-card-transactions  
> **For**: Teampay Development Team  
> **Status**: Ready for Implementation Planning

---

## Executive Summary

This document provides everything needed to rebuild the receipt matching feature from scratch. It is **technology-agnostic** - the concepts apply regardless of your tech stack (Python/Django, Node.js, Ruby, etc.).

---

## Part 1: What Is Receipt Matching?

Receipt matching is a feature that allows users to attach receipt images/PDFs to expense transactions, with intelligent suggestions based on amount, date, and merchant similarity.

### User Value

- **Compliance**: Receipts required for audit/expense policy
- **Efficiency**: Auto-matching reduces manual data entry
- **Accuracy**: Prevents wrong receipts being attached

### Two Core Workflows

1. **Upload → Auto-Match**: User uploads receipt, system finds matching transaction
2. **Transaction → Attach**: User views transaction, attaches receipt manually

---

## Part 2: Essential Data Model

### Minimum Viable Schema

```sql
-- Receipts table (stores uploaded receipt documents)
CREATE TABLE receipts (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,           -- Multi-tenant isolation
    uploaded_by_id UUID NOT NULL,         -- Who uploaded
    
    -- File storage
    file_url TEXT NOT NULL,               -- S3/cloud storage URL
    file_type VARCHAR(20),                -- pdf, png, jpg, etc.
    file_hash VARCHAR(64),                -- SHA-256 for duplicate detection
    
    -- Extracted data (from OCR/AI)
    extracted_merchant TEXT,
    extracted_amount DECIMAL(12,2),
    extracted_date DATE,
    extraction_confidence FLOAT,
    
    -- Match tracking
    linked_transaction_id UUID,           -- FK to transactions (nullable)
    linked_at TIMESTAMP,
    
    -- Pre-computed suggestions (JSON array)
    match_candidates JSONB,
    candidates_computed_at TIMESTAMP,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'uploaded', -- uploaded, processing, ready, matched
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
    CONSTRAINT unique_file_hash_per_workspace UNIQUE (workspace_id, file_hash)
);

-- Add receipt tracking to transactions table
ALTER TABLE transactions ADD COLUMN receipt_id UUID REFERENCES receipts(id);
ALTER TABLE transactions ADD COLUMN receipt_status VARCHAR(20) DEFAULT 'missing';
ALTER TABLE transactions ADD CONSTRAINT unique_receipt_per_transaction UNIQUE (receipt_id);
```

### Key Constraints

| Constraint | Purpose |
|------------|---------|
| `unique_file_hash_per_workspace` | Prevents duplicate receipt uploads |
| `unique_receipt_per_transaction` | One receipt can only match one transaction |

---

## Part 3: The Matching Algorithm

### Scoring Formula (100 points max)

```python
def calculate_match_score(receipt, transaction):
    """
    Calculate confidence score between a receipt and transaction.
    Returns: float between 0.0 and 1.0
    """
    score = 0
    
    # === AMOUNT MATCHING (50 points) ===
    # Most important factor - amounts should match closely
    if receipt.amount and transaction.amount:
        diff = abs(receipt.amount - transaction.amount)
        if diff <= 0.01:  # Exact match (within penny)
            score += 50
        elif diff / transaction.amount <= 0.05:  # Within 5%
            score += int(50 * (1 - diff / transaction.amount))
        # else: 0 points
    
    # === DATE MATCHING (30 points) ===
    # Receipt date should be within 7 days of transaction
    if receipt.date and transaction.date:
        days_diff = abs((receipt.date - transaction.date).days)
        if days_diff <= 3:
            score += 30
        elif days_diff <= 7:
            score += int(30 * (1 - days_diff / 7))
        # else: 0 points
    
    # === MERCHANT MATCHING (20 points) ===
    # Merchant names should be similar
    if receipt.merchant and transaction.merchant:
        r = receipt.merchant.lower().strip()
        t = transaction.merchant.lower().strip()
        
        if r == t:  # Exact match
            score += 20
        elif r in t or t in r:  # Contains match
            score += 15
        elif jaro_winkler_similarity(r, t) > 0.8:  # Fuzzy match
            score += 10
        # else: 0 points
    
    return score / 100.0  # Normalize to 0.0-1.0

# Thresholds
AUTO_MATCH_THRESHOLD = 0.80   # >= 80% confidence: auto-link
SUGGEST_THRESHOLD = 0.50      # >= 50% confidence: show as suggestion
```

### Tie-Breaking Rules

When multiple transactions have similar scores:

1. **Clear winner** (10+ point difference): Pick highest score
2. **Exact amount** beats similar amount
3. **Closer date** wins (if 2+ days closer)
4. **Exact merchant** beats fuzzy match
5. **Most recent transaction** as final tiebreaker

---

## Part 4: Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic upload and manual linking

```
Tasks:
□ Create receipts table with schema above
□ Add receipt_id column to transactions
□ Build file upload endpoint (S3 or equivalent)
□ Build manual link API: POST /receipts/:id/link { transaction_id }
□ Build unlink API: DELETE /receipts/:id/link
□ Basic UI: Upload button on transaction detail page
```

**Acceptance Criteria**:
- User can upload a receipt image
- User can manually link receipt to transaction
- Transaction shows "Receipt Attached" status

### Phase 2: AI Extraction (Week 3)

**Goal**: Extract data from receipt images

```
Tasks:
□ Integrate OCR/AI service (pick one):
  - AWS Textract (structured data extraction)
  - Google Cloud Vision
  - OpenAI GPT-4 Vision
  - Anthropic Claude Vision
□ Create extraction worker (async processing)
□ Extract: merchant, amount, date
□ Store extracted data on receipt record
□ Update status: uploaded → processing → ready
```

**Acceptance Criteria**:
- Upload triggers AI extraction
- Extracted data visible on receipt detail
- Processing takes < 30 seconds

### Phase 3: Matching Service (Week 4)

**Goal**: Intelligent match suggestions

```
Tasks:
□ Implement scoring algorithm (see Part 3)
□ Build match candidate finder:
  - Query eligible transactions (no receipt, same owner)
  - Score each against receipt
  - Return top 10 sorted by score
□ API endpoint: GET /receipts/:id/candidates
□ Store candidates in match_candidates JSON column
□ UI: Show suggestions with confidence bars
```

**Acceptance Criteria**:
- Receipt shows match suggestions
- Suggestions sorted by confidence
- One-click to link from suggestion

### Phase 4: Auto-Matching (Week 5)

**Goal**: Automatic linking for high-confidence matches

```
Tasks:
□ After extraction completes:
  - Compute match candidates
  - If single candidate >= 80%: auto-link
  - If multiple high-confidence: don't auto-link
□ Handle edge cases:
  - No matches found
  - Multiple ties
□ Notification: "Receipt auto-matched to [merchant]"
```

**Acceptance Criteria**:
- High-confidence receipts auto-link
- User notified of auto-match
- Ambiguous cases left for manual review

### Phase 5: Polish (Week 6-7)

**Goal**: Full-featured UI and edge cases

```
Tasks:
□ Receipt Inbox page (list all unmatched receipts)
□ Bulk operations (select multiple, "Match All")
□ Duplicate detection (hash-based)
□ Transaction view: "Missing Receipt" indicator
□ Mobile-friendly upload
□ Error handling for all edge cases
```

---

## Part 5: Critical Edge Cases (MUST Handle)

### Edge Case 1: Duplicate Receipts

**Problem**: User uploads same receipt twice

**Solution**:
```python
def check_duplicate(file_content, workspace_id):
    file_hash = hashlib.sha256(file_content).hexdigest()
    existing = Receipt.query.filter_by(
        workspace_id=workspace_id,
        file_hash=file_hash
    ).first()
    
    if existing:
        return DuplicateError(f"This receipt was already uploaded on {existing.created_at}")
    return None
```

### Edge Case 2: Race Conditions

**Problem**: Two users try to link same receipt simultaneously

**Solution**: Database unique constraint + graceful error handling
```python
try:
    transaction.receipt_id = receipt.id
    db.commit()
except IntegrityError:
    return Error("This receipt was just linked to another transaction")
```

### Edge Case 3: Exclusivity (Card vs Reimbursement)

**Problem**: Receipt linked to card transaction, user tries to add to reimbursement

**Solution**: Check before linking
```python
def link_receipt_to_reimbursement(receipt_id, item_id):
    receipt = Receipt.get(receipt_id)
    
    if receipt.linked_transaction_id:
        return Error("This receipt is already linked to a card transaction")
    
    # Proceed with linking to reimbursement
```

### Edge Case 4: Stale Match Candidates

**Problem**: Candidates computed 10 min ago, but transaction was matched by someone else

**Solution**: Re-validate before allowing link
```python
def link_receipt(receipt_id, transaction_id):
    transaction = Transaction.get(transaction_id)
    
    if transaction.receipt_id:
        return Error("This transaction already has a receipt")
    
    # Proceed with linking
```

### Edge Case 5: Missing Extracted Data

**Problem**: OCR fails to extract merchant name

**Solution**: Handle gracefully, don't block matching
```python
def calculate_match_score(receipt, transaction):
    score = 0
    
    # Only add amount score if both have amounts
    if receipt.amount and transaction.amount:
        score += amount_score(...)
    
    # Missing data = 0 for that component, not a failure
    return score
```

---

## Part 6: Security Checklist

| # | Security Requirement | Implementation |
|---|---------------------|----------------|
| 1 | **Multi-tenant isolation** | ALL queries filtered by workspace_id |
| 2 | **User scoping** | Users only see their own receipts/transactions |
| 3 | **File validation** | Check file type by magic bytes, not extension |
| 4 | **File size limits** | Max 15MB per file |
| 5 | **Antivirus scanning** | Scan uploads before processing |
| 6 | **Sanitize extracted text** | Escape any HTML/script in OCR output |
| 7 | **Rate limiting** | Limit uploads per user per hour |
| 8 | **Audit trail** | Log all link/unlink operations |

---

## Part 7: API Specification

### Upload Receipt

```
POST /api/receipts
Content-Type: multipart/form-data

file: <binary>

Response 201:
{
  "id": "uuid",
  "status": "processing",
  "file_url": "https://...",
  "created_at": "2026-01-26T10:00:00Z"
}
```

### Get Match Candidates

```
GET /api/receipts/:id/candidates

Response 200:
{
  "receipt_id": "uuid",
  "candidates": [
    {
      "transaction_id": "uuid",
      "merchant": "Starbucks",
      "amount": 42.50,
      "date": "2026-01-25",
      "score": 0.85,
      "score_breakdown": {
        "amount": 50,
        "date": 25,
        "merchant": 10
      }
    },
    ...
  ],
  "computed_at": "2026-01-26T10:05:00Z"
}
```

### Link Receipt to Transaction

```
POST /api/receipts/:id/link
Content-Type: application/json

{
  "transaction_id": "uuid"
}

Response 200:
{
  "receipt_id": "uuid",
  "transaction_id": "uuid",
  "linked_at": "2026-01-26T10:10:00Z"
}

Response 409 (Conflict):
{
  "error": "receipt_already_linked",
  "message": "This receipt is already linked to another transaction"
}
```

### Unlink Receipt

```
DELETE /api/receipts/:id/link

Response 204: (No Content)
```

---

## Part 8: Recommended OCR/AI Providers

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **AWS Textract** | Best for structured receipts, good accuracy | AWS lock-in | ~$1.50/1000 pages |
| **Google Cloud Vision** | Good general OCR | Less receipt-specific | ~$1.50/1000 pages |
| **OpenAI GPT-4 Vision** | Excellent for messy receipts | Higher latency | ~$0.01/image |
| **Anthropic Claude** | Great reasoning for edge cases | Higher cost | ~$0.01/image |

**Recommendation**: Start with AWS Textract or GPT-4 Vision. Add fallback later.

---

## Part 9: Testing Checklist

### Unit Tests

- [ ] Scoring algorithm with various inputs
- [ ] Tie-breaking logic
- [ ] Edge cases (nil values, zero amounts)

### Integration Tests

- [ ] Upload → Extract → Compute Candidates flow
- [ ] Manual link/unlink
- [ ] Auto-match trigger
- [ ] Duplicate detection

### End-to-End Tests

- [ ] Upload receipt via UI
- [ ] View suggestions
- [ ] Link receipt to transaction
- [ ] Verify transaction shows "Receipt Attached"

### Security Tests

- [ ] User A cannot see User B's receipts
- [ ] Workspace A cannot access Workspace B's data
- [ ] Malformed file upload rejected
- [ ] Oversized file rejected

---

## Part 10: Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Auto-match rate** | > 60% of receipts | Receipts auto-matched / total uploaded |
| **Auto-match accuracy** | > 95% | Correct auto-matches / total auto-matches |
| **Time to process** | < 30 seconds | Upload to ready status |
| **Manual link time** | < 5 seconds | Click "Link" to confirmed |

---

## Appendix A: Ashwood Code References

For detailed implementation reference, see these files in the ashwood codebase:

| Concept | File Path |
|---------|-----------|
| Matching Algorithm | `lib/flame_teampay_payables/ember_expense_receipt/services/receipt_service.ex` (lines 234-284) |
| Link Reactor | `lib/flame_teampay_payables/ember_expense_card/reactors/link_transaction_receipt_reactor.ex` |
| Auto-Match Flow | `lib/flame_teampay_payables/ember_document_intake/reactors/fast_process_document_reactor.ex` |
| Match Computation | `lib/flame_teampay_payables/ember_expense_receipt/services/match_computation_service.ex` |
| Duplicate Detection | `lib/flame_teampay_payables/ember_document_intake/services/duplicate_detection_service.ex` |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Receipt** | Digital document (image/PDF) proving a purchase |
| **Transaction** | Expense record from a card or reimbursement |
| **Match** | Link between receipt and transaction |
| **Confidence Score** | 0.0-1.0 measure of match quality |
| **Auto-Match** | System automatically links high-confidence matches |
| **Match Candidate** | Potential transaction for a receipt to match |

---

**Document Prepared By**: Ember Payments Committee  
**Date**: 2026-01-26  
**Version**: 1.0

*This document may be shared with the teampay development team.*
