"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Kanban, Shield, Zap, LogOut, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/kanban", label: "Kanban", icon: Kanban },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-[rgb(var(--border))] flex-shrink-0", collapsed ? "justify-center" : "gap-3")}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <span className="font-bold text-base tracking-tight text-[rgb(var(--text))]">TaskFlow</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-item",
                active ? "sidebar-item-active" : "sidebar-item-inactive",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-brand-600 dark:text-brand-400" : "")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Link
            href="/admin"
            className={cn(
              "sidebar-item",
              pathname === "/admin" ? "sidebar-item-active" : "sidebar-item-inactive",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Admin" : undefined}
          >
            <Shield className={cn("w-4 h-4 flex-shrink-0", pathname === "/admin" ? "text-brand-600 dark:text-brand-400" : "")} />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[rgb(var(--border))] space-y-1">
        {user && (
          <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg", collapsed && "justify-center px-0")}>
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[rgb(var(--text))] truncate">{user.name}</div>
                <div className="text-xs text-[rgb(var(--text-muted))] truncate">{user.email}</div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className={cn("sidebar-item sidebar-item-inactive w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30", collapsed && "justify-center px-0")}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("sidebar-item sidebar-item-inactive w-full", collapsed && "justify-center px-0")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
