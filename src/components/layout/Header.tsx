import { Moon, ReceiptText, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-canvas/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/mesas/nova" className="flex min-w-0 items-center gap-3" aria-label="Divisor de Contas">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-green text-slate-950">
            <ReceiptText aria-hidden="true" size={22} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink-strong">Divisor de Contas</span>
            <span className="block truncate text-xs text-ink-muted">Mesa compartilhada</span>
          </span>
        </Link>
        <Button aria-label="Alternar tema" size="icon" variant="ghost" onClick={toggleMode}>
          {isDark ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
        </Button>
      </div>
    </header>
  );
}
