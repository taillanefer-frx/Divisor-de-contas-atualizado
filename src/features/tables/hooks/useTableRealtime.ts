import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createRealtimeStatus, subscribeToTableRealtime, type RealtimeStatus, type TableRealtimeEvent } from '@/lib/supabase/realtime';

type UseTableRealtimeOptions = {
  tableId: string | null;
  enabled: boolean;
  onReconcile: (reason: TableRealtimeEvent | 'connected' | 'manual') => Promise<void>;
  onError?: (error: unknown) => void;
};

export function useTableRealtime({ tableId, enabled, onReconcile, onError }: UseTableRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeStatus>(() => createRealtimeStatus());
  const isReconcilingRef = useRef(false);
  const hasPendingReconcileRef = useRef(false);
  const isMountedRef = useRef(false);

  const reconcile = useCallback(
    async (reason: TableRealtimeEvent | 'connected' | 'manual') => {
      if (isReconcilingRef.current) {
        hasPendingReconcileRef.current = true;
        return;
      }

      isReconcilingRef.current = true;

      try {
        await onReconcile(reason);
        if (isMountedRef.current) {
          setStatus((current) => ({ ...current, lastSyncedAt: new Date() }));
        }
      } catch (error) {
        onError?.(error);
        if (isMountedRef.current) {
          setStatus({ state: 'error', lastSyncedAt: null, message: 'Nao foi possivel reconciliar os dados.' });
        }
      } finally {
        isReconcilingRef.current = false;

        if (hasPendingReconcileRef.current) {
          hasPendingReconcileRef.current = false;
          await reconcile('manual');
        }
      }
    },
    [onError, onReconcile],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !tableId) {
      setStatus(createRealtimeStatus());
      return;
    }

    const client = getSupabaseClient();

    if (!client) {
      setStatus({ state: 'error', lastSyncedAt: null, message: 'Supabase nao esta configurado.' });
      return;
    }

    let disposed = false;

    const subscription = subscribeToTableRealtime({
      client,
      tableId,
      onEvent: (event) => {
        if (!disposed) void reconcile(event);
      },
      onStatusChange: (nextStatus) => {
        if (disposed) return;
        setStatus(nextStatus);
        if (nextStatus.state === 'connected') void reconcile('connected');
      },
    });

    return () => {
      disposed = true;
      void subscription.unsubscribe();
    };
  }, [enabled, reconcile, tableId]);

  return { status, reconcile: () => reconcile('manual') };
}
