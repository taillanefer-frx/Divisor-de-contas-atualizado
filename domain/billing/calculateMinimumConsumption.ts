import type { ParticipantBillingResult } from '@/domain/billing/types';

export function calculateMinimumConsumptionAdjustment(itemConsumptionCents: number, minimumConsumptionCents: number) {
  if (minimumConsumptionCents <= 0) return 0;
  return Math.max(0, minimumConsumptionCents - itemConsumptionCents);
}

export function applyMinimumConsumption(participant: ParticipantBillingResult, minimumConsumptionCents: number) {
  return calculateMinimumConsumptionAdjustment(participant.item_consumption_cents, minimumConsumptionCents);
}
