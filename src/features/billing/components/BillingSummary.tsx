import { AlertTriangle, ChevronDown, CircleDollarSign, Plus, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/money/money';
import type { BillingResult, ParticipantPaymentSummary, TablePaymentSummary } from '@/domain/billing';

type BillingSummaryProps = {
  result: BillingResult;
  paymentSummary?: TablePaymentSummary | null;
  receiptItems?: Array<{ id: string; name: string; amount_cents: number; quantity: number; status: string }>;
  onOpenAddItem?: () => void;
  onOpenScanReceipt?: () => void;
  onRegisterPartialPayment?: (participant: ParticipantPaymentSummary) => void;
  onRegisterFullPayment?: (participant: ParticipantPaymentSummary) => void;
};

const stateLabel: Record<ParticipantPaymentSummary['financial_state'], string> = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
  no_charge: 'Sem cobranca',
};

const stateTone: Record<ParticipantPaymentSummary['financial_state'], 'green' | 'blue' | 'red' | 'neutral'> = {
  pending: 'red',
  partial: 'blue',
  paid: 'green',
  no_charge: 'neutral',
};

function MoneyValue({ value }: { value: number }) {
  return <span className="break-words text-right font-bold text-ink-strong">{formatMoney(value)}</span>;
}

export function BillingSummary({ result, paymentSummary, receiptItems = [], onOpenAddItem, onOpenScanReceipt, onRegisterPartialPayment, onRegisterFullPayment }: BillingSummaryProps) {
  const activeReceiptItems = receiptItems.filter((item) => item.status === 'active');

  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Badge tone="purple">Mesa</Badge>
          <h2 className="mt-2 text-xl font-bold text-ink-strong">Previa da nota</h2>
        </div>
        {onOpenAddItem || onOpenScanReceipt ? (
          <div className="flex gap-2">
            {onOpenScanReceipt ? (
              <Button aria-label="Escanear nota" variant="ghost" size="icon" onClick={onOpenScanReceipt}>
                <ScanLine aria-hidden="true" size={18} />
              </Button>
            ) : null}
            {onOpenAddItem ? (
              <Button aria-label="Adicionar item" variant="ghost" size="icon" onClick={onOpenAddItem}>
                <Plus aria-hidden="true" size={20} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {result.errors.length > 0 ? (
        <Card className="grid gap-2 border-brand-red/70 bg-brand-red/20">
          <div className="flex gap-2 text-sm font-semibold text-ink-strong"><AlertTriangle aria-hidden="true" size={18} />Corrija os dados para calcular a conta</div>
          <ul className="grid gap-1 text-sm text-ink-body">{result.errors.map((error, index) => <li key={error.code + index}>{error.message}</li>)}</ul>
        </Card>
      ) : null}

      {result.warnings.length > 0 || paymentSummary?.warnings.length ? (
        <Card className="grid gap-2 bg-surface-muted shadow-none">
          <p className="text-sm font-semibold text-ink-strong">Avisos</p>
          <ul className="grid gap-1 text-sm text-ink-muted">
            {result.warnings.map((warning, index) => <li key={warning.code + index}>{warning.message}</li>)}
            {paymentSummary?.warnings.map((warning, index) => <li key={'payment' + index}>{warning}</li>)}
          </ul>
        </Card>
      ) : null}

      <Card className="grid gap-4 border-amber-200 bg-[#fffaf0] text-slate-900 shadow-none dark:border-surface-border dark:bg-surface-panel dark:text-ink-body">
        <div className="grid gap-2 border-b border-dashed border-amber-300 pb-3 dark:border-surface-border">
          {activeReceiptItems.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-ink-muted">Nenhum item na nota ainda.</p>
          ) : (
            activeReceiptItems.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 text-sm">
                <span className="min-w-0 truncate">{item.quantity > 1 ? item.quantity + 'x ' : ''}{item.name}</span>
                <span className="font-semibold tabular-nums">{formatMoney(item.amount_cents * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-ink-muted">Subtotal</span><MoneyValue value={result.totals.items_subtotal_cents} /></div>
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-ink-muted">Taxa de servico</span><MoneyValue value={result.totals.service_fee_cents} /></div>
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-ink-muted">Couvert</span><MoneyValue value={result.totals.cover_charge_cents} /></div>
          <div className="flex justify-between gap-3 text-sm"><span className="text-slate-600 dark:text-ink-muted">Consumacao minima</span><MoneyValue value={result.totals.minimum_consumption_adjustment_cents} /></div>
          <div className="flex justify-between gap-3 border-t border-dashed border-amber-300 pt-3 text-base dark:border-surface-border"><span className="font-bold text-slate-950 dark:text-ink-strong">Total</span><MoneyValue value={paymentSummary?.totals.total_due_cents ?? result.totals.grand_total_cents} /></div>
        </div>

        {paymentSummary ? (
          <>
            <div className="flex justify-between gap-3 text-sm"><span className="text-ink-muted">Total pago</span><MoneyValue value={paymentSummary.totals.total_paid_cents} /></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-ink-muted">Saldo restante</span><MoneyValue value={paymentSummary.totals.remaining_balance_cents} /></div>
            <div className="flex justify-between gap-3 text-sm"><span className="text-ink-muted">Pago a mais</span><MoneyValue value={paymentSummary.totals.overpaid_cents} /></div>
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted sm:grid-cols-4">
              <span>Pendentes: {paymentSummary.totals.pending_count}</span>
              <span>Parciais: {paymentSummary.totals.partial_count}</span>
              <span>Pagos: {paymentSummary.totals.paid_count}</span>
              <span>Sem cobranca: {paymentSummary.totals.no_charge_count}</span>
            </div>
          </>
        ) : null}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {result.participants.map((participant) => {
          const payment = paymentSummary?.participants.find((current) => current.participant_id === participant.participant_id);
          return (
            <Card key={participant.participant_id} className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate text-lg font-bold text-ink-strong">{participant.display_name}</h3>
                {payment ? <Badge tone={stateTone[payment.financial_state]}>{stateLabel[payment.financial_state]}</Badge> : <MoneyValue value={participant.total_due_cents} />}
              </div>
              <div className="grid gap-2 rounded-lg bg-surface-muted p-3 text-sm text-ink-body">
                <div className="flex justify-between gap-3"><span>Consumo</span><MoneyValue value={participant.item_consumption_cents} /></div>
                <div className="flex justify-between gap-3"><span>Taxa</span><MoneyValue value={participant.service_fee_cents} /></div>
                <div className="flex justify-between gap-3"><span>Couvert</span><MoneyValue value={participant.cover_charge_cents} /></div>
                <div className="flex justify-between gap-3"><span>Ajuste minima</span><MoneyValue value={participant.minimum_consumption_adjustment_cents} /></div>
                <div className="flex justify-between gap-3 border-t border-surface-border pt-2"><span>Total devido</span><MoneyValue value={participant.total_due_cents} /></div>
                {payment ? (
                  <>
                    <div className="flex justify-between gap-3"><span>Total pago</span><MoneyValue value={payment.total_paid_cents} /></div>
                    <div className="flex justify-between gap-3"><span>Saldo</span><MoneyValue value={payment.remaining_balance_cents} /></div>
                    <div className="flex justify-between gap-3"><span>Pago a mais</span><MoneyValue value={payment.overpaid_cents} /></div>
                  </>
                ) : null}
              </div>
              {payment && onRegisterPartialPayment && onRegisterFullPayment ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" disabled={payment.remaining_balance_cents === 0} onClick={() => onRegisterPartialPayment(payment)}><CircleDollarSign aria-hidden="true" size={18} />Parcial</Button>
                  <Button disabled={payment.remaining_balance_cents === 0} onClick={() => onRegisterFullPayment(payment)}>Pagar restante</Button>
                </div>
              ) : null}
              <details className="group rounded-lg border border-surface-border p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink-strong">Detalhes<ChevronDown aria-hidden="true" className="transition group-open:rotate-180" size={18} /></summary>
                {participant.items.length === 0 ? <p className="mt-3 text-sm text-ink-muted">Nenhum item atribuido.</p> : <div className="mt-3 grid gap-2">{participant.items.map((item) => <div key={item.item_id} className="flex justify-between gap-3 text-sm text-ink-body"><span className="min-w-0 truncate">{item.item_name}</span><MoneyValue value={item.assigned_cents} /></div>)}</div>}
              </details>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
