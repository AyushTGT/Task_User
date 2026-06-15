"use client";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TaskFilters as Filters, TaskStatus, TaskPriority } from "@/types";

interface TaskFiltersProps {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
}

const STATUSES: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITIES: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SORTS: { value: string; label: string }[] = [
  { value: "created_at", label: "Created date" },
  { value: "due_date", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const hasActive = filters.status || filters.priority || filters.search;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ search: searchValue, page: 1 });
  };

  const clearSearch = () => {
    setSearchValue("");
    onChange({ search: "", page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 min-w-48 max-w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search tasks..."
          className="input pl-9 pr-8 h-9 text-sm"
        />
        {searchValue && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Status */}
      <select
        value={filters.status ?? ""}
        onChange={(e) => onChange({ status: e.target.value as TaskStatus | "", page: 1 })}
        className="input h-9 text-sm w-auto pr-8 cursor-pointer"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Priority */}
      <select
        value={filters.priority ?? ""}
        onChange={(e) => onChange({ priority: e.target.value as TaskPriority | "", page: 1 })}
        className="input h-9 text-sm w-auto pr-8 cursor-pointer"
      >
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      {/* Sort */}
      <div className="flex items-center gap-0">
        <select
          value={filters.sort_by ?? "created_at"}
          onChange={(e) => onChange({ sort_by: e.target.value as any })}
          className="input h-9 text-sm w-auto pr-8 cursor-pointer rounded-r-none border-r-0"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filters.sort_dir ?? "desc"}
          onChange={(e) => onChange({ sort_dir: e.target.value as "asc" | "desc" })}
          className="input h-9 text-sm w-auto pr-8 cursor-pointer rounded-l-none"
        >
          <option value="desc">↓ Desc</option>
          <option value="asc">↑ Asc</option>
        </select>
      </div>

      {/* Clear */}
      {hasActive && (
        <button
          onClick={() => { setSearchValue(""); onChange({ status: "", priority: "", search: "", page: 1 }); }}
          className="btn-ghost text-sm h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
