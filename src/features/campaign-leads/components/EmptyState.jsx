import { Radio, Plus } from 'lucide-react';

export default function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 animate-fade-in-up">
      <div className="h-14 w-14 rounded-xl border border-white/10 bg-slate-800/60 grid place-items-center animate-pop-in">
        <Radio className="w-6 h-6 text-slate-600 animate-pulse-slow" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-400">No routing rules yet</p>
        <p className="text-xs text-slate-600 mt-1">Create your first rule to start distributing leads automatically</p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-lg border border-sky-600/40 bg-sky-600/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-600/30 transition-smooth active:scale-[0.97]"
      >
        <Plus className="w-4 h-4" /> Create Rule
      </button>
    </div>
  );
}
