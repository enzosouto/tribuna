import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function GridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={className ?? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-medium">Algo deu errado</p>
      {message && <p className="max-w-xs text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
