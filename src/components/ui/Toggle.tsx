import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean };

export function Toggle({ className, pressed, children, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border border-surface-border bg-surface-panel px-3 text-sm font-semibold text-ink-body transition hover:bg-surface-muted',
        pressed && 'border-brand-purple bg-brand-purple/45 text-ink-strong',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
