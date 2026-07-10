import { normalizeRawReceiptLine } from '@/domain/receipt-ocr/lineParsing';
import type { OcrReceiptResult, ReceiptOcrProviderName } from '@/domain/receipt-ocr/types';

type ProviderLine = {
  text?: unknown;
  rawText?: unknown;
  description?: unknown;
  amountCents?: unknown;
  confidence?: unknown;
};

type ProviderResult = {
  provider?: unknown;
  rawText?: unknown;
  lines?: unknown;
  totalCents?: unknown;
  subtotalCents?: unknown;
  serviceFeeCents?: unknown;
  discountCents?: unknown;
  warnings?: unknown;
};

function toNullableCents(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function toConfidence(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}

function toWarnings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function normalizeOcrProviderResult(input: ProviderResult): OcrReceiptResult {
  const provider = typeof input.provider === 'string' ? (input.provider as ReceiptOcrProviderName) : 'pending-provider';
  const rawText = typeof input.rawText === 'string' ? input.rawText : null;
  const providerLines = Array.isArray(input.lines) ? (input.lines as ProviderLine[]) : [];

  const lines = providerLines.map((line, index) => {
    const rawLine = typeof line.rawText === 'string' ? line.rawText : typeof line.text === 'string' ? line.text : typeof line.description === 'string' ? line.description : '';
    const normalized = normalizeRawReceiptLine(rawLine, index, toConfidence(line.confidence));
    const amountCents = toNullableCents(line.amountCents);
    return amountCents === null ? normalized : { ...normalized, amountCents };
  });

  return {
    provider,
    rawText,
    lines,
    subtotalCents: toNullableCents(input.subtotalCents),
    serviceFeeCents: toNullableCents(input.serviceFeeCents),
    discountCents: toNullableCents(input.discountCents),
    totalCents: toNullableCents(input.totalCents),
    warnings: toWarnings(input.warnings),
  };
}
