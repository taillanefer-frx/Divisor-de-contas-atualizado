import type { BillingInput, BillingIssue } from '@/domain/billing/types';

export function validateBillingInput(input: BillingInput) {
  const errors: BillingIssue[] = [];
  const warnings: BillingIssue[] = [];
  const participantIds = new Set<string>();
  const itemIds = new Set<string>();
  const assignmentKeys = new Set<string>();

  for (const participant of input.participants) {
    if (!participant.id || !participant.display_name.trim()) {
      errors.push({ code: 'invalid_participant', message: 'Participante invalido.', entityId: participant.id });
    }
    participantIds.add(participant.id);
  }

  for (const item of input.items) {
    itemIds.add(item.id);

    if (!item.id || !item.name.trim()) {
      errors.push({ code: 'invalid_item', message: 'Item invalido.', entityId: item.id });
    }

    if (!Number.isSafeInteger(item.amount_cents) || item.amount_cents < 0) {
      errors.push({ code: 'invalid_item', message: 'Item com valor monetario invalido.', entityId: item.id });
    }

    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      errors.push({ code: 'invalid_item', message: 'Item com quantidade invalida para o MVP.', entityId: item.id });
    }
  }

  for (const assignment of input.itemParticipants) {
    const key = assignment.item_id + ':' + assignment.participant_id;

    if (!itemIds.has(assignment.item_id)) {
      errors.push({ code: 'missing_item', message: 'Associacao aponta para item inexistente.', entityId: assignment.item_id });
    }

    if (!participantIds.has(assignment.participant_id)) {
      errors.push({ code: 'missing_participant', message: 'Associacao aponta para participante inexistente.', entityId: assignment.participant_id });
    }

    if (!Number.isSafeInteger(assignment.share_weight) || assignment.share_weight <= 0) {
      errors.push({ code: 'invalid_assignment', message: 'Associacao com peso invalido.', entityId: assignment.item_id });
    }

    if (assignmentKeys.has(key)) {
      errors.push({ code: 'duplicate_assignment', message: 'Associacao duplicada para o mesmo item e participante.', entityId: assignment.item_id });
    }

    assignmentKeys.add(key);
  }

  for (const item of input.items) {
    const itemAssignments = input.itemParticipants.filter((assignment) => assignment.item_id === item.id);

    if (item.status === 'void' && itemAssignments.length > 0) {
      warnings.push({ code: 'void_item_has_assignments', message: 'Item anulado possui associacoes, mas nao entra no calculo.', entityId: item.id });
    }

    if (item.status === 'active' && itemAssignments.length === 0) {
      errors.push({ code: 'item_without_participants', message: 'Item ativo sem participantes associados.', entityId: item.id });
    }

    if (item.status === 'active' && itemAssignments.length > 0) {
      const weightSum = itemAssignments.reduce((sum, assignment) => sum + assignment.share_weight, 0);
      if (weightSum <= 0) {
        errors.push({ code: 'zero_weight_sum', message: 'Soma de pesos do item precisa ser maior que zero.', entityId: item.id });
      }
    }
  }

  if (!Number.isFinite(input.settings.service_fee_percent) || input.settings.service_fee_percent < 0 || input.settings.service_fee_percent > 100) {
    errors.push({ code: 'invalid_settings', message: 'Percentual de taxa de servico invalido.' });
  }

  if (!Number.isSafeInteger(input.settings.cover_charge_cents) || input.settings.cover_charge_cents < 0) {
    errors.push({ code: 'invalid_settings', message: 'Couvert invalido.' });
  }

  if (!Number.isSafeInteger(input.settings.minimum_consumption_cents) || input.settings.minimum_consumption_cents < 0) {
    errors.push({ code: 'invalid_settings', message: 'Consumacao minima invalida.' });
  }

  if (input.settings.rounding_strategy !== 'largest_remainder') {
    warnings.push({ code: 'unsupported_rounding_strategy', message: 'O motor usa largest_remainder nesta etapa.' });
  }

  if (input.participants.length === 0 && input.items.length === 0) {
    warnings.push({ code: 'empty_bill', message: 'Mesa sem participantes e sem itens.' });
  }

  return { errors, warnings };
}
