import type { ParticipantsRow } from '@/lib/supabase/types';

export function wasParticipantPresentAt(participant: Pick<ParticipantsRow, 'arrival_at' | 'departure_at'>, consumedAt: string) {
  const arrivalTime = new Date(participant.arrival_at).getTime();
  const consumedTime = new Date(consumedAt).getTime();
  const departureTime = participant.departure_at ? new Date(participant.departure_at).getTime() : null;

  if (Number.isNaN(arrivalTime) || Number.isNaN(consumedTime)) return false;
  if (departureTime !== null && Number.isNaN(departureTime)) return false;

  return arrivalTime <= consumedTime && (departureTime === null || departureTime >= consumedTime);
}

export function getEligibleParticipantIds(participants: Pick<ParticipantsRow, 'id' | 'arrival_at' | 'departure_at'>[], consumedAt: string) {
  return new Set(participants.filter((participant) => wasParticipantPresentAt(participant, consumedAt)).map((participant) => participant.id));
}
