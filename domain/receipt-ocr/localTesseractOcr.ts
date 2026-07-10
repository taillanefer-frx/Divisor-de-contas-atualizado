import { FREE_PLAN_LIMITS } from '@/config/freePlanLimits';
import { validateReceiptImageFile } from '@/domain/receipt-ocr/fileValidation';
import { normalizeRawReceiptLine } from '@/domain/receipt-ocr/lineParsing';
import type { OcrReceiptResult } from '@/domain/receipt-ocr/types';

type OcrProgress = { status: string; progress: number };
type TesseractWorker = { recognize: (file: File) => Promise<{ data?: { text?: string; confidence?: number } }>; terminate: () => Promise<void> };
type TesseractModule = { createWorker: (language?: string, oem?: number, options?: { logger?: (progress: OcrProgress) => void }) => Promise<TesseractWorker> };

export type LocalReceiptOcrProgress = { phase: 'loading' | 'recognizing' | 'parsing' | 'done'; progress: number; message: string };
export type LocalReceiptOcrOptions = { signal?: AbortSignal; onProgress?: (progress: LocalReceiptOcrProgress) => void };

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Leitura da nota cancelada.', 'AbortError');
}

function getProgressMessage(status: string) {
  if (status.includes('recogniz')) return 'Lendo texto da nota no seu navegador...';
  if (status.includes('load')) return 'Carregando OCR local...';
  return 'Preparando OCR local...';
}

function extractTotalCents(lines: ReturnType<typeof normalizeRawReceiptLine>[]) {
  const totalLine = [...lines].reverse().find((line) => line.kind === 'total' && line.amountCents !== null);
  return totalLine?.amountCents ?? null;
}

export async function recognizeReceiptImageLocally(file: File, options: LocalReceiptOcrOptions = {}): Promise<OcrReceiptResult> {
  const validation = validateReceiptImageFile(file);
  if (!validation.ok) throw new Error(validation.error);
  if (file.size > FREE_PLAN_LIMITS.maxReceiptImageBytes) throw new Error('A imagem precisa ter ate 6 MB.');

  assertNotAborted(options.signal);
  options.onProgress?.({ phase: 'loading', progress: 0.05, message: 'Carregando OCR local...' });

  const moduleName = 'tesseract.js';
  let worker: TesseractWorker | null = null;
  let canceled = false;
  const cancel = () => {
    canceled = true;
    void worker?.terminate();
  };

  options.signal?.addEventListener('abort', cancel, { once: true });

  try {
    const tesseract = await import(/* @vite-ignore */ moduleName) as TesseractModule;
    assertNotAborted(options.signal);
    worker = await tesseract.createWorker('por', 1, {
      logger: (progress) => {
        const value = Number.isFinite(progress.progress) ? Math.max(0.05, Math.min(0.95, progress.progress)) : 0.1;
        options.onProgress?.({ phase: 'recognizing', progress: value, message: getProgressMessage(progress.status) });
      },
    });
    assertNotAborted(options.signal);
    const result = await worker.recognize(file);
    assertNotAborted(options.signal);
    options.onProgress?.({ phase: 'parsing', progress: 0.98, message: 'Organizando linhas para revisao...' });
    const rawText = result.data?.text?.trim() || '';
    const confidence = typeof result.data?.confidence === 'number' ? Math.max(0, Math.min(1, result.data.confidence / 100)) : null;
    const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => normalizeRawReceiptLine(line, index, confidence));
    options.onProgress?.({ phase: 'done', progress: 1, message: 'Leitura concluida. Revise antes de criar itens.' });
    return { provider: 'local-tesseract', rawText, lines, subtotalCents: null, serviceFeeCents: null, discountCents: null, totalCents: extractTotalCents(lines), warnings: lines.length === 0 ? ['Nenhuma linha foi reconhecida. Use a revisao manual ou tire outra foto.'] : [] };
  } catch (error) {
    if (canceled || options.signal?.aborted) throw new DOMException('Leitura da nota cancelada.', 'AbortError');
    if (error instanceof Error && /Cannot find package|Failed to resolve|module/i.test(error.message)) throw new Error('OCR local indisponivel: instale a dependencia tesseract.js antes de usar a leitura automatica. O cadastro manual continua disponivel.');
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', cancel);
    await worker?.terminate().catch(() => undefined);
  }
}
