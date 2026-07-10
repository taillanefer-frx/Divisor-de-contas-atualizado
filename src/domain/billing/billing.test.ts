import { calculateBill, splitAmountByLargestRemainder } from '@/domain/billing';
import type { BillingInput } from '@/domain/billing';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function baseInput(overrides: Partial<BillingInput> = {}): BillingInput {
  return {
    participants: [
      { id: 'ana', display_name: 'Ana' },
      { id: 'bruno', display_name: 'Bruno' },
      { id: 'carla', display_name: 'Carla' },
    ],
    items: [],
    itemParticipants: [],
    settings: {
      service_fee_percent: 0,
      cover_charge_cents: 0,
      minimum_consumption_cents: 0,
      rounding_strategy: 'largest_remainder',
    },
    ...overrides,
  };
}

function totalsMatch(result: ReturnType<typeof calculateBill>) {
  return result.totals.grand_total_cents === result.totals.participants_total_cents && result.totals.reconciliation_difference_cents === 0;
}

export function runBillingTests() {
  const tests: Array<[string, () => void]> = [
    ['R$ 100 dividido igualmente por 3', () => {
      const split = splitAmountByLargestRemainder(10000, [{ id: 'ana', weight: 1 }, { id: 'bruno', weight: 1 }, { id: 'carla', weight: 1 }]);
      assert(split.map((entry) => entry.amount_cents).join(',') === '3334,3333,3333', 'split inesperado');
    }],
    ['100 centavos dividido por 3', () => {
      const split = splitAmountByLargestRemainder(100, [{ id: 'ana', weight: 1 }, { id: 'bruno', weight: 1 }, { id: 'carla', weight: 1 }]);
      assert(split.map((entry) => entry.amount_cents).join(',') === '34,33,33', 'centavos nao fecharam');
    }],
    ['item com pesos 1 e 2', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'Item', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 2 }] }));
      assert(result.participants[0].total_due_cents === 333 && result.participants[1].total_due_cents === 667, 'peso 1/2 incorreto');
    }],
    ['item individual', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'Solo', amount_cents: 500, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.participants[0].total_due_cents === 500, 'individual incorreto');
    }],
    ['item compartilhado', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'Dupla', amount_cents: 800, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 1 }] }));
      assert(result.participants.every((participant) => participant.total_due_cents === 400), 'compartilhado incorreto');
    }],
    ['varios itens', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }, { id: 'i2', name: 'B', amount_cents: 500, quantity: 2, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i2', participant_id: 'bruno', share_weight: 1 }] }));
      assert(result.totals.items_subtotal_cents === 2000 && totalsMatch(result), 'varios itens incorreto');
    }],
    ['participante sem itens', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.participants[1].total_due_cents === 0 && result.warnings.some((warning) => warning.code === 'participant_without_items'), 'sem itens incorreto');
    }],
    ['item sem participantes', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }] }));
      assert(result.errors.some((error) => error.code === 'item_without_participants'), 'item sem participantes nao bloqueou');
    }],
    ['peso zero', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 0 }] }));
      assert(result.errors.some((error) => error.code === 'invalid_assignment'), 'peso zero nao bloqueou');
    }],
    ['peso negativo', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: -1 }] }));
      assert(result.errors.some((error) => error.code === 'invalid_assignment'), 'peso negativo nao bloqueou');
    }],
    ['soma de pesos zero', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 0 }] }));
      assert(result.errors.length > 0, 'soma zero nao bloqueou');
    }],
    ['associacao duplicada', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.errors.some((error) => error.code === 'duplicate_assignment'), 'duplicada nao bloqueou');
    }],
    ['item anulado', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1000, quantity: 1, status: 'void' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.totals.grand_total_cents === 0 && result.warnings.some((warning) => warning.code === 'void_item_has_assignments'), 'anulado entrou no total');
    }],
    ['quantidade maior que 1', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 1200, quantity: 3, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.totals.items_subtotal_cents === 3600, 'quantidade maior que 1 incorreta');
    }],
    ['valor zero', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: 0, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.totals.grand_total_cents === 0, 'valor zero incorreto');
    }],
    ['lista vazia', () => {
      const result = calculateBill(baseInput({ participants: [], items: [], itemParticipants: [] }));
      assert(result.warnings.some((warning) => warning.code === 'empty_bill'), 'lista vazia sem aviso');
    }],
    ['taxa de servico 10%', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 3000, quantity: 1, status: 'active' }, { id: 'i2', name: 'B', amount_cents: 7000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i2', participant_id: 'bruno', share_weight: 1 }], settings: { service_fee_percent: 10, cover_charge_cents: 0, minimum_consumption_cents: 0, rounding_strategy: 'largest_remainder' } }));
      assert(result.participants[0].service_fee_cents === 300 && result.participants[1].service_fee_cents === 700, 'taxa 10 incorreta');
    }],
    ['taxa com arredondamento', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 999, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }], settings: { service_fee_percent: 10, cover_charge_cents: 0, minimum_consumption_cents: 0, rounding_strategy: 'largest_remainder' } }));
      assert(result.totals.service_fee_cents === 100, 'taxa arredondamento incorreta');
    }],
    ['subtotal zero com taxa ativada', () => {
      const result = calculateBill(baseInput({ settings: { service_fee_percent: 10, cover_charge_cents: 0, minimum_consumption_cents: 0, rounding_strategy: 'largest_remainder' } }));
      assert(result.totals.service_fee_cents === 0, 'taxa com subtotal zero incorreta');
    }],
    ['couvert por pessoa', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], settings: { service_fee_percent: 0, cover_charge_cents: 500, minimum_consumption_cents: 0, rounding_strategy: 'largest_remainder' } }));
      assert(result.totals.cover_charge_cents === 1000 && totalsMatch(result), 'couvert incorreto');
    }],
    ['consumacao minima nao atingida', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 4200, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }], settings: { service_fee_percent: 0, cover_charge_cents: 0, minimum_consumption_cents: 5000, rounding_strategy: 'largest_remainder' } }));
      assert(result.participants[0].minimum_consumption_adjustment_cents === 800, 'minima nao atingida incorreta');
    }],
    ['consumacao minima atingida', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 5000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }], settings: { service_fee_percent: 0, cover_charge_cents: 0, minimum_consumption_cents: 5000, rounding_strategy: 'largest_remainder' } }));
      assert(result.participants[0].minimum_consumption_adjustment_cents === 0, 'minima atingida incorreta');
    }],
    ['consumo acima da minima', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 6000, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }], settings: { service_fee_percent: 0, cover_charge_cents: 0, minimum_consumption_cents: 5000, rounding_strategy: 'largest_remainder' } }));
      assert(result.participants[0].minimum_consumption_adjustment_cents === 0, 'acima minima incorreto');
    }],
    ['diferenca de 1 centavo', () => {
      const split = splitAmountByLargestRemainder(1, [{ id: 'ana', weight: 1 }, { id: 'bruno', weight: 1 }]);
      assert(split[0].amount_cents + split[1].amount_cents === 1, '1 centavo nao fechou');
    }],
    ['diferenca de varios centavos', () => {
      const split = splitAmountByLargestRemainder(7, [{ id: 'ana', weight: 1 }, { id: 'bruno', weight: 1 }, { id: 'carla', weight: 1 }]);
      assert(split.reduce((total, entry) => total + entry.amount_cents, 0) === 7, 'varios centavos nao fecharam');
    }],
    ['desempate deterministicamente por id', () => {
      const split = splitAmountByLargestRemainder(1, [{ id: 'bruno', weight: 1 }, { id: 'ana', weight: 1 }]);
      assert(split.find((entry) => entry.id === 'ana')?.amount_cents === 1, 'desempate por id falhou');
    }],
    ['ordem dos participantes sem alterar fechamento', () => {
      const first = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 100, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 1 }] }));
      const second = calculateBill(baseInput({ participants: [{ id: 'bruno', display_name: 'Bruno' }, { id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 100, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 1 }] }));
      assert(first.totals.grand_total_cents === second.totals.grand_total_cents && totalsMatch(second), 'ordem alterou fechamento');
    }],
    ['dados invalidos', () => {
      const result = calculateBill(baseInput({ items: [{ id: 'i1', name: 'A', amount_cents: -1, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.errors.length > 0, 'dados invalidos nao bloquearam');
    }],
    ['valores grandes seguros', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }], items: [{ id: 'i1', name: 'A', amount_cents: 900000000, quantity: 2, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }] }));
      assert(result.totals.items_subtotal_cents === 1800000000 && totalsMatch(result), 'valores grandes incorretos');
    }],
    ['soma dos participantes igual ao total geral', () => {
      const result = calculateBill(baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 999, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 1 }], settings: { service_fee_percent: 10, cover_charge_cents: 333, minimum_consumption_cents: 1000, rounding_strategy: 'largest_remainder' } }));
      assert(totalsMatch(result), 'soma final nao fechou');
    }],
    ['invariantes de inteiros finitos e sem mutacao', () => {
      const input = baseInput({ participants: [{ id: 'ana', display_name: 'Ana' }, { id: 'bruno', display_name: 'Bruno' }], items: [{ id: 'i1', name: 'A', amount_cents: 100, quantity: 1, status: 'active' }], itemParticipants: [{ item_id: 'i1', participant_id: 'ana', share_weight: 1 }, { item_id: 'i1', participant_id: 'bruno', share_weight: 1 }] });
      const before = deepClone(input);
      const result = calculateBill(input);
      const values = [result.totals.grand_total_cents, ...result.participants.flatMap((participant) => [participant.item_consumption_cents, participant.total_due_cents])];
      assert(values.every((value) => Number.isSafeInteger(value) && Number.isFinite(value)), 'valor final invalido');
      assert(JSON.stringify(input) === JSON.stringify(before), 'entrada foi mutada');
      assert(totalsMatch(result), 'invariante de fechamento falhou');
    }],
  ];

  const passed: string[] = [];

  for (const [name, run] of tests) {
    run();
    passed.push(name);
  }

  return { passed, total: tests.length };
}
