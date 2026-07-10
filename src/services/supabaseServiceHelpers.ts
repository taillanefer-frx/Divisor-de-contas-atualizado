import { requireSupabaseClient } from '@/lib/supabase/client';

export function getClient() {
  return requireSupabaseClient();
}
