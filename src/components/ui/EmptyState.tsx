import { type ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="grid gap-3 text-center">
      <div>
        <h2 className="text-lg font-bold text-ink-strong">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </Card>
  );
}
