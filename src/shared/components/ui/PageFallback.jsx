import { Skeleton } from './Skeleton';

export default function PageFallback() {
  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-5 animate-fade-in">
      {/* Header bar */}
      <div className="rounded-2xl border border-border bg-card/40 p-5 flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2.5 w-72" />
        </div>
      </div>

      {/* Strip of cards */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 flex-1 min-w-[10rem]" rounded="lg" />
        ))}
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80" rounded="xl" />
        <Skeleton className="h-80" rounded="xl" />
      </div>
    </div>
  );
}
