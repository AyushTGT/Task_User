"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn, STATUS_CONFIG } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-slate-500",
  todo: "bg-brand-500",
  in_progress: "bg-blue-500",
  in_review: "bg-purple-500",
  done: "bg-emerald-500",
};

export function KanbanColumn({ status, tasks, onAddTask, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "column", status } });
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", COLUMN_COLORS[status])} />
          <span className="font-semibold text-sm text-[rgb(var(--text))]">{cfg.label}</span>
          <span className="w-5 h-5 rounded-full bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] text-xs flex items-center justify-center font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "kanban-col flex-1 space-y-2.5 min-h-28 p-1 rounded-xl transition-all duration-150 overflow-y-auto",
          isOver && "bg-brand-50/50 dark:bg-brand-950/20 ring-2 ring-brand-400/30"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-[rgb(var(--border))]">
            <p className="text-xs text-[rgb(var(--text-muted))]">Drop tasks here</p>
          </div>
        )}

        {/* Add task button at bottom */}
        <button
          onClick={() => onAddTask(status)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors group border border-dashed border-transparent hover:border-[rgb(var(--border))]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}
