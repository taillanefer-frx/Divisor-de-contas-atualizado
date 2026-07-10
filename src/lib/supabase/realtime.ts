import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '@/lib/supabase/client';

export type RealtimeConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export type RealtimeStatus = {
  state: RealtimeConnectionState;
  lastSyncedAt: Date | null;
  message: string;
};

export type TableRealtimeTable = 'tables' | 'table_settings' | 'participants' | 'items' | 'table_menu_items' | 'item_participants' | 'payments' | 'receipt_scans' | 'receipt_scan_items';

export type TableRealtimeEvent = {
  table: TableRealtimeTable;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>;
};

type SubscribeToTableRealtimeOptions = {
  client: AppSupabaseClient;
  tableId: string;
  onEvent: (event: TableRealtimeEvent) => void;
  onStatusChange: (status: RealtimeStatus) => void;
};

export function createRealtimeStatus(): RealtimeStatus {
  return {
    state: 'idle',
    lastSyncedAt: null,
    message: 'Tempo real aguardando mesa.',
  };
}

function statusFromSupabase(status: string): RealtimeStatus {
  if (status === 'SUBSCRIBED') {
    return { state: 'connected', lastSyncedAt: new Date(), message: 'Atualizacao em tempo real ativa.' };
  }

  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    return { state: 'error', lastSyncedAt: null, message: 'Nao foi possivel sincronizar agora.' };
  }

  if (status === 'CLOSED') {
    return { state: 'disconnected', lastSyncedAt: null, message: 'Sincronizacao desconectada.' };
  }

  return { state: 'reconnecting', lastSyncedAt: null, message: 'Reconectando sincronizacao...' };
}

function registerTableListener(channel: RealtimeChannel, table: TableRealtimeTable, filter: string, onEvent: (event: TableRealtimeEvent) => void) {
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      filter,
    },
    (payload) => {
      onEvent({
        table,
        eventType: payload.eventType,
        payload: payload as RealtimePostgresChangesPayload<Record<string, unknown>>,
      });
    },
  );
}

export function subscribeToTableRealtime({ client, tableId, onEvent, onStatusChange }: SubscribeToTableRealtimeOptions) {
  const channel = client.channel('table-realtime:' + tableId);

  onStatusChange({ state: 'connecting', lastSyncedAt: null, message: 'Conectando sincronizacao...' });

  registerTableListener(channel, 'tables', 'id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'table_settings', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'participants', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'items', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'table_menu_items', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'item_participants', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'payments', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'receipt_scans', 'table_id=eq.' + tableId, onEvent);
  registerTableListener(channel, 'receipt_scan_items', 'table_id=eq.' + tableId, onEvent);

  channel.subscribe((status) => {
    onStatusChange(statusFromSupabase(status));
  });

  return {
    unsubscribe: async () => {
      onStatusChange({ state: 'disconnected', lastSyncedAt: null, message: 'Sincronizacao encerrada.' });
      await client.removeChannel(channel);
    },
  };
}
