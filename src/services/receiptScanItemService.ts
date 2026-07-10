import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ReceiptScanItemsInsert, ReceiptScanItemsRow, ReceiptScanItemsUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const receiptScanItemService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('receipt_scan_items').select('*').eq('table_id', table_id).order('line_index', { ascending: true });
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow[];
  },

  async listByReceiptScanId(receipt_scan_id: string) {
    const { data, error } = await getClient().from('receipt_scan_items').select('*').eq('receipt_scan_id', receipt_scan_id).order('line_index', { ascending: true });
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('receipt_scan_items').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow;
  },

  async create(values: ReceiptScanItemsInsert) {
    const { data, error } = await getClient().from('receipt_scan_items').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow;
  },

  async createMany(values: ReceiptScanItemsInsert[]) {
    if (values.length === 0) return [];
    const { data, error } = await getClient().from('receipt_scan_items').insert(values).select('*');
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow[];
  },

  async update(id: string, values: ReceiptScanItemsUpdate) {
    const { data, error } = await getClient().from('receipt_scan_items').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as ReceiptScanItemsRow;
  },

  async updateReview(id: string, values: Pick<ReceiptScanItemsUpdate, 'recognized_name' | 'recognized_amount_cents' | 'review_status'>) {
    return this.update(id, values);
  },

  async remove(id: string) {
    const { error } = await getClient().from('receipt_scan_items').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
