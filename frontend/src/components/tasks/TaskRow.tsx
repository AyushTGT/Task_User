"use client";
import { Calendar, Paperclip, MoreHorizontal, Check, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn, formatDate, isOverdue, PRIORITY_CONFIG, STATUS_CONFIG, getInitials } from "@/lib/utils";
import type { Task } from "@/types";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskRow({ task, onEdit }: TaskRowProps) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const overdue = isOverdue(task.due_date);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markDone = () => updateTask.mutate({ id: task.id, payload: { status: task.status === "done" ? "todo" : "done" } });
  const handleDelete = () => { setMenuOpen(false); deleteTask.mutate(task.id); };

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--surface-2))] transition-colors border-b border-[rgb(var(--border))] last:border-0">
      {/* Done checkbox */}
      <button
        onClick={markDone}
        className={cn(
          "w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
          task.status === "done"
            ? "bg-emerald-500 border-emerald-500"
            : "border-[rgb(var(--border))] hover:border-brand-500"
        )}
        style={{ width: "18px", height: "18px" }}
      >
        {task.status === "done" && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>

      {/* Priority dot */}
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityCfg.dot)} />

      {/* Title + labels */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit(task)}
          className={cn("text-sm font-medium text-left hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate block", task.status === "done" && "line-through text-[rgb(var(--text-muted))]")}
        >
          {task.title}
        </button>
        {task.labels.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {task.labels.slice(0, 3).map((l) => (
              <span key={l} className="badge bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))] text-[10px]">{l}</span>
            ))}
            {task.labels.length > 3 && <span className="text-[10px] text-[rgb(var(--text-muted))]">+{task.labels.length - 3}</span>}
          </div>
        )}
      </div>

      {/* Status */}
      <span className={cn("badge hidden sm:inline-flex", statusCfg.bg, statusCfg.color, statusCfg.border, "border")}>
        {statusCfg.icon} {statusCfg.label}
      </span>

      {/* Priority */}
      <span className={cn("badge hidden md:inline-flex", priorityCfg.bg, priorityCfg.color, priorityCfg.border, "border")}>
        {priorityCfg.label}
      </span>

      {/* Due date */}
      <div className={cn("hidden lg:flex items-center gap-1 text-xs flex-shrink-0", overdue ? "text-red-500" : "text-[rgb(var(--text-muted))]")}>
        <Calendar className="w-3 h-3" />
        {formatDate(task.due_date)}
      </div>

      {/* Attachment count */}
      {(task.attachment_count ?? 0) > 0 && (
        <div className="hidden lg:flex items-center gap-1 text-xs text-[rgb(var(--text-muted))]">
          <Paperclip className="w-3 h-3" />
          {task.attachment_count}
        </div>
      )}

      {/* Owner avatar */}
      <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" title={task.owner.name}>
        {getInitials(task.owner.name)}
      </div>

      {/* Actions */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded-lg"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 card shadow-modal w-36 py-1 z-20 animate-scale-in">
            <button onClick={() => { setMenuOpen(false); onEdit(task); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
