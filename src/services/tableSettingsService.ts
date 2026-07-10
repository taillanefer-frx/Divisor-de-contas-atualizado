import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { TableSettingsInsert, TableSettingsRow, TableSettingsUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const tableSettingsService = {
  async getByTableId(table_id: string) {
    const { data, error } = await getClient().from('table_settings').select('*').eq('table_id', table_id).single();
    throwIfSupabaseError(error);
    return data as TableSettingsRow;
  },

  async create(values: TableSettingsInsert) {
    const { data, error } = await getClient().from('table_settings').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as TableSettingsRow;
  },

  async update(table_id: string, values: TableSettingsUpdate) {
    const { data, error } = await getClient().from('table_settings').update(values).eq('table_id', table_id).select('*').single();
    throwIfSupabaseError(error);
    return data as TableSettingsRow;
  },

  async remove(table_id: string) {
    const { error } = await getClient().from('table_settings').delete().eq('table_id', table_id);
    throwIfSupabaseError(error);
  },
};
