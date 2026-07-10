import { FREE_PLAN_LIMITS } from '@/config/freePlanLimits';
import type { MoneyCents, Uuid } from '@/lib/supabase/types';

export const RECEIPT_IMAGE_BUCKET = 'receipt-images';
export const RECEIPT_IMAGE_MAX_BYTES = FREE_PLAN_LIMITS.maxReceiptImageBytes;
export const RECEIPT_IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const RECEIPT_IMAGE_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export type ReceiptImageMimeType = (typeof RECEIPT_IMAGE_ALLOWED_MIME_TYPES)[number];
export type ReceiptOcrProviderName = 'local-tesseract' | 'manual' | 'legacy-edge-function';
export type OcrLineKind = 'item' | 'total' | 'subtotal' | 'service_fee' | 'discount' | 'payment' | 'tax_id' | 'metadata' | 'unknown';
export type OcrConfidenceLevel = 'high' | 'review' | 'low' | 'unknown';

export type ReceiptFileValidationResult =
  | { ok: true; file: File; safeFileName: string; mimeType: ReceiptImageMimeType; extension: string; warnings: string[] }
  | { ok: false; error: string; technicalReason?: string };

export type OcrReceiptLine = {
  rawText: string;
  suggestedName: string | null;
  amountCents: MoneyCents | null;
  quantity: number | null;
  confidence: number | null;
  lineIndex: number;
  kind: OcrLineKind;
  warnings: string[];
};

export type OcrReceiptResult = {
  provider: ReceiptOcrProviderName;
  rawText: string | null;
  lines: OcrReceiptLine[];
  subtotalCents: MoneyCents | null;
  serviceFeeCents: MoneyCents | null;
  discountCents: MoneyCents | null;
  totalCents: MoneyCents | null;
  warnings: string[];
};

export type ReceiptReviewLineDraft = {
  receipt_scan_item_id: Uuid;
  raw_text: string;
  name: string;
  amount_cents: MoneyCents | null;
  quantity: number;
  consumed_at: string;
  participant_ids: Uuid[];
  review_status: 'accepted' | 'ignored' | 'edited';
  confidence: number | null;
  warnings: string[];
};

export type ConfirmReceiptScanLinePayload = {
  receipt_scan_item_id: Uuid;
  name: string;
  amount_cents: MoneyCents;
  quantity: number;
  consumed_at: string;
  participants: Array<{ participant_id: Uuid; assignment_type: 'manual' | 'suggested' }>;
};

export type ReceiptTotalsComparison = {
  receiptTotalCents: MoneyCents | null;
  importedItemsTotalCents: MoneyCents;
  appCalculatedTotalCents: MoneyCents;
  differenceCents: MoneyCents | null;
  status: 'no_receipt_total' | 'matches' | 'positive_difference' | 'negative_difference';
};
