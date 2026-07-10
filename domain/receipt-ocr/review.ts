import type { ItemsRow, ReceiptScanItemsRow } from '@/lib/supabase/types';
import type { ConfirmReceiptScanLinePayload, ReceiptReviewLineDraft, ReceiptTotalsComparison } from '@/domain/receipt-ocr/types';

export function findPossibleDuplicateLineIds(lines: Array<Pick<ReceiptReviewLineDraft, 'receipt_scan_item_id' | 'name' | 'amount_cents'>>) {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const line of lines) {
    const key = [line.name.trim().toLowerCase(), line.amount_cents ?? 'sem-valor'].join('|');
    const previous = seen.get(key);
    if (previous) {
      duplicates.add(previous);
      duplicates.add(line.receipt_scan_item_id);
    } else {
      seen.set(key, line.receipt_scan_item_id);
    }
  }

  return duplicates;
}

export function toReviewDraft(line: ReceiptScanItemsRow, consumedAt: string): ReceiptReviewLineDraft {
  return {
    receipt_scan_item_id: line.id,
    raw_text: line.raw_text,
    name: line.recognized_name ?? '',
    amount_cents: line.recognized_amount_cents,
    quantity: 1,
    consumed_at: consumedAt,
    participant_ids: [],
    review_status: line.review_status === 'ignored' ? 'ignored' : line.review_status === 'edited' ? 'edited' : 'accepted',
    confidence: line.confidence,
    warnings: [],
  };
}

export function validateReviewLineForConfirmation(line: ReceiptReviewLineDraft): string[] {
  if (line.review_status === 'ignored') return [];

  const errors: string[] = [];
  if (!line.name.trim()) errors.push('Informe o nome do item.');
  if (!Number.isInteger(line.amount_cents) || line.amount_cents === null || line.amount_cents < 0) errors.push('Informe um valor valido em centavos.');
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) errors.push('Informe uma quantidade maior que zero.');
  if (!line.consumed_at) errors.push('Informe o horario de consumo.');
  return errors;
}

export function buildConfirmReceiptPayload(lines: ReceiptReviewLineDraft[]): ConfirmReceiptScanLinePayload[] {
  return lines
    .filter((line) => line.review_status !== 'ignored')
    .map((line) => {
      const amount = line.amount_cents;
      if (!Number.isInteger(amount) || amount === null) throw new Error('Linha sem valor valido.');

      return {
        receipt_scan_item_id: line.receipt_scan_item_id,
        name: line.name.trim(),
        amount_cents: amount,
        quantity: line.quantity,
        consumed_at: line.consumed_at,
        participants: line.participant_ids.map((participant_id) => ({ participant_id, assignment_type: 'manual' as const })),
      };
    });
}

export function calculateImportedItemsTotal(lines: ReceiptReviewLineDraft[]) {
  return lines.reduce((total, line) => {
    if (line.review_status === 'ignored' || line.amount_cents === null) return total;
    return total + Math.round(line.amount_cents * line.quantity);
  }, 0);
}

export function compareReceiptTotals(receiptTotalCents: number | null, importedItemsTotalCents: number, appCalculatedTotalCents: number): ReceiptTotalsComparison {
  const differenceCents = receiptTotalCents === null ? null : appCalculatedTotalCents - receiptTotalCents;
  return {
    receiptTotalCents,
    importedItemsTotalCents,
    appCalculatedTotalCents,
    differenceCents,
    status: differenceCents === null ? 'no_receipt_total' : differenceCents === 0 ? 'matches' : differenceCents > 0 ? 'positive_difference' : 'negative_difference',
  };
}

export function importedLineAlreadyHasItem(line: ReceiptScanItemsRow) {
  return Boolean(line.matched_item_id);
}

export function confirmedItemsFromReceipt(items: ItemsRow[], receiptScanId: string) {
  return items.filter((item) => item.receipt_scan_id === receiptScanId && item.status === 'active');
}
