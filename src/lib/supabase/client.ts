import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type AppSupabaseClient = SupabaseClient<Database>;

let supabaseClient: AppSupabaseClient | null = null;

export function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) return null;

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }

  return supabaseClient;
}

export function requireSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase client is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  return client;
}
