import { calculateBill, calculatePaymentSummary, getPaymentFinancialState } from '@/domain/billing';
import type { BillingInput, BillingPayment } from '@/domain/billing';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function billingInput(totalCents = 10000): BillingInput {
  return {
    participants: [{ id: 'ana', display_name: 'Ana' }],
    items: totalCents > 0 ? [{ id: 'item', name: 'Item', amount_cents: totalCents, quantity: 1, status: 'active' }] : [],
    itemParticipants: totalCents > 0 ? [{ item_id: 'item', participant_id: 'ana', share_weight: 1 }] : [],
    settings: { service_fee_percent: 0, cover_charge_cents: 0, minimum_consumption_cents: 0, rounding_strategy: 'largest_remainder' },
  };
}

function payment(overrides: Partial<BillingPayment> = {}): BillingPayment {
  return {
    id: overrides.id ?? 'p1',
    table_id: overrides.table_id ?? 'table1',
    participant_id: overrides.participant_id ?? 'ana',
    amount_cents: overrides.amount_cents ?? 4000,
    payment_type: overrides.payment_type ?? 'partial',
    status: overrides.status ?? 'registered',
    paid_at: overrides.paid_at ?? '2026-06-26T12:00:00.000Z',
    canceled_at: overrides.canceled_at ?? null,
    notes: overrides.notes ?? null,
  };
}

function summary(totalCents: number, payments: BillingPayment[]) {
  return calculatePaymentSummary(calculateBill(billingInput(totalCents)), payments, 'table1');
}

export function runPaymentTests() {
  const tests: Array<[string, () => void]> = [
    ['deve 100 e nao pagou', () => { const result = summary(10000, []); assert(result.participants[0].financial_state === 'pending' && result.participants[0].remaining_balance_cents === 10000, 'pendente incorreto'); }],
    ['pagamento parcial 40', () => { const result = summary(10000, [payment({ amount_cents: 4000 })]); assert(result.participants[0].financial_state === 'partial' && result.participants[0].remaining_balance_cents === 6000, 'parcial incorreto'); }],
    ['segundo pagamento 60', () => { const result = summary(10000, [payment({ id: 'p1', amount_cents: 4000 }), payment({ id: 'p2', amount_cents: 6000 })]); assert(result.participants[0].financial_state === 'paid' && result.participants[0].remaining_balance_cents === 0, 'complemento incorreto'); }],
    ['pagamento total unico', () => { const result = summary(10000, [payment({ amount_cents: 10000, payment_type: 'total' })]); assert(result.participants[0].financial_state === 'paid', 'total incorreto'); }],
    ['pagamento um centavo', () => { const result = summary(10000, [payment({ amount_cents: 1 })]); assert(result.participants[0].total_paid_cents === 1 && result.participants[0].financial_state === 'partial', 'centavo incorreto'); }],
    ['pagamento acima do devido', () => { const result = summary(3000, [payment({ amount_cents: 5000 })]); assert(result.participants[0].overpaid_cents === 2000 && result.participants[0].financial_state === 'paid', 'excedente incorreto'); }],
    ['deve zero', () => { const result = summary(0, []); assert(result.participants[0].financial_state === 'no_charge', 'sem cobranca incorreto'); }],
    ['deve zero e pagou', () => { const result = summary(0, [payment({ amount_cents: 1000 })]); assert(result.participants[0].financial_state === 'paid' && result.participants[0].overpaid_cents === 1000, 'zero com pagamento incorreto'); }],
    ['pagamento cancelado', () => { const result = summary(10000, [payment({ status: 'canceled', canceled_at: '2026-06-26T13:00:00.000Z' })]); assert(result.participants[0].total_paid_cents === 0, 'cancelado contou'); }],
    ['varios pagamentos registrados', () => { const result = summary(10000, [payment({ id: 'p1', amount_cents: 2000 }), payment({ id: 'p2', amount_cents: 3000 })]); assert(result.participants[0].total_paid_cents === 5000, 'soma varios incorreta'); }],
    ['registrado e cancelado', () => { const result = summary(10000, [payment({ id: 'p1', amount_cents: 2000 }), payment({ id: 'p2', amount_cents: 3000, status: 'canceled', canceled_at: 'x' })]); assert(result.participants[0].total_paid_cents === 2000, 'cancelado misto contou'); }],
    ['conta aumenta depois do pagamento', () => { const result = summary(12000, [payment({ amount_cents: 10000 })]); assert(result.participants[0].financial_state === 'partial' && result.participants[0].remaining_balance_cents === 2000, 'aumento incorreto'); }],
    ['conta diminui depois do pagamento', () => { const result = summary(7000, [payment({ amount_cents: 10000 })]); assert(result.participants[0].financial_state === 'paid' && result.participants[0].overpaid_cents === 3000, 'diminuicao incorreta'); }],
    ['pagamento igual ao total', () => { assert(getPaymentFinancialState(100, 100) === 'paid', 'igual incorreto'); }],
    ['pagamento maior que total', () => { assert(getPaymentFinancialState(100, 101) === 'paid', 'maior incorreto'); }],
    ['pagamento menor que total', () => { assert(getPaymentFinancialState(100, 99) === 'partial', 'menor incorreto'); }],
    ['valor zero invalido ignorado', () => { const result = summary(100, [payment({ amount_cents: 0 })]); assert(result.participants[0].total_paid_cents === 0 && result.warnings.length > 0, 'zero nao ignorado'); }],
    ['valor negativo invalido ignorado', () => { const result = summary(100, [payment({ amount_cents: -1 })]); assert(result.participants[0].total_paid_cents === 0 && result.warnings.length > 0, 'negativo nao ignorado'); }],
    ['valor invalido decimal ignorado', () => { const result = summary(100, [payment({ amount_cents: 1.5 })]); assert(result.participants[0].total_paid_cents === 0 && result.warnings.length > 0, 'decimal nao ignorado'); }],
    ['lista vazia', () => { const result = summary(100, []); assert(result.totals.total_paid_cents === 0, 'vazia incorreta'); }],
    ['participante inexistente', () => { const result = summary(100, [payment({ participant_id: 'ghost' })]); assert(result.totals.total_paid_cents === 0 && result.warnings.length > 0, 'participante inexistente contou'); }],
    ['pagamento de outra mesa', () => { const result = summary(100, [payment({ table_id: 'other' })]); assert(result.totals.total_paid_cents === 0 && result.warnings.length > 0, 'outra mesa contou'); }],
    ['soma geral pagamentos', () => { const result = summary(10000, [payment({ id: 'p1', amount_cents: 4000 }), payment({ id: 'p2', amount_cents: 1000 })]); assert(result.totals.total_paid_cents === 5000, 'soma geral incorreta'); }],
    ['soma geral saldos', () => { const result = summary(10000, [payment({ amount_cents: 4000 })]); assert(result.totals.remaining_balance_cents === 6000, 'saldo geral incorreto'); }],
    ['valor excedente geral', () => { const result = summary(100, [payment({ amount_cents: 150 })]); assert(result.totals.overpaid_cents === 50, 'excedente geral incorreto'); }],
    ['valores grandes', () => { const result = summary(900000000, [payment({ amount_cents: 800000000 })]); assert(result.totals.total_paid_cents === 800000000, 'grande incorreto'); }],
    ['nenhum NaN', () => { const result = summary(100, [payment({ amount_cents: 1 })]); assert([result.totals.total_paid_cents, result.totals.remaining_balance_cents].every(Number.isFinite), 'NaN encontrado'); }],
    ['nenhum Infinity', () => { const result = summary(100, [payment({ amount_cents: 1 })]); assert([result.totals.total_paid_cents, result.totals.remaining_balance_cents].every((value) => value !== Infinity), 'Infinity encontrado'); }],
    ['nenhum decimal final', () => { const result = summary(100, [payment({ amount_cents: 1 })]); assert([result.totals.total_paid_cents, result.totals.remaining_balance_cents].every(Number.isInteger), 'decimal encontrado'); }],
    ['nao modifica entrada', () => { const payments = [payment({ amount_cents: 40 })]; const before = clone(payments); summary(100, payments); assert(JSON.stringify(payments) === JSON.stringify(before), 'entrada mutada'); }],
  ];
  const passed: string[] = [];
  for (const [name, run] of tests) { run(); passed.push(name); }
  return { total: tests.length, passed };
}
