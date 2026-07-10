import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { CreateTableWithConsentResult, JoinTableByShareTokenResult, TablesInsert, TablesRow, TablesUpdate } from '@/lib/supabase/types';
import { authSessionService } from '@/services/authSessionService';
import { getClient } from '@/services/supabaseServiceHelpers';

export type CreateTableWithConsentInput = {
  name: string;
  terms_version: string;
  privacy_version: string;
  user_agent?: string | null;
};

export const tableService = {
  async listOpen() {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().from('tables').select('*').eq('status', 'open').order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    return data as TablesRow[];
  },

  async getById(id: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().from('tables').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async getByShareToken(share_token: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('join_table_by_share_token', {
      p_share_token: share_token,
    });

    throwIfSupabaseError(error);

    const joinedTable = data?.[0];
    if (!joinedTable) {
      throw new Error('Supabase did not return the joined table.');
    }

    return joinedTable as JoinTableByShareTokenResult;
  },

  async createWithConsent(values: CreateTableWithConsentInput) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('create_table_with_consent', {
      p_table_name: values.name,
      p_terms_version: values.terms_version,
      p_privacy_version: values.privacy_version,
      p_user_agent: values.user_agent ?? null,
    });

    throwIfSupabaseError(error);

    const createdTable = data?.[0];

    if (!createdTable) {
      throw new Error('Supabase did not return the created table.');
    }

    return createdTable as CreateTableWithConsentResult;
  },

  async create(values: TablesInsert) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().from('tables').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async update(id: string, values: TablesUpdate) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().from('tables').update(values).eq('id', id).select('*').single();
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async close(id: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('close_table', { p_table_id: id });
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async reopen(id: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('reopen_table', { p_table_id: id });
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async archive(id: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('archive_table', { p_table_id: id });
    throwIfSupabaseError(error);
    return data as TablesRow;
  },

  async remove(id: string) {
    await authSessionService.ensureAnonymousSession();
    const { error } = await getClient().rpc('delete_table', { p_table_id: id });
    throwIfSupabaseError(error);
  },
};
