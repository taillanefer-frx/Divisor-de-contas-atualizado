import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeForDisplay } from '@/lib/date/dateTime';
import { formatMoney } from '@/lib/money/money';
import type { PaymentsRow } from '@/lib/supabase/types';

type PaymentCancelDialogProps = {
  payment: PaymentsRow | null;
  participantName: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function PaymentCancelDialog({ payment, participantName, isSubmitting, errorMessage, onClose, onConfirm }: PaymentCancelDialogProps) {
  return (
    <Modal title="Cancelar pagamento" isOpen={Boolean(payment)} onClose={onClose}>
      <div className="grid gap-4 text-sm text-ink-body">
        <div className="flex gap-3 rounded-lg bg-brand-red/20 p-3">
          <Ban aria-hidden="true" className="mt-0.5 shrink-0 text-red-700 dark:text-red-200" size={20} />
          <div className="grid gap-2">
            <p className="font-semibold text-ink-strong">{participantName}</p>
            <p>Valor: {payment ? formatMoney(payment.amount_cents) : '-'}</p>
            <p>Data: {payment ? formatDateTimeForDisplay(payment.paid_at) : '-'}</p>
            <p>O pagamento continuara no historico, mas deixara de contar no total pago.</p>
          </div>
        </div>
        {errorMessage ? <p className="text-red-700 dark:text-red-200">{errorMessage}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={isSubmitting} onClick={onClose}>Fechar</Button>
          <Button variant="danger" disabled={isSubmitting || !payment} onClick={onConfirm}>Confirmar cancelamento</Button>
        </div>
      </div>
    </Modal>
  );
}
