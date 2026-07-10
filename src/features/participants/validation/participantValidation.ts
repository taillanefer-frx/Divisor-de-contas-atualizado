import { isLocalDepartureBeforeArrival } from '@/lib/date/dateTime';

export type ParticipantFormErrors = {
  display_name?: string;
  arrival_at?: string;
  departure_at?: string;
};

export type ParticipantFormValues = {
  display_name: string;
  arrival_at: string;
  departure_at: string;
};

export function validateParticipantForm(values: ParticipantFormValues) {
  const errors: ParticipantFormErrors = {};
  const displayName = values.display_name.trim();

  if (!displayName) {
    errors.display_name = 'Informe o nome da pessoa.';
  } else if (displayName.length > 80) {
    errors.display_name = 'Use no maximo 80 caracteres.';
  }

  if (!values.arrival_at) {
    errors.arrival_at = 'Informe o horario de chegada.';
  }

  if (values.departure_at && isLocalDepartureBeforeArrival(values.arrival_at, values.departure_at)) {
    errors.departure_at = 'A saida nao pode ser antes da chegada.';
  }

  return errors;
}

export function hasParticipantFormErrors(errors: ParticipantFormErrors) {
  return Boolean(errors.display_name || errors.arrival_at || errors.departure_at);
}
