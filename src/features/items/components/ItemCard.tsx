import { Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDateTimeForDisplay } from '@/lib/date/dateTime';
import { formatMoney } from '@/lib/money/money';
import { calculateItemTotal } from '@/domain/billing';
import type { ItemWithParticipants } from '@/services/itemService';

type ItemCardProps = {
  item: ItemWithParticipants;
  disabled?: boolean;
  onEdit: (item: ItemWithParticipants) => void;
  onVoid: (item: ItemWithParticipants) => void;
};

export function ItemCard({ item, disabled = false, onEdit, onVoid }: ItemCardProps) {
  const lineTotal = calculateItemTotal(item);
  const isVoid = item.status === 'void';

  return (
    <Card className={isVoid ? 'grid gap-4 opacity-70' : 'grid gap-4'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={isVoid ? 'truncate text-lg font-bold text-ink-muted line-through' : 'truncate text-lg font-bold text-ink-strong'}>{item.name}</h3>
          <p className="mt-1 text-sm text-ink-muted">Consumido {formatDateTimeForDisplay(item.consumed_at)}</p>
        </div>
        <Badge tone={isVoid ? 'neutral' : 'blue'}>{isVoid ? 'Anulado' : 'Manual'}</Badge>
      </div>

      <div className="grid gap-2 rounded-lg bg-surface-muted p-3 text-sm text-ink-body">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Unitario</span>
          <span className="font-semibold">{formatMoney(item.amount_cents)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Quantidade</span>
          <span className="font-semibold">{item.quantity}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-surface-border pt-2">
          <span className="text-ink-muted">Total da linha</span>
          <span className="font-bold text-ink-strong">{formatMoney(lineTotal)}</span>
        </div>
      </div>

      {item.notes ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted">{item.notes}</p> : null}

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Participantes</p>
        {item.participants.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum participante associado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {item.participants.map((participant) => (
              <Badge key={participant.id} tone={participant.assignment_type === 'suggested' ? 'green' : 'purple'}>
                {participant.display_name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {!isVoid ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={disabled} onClick={() => onEdit(item)}>
            <Edit3 aria-hidden="true" size={18} />
            Editar
          </Button>
          <Button variant="danger" disabled={disabled} onClick={() => onVoid(item)}>
            <Trash2 aria-hidden="true" size={18} />
            Anular
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
