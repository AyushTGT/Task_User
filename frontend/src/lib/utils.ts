import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import type { TaskPriority, TaskStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "No due date";
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d, yyyy");
}

export function formatDateRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  urgent: {
    label: "Urgent",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  backlog: {
    label: "Backlog",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-700",
    icon: "○",
  },
  todo: {
    label: "To Do",
    color: "text-brand-600 dark:text-brand-400",
    bg: "bg-brand-50 dark:bg-brand-950/30",
    border: "border-brand-200 dark:border-brand-800",
    icon: "◯",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "◑",
  },
  in_review: {
    label: "In Review",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "◕",
  },
  done: {
    label: "Done",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "●",
  },
};

export const KANBAN_COLUMNS: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1&textColor=ffffff`;
}

export function computeMidPosition(before: number, after: number): number {
  return (before + after) / 2;
}
