import type { BillingItem } from '@/domain/billing/types';

export function calculateItemTotal(item: Pick<BillingItem, 'amount_cents' | 'quantity'>) {
  return item.amount_cents * item.quantity;
}
