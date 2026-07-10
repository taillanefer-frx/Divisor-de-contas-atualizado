import type { SplitResult, SplitWeight } from '@/domain/billing/types';

function assertIntegerMoney(amountCents: number) {
  return Number.isSafeInteger(amountCents);
}

export function splitAmountByLargestRemainder(amountCents: number, weights: SplitWeight[]): SplitResult[] {
  if (!assertIntegerMoney(amountCents) || amountCents < 0) {
    throw new Error('amountCents must be a non-negative safe integer.');
  }

  if (weights.length === 0) return [];

  for (const weight of weights) {
    if (!Number.isSafeInteger(weight.weight) || weight.weight <= 0) {
      throw new Error('All weights must be positive safe integers.');
    }
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive.');
  }

  const ranked = weights
    .map((weight, index) => {
      const numerator = BigInt(amountCents) * BigInt(weight.weight);
      const denominator = BigInt(totalWeight);
      const floor = Number(numerator / denominator);
      const remainder = numerator % denominator;

      return {
        id: weight.id,
        index,
        floor,
        remainder,
      };
    })
    .sort((left, right) => {
      if (left.remainder > right.remainder) return -1;
      if (left.remainder < right.remainder) return 1;
      return left.id.localeCompare(right.id);
    });

  const distributed = ranked.reduce((sum, entry) => sum + entry.floor, 0);
  let centsToDistribute = amountCents - distributed;
  const amounts = new Map<string, number>();

  for (const entry of ranked) {
    const extraCent = centsToDistribute > 0 ? 1 : 0;
    amounts.set(entry.id, entry.floor + extraCent);
    centsToDistribute -= extraCent;
  }

  return weights.map((weight) => ({ id: weight.id, amount_cents: amounts.get(weight.id) ?? 0 }));
}
