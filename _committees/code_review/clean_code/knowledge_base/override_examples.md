# Override Examples

> **Purpose**: Document when and how language specialists override universal findings

---

## Override Authority

| Member | Can Override | Condition |
|--------|--------------|-----------|
| 💜 Elixir Idioms Reviewer | Universal reviewers | When Elixir idiom clearly applies |
| 💛 JavaScript Idioms Reviewer | Universal reviewers | When JS/TS idiom clearly applies |
| ⚖️ Pragmatism Critic | Any finding | When change provides negligible benefit |
| 🔗 Consistency Critic | Any finding | When suggestion contradicts codebase patterns |

---

## Override Documentation Format

```markdown
**Override Applied**

| | |
|-|-|
| Original Finding | [What universal reviewer said] |
| Override By | [Who overrode] |
| New Recommendation | [What we're recommending instead] |
| Reason | [Why the override applies] |
```

---

## 💜 Elixir Override Examples

### Override: "Extract Duplicated Code"

**Original Finding** (🔄 Duplication Reviewer):
> These three function clauses have similar bodies. Extract common logic to reduce duplication.

```elixir
def process(%User{role: :admin} = user), do: admin_flow(user)
def process(%User{role: :manager} = user), do: manager_flow(user)
def process(%User{role: :employee} = user), do: employee_flow(user)
```

**Override** (💜 Elixir Idioms Reviewer):
> Keep the pattern matching clauses separate.

**Reason**: In Elixir, explicit pattern matching clauses are clearer than abstracted logic. Each clause handles a distinct case, and the "duplication" makes the control flow obvious. This is idiomatic Elixir - the pattern matching IS the abstraction.

---

### Override: "Function Too Long"

**Original Finding** (📐 Function & Complexity Reviewer):
> This function is 35 lines. Consider splitting into smaller functions.

```elixir
def create_order(params) do
  with {:ok, validated} <- validate_params(params),
       {:ok, user} <- fetch_user(validated.user_id),
       {:ok, items} <- fetch_items(validated.item_ids),
       {:ok, totals} <- calculate_totals(items),
       {:ok, order} <- build_order(user, items, totals),
       {:ok, saved} <- save_order(order),
       {:ok, _} <- send_confirmation(saved) do
    {:ok, saved}
  else
    {:error, :invalid_params} -> {:error, "Invalid order parameters"}
    {:error, :user_not_found} -> {:error, "User not found"}
    {:error, :items_not_found} -> {:error, "Some items not found"}
    {:error, reason} -> {:error, "Order creation failed: #{inspect(reason)}"}
  end
end
```

**Override** (💜 Elixir Idioms Reviewer):
> Keep as single `with` block.

**Reason**: This is a `with` block handling a multi-step workflow. The linear structure clearly shows the happy path and all error cases in one place. Splitting would require passing intermediate results between functions, making the flow harder to follow. This is idiomatic Elixir for orchestrating multiple operations.

---

### Override: "Too Many Arguments"

**Original Finding** (📐 Function & Complexity Reviewer):
> This function has 4 arguments. Consider using an options map.

```elixir
def reduce_items(items, initial, acc_fn, transform_fn) do
  Enum.reduce(items, initial, fn item, acc ->
    acc_fn.(transform_fn.(item), acc)
  end)
end
```

**Override** (💜 Elixir Idioms Reviewer):
> Keep separate arguments.

**Reason**: This follows the standard `Enum.reduce/3` callback pattern. The arity is dictated by functional programming conventions. Using a map would fight the standard library patterns and make the function harder to compose with other Enum functions.

---

### Override: "Use Early Returns"

**Original Finding** (📐 Function & Complexity Reviewer):
> Use early returns to reduce nesting.

```elixir
def process(user) do
  if valid?(user) do
    if active?(user) do
      do_process(user)
    else
      {:error, :inactive}
    end
  else
    {:error, :invalid}
  end
end
```

**Override** (💜 Elixir Idioms Reviewer):
> Use pattern matching or `with` instead of early returns.

**New Recommendation**:
```elixir
def process(user) do
  with :ok <- validate(user),
       :ok <- check_active(user) do
    do_process(user)
  end
end

defp validate(user), do: if(valid?(user), do: :ok, else: {:error, :invalid})
defp check_active(user), do: if(active?(user), do: :ok, else: {:error, :inactive})
```

**Reason**: Elixir doesn't have early returns. The idiomatic approach is `with` blocks or pattern matching, not trying to simulate imperative early returns.

---

## 💛 JavaScript Override Examples

### Override: "Function Too Long"

**Original Finding** (📐 Function & Complexity Reviewer):
> This async function is 40 lines. Consider splitting.

```javascript
async function processOrder(orderId) {
  const order = await fetchOrder(orderId);
  if (!order) throw new OrderNotFoundError(orderId);
  
  const user = await fetchUser(order.userId);
  if (!user) throw new UserNotFoundError(order.userId);
  
  const items = await fetchItems(order.itemIds);
  const availableItems = items.filter(item => item.inStock);
  
  if (availableItems.length !== items.length) {
    await notifyOutOfStock(order, items.filter(i => !i.inStock));
  }
  
  const totals = calculateTotals(availableItems);
  const payment = await processPayment(user, totals);
  
  if (!payment.success) {
    await handleFailedPayment(order, payment);
    throw new PaymentFailedError(payment.error);
  }
  
  const savedOrder = await saveOrder({ ...order, status: 'completed', payment });
  await sendConfirmation(user, savedOrder);
  
  return savedOrder;
}
```

**Override** (💛 JavaScript Idioms Reviewer):
> Keep as single async function.

**Reason**: This is a sequential async workflow where each step depends on the previous. The linear async/await structure clearly shows the order of operations. Splitting would require awkward parameter passing between functions and make the flow harder to follow. The function is long but straightforward.

---

### Override: "Too Complex Type"

**Original Finding** (📐 Function & Complexity Reviewer):
> This type definition is complex. Simplify.

```typescript
type ApiResponse<T> = 
  | { status: 'success'; data: T; meta: ResponseMeta }
  | { status: 'error'; error: ApiError; meta: ResponseMeta }
  | { status: 'loading' }
  | { status: 'idle' };
```

**Override** (💛 JavaScript Idioms Reviewer):
> Keep the discriminated union.

**Reason**: This TypeScript discriminated union properly models all possible states of an API response. The "complexity" is actually type safety - TypeScript will ensure all cases are handled. Simplifying would lose this safety. This is idiomatic TypeScript for state modeling.

---

### Override: "Extract Similar Components"

**Original Finding** (🔄 Duplication Reviewer):
> These React components have similar structure. Extract common component.

```jsx
function UserCard({ user }) {
  return (
    <Card>
      <Avatar src={user.avatar} />
      <Name>{user.name}</Name>
      <Role>{user.role}</Role>
      <Actions>
        <EditButton onClick={() => editUser(user.id)} />
        <DeleteButton onClick={() => deleteUser(user.id)} />
      </Actions>
    </Card>
  );
}

function ProductCard({ product }) {
  return (
    <Card>
      <Image src={product.image} />
      <Name>{product.name}</Name>
      <Price>{product.price}</Price>
      <Actions>
        <EditButton onClick={() => editProduct(product.id)} />
        <DeleteButton onClick={() => deleteProduct(product.id)} />
      </Actions>
    </Card>
  );
}
```

**Override** (💛 JavaScript Idioms Reviewer):
> Keep components separate.

**Reason**: These components serve different domains (users vs products) and will likely evolve independently. Premature abstraction of React components often leads to:
- Prop explosion (`<GenericCard type="user" showAvatar showPrice ... />`)
- Conditional rendering complexity
- Harder maintenance when requirements diverge

The duplication is acceptable here.

---

## ⚖️ Pragmatism Critic Override Examples

### Override: "Marginal Improvement"

**Original Finding** (🏷️ Naming Reviewer):
> Rename `getData` to `fetchUserProfileData`.

**Override** (⚖️ Pragmatism Critic):
> Downgrade to Nice to Have or remove.

**Reason**: The function is in `UserProfileService.js` and only called from `UserProfile.jsx`. In context, `getData` is clear enough. The longer name adds 15 characters for marginal clarity. This is a valid suggestion but not worth the churn.

---

### Override: "Over-Abstraction"

**Original Finding** (🔄 Duplication Reviewer):
> Extract these 3 similar API calls into a generic fetcher.

**Override** (⚖️ Pragmatism Critic):
> Remove finding.

**Reason**: The current code is 15 lines total across 3 functions. The suggested abstraction would be 25 lines plus configuration. We're adding complexity, not removing it. These endpoints may also need different error handling in the future.

---

## 🔗 Consistency Critic Override Examples

### Override: "Pattern Inconsistency"

**Original Finding** (📐 Function & Complexity Reviewer):
> Use early returns to reduce nesting.

**Override** (🔗 Consistency Critic):
> Remove finding - maintain codebase consistency.

**Reason**: The codebase consistently uses if/else blocks (47 occurrences). Introducing early returns here creates inconsistency. If we want to adopt early returns, we should do it project-wide, not one function at a time.

---

### Override: "New Pattern Without Migration"

**Original Finding** (🚨 Error Handling Reviewer):
> Use discriminated union Result type instead of throwing.

**Override** (🔗 Consistency Critic):
> Remove finding or establish as new standard.

**Reason**: The codebase uses throw/catch for error handling (89 occurrences). Introducing Result types in one place while keeping throw/catch elsewhere creates two patterns for the same thing. Either:
1. Remove this finding and use throw/catch
2. Establish Result types as the new standard with migration plan

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    OVERRIDE QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  💜 ELIXIR SPECIALIST OVERRIDES WHEN:                            │
│  - Pattern matching is clearer than abstraction                  │
│  - with blocks are appropriate despite length                    │
│  - Functional patterns don't match OOP suggestions               │
│  - Elixir conventions differ from general advice                 │
│                                                                  │
│  💛 JAVASCRIPT SPECIALIST OVERRIDES WHEN:                        │
│  - Async flow is clearer as single function                      │
│  - TypeScript types provide safety despite complexity            │
│  - React patterns differ from general component advice           │
│  - JS module patterns don't match general suggestions            │
│                                                                  │
│  ⚖️ PRAGMATISM CRITIC OVERRIDES WHEN:                            │
│  - Change provides negligible benefit                            │
│  - Abstraction adds more complexity than it removes              │
│  - Effort exceeds value                                          │
│                                                                  │
│  🔗 CONSISTENCY CRITIC OVERRIDES WHEN:                           │
│  - Suggestion contradicts established patterns                   │
│  - New pattern without migration plan                            │
│  - Personal preference vs team convention                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*"Overrides exist to ensure language idioms and practical concerns trump theoretical purity."*
