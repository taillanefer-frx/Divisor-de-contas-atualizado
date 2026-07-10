import type { BillingResult } from '@/domain/billing/types';
import type { PaymentStatus, PaymentType } from '@/lib/supabase/types';

export type PaymentFinancialState = 'pending' | 'partial' | 'paid' | 'no_charge';

export type BillingPayment = {
  id: string;
  table_id: string;
  participant_id: string;
  amount_cents: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  paid_at: string;
  canceled_at: string | null;
  notes: string | null;
};

export type ParticipantPaymentSummary = {
  participant_id: string;
  display_name: string;
  total_due_cents: number;
  total_paid_cents: number;
  remaining_balance_cents: number;
  overpaid_cents: number;
  financial_state: PaymentFinancialState;
  payments: BillingPayment[];
};

export type TablePaymentSummary = {
  participants: ParticipantPaymentSummary[];
  totals: {
    total_due_cents: number;
    total_paid_cents: number;
    remaining_balance_cents: number;
    overpaid_cents: number;
    pending_count: number;
    partial_count: number;
    paid_count: number;
    no_charge_count: number;
  };
  warnings: string[];
};

function assertMoney(value: number) {
  return Number.isSafeInteger(value) && Number.isFinite(value);
}

export function getPaymentFinancialState(totalDueCents: number, totalPaidCents: number): PaymentFinancialState {
  if (totalDueCents === 0 && totalPaidCents === 0) return 'no_charge';
  if (totalPaidCents >= totalDueCents) return 'paid';
  if (totalPaidCents > 0) return 'partial';
  return 'pending';
}

export function calculatePaymentSummary(billing: BillingResult, payments: BillingPayment[], tableId: string): TablePaymentSummary {
  const warnings: string[] = [];
  const participantsById = new Map(billing.participants.map((participant) => [participant.participant_id, participant]));
  const validPaymentsByParticipant = new Map<string, BillingPayment[]>();

  for (const payment of payments) {
    if (payment.table_id !== tableId) {
      warnings.push('Pagamento de outra mesa foi ignorado.');
      continue;
    }

    if (!participantsById.has(payment.participant_id)) {
      warnings.push('Pagamento de participante inexistente foi ignorado no resumo.');
      continue;
    }

    if (!assertMoney(payment.amount_cents) || payment.amount_cents <= 0) {
      warnings.push('Pagamento com valor invalido foi ignorado no resumo.');
      continue;
    }

    if (payment.status !== 'registered') continue;

    const current = validPaymentsByParticipant.get(payment.participant_id) ?? [];
    current.push(payment);
    validPaymentsByParticipant.set(payment.participant_id, current);
  }

  const participants = billing.participants.map((participant) => {
    const validPayments = validPaymentsByParticipant.get(participant.participant_id) ?? [];
    const totalPaidCents = validPayments.reduce((total, payment) => total + payment.amount_cents, 0);
    const totalDueCents = participant.total_due_cents;
    const remainingBalanceCents = Math.max(0, totalDueCents - totalPaidCents);
    const overpaidCents = Math.max(0, totalPaidCents - totalDueCents);

    return {
      participant_id: participant.participant_id,
      display_name: participant.display_name,
      total_due_cents: totalDueCents,
      total_paid_cents: totalPaidCents,
      remaining_balance_cents: remainingBalanceCents,
      overpaid_cents: overpaidCents,
      financial_state: getPaymentFinancialState(totalDueCents, totalPaidCents),
      payments: validPayments,
    } satisfies ParticipantPaymentSummary;
  });

  const totalDueCents = participants.reduce((total, participant) => total + participant.total_due_cents, 0);
  const totalPaidCents = participants.reduce((total, participant) => total + participant.total_paid_cents, 0);

  return {
    participants,
    totals: {
      total_due_cents: totalDueCents,
      total_paid_cents: totalPaidCents,
      remaining_balance_cents: Math.max(0, totalDueCents - totalPaidCents),
      overpaid_cents: Math.max(0, totalPaidCents - totalDueCents),
      pending_count: participants.filter((participant) => participant.financial_state === 'pending').length,
      partial_count: participants.filter((participant) => participant.financial_state === 'partial').length,
      paid_count: participants.filter((participant) => participant.financial_state === 'paid').length,
      no_charge_count: participants.filter((participant) => participant.financial_state === 'no_charge').length,
    },
    warnings,
  };
}
