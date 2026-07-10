import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type AppSupabaseClient = SupabaseClient<Database> | null;

const SupabaseContext = createContext<AppSupabaseClient>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createSupabaseClient(), []);
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
