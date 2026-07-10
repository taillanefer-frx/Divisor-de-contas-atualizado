import { splitAmountByLargestRemainder } from '@/domain/billing/largestRemainder';
import type { SplitResult, SplitWeight } from '@/domain/billing/types';

function percentToBasisPoints(percent: number) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  const [integerPart, decimalPart = ''] = String(percent).split('.');
  const normalizedDecimal = (decimalPart + '00').slice(0, 2);
  const basisPoints = Number(integerPart) * 100 + Number(normalizedDecimal);
  return Number.isSafeInteger(basisPoints) ? basisPoints : null;
}

function roundRationalToCents(numerator: bigint, denominator: bigint) {
  return Number((numerator * 2n + denominator) / (denominator * 2n));
}

export function calculateServiceFeeTotal(subtotalCents: number, serviceFeePercent: number) {
  const basisPoints = percentToBasisPoints(serviceFeePercent);
  if (basisPoints === null) return null;
  if (subtotalCents === 0 || basisPoints === 0) return 0;
  return roundRationalToCents(BigInt(subtotalCents) * BigInt(basisPoints), 10000n);
}

export function splitServiceFee(totalServiceFeeCents: number, consumptionWeights: SplitWeight[]): SplitResult[] {
  const positiveWeights = consumptionWeights.filter((weight) => weight.weight > 0);
  return splitAmountByLargestRemainder(totalServiceFeeCents, positiveWeights);
}
