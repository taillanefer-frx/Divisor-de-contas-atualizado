import { RECEIPT_IMAGE_BUCKET, buildReceiptStoragePath, validateReceiptImageFile } from '@/domain/receipt-ocr';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { getClient } from '@/services/supabaseServiceHelpers';

export type ReceiptUploadTarget = {
  table_id: string;
  receipt_scan_id: string;
  file: File;
};

export async function prepareReceiptUpload(target: ReceiptUploadTarget) {
  const validation = validateReceiptImageFile(target.file);
  if (!validation.ok) throw new Error(validation.error);

  return {
    table_id: target.table_id,
    receipt_scan_id: target.receipt_scan_id,
    storage_path: buildReceiptStoragePath(target.table_id, target.receipt_scan_id, validation.safeFileName),
    file_name: validation.safeFileName,
    content_type: validation.mimeType,
    warnings: validation.warnings,
  };
}

export const receiptStorage = {
  async uploadReceiptImage(target: ReceiptUploadTarget) {
    const prepared = await prepareReceiptUpload(target);
    const { data, error } = await getClient().storage.from(RECEIPT_IMAGE_BUCKET).upload(prepared.storage_path, target.file, {
      contentType: prepared.content_type,
      upsert: false,
    });

    if (error) throw error;
    return { ...prepared, storage_path: data.path };
  },

  async createSignedImageUrl(storagePath: string, expiresInSeconds = 300) {
    const { data, error } = await getClient().storage.from(RECEIPT_IMAGE_BUCKET).createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async removeReceiptImage(storagePath: string) {
    const { error } = await getClient().storage.from(RECEIPT_IMAGE_BUCKET).remove([storagePath]);
    if (error) throw error;
  },
};

export function throwStorageError(error: unknown) {
  throwIfSupabaseError(error && typeof error === 'object' && 'code' in error ? (error as never) : null);
  if (error instanceof Error) throw error;
  throw new Error('Falha no Storage.');
}
