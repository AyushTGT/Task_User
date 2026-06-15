"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, CheckSquare, TrendingUp, AlertTriangle,
  Crown, ChevronDown, ExternalLink, Calendar, Paperclip, X, Search,
  Activity, Tag, Clock, Download, FileText, Image as ImageIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { DashboardStatSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { cn, STATUS_CONFIG, PRIORITY_CONFIG, formatDate, formatDateRelative, isOverdue, getInitials } from "@/lib/utils";
import type { AdminStats, TaskStatus, TaskPriority, User, Task, Attachment, ActivityLog } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACTIVITY_LABELS: Record<string, string> = {
  created: "created this task",
  updated: "updated",
  status_changed: "changed status",
};

type Tab = "dashboard" | "users" | "user-tasks";

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700" },
  admin:       { label: "Admin",       className: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700" },
  user:        { label: "User",        className: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700" },
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high:   "border-l-orange-500",
  medium: "border-l-yellow-500",
  low:    "border-l-green-500",
};

/* ── Role dropdown ─────────────────────────────────────────────────────── */
function RoleDropdown({ targetUser, currentUser }: { targetUser: User; currentUser: User }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${targetUser.id}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setOpen(false); },
  });

  const isSuperAdmin = targetUser.role === "super_admin";
  const isSelf = targetUser.id === currentUser.id;
  const canChange = currentUser.role === "super_admin" && !isSuperAdmin && !isSelf;
  const cfg = ROLE_LABELS[targetUser.role] ?? ROLE_LABELS.user;

  if (!canChange) {
    return (
      <span className={cn("badge text-xs px-2.5 py-1 gap-1.5", cfg.className)}>
        {isSuperAdmin && <Crown className="w-3 h-3" />}
        {cfg.label}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={mutation.isPending}
        className={cn("badge text-xs px-2.5 py-1 gap-1.5 cursor-pointer hover:opacity-80 transition-opacity", cfg.className)}
      >
        {cfg.label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl shadow-modal overflow-hidden min-w-[120px]">
            {["admin", "user"].map((role) => (
              <button
                key={role}
                disabled={targetUser.role === role || mutation.isPending}
                onClick={() => mutation.mutate(role)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-medium transition-colors",
                  targetUser.role === role
                    ? "bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] cursor-default"
                    : "hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
                )}
              >
                {ROLE_LABELS[role].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── User email combobox ───────────────────────────────────────────────── */
function UserCombobox({
  users,
  selected,
  onSelect,
}: {
  users: User[];
  selected: User | null;
  onSelect: (u: User | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.name.toLowerCase().includes(query.toLowerCase())
      )
    : users;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (u: User) => {
    onSelect(u);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className={cn(
        "flex items-center gap-2 input pr-3",
        open && "ring-2 ring-brand-500/40 border-brand-500"
      )}>
        <Search className="w-4 h-4 text-[rgb(var(--text-muted))] flex-shrink-0" />
        {selected && !open ? (
          <button
            className="flex-1 flex items-center gap-2 text-left"
            onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          >
            <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              {getInitials(selected.name)}
            </div>
            <span className="text-sm truncate">{selected.email}</span>
            <span className="text-xs text-[rgb(var(--text-muted))] truncate">({selected.name})</span>
          </button>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by email or name…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[rgb(var(--text-muted))]"
          />
        )}
        {selected && (
          <button onClick={handleClear} className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl shadow-modal overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-[rgb(var(--text-muted))]">No users match</div>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelect(u)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgb(var(--surface-2))] transition-colors",
                  selected?.id === u.id && "bg-brand-50 dark:bg-brand-950/30"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-[rgb(var(--text-muted))] truncate">{u.email}</div>
                </div>
                <span className={cn("badge text-xs px-2 py-0.5 flex-shrink-0", (ROLE_LABELS[u.role] ?? ROLE_LABELS.user).className)}>
                  {(ROLE_LABELS[u.role] ?? ROLE_LABELS.user).label}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Admin task detail slide panel ────────────────────────────────────── */
function AdminTaskPanel({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ["admin-task-detail", taskId],
    queryFn: async () => (await api.get(`/admin/tasks/${taskId}`)).data,
  });

  const { data: activities, isLoading: actLoading } = useQuery<ActivityLog[]>({
    queryKey: ["admin-task-activities", taskId],
    queryFn: async () => (await api.get(`/admin/tasks/${taskId}/activities`)).data,
  });

  const overdue = task ? isOverdue(task.due_date) : false;
  const priorityCfg = task ? PRIORITY_CONFIG[task.priority] : null;
  const statusCfg = task ? STATUS_CONFIG[task.status] : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[rgb(var(--surface))] shadow-modal flex flex-col animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border))] flex-shrink-0">
          <h2 className="text-sm font-semibold truncate pr-4">Task Details</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {taskLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-4 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          ) : task ? (
            <>
              {/* Title + status/priority */}
              <div>
                <h3 className={cn("text-base font-semibold leading-snug mb-2", task.status === "done" && "line-through text-[rgb(var(--text-muted))]")}>
                  {task.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {statusCfg && (
                    <span className={cn("badge text-xs border", statusCfg.bg, statusCfg.color, statusCfg.border)}>
                      {statusCfg.label}
                    </span>
                  )}
                  {priorityCfg && (
                    <span className={cn("badge text-xs border", priorityCfg.bg, priorityCfg.color, priorityCfg.border)}>
                      {priorityCfg.label}
                    </span>
                  )}
                  {task.due_date && (
                    <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-500" : "text-[rgb(var(--text-muted))]")}>
                      <Calendar className="w-3 h-3" />{formatDate(task.due_date)}
                      {overdue && <span className="badge bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-800">Overdue</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="text-sm text-[rgb(var(--text-muted))] leading-relaxed whitespace-pre-wrap bg-[rgb(var(--surface-2))] rounded-lg p-3">
                  {task.description}
                </div>
              )}

              {/* Owner */}
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {task.owner.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{task.owner.name}</div>
                  <div className="text-xs text-[rgb(var(--text-muted))]">{task.owner.email}</div>
                </div>
              </div>

              {/* Labels */}
              {task.labels.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-muted))] mb-2">
                    <Tag className="w-3 h-3" /> Labels
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((l) => (
                      <span key={l} className="badge bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {(task.attachments ?? []).length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-muted))] mb-2">
                    <Paperclip className="w-3 h-3" /> Attachments ({task.attachments!.length})
                  </div>
                  <div className="space-y-1.5">
                    {task.attachments!.map((att) => (
                      <button
                        key={att.id}
                        onClick={async () => {
                          const resp = await api.get(`/tasks/${task.id}/attachments/${att.id}/download`, { responseType: "blob" });
                          const url = URL.createObjectURL(new Blob([resp.data]));
                          const a = document.createElement("a");
                          a.href = url; a.download = att.original_name;
                          document.body.appendChild(a); a.click();
                          document.body.removeChild(a); URL.revokeObjectURL(url);
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors text-left"
                      >
                        {att.content_type.startsWith("image/")
                          ? <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          : <FileText className="w-4 h-4 text-[rgb(var(--text-muted))] flex-shrink-0" />}
                        <span className="text-xs flex-1 truncate">{att.original_name}</span>
                        <Download className="w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity log */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-muted))] mb-3">
                  <Activity className="w-3 h-3" /> Activity log
                </div>
                {actLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-3 rounded" />)}
                  </div>
                ) : (activities ?? []).length === 0 ? (
                  <p className="text-xs text-[rgb(var(--text-muted))]">No activity recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {(activities ?? []).map((log) => (
                      <div key={log.id} className="flex items-start gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center flex-shrink-0 text-[10px] font-medium text-[rgb(var(--text-muted))]">
                          {log.user_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 text-xs">
                          <span className="font-medium text-[rgb(var(--text))]">{log.user_name ?? "Someone"}</span>{" "}
                          <span className="text-[rgb(var(--text-muted))]">
                            {ACTIVITY_LABELS[log.action] ?? log.action}
                            {log.field && ` ${log.field}`}
                            {log.old_value && log.new_value && ` from "${log.old_value.value}" to "${log.new_value.value}"`}
                          </span>
                        </div>
                        <span className="text-[10px] text-[rgb(var(--text-muted))] flex-shrink-0">{formatDateRelative(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-[rgb(var(--text-muted))]">Task not found.</p>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Admin task card (read-only, no DnD) ──────────────────────────────── */
function AdminTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const overdue = isOverdue(task.due_date);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "card border-l-4 p-3.5 flex flex-col gap-2 cursor-pointer hover:shadow-card-hover transition-shadow",
        PRIORITY_BORDER[task.priority] ?? "border-l-slate-300",
        task.status === "done" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium leading-snug line-clamp-2", task.status === "done" && "line-through text-[rgb(var(--text-muted))]")}>
          {task.title}
        </p>
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-medium border border-brand-200 dark:border-brand-800">
              {l}
            </span>
          ))}
          {task.labels.length > 3 && <span className="text-[9px] text-[rgb(var(--text-muted))]">+{task.labels.length - 3}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("badge text-[9px] px-1.5 border", statusCfg.bg, statusCfg.color, statusCfg.border)}>
            {statusCfg.label}
          </span>
          <span className={cn("badge text-[9px] px-1.5 border", priorityCfg.bg, priorityCfg.color, priorityCfg.border)}>
            {priorityCfg.label}
          </span>
          {(task.attachment_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[rgb(var(--text-muted))]">
              <Paperclip className="w-2.5 h-2.5" />{task.attachment_count}
            </span>
          )}
        </div>
        {task.due_date && (
          <span className={cn("flex items-center gap-0.5 text-[10px]", overdue ? "text-red-500" : "text-[rgb(var(--text-muted))]")}>
            <Calendar className="w-2.5 h-2.5" />{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── User Tasks panel ──────────────────────────────────────────────────── */
function UserTasksPanel({ allUsers }: { allUsers: User[]; initialUser?: User | null }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [panelTaskId, setPanelTaskId] = useState<string | null>(null);

  const { data: tasksData, isLoading } = useQuery<{ data: Task[]; pagination: { total: number } }>({
    queryKey: ["admin-user-tasks", selectedUser?.id],
    queryFn: async () =>
      (await api.get(`/admin/tasks?user_id=${selectedUser!.id}&page_size=500`)).data,
    enabled: !!selectedUser,
  });

  const allTasks = tasksData?.data ?? [];
  const filtered = statusFilter ? allTasks.filter((t) => t.status === statusFilter) : allTasks;

  const statusCounts = allTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Selector row */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-shrink-0 text-sm font-medium text-[rgb(var(--text-muted))] whitespace-nowrap">
          Select user:
        </div>
        <UserCombobox users={allUsers} selected={selectedUser} onSelect={setSelectedUser} />
      </div>

      {/* Empty state */}
      {!selectedUser && (
        <div className="card p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center">
            <Users className="w-6 h-6 text-[rgb(var(--text-muted))]" />
          </div>
          <p className="text-sm text-[rgb(var(--text-muted))]">Search or select a user to view their tasks</p>
        </div>
      )}

      {/* User header + tasks */}
      {selectedUser && (
        <div className="space-y-4">
          {/* User info bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-sm font-bold">
                {getInitials(selectedUser.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{selectedUser.name}</span>
                  <span className={cn("badge text-xs px-2 py-0.5", (ROLE_LABELS[selectedUser.role] ?? ROLE_LABELS.user).className)}>
                    {(ROLE_LABELS[selectedUser.role] ?? ROLE_LABELS.user).label}
                  </span>
                </div>
                <div className="text-xs text-[rgb(var(--text-muted))]">{selectedUser.email}</div>
              </div>
            </div>
            {!isLoading && (
              <div className="sm:ml-auto text-sm text-[rgb(var(--text-muted))]">
                {allTasks.length} task{allTasks.length !== 1 && "s"} total
              </div>
            )}
          </div>

          {/* Status filter pills */}
          {!isLoading && allTasks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("")}
                className={cn(
                  "badge px-3 py-1 text-xs font-medium transition-colors",
                  !statusFilter
                    ? "bg-brand-600 text-white border-transparent"
                    : "bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))] hover:text-[rgb(var(--text))]"
                )}
              >
                All ({allTasks.length})
              </button>
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
                const count = statusCounts[s] ?? 0;
                if (!count) return null;
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                    className={cn(
                      "badge px-3 py-1 text-xs font-medium transition-colors border",
                      statusFilter === s
                        ? cn(cfg.bg, cfg.color, cfg.border, "opacity-100")
                        : cn("bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))] hover:text-[rgb(var(--text))]")
                    )}
                  >
                    {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Task cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-3.5 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center text-sm text-[rgb(var(--text-muted))]">
              {allTasks.length === 0 ? "This user has no tasks yet." : "No tasks match the selected filter."}
            </div>
          ) : (
            <>
              <p className="text-xs text-[rgb(var(--text-muted))]">Click a card to view details &amp; activity log</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((task) => (
                  <AdminTaskCard key={task.id} task={task} onClick={() => setPanelTaskId(task.id)} />
                ))}
              </div>
              {panelTaskId && (
                <AdminTaskPanel taskId={panelTaskId} onClose={() => setPanelTaskId(null)} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main admin page ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [taskViewUser, setTaskViewUser] = useState<User | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "super_admin") router.push("/dashboard");
  }, [user, router]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get<AdminStats>("/admin/stats")).data,
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ data: User[]; total: number }>({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/admin/users?page_size=500")).data,
    enabled: !!user && (user.role === "admin" || user.role === "super_admin"),
  });

  const allUsers = usersData?.data ?? [];

  const handleViewTasks = useCallback((u: User) => {
    setTaskViewUser(u);
    setTab("user-tasks");
  }, []);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  const isSuperAdmin = user.role === "super_admin";

  const TABS = [
    { key: "dashboard" as Tab,   label: "Dashboard",     icon: TrendingUp },
    { key: "users" as Tab,       label: "Users",         icon: Users },
    { key: "user-tasks" as Tab,  label: "User Tasks",    icon: CheckSquare },
  ];

  return (
    <>
      <Header
        title="Admin Dashboard"
        subtitle="System-wide overview"
        actions={
          <div className={cn("badge px-3 py-1", isSuperAdmin
            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
            : "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
          )}>
            {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-[rgb(var(--surface-2))] rounded-xl p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === key
                  ? "bg-[rgb(var(--surface))] text-[rgb(var(--text))] shadow-sm"
                  : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Dashboard tab ─────────────────────── */}
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <DashboardStatSkeleton key={i} />)
              ) : (
                <>
                  <div className="card p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
                      <div className="text-sm text-[rgb(var(--text-muted))]">Total users</div>
                    </div>
                  </div>
                  <div className="card p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.total_tasks ?? 0}</div>
                      <div className="text-sm text-[rgb(var(--text-muted))]">Total tasks</div>
                    </div>
                  </div>
                  <div className="card p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.tasks_by_status?.in_progress ?? 0}</div>
                      <div className="text-sm text-[rgb(var(--text-muted))]">In progress</div>
                    </div>
                  </div>
                  <div className="card p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats?.tasks_by_priority?.urgent ?? 0}</div>
                      <div className="text-sm text-[rgb(var(--text-muted))]">Urgent tasks</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-4">Tasks by status</h2>
                {stats && (
                  <div className="space-y-3">
                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => {
                      const count = stats.tasks_by_status[s] ?? 0;
                      const total = stats.total_tasks;
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <span className="text-sm text-[rgb(var(--text-muted))] w-28 flex-shrink-0">{cfg.label}</span>
                          <div className="flex-1 h-2 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-500", {
                              "bg-slate-400": s === "backlog",
                              "bg-brand-500": s === "todo",
                              "bg-blue-500": s === "in_progress",
                              "bg-purple-500": s === "in_review",
                              "bg-emerald-500": s === "done",
                            })} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[rgb(var(--text-muted))] w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-4">Tasks by priority</h2>
                {stats && (
                  <div className="space-y-3">
                    {(["urgent", "high", "medium", "low"] as TaskPriority[]).map((p) => {
                      const count = stats.tasks_by_priority[p] ?? 0;
                      const total = stats.total_tasks;
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <div key={p} className="flex items-center gap-3">
                          <span className={cn("text-sm w-20 flex-shrink-0", cfg.color)}>{cfg.label}</span>
                          <div className="flex-1 h-2 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-500", cfg.dot)} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-[rgb(var(--text-muted))] w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Users tab ─────────────────────────── */}
        {tab === "users" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">All Users</h2>
                <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                  {usersData?.total ?? 0} total users
                  {isSuperAdmin && " · Click a role badge to change it"}
                </p>
              </div>
            </div>

            {usersLoading ? (
              <div className="divide-y divide-[rgb(var(--border))]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 flex items-center gap-4">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-32 rounded" />
                      <div className="skeleton h-2.5 w-48 rounded" />
                    </div>
                    <div className="skeleton h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[rgb(var(--border))]">
                {allUsers.map((u) => {
                  const initials = getInitials(u.name);
                  const isYou = u.id === user.id;
                  return (
                    <div key={u.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[rgb(var(--surface-2))] transition-colors">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                          : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{u.name}</span>
                          {isYou && <span className="text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--surface-2))] px-1.5 py-0.5 rounded">you</span>}
                        </div>
                        <div className="text-xs text-[rgb(var(--text-muted))] truncate">{u.email}</div>
                      </div>
                      <div className="text-xs text-[rgb(var(--text-muted))] hidden sm:block w-24 text-right flex-shrink-0">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <button
                        onClick={() => handleViewTasks(u)}
                        className="hidden sm:flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium flex-shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> View tasks
                      </button>
                      <div className="flex-shrink-0">
                        <RoleDropdown targetUser={u} currentUser={user as User} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── User Tasks tab ────────────────────── */}
        {tab === "user-tasks" && (
          <UserTasksPanel allUsers={allUsers} />
        )}
      </div>
    </>
  );
}
