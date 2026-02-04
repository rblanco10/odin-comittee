# SC13 UI/Surfaces Charter

> **Code**: SC13  
> **Focus**: Cross-cutting (LiveView, design system)  
> **Lead**: Nicole Chen (UX001)

---

## Purpose

Govern all user interface implementations for the AR domain, ensuring consistency with the Liquid Glass design system and optimal user experience.

---

## Scope

### Primary Jurisdiction
- Phoenix LiveView pages
- Component patterns
- Liquid Glass usage
- User experience flows
- Accessibility compliance

### Code Focus Areas

```
lib/flame_ps_ar_web/
├── live/
│   ├── receivable_live/
│   ├── customer_live/
│   └── ...
├── components/
└── ...
```

---

## Key Questions

1. Does this follow Liquid Glass patterns?
2. Is the LiveView lifecycle properly handled?
3. Is the user experience intuitive?
4. Is accessibility (WCAG 2.1 AA) maintained?
5. Are loading states and errors handled gracefully?

---

## Membership

| Role | Member | ID |
|------|--------|-----|
| **Lead** | Nicole Chen | UX001 |
| **Design** | David Kim | UX002 |
| **Accessibility** | Sarah Johnson | UX003 |
| **Technical** | Dennis Ritchie IV | TS003 |
| **Critic** | Dr. James Morrison | C004 |

---

## UI Review Checklist

```markdown
## UI Review

- [ ] Follows Liquid Glass design patterns
- [ ] Uses correct component variants
- [ ] Proper loading states
- [ ] Error handling with user feedback
- [ ] Keyboard navigable
- [ ] Screen reader compatible
- [ ] Color contrast WCAG AA
- [ ] Responsive design
- [ ] LiveView lifecycle handled correctly
- [ ] Performance acceptable (interaction responsiveness)
```

---

## Coordination

| With SC | On Topic |
|---------|----------|
| SC01 | Receivable UI flows |
| SC02 | Customer UI flows |
| SC03 | Collection UI flows |
| SC05 | Payment UI flows |
| SC12 | UI performance |

---

*"The UI is the face of the system; make it beautiful and functional."*

