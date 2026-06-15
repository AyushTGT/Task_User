"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Paperclip, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn, formatDate, isOverdue, PRIORITY_CONFIG, getInitials } from "@/lib/utils";
import type { Task } from "@/types";
import { useDeleteTask } from "@/hooks/useTasks";

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  overlay?: boolean;
}

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
};

export function KanbanCard({ task, onEdit, overlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(task.due_date);
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isDragging && !overlay) {
    return (
      <div ref={setNodeRef} style={style} className="h-24 rounded-xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] opacity-50" />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card border-l-4 p-3.5 group cursor-default select-none hover:shadow-card-hover transition-all duration-150",
        PRIORITY_BORDER[task.priority] ?? "border-l-slate-300",
        overlay && "drag-overlay shadow-modal",
        task.status === "done" && "opacity-70"
      )}
    >
      {/* Drag handle + menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-opacity"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onEdit(task)}
          className="flex-1 text-sm font-medium text-[rgb(var(--text))] text-left leading-snug hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-2"
        >
          {task.title}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-opacity"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 card shadow-modal w-32 py-1 z-30 animate-scale-in">
              <button onClick={() => { setMenuOpen(false); onEdit(task); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => { setMenuOpen(false); deleteTask.mutate(task.id); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.slice(0, 3).map((l) => (
            <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-medium border border-brand-200 dark:border-brand-800">
              {l}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span className={cn("badge text-[9px] px-1.5", priorityCfg.bg, priorityCfg.color, priorityCfg.border, "border")}>
            {priorityCfg.label}
          </span>

          {/* Attachment */}
          {(task.attachment_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[rgb(var(--text-muted))]">
              <Paperclip className="w-2.5 h-2.5" />
              {task.attachment_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {task.due_date && (
            <span className={cn("flex items-center gap-0.5 text-[10px]", overdue ? "text-red-500" : "text-[rgb(var(--text-muted))]")}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDate(task.due_date)}
            </span>
          )}
          <div
            className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
            title={task.owner.name}
          >
            {getInitials(task.owner.name)}
          </div>
        </div>
      </div>
    </div>
  );
}
