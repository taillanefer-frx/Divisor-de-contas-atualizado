import { Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDateTimeForDisplay } from '@/lib/date/dateTime';
import type { ParticipantsRow } from '@/lib/supabase/types';

type ParticipantCardProps = {
  participant: ParticipantsRow;
  disabled?: boolean;
  onEdit: (participant: ParticipantsRow) => void;
  onRequestRemove: (participant: ParticipantsRow) => void;
};

export function ParticipantCard({ participant, disabled = false, onEdit, onRequestRemove }: ParticipantCardProps) {
  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink-strong">{participant.display_name}</h3>
          <p className="mt-1 text-sm text-ink-muted">Chegou {formatDateTimeForDisplay(participant.arrival_at)}</p>
        </div>
        <Badge tone={participant.departure_at ? 'neutral' : 'green'}>{participant.departure_at ? 'Saiu' : 'Na mesa'}</Badge>
      </div>

      <div className="grid gap-2 rounded-lg bg-surface-muted p-3 text-sm text-ink-body">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Chegada</span>
          <span className="text-right font-medium">{formatDateTimeForDisplay(participant.arrival_at)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Saida</span>
          <span className="text-right font-medium">{formatDateTimeForDisplay(participant.departure_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => onEdit(participant)} disabled={disabled}>
          <Edit3 aria-hidden="true" size={18} />
          Editar
        </Button>
        <Button variant="danger" onClick={() => onRequestRemove(participant)} disabled={disabled}>
          <Trash2 aria-hidden="true" size={18} />
          Remover
        </Button>
      </div>
    </Card>
  );
}
