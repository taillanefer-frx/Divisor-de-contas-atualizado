import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ReceiptScansInsert, ReceiptScansRow, ReceiptScansUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const receiptScanService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('receipt_scans').select('*').eq('table_id', table_id).order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    return data as ReceiptScansRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('receipt_scans').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ReceiptScansRow;
  },

  async create(values: ReceiptScansInsert) {
    const { data, error } = await getClient().from('receipt_scans').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ReceiptScansRow;
  },

  async update(id: string, values: ReceiptScansUpdate) {
    const { data, error } = await getClient().from('receipt_scans').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as ReceiptScansRow;
  },

  async markFailed(id: string, errorMessage: string) {
    return this.update(id, { status: 'failed', error_message: errorMessage.slice(0, 500), processed_at: new Date().toISOString() });
  },

  async remove(id: string) {
    const { error } = await getClient().from('receipt_scans').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
