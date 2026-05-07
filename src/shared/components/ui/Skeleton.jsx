import { cn } from '@/shared/lib/utils';

export function Skeleton({ className, rounded = 'md', ...props }) {
  const radius = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
    none: '',
  }[rounded] ?? 'rounded-md';

  return <div className={cn('skeleton', radius, className)} {...props} />;
}

export function SkeletonText({ lines = 3, className, lastWidth = '60%' }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={i === lines - 1 ? { width: lastWidth } : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, rows = 2, withIcon = true, withFooter = false }) {
  return (
    <div
      className={cn(
        'border border-border rounded-xl bg-card/40 p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {withIcon && <Skeleton className="h-10 w-10 shrink-0" rounded="xl" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-2.5 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-7 w-7 shrink-0" rounded="lg" />
      </div>

      {rows > 0 && <SkeletonText lines={rows} />}

      {withFooter && (
        <div className="pt-3 border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      )}
    </div>
  );
}

export function SkeletonStat({ className }) {
  return (
    <div
      className={cn(
        'flex-1 min-w-[130px] border border-border rounded-lg bg-card/40 p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-3 w-3" rounded="sm" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2 w-24" />
    </div>
  );
}

export function SkeletonOverviewCard({ className }) {
  return (
    <div
      className={cn(
        'h-[7rem] min-w-[12.5rem] border border-border rounded-lg bg-card/40 p-3 flex flex-col justify-between',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-3 w-3" rounded="sm" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2.5 w-full" rounded="full" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5, className }) {
  return (
    <div
      className={cn(
        'border border-border rounded-md overflow-hidden bg-card/30',
        className,
      )}
    >
      <div className="grid gap-3 px-3 py-2.5 border-b border-border bg-card/40"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-2.5" />
        ))}
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-3 py-2.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-3" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className, height = 170, type = 'pie' }) {
  if (type === 'pie') {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ height }}
      >
        <div className="relative">
          <Skeleton className="h-32 w-32" rounded="full" />
          <div className="absolute inset-6 rounded-full bg-card border border-border" />
        </div>
      </div>
    );
  }
  if (type === 'gauge') {
    return (
      <div className={cn('relative', className)} style={{ height }}>
        <Skeleton className="absolute left-1/2 -translate-x-1/2 bottom-0 h-24 w-44" rounded="full" />
      </div>
    );
  }
  if (type === 'bars') {
    return (
      <div
        className={cn('flex items-end gap-2 px-2', className)}
        style={{ height }}
      >
        {[60, 90, 45, 80, 70, 95, 55, 85, 65].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }
  // line
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export function SkeletonList({ count = 6, itemHeight = 56, className, gap = 8 }) {
  return (
    <div className={cn('flex flex-col', className)} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="xl"
          style={{ height: itemHeight }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatarRow({ count = 6, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-card/30">
          <Skeleton className="h-9 w-9 shrink-0" rounded="lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-3/4" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0" rounded="md" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
