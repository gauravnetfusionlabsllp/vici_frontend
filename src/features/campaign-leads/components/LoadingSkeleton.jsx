import { Skeleton } from '@/shared/components/ui';

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 stagger-children">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="border rounded-xl border-white/8 bg-gradient-to-b from-slate-900/60 to-slate-950/70 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14" rounded="md" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton className="h-8 w-8" rounded="lg" />
              <Skeleton className="h-8 w-8" rounded="lg" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16" rounded="sm" />
            <Skeleton className="h-5 w-20" rounded="sm" />
            <Skeleton className="h-5 w-14" rounded="sm" />
            <Skeleton className="h-5 w-24" rounded="sm" />
          </div>
          <Skeleton className="h-7 w-full" rounded="lg" />
        </div>
      ))}
    </div>
  );
}
