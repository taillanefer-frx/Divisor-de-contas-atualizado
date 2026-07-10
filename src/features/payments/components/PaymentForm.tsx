import { useState, type FormEvent } from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fromDatetimeLocalValue, getCurrentDatetimeLocalValue } from '@/lib/date/dateTime';
import { centsToCurrencyInput, formatMoney, parseCurrencyToCents } from '@/lib/money/money';
import { hasPaymentFormErrors, validatePaymentForm, type PaymentFormErrors } from '@/features/payments/validation/paymentValidation';

export type PaymentFormSubmitValues = {
  amount_cents: number;
  paid_at: string;
  departure_at: string | null;
  notes: string | null;
};

type PaymentFormProps = {
  participantName: string;
  remainingBalanceCents: number;
  defaultAmountCents?: number;
  isSubmitting?: boolean;
  onSubmit: (values: PaymentFormSubmitValues) => Promise<void> | void;
  onCancel: () => void;
};

export function PaymentForm({ participantName, remainingBalanceCents, defaultAmountCents, isSubmitting = false, onSubmit, onCancel }: PaymentFormProps) {
  const [values, setValues] = useState({
    amount: defaultAmountCents !== undefined ? centsToCurrencyInput(defaultAmountCents) : '',
    paid_at: getCurrentDatetimeLocalValue(),
    should_mark_departure: defaultAmountCents !== undefined,
    departure_at: getCurrentDatetimeLocalValue(),
    notes: '',
  });
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [confirmedOverpay, setConfirmedOverpay] = useState(false);

  const parsedAmount = parseCurrencyToCents(values.amount);
  const amountCents = parsedAmount.ok ? parsedAmount.cents : 0;
  const overpayCents = Math.max(0, amountCents - remainingBalanceCents);
  const requiresOverpayConfirmation = overpayCents > 0 && !confirmedOverpay;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validatePaymentForm(values);
    setErrors(nextErrors);
    if (hasPaymentFormErrors(nextErrors)) return;

    const amount = parseCurrencyToCents(values.amount);
    if (!amount.ok) {
      setErrors((current) => ({ ...current, amount: amount.error }));
      return;
    }

    if (amount.cents > remainingBalanceCents && !confirmedOverpay) return;

    await onSubmit({
      amount_cents: amount.cents,
      paid_at: fromDatetimeLocalValue(values.paid_at),
      departure_at: values.should_mark_departure ? fromDatetimeLocalValue(values.departure_at) : null,
      notes: values.notes.trim() ? values.notes.trim() : null,
    });
  }

  return (
    <Card className="grid gap-4">
      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="text-sm text-ink-muted">Participante</p>
          <h3 className="text-lg font-bold text-ink-strong">{participantName}</h3>
          <p className="mt-1 text-sm text-ink-muted">Saldo restante atual: {formatMoney(remainingBalanceCents)}</p>
        </div>

        <Input name="amount" label="Valor pago" placeholder="10,50" inputMode="decimal" value={values.amount} error={errors.amount} disabled={isSubmitting} onChange={(event) => { setValues((current) => ({ ...current, amount: event.target.value })); setConfirmedOverpay(false); }} />
        <Input name="paid_at" label="Data e hora" type="datetime-local" value={values.paid_at} error={errors.paid_at} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, paid_at: event.target.value }))} />
        <label className="flex items-start gap-3 rounded-lg border border-surface-border bg-surface-muted p-3 text-sm leading-6 text-ink-body">
          <input className="mt-1 h-5 w-5 shrink-0 accent-brand-green" type="checkbox" checked={values.should_mark_departure} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, should_mark_departure: event.target.checked }))} />
          <span>Marcar que pagou e registrar horario de saida.</span>
        </label>
        {values.should_mark_departure ? <Input name="departure_at" label="Horario de saida" type="datetime-local" value={values.departure_at} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, departure_at: event.target.value }))} /> : null}
        <label className="grid gap-2 text-sm font-medium text-ink-body">
          Observacao opcional
          <textarea className="min-h-20 w-full rounded-lg border border-surface-border bg-surface-panel px-3 py-3 text-base text-ink-strong outline-none transition placeholder:text-ink-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30" value={values.notes} maxLength={500} disabled={isSubmitting} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} />
        </label>

        {overpayCents > 0 ? (
          <div className="grid gap-3 rounded-lg bg-brand-red/20 p-3 text-sm text-ink-body">
            <div className="flex gap-2 font-semibold text-ink-strong">
              <AlertTriangle aria-hidden="true" size={18} />
              Pagamento acima do saldo
            </div>
            <p>Saldo: {formatMoney(remainingBalanceCents)}. Digitado: {formatMoney(amountCents)}. Excedente: {formatMoney(overpayCents)}.</p>
            {!confirmedOverpay ? <Button variant="danger" type="button" onClick={() => setConfirmedOverpay(true)}>Confirmar excedente</Button> : <p className="font-semibold text-ink-strong">Excedente confirmado.</p>}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" type="button" disabled={isSubmitting} onClick={onCancel}>
            <X aria-hidden="true" size={18} />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || requiresOverpayConfirmation}>
            <Save aria-hidden="true" size={18} />
            Registrar pagamento
          </Button>
        </div>
      </form>
    </Card>
  );
}
