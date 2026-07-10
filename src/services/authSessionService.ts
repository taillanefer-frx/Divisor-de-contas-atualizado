import { requireSupabaseClient } from '@/lib/supabase/client';

let pendingAnonymousSession: Promise<string> | null = null;

export const authSessionService = {
  async ensureAnonymousSession() {
    const client = requireSupabaseClient();
    const currentSession = await client.auth.getSession();

    if (currentSession.data.session?.user?.id) {
      return currentSession.data.session.user.id;
    }

    if (!pendingAnonymousSession) {
      pendingAnonymousSession = client.auth.signInAnonymously().then(({ data, error }) => {
        if (error) throw error;
        const userId = data.user?.id;
        if (!userId) throw new Error('Nao foi possivel criar uma sessao anonima segura.');
        return userId;
      }).finally(() => {
        pendingAnonymousSession = null;
      });
    }

    return pendingAnonymousSession;
  },
};
