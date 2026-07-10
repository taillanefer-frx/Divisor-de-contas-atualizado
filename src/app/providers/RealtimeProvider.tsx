import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createRealtimeStatus } from '@/lib/supabase/realtime';

type RealtimeContextValue = ReturnType<typeof createRealtimeStatus>;

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => createRealtimeStatus(), []);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeStatus() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtimeStatus must be used within RealtimeProvider');
  return context;
}
