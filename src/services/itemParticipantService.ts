import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ItemParticipantsInsert, ItemParticipantsRow, ItemParticipantsUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const itemParticipantService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('item_participants').select('*').eq('table_id', table_id).order('created_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ItemParticipantsRow[];
  },

  async listByItemId(item_id: string) {
    const { data, error } = await getClient().from('item_participants').select('*').eq('item_id', item_id).order('created_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ItemParticipantsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('item_participants').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ItemParticipantsRow;
  },

  async create(values: ItemParticipantsInsert) {
    const { data, error } = await getClient().from('item_participants').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ItemParticipantsRow;
  },

  async update(id: string, values: ItemParticipantsUpdate) {
    const { data, error } = await getClient().from('item_participants').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as ItemParticipantsRow;
  },

  async remove(id: string) {
    const { error } = await getClient().from('item_participants').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
