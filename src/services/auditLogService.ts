import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { AuditLogsInsert, AuditLogsRow } from '@/lib/supabase/types';
import { getClient } from '@/services/supabaseServiceHelpers';

export const auditLogService = {
  async listByTableId(table_id: string) {
    const { data, error } = await getClient().from('audit_logs').select('*').eq('table_id', table_id).order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    return data as AuditLogsRow[];
  },

  async getById(id: string) {
    const { data, error } = await getClient().from('audit_logs').select('*').eq('id', id).single();
    throwIfSupabaseError(error);
    return data as AuditLogsRow;
  },

  async create(values: AuditLogsInsert) {
    const { data, error } = await getClient().from('audit_logs').insert(values).select('*').single();
    throwIfSupabaseError(error);
    return data as AuditLogsRow;
  },
};
