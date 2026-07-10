import { FileText, Plus, QrCode, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/components/ui/cn';

const navItems = [
  { to: '/mesas/nova', label: 'Nova', icon: Plus },
  { to: '/mesa/demo', label: 'Mesa', icon: UsersRound },
  { to: '/mesa/demo/compartilhar', label: 'QR', icon: QrCode },
  { to: '/legal/termos', label: 'Legal', icon: FileText },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-surface-panel/95 backdrop-blur sm:hidden" aria-label="Navegacao principal">
      <div className="grid grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('grid min-h-12 place-items-center gap-1 rounded-lg px-2 text-xs font-semibold text-ink-muted', isActive && 'bg-brand-green/50 text-ink-strong')
              }
            >
              <Icon aria-hidden="true" size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
