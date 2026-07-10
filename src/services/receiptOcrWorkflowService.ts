import { buildConfirmReceiptPayload, normalizeOcrProviderResult, recognizeReceiptImageLocally, validateReceiptImageFile, type LocalReceiptOcrOptions, type ReceiptReviewLineDraft } from '@/domain/receipt-ocr';
import type { ItemsRow, ReceiptScansRow } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';
import { receiptScanItemService } from '@/services/receiptScanItemService';
import { receiptScanService } from '@/services/receiptScanService';

export type ProcessLocalReceiptInput = { table_id: string; file: File; options?: LocalReceiptOcrOptions };

function createClientSideId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'scan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

export const receiptOcrWorkflowService = {
  async processLocalImage({ table_id, file, options }: ProcessLocalReceiptInput) {
    const validation = validateReceiptImageFile(file);
    if (!validation.ok) throw new Error(validation.error);

    const scan = await receiptScanService.create({
      id: createClientSideId(),
      table_id,
      storage_path: null,
      original_file_name: validation.safeFileName,
      mime_type: validation.mimeType,
      status: 'processing',
    });

    try {
      const result = await recognizeReceiptImageLocally(file, options);
      const savedRows = await this.saveNormalizedOcrLines(scan, result);
      return { scan: await receiptScanService.getById(scan.id), lines: savedRows, warnings: [...validation.warnings, ...result.warnings] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel ler a nota no navegador.';
      await receiptScanService.markFailed(scan.id, message);
      throw error;
    }
  },

  async saveNormalizedOcrLines(scan: ReceiptScansRow, providerResult: unknown) {
    const normalized = normalizeOcrProviderResult(providerResult && typeof providerResult === 'object' ? providerResult : {});
    const rows = normalized.lines.map((line) => ({
      receipt_scan_id: scan.id,
      table_id: scan.table_id,
      line_index: line.lineIndex,
      raw_text: line.rawText,
      recognized_name: line.suggestedName,
      recognized_amount_cents: line.amountCents,
      confidence: line.confidence,
      review_status: 'pending' as const,
    }));

    const savedRows = await receiptScanItemService.createMany(rows);
    await receiptScanService.update(scan.id, {
      status: 'completed',
      receipt_total_cents: normalized.totalCents,
      raw_ocr_text: normalized.rawText,
      error_message: normalized.warnings.length > 0 ? normalized.warnings.join(' ').slice(0, 500) : null,
      processed_at: new Date().toISOString(),
    });
    return savedRows;
  },

  async confirmReviewedLines(table_id: string, receipt_scan_id: string, drafts: ReceiptReviewLineDraft[]) {
    const payload = buildConfirmReceiptPayload(drafts);
    const { data, error } = await getClient().rpc('confirm_receipt_scan_import', { p_table_id: table_id, p_receipt_scan_id: receipt_scan_id, p_lines: payload });
    if (error) throw error;
    return data as ItemsRow[];
  },
};
