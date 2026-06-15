"use client";
import { useState } from "react";
import { Plus, Kanban, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { KanbanCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAllTasksForKanban } from "@/hooks/useTasks";
import type { Task, TaskStatus, TaskFilters as Filters } from "@/types";

export default function KanbanPage() {
  const [showForm, setShowForm] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: "", priority: "" });

  const { data: allTasks, isLoading, refetch, isFetching } = useAllTasksForKanban();

  const filteredTasks = (allTasks ?? []).filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setShowForm(true);
  };

  return (
    <>
      <Header
        title="Kanban Board"
        subtitle={allTasks ? `${allTasks.length} tasks across all columns` : ""}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className={`btn-ghost h-9 w-9 p-0 flex items-center justify-center ${isFetching ? "animate-spin" : ""}`}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 h-9 text-sm">
              <Plus className="w-4 h-4" /> Add task
            </button>
          </div>
        }
      />

      {/* Filters bar */}
      <div className="px-6 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <TaskFilters
          filters={filters}
          onChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        />
      </div>

      <div className="flex-1 overflow-hidden p-6 h-[calc(100vh-8.5rem)]">
        {isLoading ? (
          <div className="flex gap-5">
            {Array.from({ length: 5 }).map((_, col) => (
              <div key={col} className="w-72 flex-shrink-0 space-y-3">
                <div className="h-6 w-24 skeleton rounded" />
                {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => (
                  <KanbanCardSkeleton key={i} />
                ))}
              </div>
            ))}
          </div>
        ) : !allTasks?.length ? (
          <EmptyState
            icon={Kanban}
            title="Your Kanban board is empty"
            description="Create your first task to start organizing your work"
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create first task
              </button>
            }
          />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            onAddTask={handleAddTask}
            onEditTask={setEditTask}
          />
        )}
      </div>

      {showForm && <TaskForm defaultStatus={defaultStatus} onClose={() => setShowForm(false)} />}
      {editTask && <TaskForm task={editTask} onClose={() => setEditTask(null)} />}
    </>
  );
}
