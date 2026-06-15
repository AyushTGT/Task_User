import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[rgb(var(--text-muted))]" />
      </div>
      <h3 className="text-base font-semibold text-[rgb(var(--text))] mb-1">{title}</h3>
      <p className="text-sm text-[rgb(var(--text-muted))] max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
