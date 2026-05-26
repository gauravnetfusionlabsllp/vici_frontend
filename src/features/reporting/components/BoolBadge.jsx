export default function BoolBadge({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center rounded-md border border-[hsl(var(--status-active)/0.35)] bg-[hsl(var(--status-active)/0.15)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[hsl(var(--status-active))]">
        YES
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center rounded-md border border-destructive/35 bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-destructive">
        NO
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}
