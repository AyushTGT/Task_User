"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskForm } from "@/components/tasks/TaskForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskRowSkeleton } from "@/components/shared/LoadingSkeleton";
import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskFilters as Filters } from "@/types";

function TasksContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const [filters, setFilters] = useState<Filters>({
    status: (searchParams.get("status") as any) ?? "",
    priority: (searchParams.get("priority") as any) ?? "",
    search: searchParams.get("search") ?? "",
    sort_by: "created_at",
    sort_dir: "desc",
    page: 1,
    page_size: 25,
  });

  const { data, isLoading, isFetching } = useTasks(filters);
  const tasks = data?.data ?? [];
  const pagination = data?.pagination;

  const updateFilters = (updates: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...updates }));

  const handleEdit = (task: Task) => setEditTask(task);

  return (
    <>
      <Header
        title="Tasks"
        subtitle={pagination ? `${pagination.total} total tasks` : ""}
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> New task
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <TaskFilters filters={filters} onChange={updateFilters} />

        {/* Task list */}
        <div className="card relative" style={{ overflow: "visible" }}>
          {isFetching && !isLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500 animate-pulse" />
          )}

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
            <div className="w-4.5 flex-shrink-0" style={{ width: "18px" }} />
            <div className="w-2 flex-shrink-0" />
            <span className="flex-1 text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Task</span>
            <span className="hidden sm:block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide w-24">Status</span>
            <span className="hidden md:block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide w-20">Priority</span>
            <span className="hidden lg:block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide w-28">Due date</span>
            <span className="hidden lg:block text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide w-8">Files</span>
            <div className="w-6 flex-shrink-0" />
            <div className="w-8 flex-shrink-0" />
          </div>

          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <TaskRowSkeleton key={i} />)
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description={filters.search || filters.status || filters.priority ? "Try adjusting your filters" : "Create your first task to get started"}
              action={
                !filters.search && !filters.status && !filters.priority ? (
                  <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create task
                  </button>
                ) : undefined
              }
            />
          ) : (
            tasks.map((task) => <TaskRow key={task.id} task={task} onEdit={handleEdit} />)
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} tasks)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
                disabled={(filters.page ?? 1) <= 1}
                className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const p = i + Math.max(1, (filters.page ?? 1) - 2);
                if (p > pagination.total_pages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => updateFilters({ page: p })}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === (filters.page ?? 1) ? "bg-brand-600 text-white" : "btn-secondary"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
                disabled={(filters.page ?? 1) >= pagination.total_pages}
                className="btn-secondary h-8 w-8 p-0 flex items-center justify-center disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
      {editTask && <TaskForm task={editTask} onClose={() => setEditTask(null)} />}
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6"><TaskRowSkeleton /></div>}>
      <TasksContent />
    </Suspense>
  );
}
