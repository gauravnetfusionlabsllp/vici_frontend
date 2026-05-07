export default function BrandMark({ size = "md", showWordmark = true, role = null, className = "" }) {
  const dims = {
    sm: { box: "h-7 w-7  rounded-md",  svg: 20, dot: "h-1.5 w-1.5", title: "text-[13px]", chip: "text-[9px]"  },
    md: { box: "h-9 w-9  rounded-lg",  svg: 26, dot: "h-2 w-2",     title: "text-[15px]", chip: "text-[10px]" },
    lg: { box: "h-12 w-12 rounded-xl", svg: 34, dot: "h-2.5 w-2.5", title: "text-lg",     chip: "text-[11px]" },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`relative ${dims.box}
                    bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.55)_55%,hsl(var(--card))_100%)]
                    ring-1 ring-primary/20
                    shadow-[0_10px_28px_-10px_hsl(var(--primary)/0.45),inset_0_1px_0_hsl(var(--primary-foreground)/0.18),inset_0_-1px_0_rgba(0,0,0,0.35)]
                    flex items-center justify-center overflow-hidden`}
        aria-hidden="true"
      >
        {/* Glass highlight (top-left) */}
        <span className="pointer-events-none absolute -top-1.5 -left-1.5 h-3/5 w-3/5 rounded-full bg-white/12 blur-md" />
        {/* Specular sheen (top edge) */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
        {/* Bottom inner shade */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Outbound signal mark */}
        <svg
          viewBox="0 0 32 32"
          width={dims.svg}
          height={dims.svg}
          className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          fill="none"
        >
          {/* Primary signal arc */}
          <path
            d="M 7 23 C 7 13, 14 7, 25 7"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* Echo arc */}
          <path
            d="M 12 23 C 12 17, 16 14, 22 13.5"
            stroke="white"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Origin node */}
          <circle cx="7" cy="23" r="2.8" fill="white" />
          {/* Target node + halo */}
          <circle cx="25" cy="7" r="4" fill="white" fillOpacity="0.22" />
          <circle cx="25" cy="7" r="2.4" fill="white" />
        </svg>

        {/* Live status pulse */}
        {/* <span
          className={`absolute -top-0.5 -right-0.5 ${dims.dot} rounded-full bg-emerald-400 ring-2 ring-background animate-pulse`}
        /> */}
      </div>

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
