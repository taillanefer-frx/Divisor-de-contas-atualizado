import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { ParticipantsInsert, ParticipantsRow, ParticipantsUpdate } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export type ParticipantRemovalSafety = {
  canRemove: boolean;
  hasItemLinks: boolean;
  hasPayments: boolean;
  hasConsentLogs: boolean;
};

async function existsInTable(tableName: 'item_participants' | 'payments' | 'consent_logs', participant_id: string) {
  const { data, error } = await getClient().from(tableName).select('id').eq('participant_id', participant_id).limit(1);
  throwIfSupabaseError(error);
  return Boolean(data && data.length > 0);
}

export const participantService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('participants').select('*').eq('table_id', table_id).order('created_at', { ascending: true });
    throwIfSupabaseError(error);
    return data as ParticipantsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('participants').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as ParticipantsRow;
  },

  async getRemovalSafety(id: string): Promise<ParticipantRemovalSafety> {
    const [hasItemLinks, hasPayments, hasConsentLogs] = await Promise.all([
      existsInTable('item_participants', id),
      existsInTable('payments', id),
      existsInTable('consent_logs', id),
    ]);

    return {
      canRemove: !hasItemLinks && !hasPayments && !hasConsentLogs,
      hasItemLinks,
      hasPayments,
      hasConsentLogs,
    };
  },

  async create(values: ParticipantsInsert) {
    const { data, error } = await getClient().from('participants').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as ParticipantsRow;
  },

  async update(id: string, values: ParticipantsUpdate) {
    const { data, error } = await getClient().from('participants').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as ParticipantsRow;
  },

  async remove(id: string) {
    const safety = await this.getRemovalSafety(id);

    if (!safety.canRemove) {
      throw new Error('Participant has related history and cannot be removed safely.');
    }

    const { error } = await getClient().from('participants').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
