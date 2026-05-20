import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AgentMailApp from './AgentMailApp';

export default function AgentMailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const leadIdParam = params.get('leadId');
  const leadId = leadIdParam && /^\d+$/.test(leadIdParam) ? Number(leadIdParam) : null;

  const officeEmail = import.meta.env.VITE_OFFICE_EMAIL || 'office@spectra.com';

  return (
    <div className="min-h-screen p-4 md:p-6 bg-background text-foreground">
      <div className="mx-auto max-w-[1280px] space-y-5 stagger-children">
        {/* Page header — matches EmailTemplatesPage visual rhythm */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10
          bg-gradient-to-b from-slate-900/70 to-slate-950/80
          shadow-[0_30px_120px_rgba(0,0,0,0.55)] px-5 py-5 transition-smooth">
          <div className="pointer-events-none absolute inset-0 opacity-60
            bg-[radial-gradient(700px_circle_at_0%_0%,hsl(var(--primary)/0.14),transparent_55%),
               radial-gradient(600px_circle_at_100%_100%,hsl(var(--accent)/0.10),transparent_55%)]" />
          <div className="relative flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-primary/20 bg-primary/10 grid place-items-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground leading-none">Send Email</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Compose, preview, and send emails to leads using shared templates.
                {leadId ? <span className="ml-1 text-primary">· Lead #{leadId}</span> : null}
              </p>
            </div>
          </div>
        </div>

        <AgentMailApp
          leadId={leadId}
          officeEmail={officeEmail}
          onClose={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
