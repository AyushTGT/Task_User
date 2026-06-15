"use client";
import { Search, Bell, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/tasks?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-[rgb(var(--text))] leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[rgb(var(--text-muted))]">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input w-48 lg:w-64 pl-9 py-1.5 text-sm h-9"
            />
          </div>
        </form>

        {actions}

        <ThemeToggle />

        {user && (
          <button className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold hover:bg-brand-700 transition-colors">
            {getInitials(user.name)}
          </button>
        )}
      </div>
    </header>
  );
}
