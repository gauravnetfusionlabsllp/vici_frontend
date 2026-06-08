import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { ArrowLeft, Home, AlertTriangle, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";

const adminQuickLinks = [
  { name: "Dashboard", path: "/" },
  { name: "Agent Productivity", path: "/selective" },
  { name: "Leads Upload", path: "/leads-upload" },
  { name: "Lead Router", path: "/campaign-leads" },
];
const agentQuickLinks = [{ name: "Call Workspace", path: "/call" }];

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  const homePath = !user ? "/login" : isAdmin ? "/" : "/call";
  const homeLabel = !user ? "Go to Login" : isAdmin ? "Go to Dashboard" : "Go to Call";
  const quickLinks = !user ? [] : isAdmin ? adminQuickLinks : agentQuickLinks;

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-80
                   bg-[radial-gradient(800px_circle_at_15%_15%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(700px_circle_at_85%_85%,hsl(var(--destructive)/0.10),transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--border)/0.12)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.12)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-card/80 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] border border-border overflow-hidden animate-fade-in-up">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="px-8 md:px-10 pt-10 pb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                         text-[10px] font-semibold uppercase tracking-[0.18em]
                         bg-destructive/10 text-destructive border border-destructive/30"
            >
              <AlertTriangle className="w-3 h-3" />
              Connection Lost
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <h1
              className="text-[120px] md:text-[160px] leading-none font-bold font-display tracking-tighter
                         bg-clip-text text-transparent
                         bg-[linear-gradient(180deg,hsl(var(--foreground))_0%,hsl(var(--muted-foreground)/0.4)_100%)]
                         select-none"
              aria-label="404"
            >
              4<span className="inline-block align-middle mx-1 md:mx-2">
                <SignalZero />
              </span>4
            </h1>
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight font-display">
              We couldn't reach that page
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              The route you dialed doesn't exist or was moved. Check the address, or jump back to a known location.
            </p>
          </div>

          

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md
                         bg-secondary/60 hover:bg-secondary text-foreground border border-border
                         transition-all duration-200 active:scale-[0.99] w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button
              onClick={() => navigate(homePath, { replace: true })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md
                         bg-primary hover:bg-primary/90 text-primary-foreground font-medium
                         shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.65)]
                         transition-all duration-200 active:scale-[0.99] w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              {homeLabel}
            </button>
          </div>
        </div>

        {quickLinks.length > 0 && (
          <div className="border-t border-border bg-secondary/20 px-8 md:px-10 py-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
              Quick links
            </div>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                             text-xs text-muted-foreground hover:text-foreground
                             bg-background/40 hover:bg-background/70
                             border border-border hover:border-primary/40
                             transition-all duration-200"
                >
                  {link.name}
                  <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border px-8 md:px-10 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-[0.16em]">
            Outbound Dialer
          </span>
          <span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-[0.16em]">
            Error · 404
          </span>
        </div>
      </div>
    </div>
  );
}

function SignalZero() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="inline-block h-[0.95em] w-[0.95em] align-middle"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="hsl(var(--border))"
        strokeWidth="6"
        opacity="0.6"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="url(#ring-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="180 110"
        className="animate-pulse-slow"
        style={{ transformOrigin: "60px 60px" }}
      />

      <path
        d="M 30 70 C 30 50, 45 38, 65 38"
        stroke="hsl(var(--primary))"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 70 38 L 90 58"
        stroke="hsl(var(--destructive))"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 90 38 L 70 58"
        stroke="hsl(var(--destructive))"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <circle cx="30" cy="70" r="4" fill="hsl(var(--primary))" />
    </svg>
  );
}
