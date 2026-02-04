# JavaScript/TypeScript-Specific Layer

> **Extends**: Shared Clean Code Rubric  
> **Languages**: JavaScript, TypeScript  
> **Reviewer**: S002 - JavaScript Idioms Reviewer

---

## Overview

This layer extends the shared rubric with JavaScript and TypeScript-specific checks. These checks address async patterns, module structure, type usage, and modern JS idioms.

---

## 1. Async/Await Correctness

### Good Patterns

```javascript
// Proper error handling
async function fetchUser(id) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserFetchError(`Failed to fetch user ${id}`, { cause: error });
  }
}

// Parallel execution when possible
async function fetchAllData(userId) {
  const [user, orders, preferences] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchPreferences(userId),
  ]);
  return { user, orders, preferences };
}

// Proper promise handling
async function loadData() {
  try {
    const data = await fetchData();
    process(data);
  } catch (error) {
    handleError(error);
  }
}
```

### Bad Patterns

```javascript
// Floating promise (no await, no catch)
function loadData() {
  fetchData().then(data => process(data));  // Unhandled rejection!
}

// Sequential when parallel is possible
async function fetchAllData(userId) {
  const user = await fetchUser(userId);        // Waits...
  const orders = await fetchOrders(userId);    // Then waits...
  const prefs = await fetchPreferences(userId); // Then waits...
  return { user, orders, prefs };
}

// Unnecessary async
async function add(a, b) {  // No await inside!
  return a + b;
}

// Silent error swallowing
async function fetchUser(id) {
  try {
    return await api.get(`/users/${id}`);
  } catch (error) {
    console.log(error);  // Logged but not handled!
    return null;         // Caller doesn't know there was an error
  }
}
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Floating promise (unhandled rejection) | Must Fix |
| Silent error swallowing | Must Fix |
| Sequential awaits when parallel works | Should Fix |
| Unnecessary async | Nice to Have |

---

## 2. Error Propagation

### Good Patterns

```javascript
// Custom error classes
class UserNotFoundError extends Error {
  constructor(userId) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
    this.userId = userId;
  }
}

// Error with context
async function getUser(id) {
  const user = await db.users.findById(id);
  if (!user) {
    throw new UserNotFoundError(id);
  }
  return user;
}

// Error cause chaining (ES2022+)
async function processOrder(orderId) {
  try {
    const order = await fetchOrder(orderId);
    return await processPayment(order);
  } catch (error) {
    throw new OrderProcessingError('Failed to process order', { cause: error });
  }
}

// Boundary error handling
async function handleRequest(req, res) {
  try {
    const result = await processRequest(req);
    res.json(result);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
      logger.error(error);
    }
  }
}
```

### Bad Patterns

```javascript
// Generic errors everywhere
throw new Error('Something went wrong');

// Empty catch
try {
  await riskyOperation();
} catch (error) {
  // Nothing here!
}

// Catching and returning null
async function getUser(id) {
  try {
    return await db.users.findById(id);
  } catch {
    return null;  // Caller can't distinguish "not found" from "error"
  }
}

// Lost error context
try {
  await complexOperation();
} catch (error) {
  throw new Error('Operation failed');  // Original error lost!
}
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Empty catch block | Must Fix |
| Returning null for errors | Must Fix |
| Generic error messages | Should Fix |
| Lost error context | Should Fix |

---

## 3. Modularity

### Good Patterns

```javascript
// Clear module structure
// users/index.js - Public API only
export { createUser } from './createUser';
export { getUser } from './getUser';
export { updateUser } from './updateUser';

// users/createUser.js - Implementation
import { validateUserParams } from './internal/validation';
import { hashPassword } from './internal/security';

export async function createUser(params) {
  const validated = validateUserParams(params);
  const hashedPassword = await hashPassword(validated.password);
  // ...
}

// users/internal/validation.js - Not exported from index
export function validateUserParams(params) {
  // ...
}
```

### Bad Patterns

```javascript
// Fat index file with logic
// users/index.js
export function createUser(params) {
  // 50 lines of logic here
}
export function getUser(id) {
  // 30 lines of logic here
}

// Circular dependency
// users.js
import { getOrdersForUser } from './orders';
export function getUser(id) { ... }

// orders.js
import { getUser } from './users';  // Circular!
export function getOrdersForUser(userId) {
  const user = getUser(userId);
  // ...
}

// Everything as named exports (no clear primary)
export const createUser = () => {};
export const getUser = () => {};
export const updateUser = () => {};
export const deleteUser = () => {};
export const validateUser = () => {};  // Should this be public?
export const hashUserPassword = () => {};  // Should this be public?
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Circular dependency | Must Fix |
| Logic in index files | Should Fix |
| No clear public API | Should Fix |

---

## 4. TypeScript Type Usage

### Good Patterns

```typescript
// Discriminated unions
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function processResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;  // TypeScript knows data exists
  }
  throw new Error(result.error);
}

// Proper generics
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// Type guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

// Branded types for domain concepts
type UserId = string & { readonly brand: unique symbol };
function createUserId(id: string): UserId {
  return id as UserId;
}
```

### Bad Patterns

```typescript
// any everywhere
function processData(data: any): any {
  return data.something;  // No type safety!
}

// Type assertions instead of proper types
function getUser(response: unknown) {
  return (response as { data: User }).data;  // Unsafe!
}

// Overly complex generics
type ComplexType<T, U, V extends keyof T, W extends U[V]> = ...  // Hard to understand

// Ignoring type errors
// @ts-ignore
const value = unsafeOperation();
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| `any` without justification | Should Fix |
| Type assertions hiding errors | Should Fix |
| `@ts-ignore` without explanation | Should Fix |
| Overly complex generics | Nice to Have |

---

## 5. Side Effects

### Good Patterns

```javascript
// Pure function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Side effect clearly named
async function saveOrderAndNotify(order) {
  await saveOrder(order);
  await sendNotification(order.userId, 'Order placed');
}

// Side effects at boundaries
async function handleCreateOrder(req, res) {
  const order = createOrder(req.body);  // Pure
  await saveOrder(order);               // Side effect
  await sendNotification(order);        // Side effect
  res.json(order);                      // Side effect
}
```

### Bad Patterns

```javascript
// Hidden side effect
function getTotal(items) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  analytics.track('total_calculated', { total });  // Hidden!
  return total;
}

// Mutation in unexpected place
function formatUser(user) {
  user.name = user.name.trim();  // Mutates input!
  return user;
}

// Global state modification
let currentUser = null;
function setUser(user) {
  currentUser = user;  // Global state!
}
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Hidden side effects in "getter" functions | Must Fix |
| Unexpected input mutation | Must Fix |
| Global state modification | Should Fix |

---

## 6. Naming Conventions

### Conventions

| Convention | Example | Notes |
|------------|---------|-------|
| `is/has/can/should` | `isValid`, `hasPermission` | Boolean values/functions |
| `handle/on` | `handleClick`, `onSubmit` | Event handlers |
| PascalCase | `UserService`, `UserProfile` | Classes, components |
| camelCase | `getUserById`, `userName` | Functions, variables |
| SCREAMING_SNAKE | `MAX_RETRIES`, `API_URL` | Constants |

### Good Patterns

```javascript
// Boolean naming
const isLoading = true;
const hasPermission = checkPermission(user);
function canEdit(user, document) { ... }

// Event handlers
function handleClick(event) { ... }
function onSubmit(formData) { ... }

// Classes and components
class UserService { ... }
function UserProfile({ user }) { ... }

// Constants
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
```

### Bad Patterns

```javascript
// Missing boolean prefix
const loading = true;        // Should be isLoading
const permission = check();  // Should be hasPermission

// Inconsistent handler naming
function clickHandler() { ... }  // Should be handleClick
function submitForm() { ... }    // Should be handleSubmit or onSubmit

// Wrong case
const UserName = 'John';     // Should be userName (variable)
function GetUser() { ... }   // Should be getUser (function)
```

### Severity Guide

| Issue | Severity |
|-------|----------|
| Misleading name | Must Fix |
| Missing boolean prefix | Should Fix |
| Wrong case convention | Should Fix |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT/TYPESCRIPT LAYER                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ASYNC/AWAIT                                                     │
│  □ No floating promises                                          │
│  □ Errors caught in async functions                              │
│  □ Parallel execution when possible                              │
│  □ Only async when needed                                        │
│                                                                  │
│  ERROR PROPAGATION                                               │
│  □ Custom error classes for domain errors                        │
│  □ No empty catch blocks                                         │
│  □ Error context preserved                                       │
│  □ Errors handled at boundaries                                  │
│                                                                  │
│  MODULARITY                                                      │
│  □ Clear public API in index files                               │
│  □ No circular dependencies                                      │
│  □ Logic in dedicated files, not index                           │
│                                                                  │
│  TYPESCRIPT TYPES                                                │
│  □ No any without justification                                  │
│  □ Discriminated unions for variants                             │
│  □ Type guards over assertions                                   │
│                                                                  │
│  SIDE EFFECTS                                                    │
│  □ Pure functions preferred                                      │
│  □ Side effects named clearly                                    │
│  □ No hidden mutations                                           │
│                                                                  │
│  NAMING                                                          │
│  □ is/has/can for booleans                                       │
│  □ handle/on for events                                          │
│  □ Correct case conventions                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*"Modern JavaScript is powerful when you embrace its async nature and module system."*
