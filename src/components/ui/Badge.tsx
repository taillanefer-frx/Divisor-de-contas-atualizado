import { type HTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

type BadgeTone = 'green' | 'blue' | 'red' | 'purple' | 'neutral';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

const toneClassName: Record<BadgeTone, string> = {
  green: 'bg-brand-green/70 text-slate-950',
  blue: 'bg-brand-blue/75 text-slate-950',
  red: 'bg-brand-red/75 text-slate-950',
  purple: 'bg-brand-purple/75 text-slate-950',
  neutral: 'bg-surface-muted text-ink-body',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return <span className={cn('inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold', toneClassName[tone], className)} {...props} />;
}
