import { Clock, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export type ParticipantTimeFieldValues = {
  arrival_at: string;
  departure_at: string;
};

type ParticipantTimeFieldsProps = {
  values: ParticipantTimeFieldValues;
  errors?: Partial<Record<keyof ParticipantTimeFieldValues, string>>;
  disabled?: boolean;
  showDeparture?: boolean;
  onChange: (values: ParticipantTimeFieldValues) => void;
};

export function ParticipantTimeFields({ values, errors, disabled = false, showDeparture = true, onChange }: ParticipantTimeFieldsProps) {
  return (
    <div className={showDeparture ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
      <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <Clock aria-hidden="true" size={14} />
          Chegada
        </div>
        <Input
          name="arrival_at"
          type="datetime-local"
          value={values.arrival_at}
          error={errors?.arrival_at}
          disabled={disabled}
          onChange={(event) => onChange({ ...values, arrival_at: event.target.value })}
        />
      </div>
      {showDeparture ? <div className="grid gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <LogOut aria-hidden="true" size={14} />
          Saida opcional
        </div>
        <Input
          name="departure_at"
          type="datetime-local"
          value={values.departure_at}
          error={errors?.departure_at}
          disabled={disabled}
          onChange={(event) => onChange({ ...values, departure_at: event.target.value })}
        />
      </div> : null}
    </div>
  );
}
