# Bridge Implementation Specification

> **Session:** SC-2025-12-22-002
> **Date:** 2025-12-22
> **Status:** READY FOR IMPLEMENTATION

---

## Overview

This document contains the complete implementation specification for the Bridge system.

---

## 1. BridgeWorker

**File:** `lib/flame_teampay_payables/ember_bridge/workers/bridge_worker.ex`

```elixir
defmodule FlameTeampayPayables.EmberBridge.Workers.BridgeWorker do
  @moduledoc """
  Oban worker that triggers BridgeReactor across all workspaces.
  
  Runs every 2 minutes. Finds all ERP mirror records that need bridging
  (bridged_at IS NULL OR updated_at > bridged_at) and creates/updates
  corresponding CodingCategory/CodingValue records.
  
  ## Design Principles
  
  - Completely decoupled from sync
  - Cross-workspace (no per-workspace overhead)
  - Cursor-based (bridged_at per record)
  - Each entity type is a separate step with compensation
  """

  use Oban.Worker,
    queue: :bridge,
    max_attempts: 3,
    priority: 2

  require Logger

  alias FlameTeampayPayables.EmberBridge.Reactors.BridgeReactor
  alias FlameTeampayPayables.EmberErp.Observability.Services.{
    TempoTracingService,
    LokiLoggingService,
    PrometheusMetricsService
  }

  @impl Oban.Worker
  def perform(%Oban.Job{} = _job) do
    Logger.info("[BridgeWorker] Starting cross-workspace bridge run")
    
    start_time = System.monotonic_time(:millisecond)

    TempoTracingService.with_span("bridge.run", [], fn ->
      case BridgeReactor.run(%{}) do
        {:ok, stats} ->
          duration = System.monotonic_time(:millisecond) - start_time
          
          Logger.info("[BridgeWorker] Completed successfully",
            total_bridged: stats.total_bridged,
            departments: stats.departments,
            locations: stats.locations,
            classes: stats.classes,
            projects: stats.projects,
            gl_accounts: stats.gl_accounts,
            jobs: stats.jobs,
            expense_categories: stats.expense_categories,
            custom_dimensions: stats.custom_dimensions,
            duration_ms: duration
          )
          
          # Emit metrics
          PrometheusMetricsService.emit_counter("bridge_runs_total", 1, %{status: "success"})
          PrometheusMetricsService.emit_histogram("bridge_duration_ms", duration)
          PrometheusMetricsService.emit_gauge("bridge_records_processed", stats.total_bridged)
          
          # Structured logging
          LokiLoggingService.log_event("bridge_complete", %{
            total_bridged: stats.total_bridged,
            duration_ms: duration,
            stats: stats
          })
          
          :ok

        {:error, reason} ->
          duration = System.monotonic_time(:millisecond) - start_time
          
          Logger.error("[BridgeWorker] Failed",
            error: inspect(reason),
            duration_ms: duration
          )
          
          PrometheusMetricsService.emit_counter("bridge_runs_total", 1, %{status: "failure"})
          
          {:error, reason}
      end
    end)
  end
end
```

---

## 2. BridgeReactor

**File:** `lib/flame_teampay_payables/ember_bridge/reactors/bridge_reactor.ex`

```elixir
defmodule FlameTeampayPayables.EmberBridge.Reactors.BridgeReactor do
  @moduledoc """
  Cross-workspace reactor that bridges ERP mirror records to CodingCategory/CodingValue.
  
  Each step:
  1. Queries records WHERE bridged_at IS NULL OR updated_at > bridged_at
  2. Calls DimensionBridgeService to create/update business layer records
  3. Updates bridged_at on successful records
  
  Steps are independent — failure in one does not block others.
  """

  use Reactor, extensions: [Ash.Reactor]

  require Logger

  alias FlameTeampayPayables.EmberBridge.Services.DimensionBridgeService
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.Core.{
    Department, Location, Class, Project, GLAccount, Job
  }
  alias FlameTeampayPayables.EmberErp.Resources.Accounting.Expense.ExpenseCategory

  # ============================================
  # STEP 1: Bridge Departments
  # ============================================
  step :bridge_departments do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging departments")
      
      case DimensionBridgeService.bridge_entity_type(Department, :department, "DEPARTMENT", "Department") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:departments_failed, reason}}
      end
    end

    compensate fn {:departments_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Departments step failed, continuing", error: inspect(reason))
      :ok  # Don't fail the whole reactor
    end
  end

  # ============================================
  # STEP 2: Bridge Locations
  # ============================================
  step :bridge_locations do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging locations")
      
      case DimensionBridgeService.bridge_entity_type(Location, :location, "LOCATION", "Location") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:locations_failed, reason}}
      end
    end

    compensate fn {:locations_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Locations step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 3: Bridge Classes
  # ============================================
  step :bridge_classes do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging classes")
      
      case DimensionBridgeService.bridge_entity_type(Class, :class, "CLASS", "Class") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:classes_failed, reason}}
      end
    end

    compensate fn {:classes_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Classes step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 4: Bridge Projects
  # ============================================
  step :bridge_projects do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging projects")
      
      case DimensionBridgeService.bridge_entity_type(Project, :project, "PROJECT", "Project") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:projects_failed, reason}}
      end
    end

    compensate fn {:projects_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Projects step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 5: Bridge GL Accounts
  # ============================================
  step :bridge_gl_accounts do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging GL accounts")
      
      case DimensionBridgeService.bridge_entity_type(GLAccount, :gl_account, "GL-ACCOUNT", "GL Account") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:gl_accounts_failed, reason}}
      end
    end

    compensate fn {:gl_accounts_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] GL Accounts step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 6: Bridge Jobs
  # ============================================
  step :bridge_jobs do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging jobs")
      
      case DimensionBridgeService.bridge_entity_type(Job, :job, "JOB", "Job") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:jobs_failed, reason}}
      end
    end

    compensate fn {:jobs_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Jobs step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 7: Bridge Expense Categories
  # ============================================
  step :bridge_expense_categories do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging expense categories")
      
      case DimensionBridgeService.bridge_entity_type(ExpenseCategory, :expense_category, "CATEGORY", "Expense Category") do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:expense_categories_failed, reason}}
      end
    end

    compensate fn {:expense_categories_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Expense Categories step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # STEP 8: Bridge Custom Dimensions
  # ============================================
  step :bridge_custom_dimensions do
    run fn _args, _context ->
      Logger.info("[BridgeReactor] Bridging custom dimensions")
      
      case DimensionBridgeService.bridge_custom_dimensions() do
        {:ok, count} -> {:ok, count}
        {:error, reason} -> {:error, {:custom_dimensions_failed, reason}}
      end
    end

    compensate fn {:custom_dimensions_failed, reason}, _args, _context ->
      Logger.warning("[BridgeReactor] Custom Dimensions step failed, continuing", error: inspect(reason))
      :ok
    end
  end

  # ============================================
  # FINAL: Aggregate Results
  # ============================================
  step :aggregate_results do
    argument :departments, result(:bridge_departments)
    argument :locations, result(:bridge_locations)
    argument :classes, result(:bridge_classes)
    argument :projects, result(:bridge_projects)
    argument :gl_accounts, result(:bridge_gl_accounts)
    argument :jobs, result(:bridge_jobs)
    argument :expense_categories, result(:bridge_expense_categories)
    argument :custom_dimensions, result(:bridge_custom_dimensions)

    run fn args, _context ->
      stats = %{
        departments: args[:departments] || 0,
        locations: args[:locations] || 0,
        classes: args[:classes] || 0,
        projects: args[:projects] || 0,
        gl_accounts: args[:gl_accounts] || 0,
        jobs: args[:jobs] || 0,
        expense_categories: args[:expense_categories] || 0,
        custom_dimensions: args[:custom_dimensions] || 0,
        total_bridged: Enum.sum([
          args[:departments] || 0,
          args[:locations] || 0,
          args[:classes] || 0,
          args[:projects] || 0,
          args[:gl_accounts] || 0,
          args[:jobs] || 0,
          args[:expense_categories] || 0,
          args[:custom_dimensions] || 0
        ])
      }

      {:ok, stats}
    end
  end

  return :aggregate_results
end
```

---

## 3. DimensionBridgeService

**File:** `lib/flame_teampay_payables/ember_bridge/services/dimension_bridge_service.ex`

```elixir
defmodule FlameTeampayPayables.EmberBridge.Services.DimensionBridgeService do
  @moduledoc """
  Core service for bridging ERP mirror records to CodingCategory/CodingValue.
  
  ## Design Principles
  
  - Streaming: Processes records in batches to avoid memory bloat
  - Resilient: Individual record failures don't stop the batch
  - Workspace-aware: Propagates NULL entity_id correctly for workspace-wide dimensions
  
  ## Bridging Logic
  
  For each ERP mirror record:
  1. Ensure CodingCategory exists (by workspace + entity + code)
  2. Upsert CodingValue (by external_id)
  3. Link mirror → CodingValue (bidirectional)
  4. Set bridged_at = now()
  """

  require Logger
  require Ash.Query
  import Ash.Expr

  alias FlameTeampayPayables.EmberCoding.Definitions.Resources.{CodingCategory, CodingValue}

  @batch_size 100

  # ============================================================================
  # Configuration per entity type
  # ============================================================================

  @dimension_configs %{
    department: %{
      code_field: :department_code,
      name_field: :department_name,
      parent_code_field: :parent_department_code,
      active_field: :active,
      description_field: :description
    },
    location: %{
      code_field: :location_code,
      name_field: :location_name,
      parent_code_field: :parent_location_code,
      active_field: :active,
      description_field: :description
    },
    class: %{
      code_field: :class_code,
      name_field: :class_name,
      parent_code_field: :parent_class_code,
      active_field: :active,
      description_field: :description
    },
    project: %{
      code_field: :project_code,
      name_field: :name,
      parent_code_field: :parent_id,
      active_field: :status,
      description_field: :description
    },
    gl_account: %{
      code_field: :account_code,
      name_field: :account_name,
      parent_code_field: :parent_account_code,
      active_field: :active,
      description_field: nil
    },
    job: %{
      code_field: :job_code,
      name_field: :name,
      parent_code_field: :parent_job_id,
      active_field: :status,
      description_field: :description
    },
    expense_category: %{
      code_field: :category_code,
      name_field: :category_name,
      parent_code_field: :parent_category_code,
      active_field: :active,
      description_field: :description
    }
  }

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Bridge all records of a given entity type that need bridging.
  
  Returns {:ok, count} with number of records bridged.
  """
  def bridge_entity_type(resource, type_atom, category_code, category_name) do
    config = Map.fetch!(@dimension_configs, type_atom)
    
    # Query records needing bridging (cross-workspace, no tenant filter)
    records = query_needs_bridging(resource)
    
    Logger.info("[DimensionBridgeService] Found #{length(records)} #{type_atom} records to bridge")
    
    # Process in batches
    bridged_count = 
      records
      |> Enum.chunk_every(@batch_size)
      |> Enum.reduce(0, fn batch, acc ->
        count = bridge_batch(batch, type_atom, category_code, category_name, config)
        acc + count
      end)
    
    {:ok, bridged_count}
  rescue
    e ->
      Logger.error("[DimensionBridgeService] Failed to bridge #{type_atom}", 
        error: Exception.message(e),
        stacktrace: Exception.format_stacktrace(__STACKTRACE__)
      )
      {:error, e}
  end

  @doc """
  Bridge custom dimensions (UDDs) - these have dynamic category codes.
  """
  def bridge_custom_dimensions do
    alias FlameTeampayPayables.EmberErp.Resources.Accounting.Core.CustomDimensionValue
    
    records = query_needs_bridging(CustomDimensionValue)
    
    Logger.info("[DimensionBridgeService] Found #{length(records)} custom dimension values to bridge")
    
    # Group by custom_dimension_id to determine category
    bridged_count =
      records
      |> Enum.group_by(& &1.custom_dimension_id)
      |> Enum.reduce(0, fn {custom_dim_id, batch}, acc ->
        count = bridge_custom_dimension_batch(custom_dim_id, batch)
        acc + count
      end)
    
    {:ok, bridged_count}
  rescue
    e ->
      Logger.error("[DimensionBridgeService] Failed to bridge custom dimensions",
        error: Exception.message(e)
      )
      {:error, e}
  end

  # ============================================================================
  # Private: Query Logic
  # ============================================================================

  defp query_needs_bridging(resource) do
    # Cross-workspace query: no tenant filter
    resource
    |> Ash.Query.filter(expr(is_nil(bridged_at) or updated_at > bridged_at))
    |> Ash.Query.limit(10_000)  # Safety limit per run
    |> Ash.read!(authorize?: false)
  end

  # ============================================================================
  # Private: Batch Processing
  # ============================================================================

  defp bridge_batch(records, type_atom, category_code, category_name, config) do
    # Group by workspace + entity for category lookup
    records
    |> Enum.group_by(fn r -> {r.workspace_id, r.entity_id} end)
    |> Enum.reduce(0, fn {{workspace_id, entity_id}, group}, acc ->
      # Ensure category exists for this workspace/entity
      case ensure_category(workspace_id, entity_id, category_code, category_name, type_atom) do
        {:ok, category} ->
          # Bridge each record in the group
          count = bridge_records(group, category, config, type_atom)
          acc + count
          
        {:error, reason} ->
          Logger.warning("[DimensionBridgeService] Failed to ensure category",
            workspace_id: workspace_id,
            entity_id: entity_id,
            category_code: category_code,
            error: inspect(reason)
          )
          acc
      end
    end)
  end

  defp bridge_records(records, category, config, type_atom) do
    # PASS 1: Create/update CodingValues (without parent_id)
    code_to_cv = 
      Enum.reduce(records, %{}, fn record, acc ->
        case upsert_coding_value(record, category, config, type_atom) do
          {:ok, cv} ->
            code = Map.get(record, config.code_field)
            Map.put(acc, code, cv)
            
          {:error, reason} ->
            Logger.warning("[DimensionBridgeService] Failed to upsert coding value",
              record_id: record.id,
              error: inspect(reason)
            )
            acc
        end
      end)
    
    # PASS 2: Resolve hierarchy (set parent_id)
    if config.parent_code_field do
      resolve_hierarchy(records, code_to_cv, config, category.workspace_id)
    end
    
    # PASS 3: Link mirror records and set bridged_at
    Enum.each(records, fn record ->
      code = Map.get(record, config.code_field)
      cv = Map.get(code_to_cv, code)
      
      if cv do
        link_and_mark_bridged(record, cv)
      end
    end)
    
    map_size(code_to_cv)
  end

  # ============================================================================
  # Private: Category Management
  # ============================================================================

  defp ensure_category(workspace_id, entity_id, code, name, _type_atom) do
    # Query for existing category
    # Note: entity_id can be NULL (workspace-wide)
    query = 
      CodingCategory
      |> Ash.Query.filter(expr(code == ^code))
      |> then(fn q ->
        if entity_id do
          Ash.Query.filter(q, expr(entity_id == ^entity_id))
        else
          Ash.Query.filter(q, expr(is_nil(entity_id)))
        end
      end)
    
    case Ash.read_one(query, tenant: workspace_id, authorize?: false) do
      {:ok, nil} ->
        create_category(workspace_id, entity_id, code, name)
        
      {:ok, category} ->
        {:ok, category}
        
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp create_category(workspace_id, entity_id, code, name) do
    params = %{
      workspace_id: workspace_id,
      entity_id: entity_id,  # Can be nil for workspace-wide
      code: code,
      name: name,
      description: "Synced from ERP",
      is_hierarchical: true,
      source: :erp,
      is_system_managed: true
    }
    # Note: is_required was removed from CodingCategory - required status
    # is determined by DimensionTypeConfig from ERP configuration
    
    CodingCategory
    |> Ash.Changeset.for_create(:create, params)
    |> Ash.create(tenant: workspace_id, authorize?: false)
  end

  # ============================================================================
  # Private: CodingValue Upsert
  # ============================================================================

  defp upsert_coding_value(record, category, config, type_atom) do
    code = Map.get(record, config.code_field) |> sanitize_code()
    name = Map.get(record, config.name_field) |> sanitize_name()
    description = if config.description_field, do: Map.get(record, config.description_field), else: nil
    is_active = get_active_status(record, config.active_field)
    
    params = %{
      workspace_id: record.workspace_id,
      entity_id: record.entity_id,  # Can be nil (workspace-wide)
      dimension_type_id: category.id,
      code: code,
      name: name,
      description: description,
      is_active: is_active,
      external_id: record.external_id,
      external_system: record.erp_system,
      erp_connection_id: record.erp_connection_id,
      last_synced_at: DateTime.utc_now(),
      erp_mirror_type: type_atom,
      erp_mirror_id: record.id,
      source: :erp
    }
    
    CodingValue
    |> Ash.Changeset.for_create(:upsert_from_erp, params)
    |> Ash.create(tenant: record.workspace_id, authorize?: false)
  end

  # ============================================================================
  # Private: Hierarchy Resolution
  # ============================================================================

  defp resolve_hierarchy(records, code_to_cv, config, workspace_id) do
    Enum.each(records, fn record ->
      parent_code = Map.get(record, config.parent_code_field)
      
      if parent_code && parent_code != "" do
        code = Map.get(record, config.code_field)
        cv = Map.get(code_to_cv, code)
        parent_cv = Map.get(code_to_cv, parent_code)
        
        if cv && parent_cv && cv.parent_id != parent_cv.id do
          cv
          |> Ash.Changeset.for_update(:set_hierarchy, %{parent_id: parent_cv.id})
          |> Ash.update(tenant: workspace_id, authorize?: false)
        end
      end
    end)
  end

  # ============================================================================
  # Private: Bidirectional Linking
  # ============================================================================

  defp link_and_mark_bridged(record, coding_value) do
    # Update mirror record: set coding_value_id and bridged_at
    record
    |> Ash.Changeset.for_update(:link_and_bridge, %{
      coding_value_id: coding_value.id,
      bridged_at: DateTime.utc_now()
    })
    |> Ash.update(authorize?: false)
    |> case do
      {:ok, _updated} ->
        :ok
        
      {:error, reason} ->
        Logger.warning("[DimensionBridgeService] Failed to link and bridge",
          record_id: record.id,
          error: inspect(reason)
        )
    end
  end

  # ============================================================================
  # Private: Helpers
  # ============================================================================

  defp get_active_status(record, :status) do
    Map.get(record, :status) == :active
  end

  defp get_active_status(record, :active) do
    Map.get(record, :active, true)
  end

  defp get_active_status(_record, nil) do
    true
  end

  defp sanitize_code(nil), do: "UNKNOWN"
  defp sanitize_code(code) do
    code
    |> String.upcase()
    |> String.replace(~r/[^A-Z0-9\-_]/, "_")
    |> String.trim()
    |> case do
      "" -> "UNKNOWN"
      s -> s
    end
  end

  defp sanitize_name(nil), do: "Unknown"
  defp sanitize_name(name) do
    name
    |> String.replace(~r/[^\p{L}\p{N}\s\-_:'&.,\/()+]/u, "_")
    |> String.trim()
    |> case do
      "" -> "Unknown"
      s -> s
    end
  end

  # ============================================================================
  # Private: Custom Dimensions
  # ============================================================================

  defp bridge_custom_dimension_batch(custom_dim_id, records) do
    alias FlameTeampayPayables.EmberErp.Resources.Accounting.Core.CustomDimension
    
    case Ash.get(CustomDimension, custom_dim_id, authorize?: false) do
      {:ok, custom_dim} ->
        category_code = "UDD-#{sanitize_code(custom_dim.object_name)}"
        category_name = custom_dim.object_label || custom_dim.object_name
        
        config = %{
          code_field: :value_code,
          name_field: :value_name,
          parent_code_field: nil,
          active_field: :active,
          description_field: :description
        }
        
        bridge_batch(records, :custom_dimension_value, category_code, category_name, config)
        
      {:error, _} ->
        Logger.warning("[DimensionBridgeService] Custom dimension not found", id: custom_dim_id)
        0
    end
  end
end
```

---

## 4. Domain Module

**File:** `lib/flame_teampay_payables/ember_bridge/domain.ex`

```elixir
defmodule FlameTeampayPayables.EmberBridge do
  @moduledoc """
  Domain for the Bridge system.
  
  The Bridge creates business layer records (CodingCategory/CodingValue)
  from ERP mirror tables. It runs independently of sync.
  """

  use Ash.Domain

  resources do
    # Bridge doesn't define new resources, it operates on:
    # - FlameTeampayPayables.EmberCoding.Definitions.Resources.CodingCategory
    # - FlameTeampayPayables.EmberCoding.Definitions.Resources.CodingValue
    # - FlameTeampayPayables.EmberErp.Resources.Accounting.Core.* (mirror tables)
  end
end
```

---

## 5. Oban Configuration

**File:** `config/config.exs` (add to existing Oban config)

```elixir
config :flame_teampay_payables, Oban,
  queues: [
    default: 10,
    erp_sync: 25,
    bridge: 5,  # ← ADD THIS
    # ... other queues
  ],
  plugins: [
    {Oban.Plugins.Cron, 
      crontab: [
        # ... existing cron jobs
        {"*/2 * * * *", FlameTeampayPayables.EmberBridge.Workers.BridgeWorker},  # ← ADD THIS
      ]
    }
  ]
```

---

## 6. Resource Changes Summary

See `RESOURCE-CHANGES.md` for detailed changes to:
- CodingCategory
- CodingValue
- Department (and other ERP mirror tables)

---

*Document created: 2025-12-22 by Sync Committee*

