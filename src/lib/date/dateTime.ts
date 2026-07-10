const pad = (value: number) => String(value).padStart(2, '0');

export function toDatetimeLocalValue(isoValue?: string | null) {
  if (!isoValue) return '';

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
}

export function fromDatetimeLocalValue(localValue: string) {
  const date = new Date(localValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid local datetime value.');
  }

  return date.toISOString();
}

export function getCurrentDatetimeLocalValue() {
  return toDatetimeLocalValue(new Date().toISOString());
}

export function formatDateTimeForDisplay(isoValue?: string | null) {
  if (!isoValue) return 'Nao informado';

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return 'Data invalida';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isLocalDepartureBeforeArrival(arrivalLocalValue: string, departureLocalValue: string) {
  if (!arrivalLocalValue || !departureLocalValue) return false;

  const arrival = new Date(arrivalLocalValue);
  const departure = new Date(departureLocalValue);

  if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) return false;

  return departure.getTime() < arrival.getTime();
}
