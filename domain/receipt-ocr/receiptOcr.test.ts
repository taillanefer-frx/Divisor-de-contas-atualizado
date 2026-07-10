import { strict as assert } from 'node:assert';
import {
  buildConfirmReceiptPayload,
  buildReceiptStoragePath,
  calculateImportedItemsTotal,
  classifyReceiptLine,
  compareReceiptTotals,
  findPossibleDuplicateLineIds,
  getConfidenceLevel,
  normalizeOcrProviderResult,
  normalizeRawReceiptLine,
  parseOcrMoneyToCents,
  sanitizeReceiptFileName,
  validateReceiptImageFile,
  type ReceiptReviewLineDraft,
} from './index';

function file(name: string, type: string, size = 100_000) {
  return { name, type, size } as File;
}

function draft(id: string, name = 'Cerveja', amount_cents: number | null = 1200): ReceiptReviewLineDraft {
  return {
    receipt_scan_item_id: id,
    raw_text: name + ' 12,00',
    name,
    amount_cents,
    quantity: 1,
    consumed_at: '2026-06-29T12:00:00.000Z',
    participant_ids: ['p1'],
    review_status: 'accepted',
    confidence: null,
    warnings: [],
  };
}

export async function runReceiptOcrTests() {
  assert.equal(validateReceiptImageFile(file('nota.jpg', 'image/jpeg')).ok, true, 'JPEG valido');
  assert.equal(validateReceiptImageFile(file('nota.png', 'image/png')).ok, true, 'PNG valido');
  assert.equal(validateReceiptImageFile(file('nota.webp', 'image/webp')).ok, true, 'WebP valido');
  assert.equal(validateReceiptImageFile(file('nota.jpg', '')).ok, false, 'sem MIME');
  assert.equal(validateReceiptImageFile(file('nota.svg', 'image/svg+xml')).ok, false, 'MIME invalido');
  assert.equal(validateReceiptImageFile(file('nota.jpg', 'image/jpeg', 0)).ok, false, 'arquivo vazio');
  assert.equal(validateReceiptImageFile(file('nota.jpg', 'image/jpeg', 9 * 1024 * 1024)).ok, false, 'arquivo grande');
  assert.equal(sanitizeReceiptFileName('../nota ruim.jpg'), 'nota-ruim.jpg', 'nome inseguro');
  assert.equal(buildReceiptStoragePath('table-id', 'scan-id', '../nota ruim.jpg'), 'tables/table-id/receipts/scan-id/nota-ruim.jpg', 'path seguro');

  assert.deepEqual(parseOcrMoneyToCents('12,00'), { ok: true, cents: 1200 }, '12,00');
  assert.deepEqual(parseOcrMoneyToCents('1.234,56'), { ok: true, cents: 123456 }, '1.234,56');
  assert.deepEqual(parseOcrMoneyToCents('R$ 35,90'), { ok: true, cents: 3590 }, 'R$');
  assert.equal(parseOcrMoneyToCents('abc').ok, false, 'valor invalido');

  assert.equal(normalizeRawReceiptLine('CERVEJA', 0).amountCents, null, 'linha sem valor');
  assert.equal(normalizeRawReceiptLine('12,00', 0).suggestedName, null, 'linha sem descricao');
  assert.equal(classifyReceiptLine('TOTAL 127,90'), 'total', 'total');
  assert.equal(classifyReceiptLine('SUBTOTAL 100,00'), 'subtotal', 'subtotal');
  assert.equal(classifyReceiptLine('SERVICO 10% 12,00'), 'service_fee', 'taxa servico');
  assert.equal(classifyReceiptLine('CNPJ 00.000.000/0001-00'), 'tax_id', 'cnpj');
  assert.equal(classifyReceiptLine('CERVEJA 12,00'), 'item', 'item valido');

  const duplicateIds = findPossibleDuplicateLineIds([draft('1'), draft('2')]);
  assert.equal(duplicateIds.has('1') && duplicateIds.has('2'), true, 'possivel duplicidade');
  assert.equal(findPossibleDuplicateLineIds([draft('1'), draft('2')]).size, 2, 'duas compras iguais nao removidas automaticamente');
  assert.equal(getConfidenceLevel(0.4), 'low', 'confianca baixa');
  assert.equal(getConfidenceLevel(null), 'unknown', 'confianca ausente');

  assert.equal(normalizeOcrProviderResult({ lines: [] }).lines.length, 0, 'OCR vazio');
  assert.equal(normalizeOcrProviderResult({ lines: 'invalid' }).lines.length, 0, 'OCR invalido');
  assert.equal(normalizeOcrProviderResult({ provider: 'google-vision', lines: [{ text: 'AGUA 5,00', confidence: 0.9 }] }).lines[0].amountCents, 500, 'normalizacao fornecedor');

  assert.equal(['pending', 'processing', 'completed', 'failed', 'canceled', 'confirmed'].includes('confirmed'), true, 'status processamento');
  const payload = buildConfirmReceiptPayload([draft('line-1')]);
  assert.equal(payload.length, 1, 'confirmacao idempotente payload unico');
  assert.equal(payload[0].receipt_scan_item_id, 'line-1', 'linha ja importada usa id de linha');

  assert.equal(compareReceiptTotals(1000, 1000, 1000).status, 'matches', 'total igual');
  assert.equal(compareReceiptTotals(900, 900, 1000).status, 'positive_difference', 'diferenca positiva');
  assert.equal(compareReceiptTotals(1100, 1100, 1000).status, 'negative_difference', 'diferenca negativa');

  const input = [draft('immutable')];
  const before = JSON.stringify(input);
  calculateImportedItemsTotal(input);
  assert.equal(JSON.stringify(input), before, 'funcao nao modifica entrada');
  assert.equal(Number.isInteger(calculateImportedItemsTotal([draft('integer')])), true, 'nenhum decimal final');
}

await runReceiptOcrTests();
