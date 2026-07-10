import { Share2, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { TablesRow } from '@/lib/supabase/types';

const statusLabel: Record<TablesRow['status'], string> = {
  open: 'Mesa aberta',
  closed: 'Mesa fechada',
  archived: 'Mesa arquivada',
};

const statusTone: Record<TablesRow['status'], 'green' | 'blue' | 'neutral'> = {
  open: 'green',
  closed: 'blue',
  archived: 'neutral',
};

type TableHeaderProps = {
  table: TablesRow;
  participantCount: number;
  onShare?: () => void;
};

export function TableHeader({ table, participantCount, onShare }: TableHeaderProps) {
  const canShare = Boolean(onShare);

  return (
    <section className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="min-w-0">
        <Badge tone={statusTone[table.status]}>{statusLabel[table.status]}</Badge>
        <h1 className="mt-3 break-words text-2xl font-bold text-ink-strong sm:text-3xl">{table.name}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
          <UsersRound aria-hidden="true" size={18} />
          {participantCount} {participantCount === 1 ? 'participante' : 'participantes'} na mesa
        </p>
      </div>
      <Button variant="secondary" onClick={onShare} disabled={!canShare} title={canShare ? 'Compartilhar mesa por link ou QR Code' : 'Compartilhamento indisponivel para mesa arquivada'}>
        <Share2 aria-hidden="true" size={18} />
        Compartilhar
      </Button>
    </section>
  );
}
