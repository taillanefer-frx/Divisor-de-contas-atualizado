import { Ban } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDateTimeForDisplay } from '@/lib/date/dateTime';
import { formatMoney } from '@/lib/money/money';
import type { PaymentsRow } from '@/lib/supabase/types';

type PaymentHistoryProps = {
  payments: PaymentsRow[];
  participantNames: Map<string, string>;
  isSubmitting?: boolean;
  onCancelPayment: (payment: PaymentsRow) => void;
};

export function PaymentHistory({ payments, participantNames, isSubmitting = false, onCancelPayment }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return <Card className="text-sm text-ink-muted">Nenhum pagamento registrado ainda.</Card>;
  }

  return (
    <section className="grid gap-3">
      <div>
        <Badge tone="blue">Historico</Badge>
        <h2 className="mt-2 text-xl font-bold text-ink-strong">Pagamentos da mesa</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {payments.map((payment) => {
          const isCanceled = payment.status === 'canceled';
          return (
            <Card key={payment.id} className={isCanceled ? 'grid gap-3 opacity-70' : 'grid gap-3'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-ink-strong">{participantNames.get(payment.participant_id) ?? 'Participante'}</h3>
                  <p className="text-sm text-ink-muted">{formatDateTimeForDisplay(payment.paid_at)}</p>
                </div>
                <Badge tone={isCanceled ? 'neutral' : 'green'}>{isCanceled ? 'Cancelado' : 'Registrado'}</Badge>
              </div>
              <div className="flex justify-between gap-3 rounded-lg bg-surface-muted p-3 text-sm">
                <span className="text-ink-muted">Valor</span>
                <span className="font-bold text-ink-strong">{formatMoney(payment.amount_cents)}</span>
              </div>
              {payment.notes ? <p className="rounded-lg bg-surface-muted p-3 text-sm text-ink-muted">{payment.notes}</p> : null}
              {isCanceled ? <p className="text-sm text-ink-muted">Cancelado em {formatDateTimeForDisplay(payment.canceled_at)}</p> : <Button variant="danger" disabled={isSubmitting} onClick={() => onCancelPayment(payment)}><Ban aria-hidden="true" size={18} />Cancelar pagamento</Button>}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
