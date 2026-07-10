import { Badge } from '@/components/ui/Badge';
import type { ReceiptScanStatus } from '@/lib/supabase/types';

const labels: Record<ReceiptScanStatus, string> = {
  pending: 'Aguardando upload',
  processing: 'Lendo a nota',
  completed: 'Pronto para revisar',
  failed: 'Falha na leitura',
  canceled: 'Cancelado',
  confirmed: 'Revisao concluida',
};

const tones: Record<ReceiptScanStatus, 'green' | 'blue' | 'red' | 'purple' | 'neutral'> = {
  pending: 'neutral',
  processing: 'blue',
  completed: 'purple',
  failed: 'red',
  canceled: 'neutral',
  confirmed: 'green',
};

export function ReceiptScanStatusBadge({ status }: { status: ReceiptScanStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
