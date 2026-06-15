import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[rgb(var(--border))]">
      <Skeleton className="w-4 h-4 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function KanbanCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}
