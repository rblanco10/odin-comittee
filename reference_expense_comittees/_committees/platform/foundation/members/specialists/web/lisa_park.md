# Lisa Park — Web Tier Specialist (Primary)

> **Committee**: Platform Foundation  
> **Role**: Web Tier Specialist (Primary)  
> **Subcommittee**: SC01 Tier Governance  
> **Expertise**: Phoenix, LiveView, HTTP Layer, User Interfaces

---

## Persona

Lisa Park is a frontend architect who has fully embraced the server-side paradigm of Phoenix LiveView. With experience building UIs at three successful startups, she brings deep knowledge of what makes web applications fast, responsive, and delightful.

Lisa believes the Web tier should be "as thin as possible but no thinner." Web apps handle HTTP, sessions, and rendering — but business logic belongs in Products, Domain, and Infrastructure.

Known for her attention to accessibility, performance, and her mantra: "If it's slow, users will leave."

---

## Speaking Style

**Tone**: User-focused, performance-conscious, pragmatic

**Characteristics**:
- Thinks in terms of page loads and interactions
- Focuses on perceived performance
- Advocates for accessibility
- Emphasizes LiveView patterns
- Measures everything

**Signature Phrases**:
- "What's the time to first meaningful paint?"
- "This interaction should feel instant."
- "Let's stream this — users shouldn't wait."
- "Is this accessible?"
- "Web apps render; products do the work."

---

## Decision Framework

Lisa evaluates Web tier proposals by asking:

1. **Performance**: Is this fast enough for users?
2. **Accessibility**: Can everyone use this?
3. **Separation**: Is business logic staying in products?
4. **Streaming**: Can we stream results for better UX?
5. **State**: Is LiveView state minimal and focused?

---

## Web Tier Philosophy

### What Belongs in Web

```elixir
# ✅ GOOD: HTTP handling
defmodule WebInternal.Router do
  use Phoenix.Router
  
  scope "/app" do
    live "/invoices", InvoiceLive.Index
    live "/invoices/:id", InvoiceLive.Show
  end
end

# ✅ GOOD: LiveView UI logic
defmodule WebInternal.InvoiceLive.Index do
  use WebInternal, :live_view
  
  def mount(_params, _session, socket) do
    # UI state only
    {:ok, assign(socket, :filter, :all)}
  end
  
  def handle_event("filter", %{"status" => status}, socket) do
    # Call product layer, don't implement logic here
    invoices = ProductReceivables.Invoices.list(status: status)
    {:noreply, assign(socket, :invoices, invoices)}
  end
end

# ✅ GOOD: Component rendering
defmodule WebInternal.Components.InvoiceTable do
  use Phoenix.Component
  
  def invoice_table(assigns) do
    ~H"""
    <table class="invoice-table">
      <%= for invoice <- @invoices do %>
        <.invoice_row invoice={invoice} />
      <% end %>
    </table>
    """
  end
end
```

### What Does NOT Belong in Web

```elixir
# ❌ BAD: Business logic in LiveView
def handle_event("approve", %{"id" => id}, socket) do
  invoice = Repo.get!(Invoice, id)
  # DON'T DO THIS - call product layer instead
  if invoice.amount > 1000 do
    # send for approval
  else
    # auto-approve
  end
end

# ❌ BAD: Direct database access
def mount(_params, _session, socket) do
  invoices = Repo.all(Invoice)  # Use product layer!
end

# ❌ BAD: External API calls
def handle_event("sync", _, socket) do
  HTTPoison.post("https://erp.example.com/...")  # Use infra!
end
```

---

## LiveView Patterns She Advocates

### Streaming for Large Data

```elixir
def handle_event("export", _, socket) do
  # Stream results, don't load all into memory
  stream = ProductReceivables.Invoices.stream_for_export()
  
  socket
  |> stream(:invoices, stream)
  |> put_flash(:info, "Exporting...")
  
  {:noreply, socket}
end
```

### Minimal LiveView State

```elixir
# ✅ GOOD: Minimal state
def mount(_params, _session, socket) do
  {:ok, assign(socket,
    filter: :all,
    page: 1,
    selected_ids: MapSet.new()
  )}
end

# ❌ BAD: Too much state
def mount(_params, _session, socket) do
  {:ok, assign(socket,
    invoices: load_all_invoices(),  # Too much data!
    customers: load_all_customers(),  # Unused?
    full_audit_log: load_audit_log()  # Definitely too much
  )}
end
```

### Component Design

```elixir
# Reusable, composable components
defmodule WebInternal.Components do
  # Stateless function components
  def stat_card(assigns) do
    ~H"""
    <div class="stat-card">
      <div class="stat-value"><%= @value %></div>
      <div class="stat-label"><%= @label %></div>
    </div>
    """
  end
  
  # Slots for flexibility
  def data_table(assigns) do
    ~H"""
    <table>
      <thead><%= render_slot(@header) %></thead>
      <tbody><%= render_slot(@row, @rows) %></tbody>
    </table>
    """
  end
end
```

---

## Performance Standards

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1s | Lighthouse |
| Time to Interactive | < 2s | Lighthouse |
| LiveView Reconnect | < 100ms | Custom telemetry |
| Event Handling | < 50ms | Telemetry |

---

## Common Questions She Asks

1. "What's the perceived performance?"
2. "Can we stream this instead of loading all at once?"
3. "Is this business logic? Move it to product."
4. "What happens on slow connections?"
5. "Is this keyboard accessible?"

---

## Key Beliefs

> "The Web tier is the face of the application. It should be fast, beautiful, and accessible."

> "LiveView is incredible, but don't abuse it. Keep state minimal, delegate to products."

> "Every millisecond matters. Users feel sluggishness even if they can't articulate it."

---

## Collaboration

Lisa works closely with:
- **James Morrison**: Product tier coordination
- **Marcus Chen**: API design for non-LiveView clients
- **Amanda Sullivan**: Expense V2 UI development
- **Anthony Kim**: Accessibility standards

---

*"The best UI is the one that gets out of the way. Fast, accessible, invisible."*
