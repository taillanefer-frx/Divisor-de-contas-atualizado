import { calculateCoverCharge } from '@/domain/billing/calculateCoverCharge';
import { calculateItemTotal } from '@/domain/billing/calculateItemTotal';
import { applyMinimumConsumption } from '@/domain/billing/calculateMinimumConsumption';
import { calculateServiceFeeTotal, splitServiceFee } from '@/domain/billing/calculateServiceFee';
import { splitAmountByLargestRemainder } from '@/domain/billing/largestRemainder';
import { validateBillingInput } from '@/domain/billing/validations';
import type { BillingInput, BillingResult, ParticipantBillingResult } from '@/domain/billing/types';

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateBill(input: BillingInput): BillingResult {
  const validation = validateBillingInput(input);
  const participants: ParticipantBillingResult[] = input.participants.map((participant) => ({
    participant_id: participant.id,
    display_name: participant.display_name,
    item_consumption_cents: 0,
    service_fee_cents: 0,
    cover_charge_cents: 0,
    minimum_consumption_adjustment_cents: 0,
    subtotal_cents: 0,
    total_due_cents: 0,
    items: [],
  }));
  const participantsById = new Map(participants.map((participant) => [participant.participant_id, participant]));

  if (validation.errors.length > 0) {
    return {
      participants,
      totals: {
        items_subtotal_cents: 0,
        service_fee_cents: 0,
        cover_charge_cents: 0,
        minimum_consumption_adjustment_cents: 0,
        grand_total_cents: 0,
        participants_total_cents: 0,
        reconciliation_difference_cents: 0,
      },
      warnings: validation.warnings,
      errors: validation.errors,
    };
  }

  const activeItems = input.items.filter((item) => item.status === 'active');

  for (const item of activeItems) {
    const itemTotal = calculateItemTotal(item);
    const assignments = input.itemParticipants.filter((assignment) => assignment.item_id === item.id);
    const splits = splitAmountByLargestRemainder(
      itemTotal,
      assignments.map((assignment) => ({ id: assignment.participant_id, weight: assignment.share_weight })),
    );

    for (const split of splits) {
      const participant = participantsById.get(split.id);
      const assignment = assignments.find((current) => current.participant_id === split.id);
      if (!participant || !assignment) continue;

      participant.item_consumption_cents += split.amount_cents;
      participant.items.push({
        item_id: item.id,
        item_name: item.name,
        line_total_cents: itemTotal,
        assigned_cents: split.amount_cents,
        share_weight: assignment.share_weight,
      });
    }
  }

  const itemsSubtotal = sum(participants.map((participant) => participant.item_consumption_cents));
  const serviceFeeTotal = calculateServiceFeeTotal(itemsSubtotal, input.settings.service_fee_percent);

  if (serviceFeeTotal === null) {
    validation.errors.push({ code: 'invalid_settings', message: 'Percentual de taxa de servico invalido.' });
  } else if (serviceFeeTotal > 0) {
    const serviceSplits = splitServiceFee(
      serviceFeeTotal,
      participants.map((participant) => ({ id: participant.participant_id, weight: participant.item_consumption_cents })),
    );

    for (const split of serviceSplits) {
      const participant = participantsById.get(split.id);
      if (participant) participant.service_fee_cents = split.amount_cents;
    }
  }

  for (const coverCharge of calculateCoverCharge(input.participants, input.settings.cover_charge_cents)) {
    const participant = participantsById.get(coverCharge.id);
    if (participant) participant.cover_charge_cents = coverCharge.amount_cents;
  }

  if (input.settings.minimum_consumption_cents > 0) {
    validation.warnings.push({ code: 'minimum_consumption_rule_limited', message: 'Consumacao minima compara apenas consumo de itens nesta etapa.' });
  }

  for (const participant of participants) {
    participant.minimum_consumption_adjustment_cents = applyMinimumConsumption(participant, input.settings.minimum_consumption_cents);
    participant.subtotal_cents = participant.item_consumption_cents + participant.service_fee_cents + participant.cover_charge_cents;
    participant.total_due_cents = participant.subtotal_cents + participant.minimum_consumption_adjustment_cents;

    if (participant.item_consumption_cents === 0 && input.items.length > 0) {
      validation.warnings.push({ code: 'participant_without_items', message: 'Participante sem itens associados.', entityId: participant.participant_id });
    }
  }

  const coverTotal = sum(participants.map((participant) => participant.cover_charge_cents));
  const minimumTotal = sum(participants.map((participant) => participant.minimum_consumption_adjustment_cents));
  const serviceTotal = sum(participants.map((participant) => participant.service_fee_cents));
  const grandTotal = itemsSubtotal + serviceTotal + coverTotal + minimumTotal;
  const participantsTotal = sum(participants.map((participant) => participant.total_due_cents));

  return {
    participants,
    totals: {
      items_subtotal_cents: itemsSubtotal,
      service_fee_cents: serviceTotal,
      cover_charge_cents: coverTotal,
      minimum_consumption_adjustment_cents: minimumTotal,
      grand_total_cents: grandTotal,
      participants_total_cents: participantsTotal,
      reconciliation_difference_cents: grandTotal - participantsTotal,
    },
    warnings: validation.warnings,
    errors: validation.errors,
  };
}
