import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { RealtimeStatus } from '@/lib/supabase/realtime';

type RealtimeStatusBadgeProps = {
  status: RealtimeStatus;
};

export function RealtimeStatusBadge({ status }: RealtimeStatusBadgeProps) {
  const Icon = status.state === 'connected' ? Wifi : status.state === 'connecting' || status.state === 'reconnecting' ? RefreshCw : WifiOff;
  const tone = status.state === 'connected' ? 'green' : status.state === 'error' || status.state === 'disconnected' ? 'red' : 'neutral';

  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted" aria-live="polite">
      <Badge tone={tone} className="gap-2">
        <Icon aria-hidden="true" size={14} />
        {status.message}
      </Badge>
      {status.lastSyncedAt ? <span className="hidden sm:inline">Sincronizado {status.lastSyncedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span> : null}
    </div>
  );
}
