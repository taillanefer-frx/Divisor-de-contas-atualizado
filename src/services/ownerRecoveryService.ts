import { throwIfSupabaseError } from '@/lib/supabase/errors';
import type { CreateOwnerRecoveryCodeResult, TablesRow } from '@/lib/supabase/types';
import { authSessionService } from '@/services/authSessionService';
import { getClient } from '@/services/supabaseServiceHelpers';

export const ownerRecoveryService = {
  async createCode(table_id: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('create_owner_recovery_code', { p_table_id: table_id });
    throwIfSupabaseError(error);
    const code = data?.[0];
    if (!code) throw new Error('Supabase did not return a recovery code.');
    return code as CreateOwnerRecoveryCodeResult;
  },

  async recoverOwner(share_token: string, recovery_code: string) {
    await authSessionService.ensureAnonymousSession();
    const { data, error } = await getClient().rpc('recover_table_owner', { p_share_token: share_token, p_recovery_code: recovery_code });
    throwIfSupabaseError(error);
    return data as TablesRow;
  },
};
