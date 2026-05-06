export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl bg-white/5 border border-white/8" />
      ))}
    </div>
  );
}
