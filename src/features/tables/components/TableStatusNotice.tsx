import { AlertCircle, Archive, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TablesRow } from '@/lib/supabase/types';

type TableStatusNoticeProps = {
  status: TablesRow['status'];
};

export function TableStatusNotice({ status }: TableStatusNoticeProps) {
  if (status === 'open') return null;

  const Icon = status === 'closed' ? Lock : Archive;
  const message = status === 'closed'
    ? 'Esta mesa esta fechada. Os participantes ficam disponiveis para consulta, mas novas alteracoes ficam bloqueadas.'
    : 'Esta mesa esta arquivada. O link nao deve ser usado para novos acessos e os dados ficam preservados apenas para consulta.';

  return (
    <Card className="flex gap-3 border-brand-blue/60 bg-brand-blue/20">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-ink-strong" size={20} />
      <div className="grid gap-1 text-sm text-ink-body">
        <p className="font-semibold text-ink-strong">Mesa somente leitura</p>
        <p>{message}</p>
      </div>
    </Card>
  );
}

export function InvalidTableNotice({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex gap-3 border-brand-red/60 bg-brand-red/20">
      <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-ink-strong" size={20} />
      <div className="grid gap-1 text-sm text-ink-body">
        <p className="font-semibold text-ink-strong">{title}</p>
        <p>{description}</p>
      </div>
    </Card>
  );
}
