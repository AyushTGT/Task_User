"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Tag, Calendar, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority } from "@/types";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
  labels: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task;
  defaultStatus?: TaskStatus;
  onClose: () => void;
}

const LABEL_SUGGESTIONS = ["bug", "feature", "design", "backend", "frontend", "docs", "testing", "urgent"];

export function TaskForm({ task, defaultStatus = "todo", onClose }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [labelInput, setLabelInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? defaultStatus,
      priority: task?.priority ?? "medium",
      due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
      labels: task?.labels ?? [],
    },
  });

  const labels = watch("labels");
  const status = watch("status");
  const priority = watch("priority");

  const addLabel = (label: string) => {
    const trimmed = label.trim().toLowerCase();
    if (trimmed && !labels.includes(trimmed)) {
      setValue("labels", [...labels, trimmed]);
    }
    setLabelInput("");
  };

  const removeLabel = (label: string) => setValue("labels", labels.filter((l) => l !== label));

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      due_date: data.due_date || undefined,
      description: data.description || undefined,
    };
    if (task) {
      updateTask.mutate({ id: task.id, payload }, { onSuccess: onClose });
    } else {
      createTask.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg shadow-modal animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
          <h2 className="font-semibold text-[rgb(var(--text))]">{task ? "Edit task" : "Create task"}</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <input
                {...register("title")}
                placeholder="Task title"
                className={cn("input text-base font-medium", errors.title && "border-red-500")}
                autoFocus
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <textarea
                {...register("description")}
                placeholder="Add a description..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Status + Priority grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select {...register("status")} className="input">
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select {...register("priority")} className="input">
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due date
              </label>
              <input {...register("due_date")} type="datetime-local" className="input" />
            </div>

            {/* Labels */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Labels
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {labels.map((label) => (
                  <span key={label} className="badge bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {label}
                    <button type="button" onClick={() => removeLabel(label)} className="ml-1 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(labelInput); } }}
                  placeholder="Add label..."
                  className="input flex-1 text-sm"
                />
                <button type="button" onClick={() => addLabel(labelInput)} className="btn-secondary text-sm px-3">Add</button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {LABEL_SUGGESTIONS.filter((s) => !labels.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addLabel(s)}
                    className="text-xs px-2 py-0.5 rounded-full border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
