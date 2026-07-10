import { type HTMLAttributes } from 'react';
import { cn } from '@/components/ui/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn('rounded-lg border border-surface-border bg-surface-panel p-4 shadow-soft', className)} {...props} />;
}
