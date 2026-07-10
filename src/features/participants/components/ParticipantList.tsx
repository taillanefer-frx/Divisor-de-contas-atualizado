import { EmptyState } from '@/components/ui/EmptyState';
import type { ParticipantsRow } from '@/lib/supabase/types';
import { ParticipantCard } from '@/features/participants/components/ParticipantCard';

type ParticipantListProps = {
  participants: ParticipantsRow[];
  disabled?: boolean;
  onEdit: (participant: ParticipantsRow) => void;
  onRequestRemove: (participant: ParticipantsRow) => void;
};

export function ParticipantList({ participants, disabled = false, onEdit, onRequestRemove }: ParticipantListProps) {
  if (participants.length === 0) {
    return <EmptyState title="Ainda nao tem participantes" description="Adicione quem esta na mesa e informe o horario de chegada para preparar a divisao correta depois." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {participants.map((participant) => (
        <ParticipantCard key={participant.id} participant={participant} disabled={disabled} onEdit={onEdit} onRequestRemove={onRequestRemove} />
      ))}
    </div>
  );
}
