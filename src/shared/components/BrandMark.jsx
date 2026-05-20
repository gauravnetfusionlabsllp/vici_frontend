export default function BrandMark({ size = "md", showWordmark = true, role = null, className = "" }) {
  const dims = {
    sm: { box: "h-6",  gap: "gap-2",   title: "text-[13px]", chip: "text-[9px]"  },
    md: { box: "h-7",  gap: "gap-2.5", title: "text-[15px]", chip: "text-[10px]" },
    lg: { box: "h-12", gap: "gap-3",   title: "text-lg",     chip: "text-[11px]" },
  }[size];

  return (
    <div className={`flex items-center ${dims.gap} ${className}`}>
      <img
        src="/logo.png"
        alt="Brand logo"
        className={`${dims.box} w-auto select-none`}
        draggable={false}
      />

      {showWordmark && (
        <div className="leading-[1.1] flex flex-col gap-0.5">
          <h1 className={`${dims.title} font-bold tracking-[-0.015em] font-display text-foreground`}>
            Outbound <span className="text-blue-500">Dialer</span>
          </h1>
          {role && (
            <span
              className={`inline-flex w-fit items-center ${dims.chip} font-semibold uppercase tracking-[0.14em]
                          px-1 py-[1px] rounded
                          bg-primary/12 text-blue-500 `}
            >
              {role}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
