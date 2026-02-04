# SC08: Security & Compliance Subcommittee

> **Code**: SC08  
> **Focus**: PII protection, audit logs, and compliance  
> **Members**: 8  
> **Lead**: Diana Foster (PII Redaction Guardian)

---

## Charter

The Security & Compliance Subcommittee is responsible for ensuring observability data is secure and compliant. This includes PII redaction, audit logging, retention policies, and compliance mapping.

---

## Scope

### In Scope
- PII detection and redaction
- Audit log architecture
- Retention policies
- Access control
- Compliance mapping (GDPR, CCPA, SOC2)
- Secret leak prevention
- Log integrity
- Data classification

### Out of Scope
- Application security (separate concern)
- Authentication/authorization (separate concern)
- General logging patterns (SC01)

---

## Members

| ID | Name | Role | Expertise |
|----|------|------|-----------|
| SC08-001 | **Diana Foster** | PII Redaction Guardian (Lead) | PII protection |
| SC08-002 | **Jonathan Blake** | Audit Log Architect | Audit logging |
| SC08-003 | **Rebecca Morrison** | Retention Policy Expert | Retention |
| SC08-004 | **Charles Wright** | Access Control Enforcer | Access control |
| SC08-005 | **Samantha Price** | Compliance Mapper | Compliance |
| SC08-006 | **Marcus Chen** | Secret Leak Preventer | Secret protection |
| SC08-007 | **Linda Tran** | Log Integrity Guardian | Integrity |
| SC08-008 | **Dr. Amanda Foster** | Security Paranoid (SC) | Challenge security |

---

## Key Questions

1. What PII might appear in logs?
2. How do we redact PII automatically?
3. What audit logs are required?
4. What retention policies apply?
5. Who should have access to what data?
6. How do we prevent secret leakage?

---

## Compliance Requirements

| Regulation | Requirement | Impact |
|------------|-------------|--------|
| GDPR | Right to erasure | Retention policies |
| GDPR | Data minimization | Log content |
| CCPA | Consumer rights | Access controls |
| SOC2 | Audit trails | Audit logging |
| PCI-DSS | Card data protection | PII redaction |

---

## Deliverables

- PII classification guide
- Redaction patterns
- Audit log schema
- Retention policy document
- Access control matrix

---

*"Security is not optional; compliance is not negotiable."*

