import type { BillingResult, TablePaymentSummary } from '@/domain/billing';
import { formatMoney } from '@/lib/money/money';

export type BillingExportInput = { tableName: string; generatedAt: string; billing: BillingResult; payments: TablePaymentSummary | null };

function escapeCsv(value: string | number) {
  const text = String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

export function buildBillingSummaryText(input: BillingExportInput) {
  const lines = [
    'Resumo da mesa: ' + input.tableName,
    'Gerado em: ' + new Date(input.generatedAt).toLocaleString('pt-BR'),
    '',
    'Total devido: ' + formatMoney(input.payments?.totals.total_due_cents ?? input.billing.totals.grand_total_cents),
    'Total pago: ' + formatMoney(input.payments?.totals.total_paid_cents ?? 0),
    'Saldo restante: ' + formatMoney(input.payments?.totals.remaining_balance_cents ?? input.billing.totals.grand_total_cents),
    '',
    'Participantes:',
  ];
  for (const participant of input.billing.participants) {
    const payment = input.payments?.participants.find((current) => current.participant_id === participant.participant_id);
    lines.push(participant.display_name + ': deve ' + formatMoney(participant.total_due_cents) + ', pagou ' + formatMoney(payment?.total_paid_cents ?? 0) + ', saldo ' + formatMoney(payment?.remaining_balance_cents ?? participant.total_due_cents));
  }
  return lines.join('\n');
}

export function buildBillingSummaryCsv(input: BillingExportInput) {
  const rows = [['participante', 'total_devido', 'total_pago', 'saldo', 'status']];
  for (const participant of input.billing.participants) {
    const payment = input.payments?.participants.find((current) => current.participant_id === participant.participant_id);
    rows.push([participant.display_name, String(participant.total_due_cents), String(payment?.total_paid_cents ?? 0), String(payment?.remaining_balance_cents ?? participant.total_due_cents), payment?.financial_state ?? 'pending']);
  }
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

export function buildBillingCsvFileName(tableName: string) {
  const safeName = tableName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'mesa';
  return 'resumo-' + safeName + '.csv';
}
