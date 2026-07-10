import type { BillingParticipant, SplitResult } from '@/domain/billing/types';

export function calculateCoverCharge(participants: BillingParticipant[], coverChargeCents: number): SplitResult[] {
  return participants.map((participant) => ({ id: participant.id, amount_cents: coverChargeCents }));
}
