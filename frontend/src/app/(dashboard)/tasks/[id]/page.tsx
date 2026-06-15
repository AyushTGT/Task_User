"use client";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, Paperclip, Clock, Calendar,
  Tag, Activity, Upload, X, Download, FileText, Image,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import {
  useTask, useTaskActivities, useDeleteTask,
  useUploadAttachment, useDeleteAttachment,
} from "@/hooks/useTasks";
import { api } from "@/lib/api";
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDate, formatDateRelative, isOverdue } from "@/lib/utils";
import type { Attachment } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "created this task",
  updated: "updated",
  status_changed: "changed status",
};

function fileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-[rgb(var(--text-muted))]" />;
}

function AttachmentRow({ att, taskId }: { att: Attachment; taskId: string }) {
  const deleteAtt = useDeleteAttachment(taskId);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const resp = await api.get(`/tasks/${taskId}/attachments/${att.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = att.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // toast imported via useTasks, but we can't call hooks here — just log
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (confirming) {
      deleteAtt.mutate(att.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 2500);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors group">
      {fileIcon(att.content_type)}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{att.original_name}</div>
        <div className="text-xs text-[rgb(var(--text-muted))]">
          {att.file_size < 1024 * 1024
            ? `${(att.file_size / 1024).toFixed(1)} KB`
            : `${(att.file_size / 1024 / 1024).toFixed(1)} MB`}
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors opacity-0 group-hover:opacity-100"
        title="Download"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleteAtt.isPending}
        className={cn(
          "p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
          confirming
            ? "text-red-600 bg-red-50 dark:bg-red-950/30 opacity-100"
            : "text-[rgb(var(--text-muted))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        )}
        title={confirming ? "Click again to confirm" : "Remove"}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function UploadZone({ taskId }: { taskId: string }) {
  const uploadAtt = useUploadAttachment(taskId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => uploadAtt.mutate(f));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => fileRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all text-center",
        dragging
          ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
          : "border-[rgb(var(--border))] hover:border-brand-400 hover:bg-[rgb(var(--surface-2))]"
      )}
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploadAtt.isPending ? (
        <span className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
          <span className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          Uploading…
        </span>
      ) : (
        <>
          <Upload className="w-5 h-5 text-[rgb(var(--text-muted))]" />
          <span className="text-sm text-[rgb(var(--text-muted))]">
            Drop files here or <span className="text-brand-600 dark:text-brand-400 font-medium">click to upload</span>
          </span>
          <span className="text-xs text-[rgb(var(--text-muted))]">Images, PDF, Word, Excel — max 10 MB</span>
        </>
      )}
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const deleteTask = useDeleteTask();

  const { data: task, isLoading } = useTask(id);
  const { data: activities } = useTaskActivities(id);

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      deleteTask.mutate(id, { onSuccess: () => router.push("/tasks") });
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Task details" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <Header title="Task not found" />
        <div className="p-6">
          <p className="text-[rgb(var(--text-muted))]">This task doesn't exist or you don't have access to it.</p>
        </div>
      </>
    );
  }

  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.due_date);

  return (
    <>
      <Header
        title={task.title}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="btn-ghost flex items-center gap-2 h-9 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setShowEdit(true)} className="btn-secondary flex items-center gap-2 h-9 text-sm">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={handleDelete} className="btn-danger flex items-center gap-2 h-9 text-sm">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="card p-6">
              <h1 className={cn("text-xl font-semibold mb-3", task.status === "done" && "line-through text-[rgb(var(--text-muted))]")}>
                {task.title}
              </h1>
              {task.description ? (
                <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-[rgb(var(--text-muted))] italic">No description</p>
              )}
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((l) => (
                    <span key={l} className="badge bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="card p-5">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments
                {(task.attachments?.length ?? 0) > 0 && (
                  <span className="text-xs text-[rgb(var(--text-muted))] font-normal">({task.attachments!.length})</span>
                )}
              </h3>
              <div className="space-y-2 mb-3">
                {(task.attachments ?? []).map((att) => (
                  <AttachmentRow key={att.id} att={att} taskId={task.id} />
                ))}
              </div>
              <UploadZone taskId={task.id} />
            </div>

            {/* Activity log */}
            <div className="card p-5">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Activity</h3>
              {(activities ?? []).length === 0 ? (
                <p className="text-sm text-[rgb(var(--text-muted))]">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {(activities ?? []).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center flex-shrink-0 text-[rgb(var(--text-muted))] text-xs font-medium">
                        {log.user_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-[rgb(var(--text))]">{log.user_name ?? "Someone"}</span>
                        {" "}
                        <span className="text-[rgb(var(--text-muted))]">
                          {ACTIVITY_LABELS[log.action] ?? log.action}
                          {log.field && ` ${log.field}`}
                          {log.old_value && log.new_value && ` from "${log.old_value.value}" to "${log.new_value.value}"`}
                        </span>
                      </div>
                      <span className="text-xs text-[rgb(var(--text-muted))] flex-shrink-0">{formatDateRelative(log.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5 space-y-4">
              <div>
                <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Status</span>
                <div className={cn("badge mt-1.5", statusCfg.bg, statusCfg.color, statusCfg.border, "border")}>{statusCfg.label}</div>
              </div>
              <div>
                <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Priority</span>
                <div className={cn("badge mt-1.5", priorityCfg.bg, priorityCfg.color, priorityCfg.border, "border")}>{priorityCfg.label}</div>
              </div>
              <div>
                <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Due date</span>
                <div className={cn("text-sm mt-1.5 flex items-center gap-1.5", overdue ? "text-red-500 font-medium" : "text-[rgb(var(--text))]")}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(task.due_date)}
                  {overdue && <span className="badge bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 ml-1">Overdue</span>}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Assignee</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {task.owner.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{task.owner.name}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wide">Created</span>
                <div className="text-sm mt-1.5 flex items-center gap-1.5 text-[rgb(var(--text-muted))]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateRelative(task.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && <TaskForm task={task} onClose={() => setShowEdit(false)} />}
    </>
  );
}
