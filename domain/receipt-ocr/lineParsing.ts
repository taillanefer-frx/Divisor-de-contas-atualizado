import { parseCurrencyToCents } from '@/lib/money/money';
import type { OcrConfidenceLevel, OcrLineKind, OcrReceiptLine } from '@/domain/receipt-ocr/types';

const totalPattern = /\b(total|valor total|total geral)\b/i;
const subtotalPattern = /\b(subtotal|sub total)\b/i;
const serviceFeePattern = /\b(servi[cç]o|gorjeta|10\s*%)\b/i;
const discountPattern = /\b(desconto|abatimento)\b/i;
const paymentPattern = /\b(pix|credito|cr[eé]dito|debito|d[eé]bito|dinheiro|troco|pago)\b/i;
const taxIdPattern = /\b(cnpj|cpf|inscri[cç][aã]o|ie)\b/i;
const metadataPattern = /\b(endere[cç]o|telefone|data|hora|cupom|extrato|mesa|operador|gar[cç]om)\b/i;
const moneyCandidatePattern = /(R\$\s*)?\d{1,3}(?:[\.\s]\d{3})*(?:,\d{2}|\.\d{2})|\d+(?:,\d{2}|\.\d{2})/g;

export function classifyReceiptLine(rawText: string): OcrLineKind {
  const text = rawText.trim();
  if (!text) return 'unknown';
  if (taxIdPattern.test(text)) return 'tax_id';
  if (subtotalPattern.test(text)) return 'subtotal';
  if (totalPattern.test(text)) return 'total';
  if (serviceFeePattern.test(text)) return 'service_fee';
  if (discountPattern.test(text)) return 'discount';
  if (paymentPattern.test(text)) return 'payment';
  if (metadataPattern.test(text)) return 'metadata';
  if (extractMoneyCandidate(text)) return 'item';
  return 'unknown';
}

export function extractMoneyCandidate(rawText: string) {
  const matches = rawText.match(moneyCandidatePattern);
  return matches?.at(-1) ?? null;
}

export function parseOcrMoneyToCents(rawValue: string | null | undefined) {
  if (!rawValue) return { ok: false as const, error: 'Linha sem valor.' };
  const normalized = rawValue.replace(/[oO]/g, '0').replace(/\s+/g, '');
  return parseCurrencyToCents(normalized);
}

export function getConfidenceLevel(confidence: number | null | undefined): OcrConfidenceLevel {
  if (confidence === null || confidence === undefined) return 'unknown';
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'review';
  return 'low';
}

function stripMoney(rawText: string, money: string | null) {
  if (!money) return rawText.trim();
  return rawText.replace(money, '').replace(/\s{2,}/g, ' ').replace(/^[\s\-xX*.]+|[\s\-xX*.]+$/g, '').trim();
}

export function normalizeRawReceiptLine(rawText: string, lineIndex: number, confidence: number | null = null): OcrReceiptLine {
  const kind = classifyReceiptLine(rawText);
  const money = extractMoneyCandidate(rawText);
  const parsedMoney = parseOcrMoneyToCents(money);
  const warnings: string[] = [];

  if (!rawText.trim()) warnings.push('Linha sem descricao.');
  if (!parsedMoney.ok) warnings.push(parsedMoney.error);
  if (kind !== 'item') warnings.push('Esta linha parece informativa e nao deve virar item automaticamente.');
  if (getConfidenceLevel(confidence) === 'low') warnings.push('Confianca baixa. Revise com cuidado.');
  if (confidence === null) warnings.push('Confianca nao informada pelo OCR.');

  return {
    rawText,
    suggestedName: kind === 'item' ? stripMoney(rawText, money) || null : null,
    amountCents: parsedMoney.ok ? parsedMoney.cents : null,
    quantity: null,
    confidence,
    lineIndex,
    kind,
    warnings,
  };
}
