import { Sun, Moon } from 'lucide-react';

// Page-scoped light/dark toggle. Styled with tokens so it reads correctly in either theme.
export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to light dashboard' : 'Switch to dark theme'}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[hsl(var(--mv-head-fg)/0.25)] bg-[hsl(var(--mv-head-fg)/0.10)] text-[hsl(var(--mv-head-fg))] hover:bg-[hsl(var(--mv-head-fg)/0.20)] transition-smooth"
    >
      {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span className="text-xs">{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
