"use client";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const current = options.find((o) => o.value === theme) ?? options[2];
  const Icon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-colors"
        title="Toggle theme"
      >
        <Icon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 card shadow-modal w-36 py-1 z-50 animate-scale-in">
          {options.map(({ value, label, icon: OptionIcon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[rgb(var(--surface-2))] transition-colors text-left",
                theme === value ? "text-brand-600 dark:text-brand-400 font-medium" : "text-[rgb(var(--text))]"
              )}
            >
              <OptionIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
