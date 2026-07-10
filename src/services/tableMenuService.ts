import { AppServiceError, throwIfSupabaseError } from '@/lib/supabase/errors';
import type { TableMenuItemsInsert, TableMenuItemsRow } from '@/lib/supabase/types';
import type { SavedMenuItem } from '@/domain/menu/menuStorage';
import { getClient } from '@/services/supabaseServiceHelpers';

export type SharedMenuItem = TableMenuItemsRow;

function isMissingTableMenuPatch(error: unknown) {
  if (!(error instanceof AppServiceError)) return false;
  const message = error.appError.technicalMessage?.toLowerCase() ?? '';
  return error.appError.code === 'setup_required' || message.includes('table_menu_items') || message.includes('schema cache');
}

export const tableMenuService = {
  async listByTableId(table_id: string): Promise<SharedMenuItem[]> {
    try {
      const { data, error } = await getClient().from('table_menu_items').select('*').eq('table_id', table_id).order('created_at', { ascending: true });
      throwIfSupabaseError(error);
      return (data ?? []) as SharedMenuItem[];
    } catch (error) {
      if (isMissingTableMenuPatch(error)) return [];
      throw error;
    }
  },

  async addItems(table_id: string, items: Array<Omit<TableMenuItemsInsert, 'table_id'>>) {
    if (items.length === 0) return [];

    const rows: TableMenuItemsInsert[] = items.map((item) => ({
      table_id,
      consumption_type: item.consumption_type ?? 'Outros',
      name: item.name.trim(),
      amount_cents: item.amount_cents,
      source: item.source ?? 'manual',
    }));

    const { data, error } = await getClient().from('table_menu_items').upsert(rows, {
      onConflict: 'table_id,name,consumption_type,amount_cents',
      ignoreDuplicates: true,
    }).select('*');

    throwIfSupabaseError(error);
    return (data ?? []) as SharedMenuItem[];
  },

  async copySavedItemsToTable(table_id: string, items: SavedMenuItem[]) {
    return this.addItems(table_id, items.map((item) => ({
      consumption_type: item.type,
      name: item.name,
      amount_cents: item.amount_cents,
      source: 'saved_bar',
    })));
  },
};
