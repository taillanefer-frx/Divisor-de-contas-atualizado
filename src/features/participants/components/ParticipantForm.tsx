import { useMemo, useState, type FormEvent } from 'react';
import { Save, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fromDatetimeLocalValue, getCurrentDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/date/dateTime';
import type { ParticipantsRow } from '@/lib/supabase/types';
import { ParticipantTimeFields } from '@/features/participants/components/ParticipantTimeFields';
import { hasParticipantFormErrors, validateParticipantForm, type ParticipantFormErrors } from '@/features/participants/validation/participantValidation';

export type ParticipantFormSubmitValues = {
  display_name: string;
  arrival_at: string;
  departure_at: string | null;
};

type ParticipantFormProps = {
  participant?: ParticipantsRow;
  isSubmitting?: boolean;
  submitLabel?: string;
  framed?: boolean;
  showDeparture?: boolean;
  onSubmit: (values: ParticipantFormSubmitValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function ParticipantForm({ participant, isSubmitting = false, submitLabel, framed = true, showDeparture = true, onSubmit, onCancel }: ParticipantFormProps) {
  const initialValues = useMemo(
    () => ({
      display_name: participant?.display_name ?? '',
      arrival_at: participant ? toDatetimeLocalValue(participant.arrival_at) : getCurrentDatetimeLocalValue(),
      departure_at: participant?.departure_at ? toDatetimeLocalValue(participant.departure_at) : '',
    }),
    [participant],
  );

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ParticipantFormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateParticipantForm(values);
    setErrors(nextErrors);

    if (hasParticipantFormErrors(nextErrors)) return;

    await onSubmit({
      display_name: values.display_name.trim(),
      arrival_at: fromDatetimeLocalValue(values.arrival_at),
      departure_at: values.departure_at ? fromDatetimeLocalValue(values.departure_at) : null,
    });

    if (!participant) {
      setValues({ display_name: '', arrival_at: getCurrentDatetimeLocalValue(), departure_at: '' });
      setErrors({});
    }
  }

  const displayNameLength = values.display_name.trim().length;

  const form = (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          name="display_name"
          label="Nome na mesa"
          placeholder="Ex.: Ana"
          value={values.display_name}
          maxLength={80}
          error={errors.display_name}
          helperText={displayNameLength + '/80 caracteres. Use apenas o apelido necessario para a conta.'}
          disabled={isSubmitting}
          onChange={(event) => setValues((current) => ({ ...current, display_name: event.target.value }))}
        />

        <ParticipantTimeFields
          values={{ arrival_at: values.arrival_at, departure_at: values.departure_at }}
          errors={{ arrival_at: errors.arrival_at, departure_at: errors.departure_at }}
          disabled={isSubmitting}
          showDeparture={showDeparture}
          onChange={(nextValues) => setValues((current) => ({ ...current, ...nextValues }))}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
              <X aria-hidden="true" size={18} />
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {participant ? <Save aria-hidden="true" size={18} /> : <UserPlus aria-hidden="true" size={18} />}
            {submitLabel ?? (participant ? 'Salvar participante' : 'Adicionar participante')}
          </Button>
        </div>
    </form>
  );

  if (!framed) return form;

  return <Card className="grid gap-4">{form}</Card>;
}
