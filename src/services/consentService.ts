import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ConsentLogsInsert, ConsentLogsRow } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const consentService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('consent_logs').select('*').eq('table_id', table_id).order('accepted_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ConsentLogsRow[];
  },

  async listByParticipantId(participant_id: string) {
    const { data, error } = await getClient().from('consent_logs').select('*').eq('participant_id', participant_id).order('accepted_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ConsentLogsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('consent_logs').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ConsentLogsRow;
  },

  async create(values: ConsentLogsInsert) {
    const { data, error } = await getClient().from('consent_logs').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ConsentLogsRow;
  },
};
