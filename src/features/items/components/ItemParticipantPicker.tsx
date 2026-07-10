import { AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTimeForDisplay } from '@/lib/date/dateTime';
import type { ItemParticipantAssignmentType, ParticipantsRow } from '@/lib/supabase/types';

type SelectedParticipant = {
  participant_id: string;
  assignment_type: Extract<ItemParticipantAssignmentType, 'manual' | 'suggested'>;
};

type ItemParticipantPickerProps = {
  participants: ParticipantsRow[];
  selectedParticipants: SelectedParticipant[];
  eligibleParticipantIds: Set<string>;
  disabled?: boolean;
  onToggle: (participant: ParticipantsRow) => void;
  onSelectAll: () => void;
  onSelectEligible: () => void;
  onClear: () => void;
};

export function ItemParticipantPicker({ participants, selectedParticipants, eligibleParticipantIds, disabled = false, onToggle, onSelectAll, onSelectEligible, onClear }: ItemParticipantPickerProps) {
  const selectedIds = new Set(selectedParticipants.map((participant) => participant.participant_id));

  if (participants.length === 0) {
    return <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted">Adicione participantes na mesa antes de associar itens.</p>;
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold text-ink-strong">Participantes associados</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-muted p-1">
        <button type="button" className="rounded-md px-2 py-2 text-xs font-semibold text-ink-body hover:bg-surface-panel disabled:opacity-50" disabled={disabled} onClick={onSelectAll}>Todos</button>
        <button type="button" className="rounded-md px-2 py-2 text-xs font-semibold text-ink-body hover:bg-surface-panel disabled:opacity-50" disabled={disabled} onClick={onSelectEligible}>Todos, exceto</button>
        <button type="button" className="rounded-md px-2 py-2 text-xs font-semibold text-ink-body hover:bg-surface-panel disabled:opacity-50" disabled={disabled} onClick={onClear}>Manual</button>
      </div>
      <div className="grid gap-1">
        {participants.map((participant) => {
          const isSelected = selectedIds.has(participant.id);
          const isEligible = eligibleParticipantIds.has(participant.id);

          return (
            <button
              key={participant.id}
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-surface-border bg-surface-panel px-3 py-2 text-left transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onToggle(participant)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded border border-surface-border bg-surface-canvas" aria-hidden="true">
                  {isSelected ? <Check size={16} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-strong">{participant.display_name}</span>
                  <span className="block text-[0.7rem] text-ink-muted">Chegada {formatDateTimeForDisplay(participant.arrival_at)}</span>
                  {participant.departure_at ? <span className="block text-xs text-ink-muted">Saida {formatDateTimeForDisplay(participant.departure_at)}</span> : null}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <Badge className="min-h-6 px-2" tone={isEligible ? 'green' : 'neutral'}>{isEligible ? 'Sugerido' : 'Fora'}</Badge>
                {isSelected && !isEligible ? <AlertTriangle aria-label="Selecionado fora do horario" className="text-red-700 dark:text-red-200" size={16} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-ink-muted">Todos marca a mesa inteira. Todos, exceto marca todos para voce desmarcar quem nao consumiu. Manual comeca vazio.</p>
    </fieldset>
  );
}

export type { SelectedParticipant };
