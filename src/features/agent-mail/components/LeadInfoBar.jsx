import { useSelector } from 'react-redux';
import { User2, X } from 'lucide-react';
import { selectMaskPii } from '@/features/auth/slices/authSlice';
import { maskEmail, maskPhone } from '@/shared/lib/mask';

export default function LeadInfoBar({ leadId, name, email, phone, onRemove }) {
  const maskPii = useSelector(selectMaskPii);
  const displayEmail = maskPii ? maskEmail(email) : email;
  const displayPhone = maskPii ? maskPhone(phone) : phone;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 animate-fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center shrink-0">
          <User2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-foreground font-medium truncate">
            {name || 'Lead'} <span className="text-muted-foreground font-normal">#{leadId}</span>
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {displayEmail || '—'}{phone ? ` · ${displayPhone}` : ''}
          </p>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-smooth"
          title="Detach lead"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
