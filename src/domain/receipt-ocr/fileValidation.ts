import { RECEIPT_IMAGE_ALLOWED_EXTENSIONS, RECEIPT_IMAGE_ALLOWED_MIME_TYPES, RECEIPT_IMAGE_MAX_BYTES, type ReceiptFileValidationResult, type ReceiptImageMimeType } from '@/domain/receipt-ocr/types';

const unsafeNamePattern = /[^a-zA-Z0-9._-]+/g;
const controlCharPattern = /[\u0000-\u001f\u007f]/g;

export function sanitizeReceiptFileName(fileName: string) {
  const baseName = fileName.trim().split(/[\\/]/).pop() || 'receipt';
  const withoutControlChars = baseName.replace(controlCharPattern, '');
  const sanitized = withoutControlChars.replace(unsafeNamePattern, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return sanitized || 'receipt';
}

export function getFileExtension(fileName: string) {
  const safeName = sanitizeReceiptFileName(fileName);
  const dotIndex = safeName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return safeName.slice(dotIndex + 1).toLowerCase();
}

export function isAllowedReceiptMimeType(mimeType: string): mimeType is ReceiptImageMimeType {
  return RECEIPT_IMAGE_ALLOWED_MIME_TYPES.includes(mimeType as ReceiptImageMimeType);
}

export function validateReceiptImageFile(file: File | null | undefined): ReceiptFileValidationResult {
  if (!file) return { ok: false, error: 'Escolha uma foto da nota.', technicalReason: 'missing_file' };
  if (file.size === 0) return { ok: false, error: 'A imagem esta vazia. Escolha outra foto.', technicalReason: 'empty_file' };
  if (file.size > RECEIPT_IMAGE_MAX_BYTES) return { ok: false, error: 'A imagem precisa ter ate 6 MB.', technicalReason: 'file_too_large' };
  if (!file.type) return { ok: false, error: 'Nao foi possivel identificar o tipo da imagem.', technicalReason: 'missing_mime_type' };
  if (!isAllowedReceiptMimeType(file.type)) return { ok: false, error: 'Use uma imagem JPEG, PNG ou WebP.', technicalReason: 'invalid_mime_type' };

  const extension = getFileExtension(file.name);
  if (!RECEIPT_IMAGE_ALLOWED_EXTENSIONS.includes(extension as (typeof RECEIPT_IMAGE_ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, error: 'A extensao do arquivo precisa ser JPG, PNG ou WebP.', technicalReason: 'invalid_extension' };
  }

  const expectedByMime: Record<ReceiptImageMimeType, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  if (!expectedByMime[file.type].includes(extension)) {
    return { ok: false, error: 'O tipo da imagem nao combina com a extensao do arquivo.', technicalReason: 'mime_extension_mismatch' };
  }

  const warnings: string[] = [];
  if (file.size < 40 * 1024) warnings.push('A imagem parece pequena. Confira se o texto esta legivel.');

  return { ok: true, file, safeFileName: sanitizeReceiptFileName(file.name), mimeType: file.type, extension, warnings };
}

export function buildReceiptStoragePath(tableId: string, receiptScanId: string, safeFileName: string) {
  const finalName = sanitizeReceiptFileName(safeFileName);
  return ['tables', tableId, 'receipts', receiptScanId, finalName].join('/');
}
