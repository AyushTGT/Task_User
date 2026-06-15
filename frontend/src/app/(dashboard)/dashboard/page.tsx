"use client";
import { CheckSquare, Clock, AlertCircle, TrendingUp, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/layout/Header";
import { DashboardStatSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDate, isOverdue } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { useState } from "react";
import { TaskForm } from "@/components/tasks/TaskForm";

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: any; color: string; sub?: string }) {
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-[rgb(var(--text))]">{value}</div>
        <div className="text-sm text-[rgb(var(--text-muted))] mt-0.5">{label}</div>
        {sub && <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5 opacity-70">{sub}</div>}
      </div>
    </div>
  );
}

function MiniTaskRow({ task }: { task: Task }) {
  const overdue = isOverdue(task.due_date);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[rgb(var(--border))] last:border-0">
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityCfg.dot)} />
      <span className="flex-1 text-sm text-[rgb(var(--text))] truncate">{task.title}</span>
      <span className={cn("text-xs", overdue ? "text-red-500" : "text-[rgb(var(--text-muted))]")}>
        {formatDate(task.due_date)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  const { data: allTasks } = useTasks({ page_size: 500 });
  const { data: overdueTasks } = useTasks({ sort_by: "due_date", sort_dir: "asc", page_size: 10 });
  const { data: recentTasks } = useTasks({ sort_by: "created_at", sort_dir: "desc", page_size: 5 });

  const tasks = allTasks?.data ?? [];
  const totalTasks = allTasks?.pagination.total ?? 0;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date) && t.status !== "done").length;

  const statusCounts = (["backlog", "todo", "in_progress", "in_review", "done"] as TaskStatus[]).map((s) => ({
    status: s,
    count: tasks.filter((t) => t.status === s).length,
    pct: totalTasks > 0 ? (tasks.filter((t) => t.status === s).length / totalTasks) * 100 : 0,
  }));

  return (
    <>
      <Header
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user?.name?.split(" ")[0]} 👋`}
        subtitle="Here's what's happening with your tasks"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 h-9 text-sm">
            <Plus className="w-4 h-4" /> New task
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total tasks" value={totalTasks} icon={CheckSquare} color="bg-brand-600" />
          <StatCard label="In progress" value={inProgressTasks} icon={TrendingUp} color="bg-blue-500" sub="actively worked on" />
          <StatCard label="Completed" value={doneTasks} icon={CheckSquare} color="bg-emerald-500" sub={totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}% done` : undefined} />
          <StatCard label="Overdue" value={overdue} icon={AlertCircle} color={overdue > 0 ? "bg-red-500" : "bg-slate-400"} sub={overdue > 0 ? "needs attention" : "all on track"} />
        </div>

        {/* Progress by status */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Progress overview</h2>
          <div className="space-y-3">
            {statusCounts.map(({ status, count, pct }) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-[rgb(var(--text-muted))] w-24 flex-shrink-0">{cfg.label}</span>
                  <div className="flex-1 h-2 bg-[rgb(var(--surface-2))] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", {
                        "bg-slate-400": status === "backlog",
                        "bg-brand-500": status === "todo",
                        "bg-blue-500": status === "in_progress",
                        "bg-purple-500": status === "in_review",
                        "bg-emerald-500": status === "done",
                      })}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[rgb(var(--text-muted))] w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--text))]">Recent tasks</h2>
              <Link href="/tasks" className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {(recentTasks?.data ?? []).map((task) => <MiniTaskRow key={task.id} task={task} />)}
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--text))] mb-4">Quick actions</h2>
            <div className="space-y-2">
              {[
                { href: "/kanban", label: "View Kanban board", icon: "⚡", desc: "Drag & drop tasks visually" },
                { href: "/tasks?status=in_progress", label: "In Progress tasks", icon: "🔄", desc: `${inProgressTasks} tasks active` },
                { href: "/tasks?priority=urgent", label: "Urgent tasks", icon: "🚨", desc: "High priority items" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--surface-2))] transition-colors group">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[rgb(var(--text))] group-hover:text-brand-600 dark:group-hover:text-brand-400">{item.label}</div>
                    <div className="text-xs text-[rgb(var(--text-muted))]">{item.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[rgb(var(--text-muted))] group-hover:text-brand-600 dark:group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
    </>
  );
}
